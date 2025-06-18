import faiss
import json
import numpy as np
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
import re
from surah_map import SURAH_MAP

genai.configure(api_key="AIzaSyA1RJISbzG7WJ0T_ZRQIEVj_WWkhiHKml4")
gemini = genai.GenerativeModel(model_name="gemini-1.5-flash")
model = SentenceTransformer("all-MiniLM-L6-v2")

# Load Quran resources
quran_index = faiss.read_index("quran_english.index")
with open("quran_english_metadata.json", "r", encoding="utf-8") as f:
    quran_metadata = json.load(f)

# Load Hadith resources
hadith_index = faiss.read_index("hadith.index")  # Load the hadith index you created
with open("processed_hadith/hadith_chunks.json", "r", encoding="utf-8") as f:
    hadith_metadata = json.load(f)

# The collection names for sunnah.com (these match their actual URL structure)
SUNNAH_COLLECTIONS = {
    "bukhari": ["sahih bukhari", "bukhari", "sahih al-bukhari", "sahih al bukhari"],
    "muslim": ["sahih muslim", "muslim"],
    "abudawud": ["sunan abu dawood", "abu dawood", "abu dawud", "sunan abi dawud", "dawud", "dawood"],
    "tirmidhi": ["jami at-tirmidhi", "tirmidhi", "jami al-tirmidhi", "tirmizi", "al-tirmidhi"],
    "nasai": ["sunan an-nasai", "nasai", "an-nasai", "sunan al-nasai", "al-nasai", "nasa'i"],
    "ibnmajah": ["sunan ibn majah", "ibn majah", "ibn-majah"]
}


def detect_source_type(query):
    """Determine if the query is likely about Quran, Hadith, or both."""
    hadith_keywords = ["hadith", "hadees", "bukhari", "muslim", "tirmidhi", "tirmizi", "sunan", "abu dawood", "nasai",
                       "ibn majah",
                       "sunnah", "prophet", "muhammad", "saying", "narration", "reported", "حدیث", "بخاری", "مسلم",
                       "ترمذی", "ابو داؤد", "نسائی", "ابن ماجہ"]

    quran_keywords = ["quran", "surah", "ayah", "verse", "quranic", "قرآن", "سورہ", "آیت", "ayat", "surah"]

    query_lower = query.lower()

    has_hadith = any(keyword in query_lower for keyword in hadith_keywords)
    has_quran = any(keyword in query_lower for keyword in quran_keywords)

    if has_hadith and not has_quran:
        return "hadith"
    elif has_quran and not has_hadith:
        return "quran"
    else:
        return "both"  # Default to checking both sources if unclear or if both are mentioned


def retrieve_context(query, source_type="both", top_k=10):
    """Retrieve relevant context from specified source(s)."""
    query_embedding = model.encode([query]).astype("float32")
    results = []

    if source_type in ["quran", "both"]:
        quran_distances, quran_indices = quran_index.search(query_embedding, top_k)
        for i, idx in enumerate(quran_indices[0]):
            if idx < len(quran_metadata):  # Ensure index is valid
                results.append({
                    "source": "quran",
                    "text": quran_metadata[idx]["text"],
                    "distance": float(quran_distances[0][i])
                })

    if source_type in ["hadith", "both"]:
        hadith_distances, hadith_indices = hadith_index.search(query_embedding, top_k)
        for i, idx in enumerate(hadith_indices[0]):
            if idx < len(hadith_metadata):  # Ensure index is valid
                results.append({
                    "source": "hadith",
                    "text": hadith_metadata[idx]["text"],
                    "distance": float(hadith_distances[0][i])
                })

    # Sort by relevance (smaller distance is better)
    results.sort(key=lambda x: x["distance"])

    # Return top results
    return results[:top_k]


def is_relevant_match(results, threshold=0.6):
    """Check if the search results are relevant based on distance scores."""
    if not results:
        return False
    # Lower distance means better match
    return any(r["distance"] < threshold for r in results)


def generate_alternatives(query):
    """Generate alternative words/phrases for the query using Gemini."""
    prompt = f"""
    I'm searching for information about this Islamic topic but can't find direct matches:
    "{query}"

    Please give me 3-5 alternative Islamic terms, concepts, or phrases that might be related to this query.
    Format: Just provide the alternative terms separated by commas, nothing else.
    """

    try:
        response = gemini.generate_content(prompt).text.strip()
        alternatives = [alt.strip() for alt in response.split(",")]
        return alternatives
    except Exception as e:
        print(f"Error generating alternatives: {e}")
        return []


def build_quran_link(surah_name, ayah_num):
    """Build a link to a Quran verse."""
    # Handle numeric surah references directly
    if surah_name.isdigit():
        return f"https://quran.com/{surah_name}/{ayah_num}"

    name = surah_name.strip().replace("'", "'")
    surah_no = SURAH_MAP.get(name)
    if surah_no:
        return f"https://quran.com/{surah_no}/{ayah_num}"

    # Try additional mappings for surah variants
    surah_variants = {
        "al-fatiha": 1, "fatiha": 1, "al-fatihah": 1, "fatihah": 1,
        "al-baqara": 2, "baqara": 2, "al-baqarah": 2, "baqarah": 2,
        "al-imran": 3, "imran": 3, "al-i'mran": 3, "ali imran": 3, "al-e-imran": 3,
        "an-nisa": 4, "nisa": 4, "an-nisa'": 4, "al-nisa": 4,
        "al-ma'idah": 5, "maidah": 5, "al-maidah": 5, "ma'idah": 5,
        "al-an'am": 6, "an'am": 6, "al-anam": 6, "anam": 6,
        "al-a'raf": 7, "a'raf": 7, "al-araf": 7, "araf": 7,
        "al-anfal": 8, "anfal": 8,
        "at-tawbah": 9, "tawbah": 9, "al-tawbah": 9, "tauba": 9, "tawba": 9,
    }

    # Convert to lowercase for case-insensitive matching
    name_lower = name.lower()
    if name_lower in surah_variants:
        return f"https://quran.com/{surah_variants[name_lower]}/{ayah_num}"

    return None


def get_sunnah_collection_id(book_name):
    """Find the correct sunnah.com collection ID for a hadith book name."""
    book_name = book_name.lower().strip()

    # Search through our collection mappings
    for collection_id, variations in SUNNAH_COLLECTIONS.items():
        if any(variation in book_name or book_name in variation for variation in variations):
            return collection_id

    # Default fallbacks based on partial matching
    if "bukhari" in book_name:
        return "bukhari"
    elif "muslim" in book_name:
        return "muslim"
    elif "dawud" in book_name or "dawood" in book_name:
        return "abudawud"
    elif "tirmidhi" in book_name or "tirmizi" in book_name:
        return "tirmidhi"
    elif "nasai" in book_name:
        return "nasai"
    elif "majah" in book_name:
        return "ibnmajah"

    # If we can't identify it, just use the raw name
    return book_name.replace(" ", "")


def build_hadith_link(book_name, hadith_number):
    """Build a working sunnah.com link based on the correct URL format."""
    collection_id = get_sunnah_collection_id(book_name)
    # sunnah.com now uses collection:number format
    return f"https://sunnah.com/{collection_id}:{hadith_number}"


def extract_quran_references(text):
    """Extract Quran references from text."""
    references = []

    # Pattern 1: Surah Al-Baqarah, Ayah 255
    pattern1 = re.compile(r"Surah\s+([^,]+),\s+Ayah\s+(\d+)", re.IGNORECASE)
    matches = pattern1.findall(text)
    references.extend([("quran", surah, ayah) for surah, ayah in matches])

    # Pattern 2: Surah Al-Baqarah 255
    pattern2 = re.compile(r"Surah\s+([^\d]+)\s+(\d+)", re.IGNORECASE)
    matches = pattern2.findall(text)
    references.extend([("quran", surah.strip(), ayah) for surah, ayah in matches])

    # Pattern 3: Quran 2:255
    pattern3 = re.compile(r"Quran\s+(\d+):(\d+)", re.IGNORECASE)
    matches = pattern3.findall(text)
    references.extend([("quran", surah, ayah) for surah, ayah in matches])

    # Pattern 4: (2:255) direct citation
    pattern4 = re.compile(r"\((\d+):(\d+)\)")
    matches = pattern4.findall(text)
    references.extend([("quran", surah, ayah) for surah, ayah in matches])

    # Remove duplicates while preserving order
    unique_refs = []
    for ref in references:
        if ref not in unique_refs:
            unique_refs.append(ref)

    return unique_refs


def extract_hadith_references(text):
    """Extract hadith references from text."""
    references = []

    # Pattern 1: Sahih Bukhari, Hadith 1
    pattern1 = re.compile(
        r"(Sahih Bukhari|Sahih Muslim|Sunan Abu Dawood|Jami at-Tirmidhi|Sunan an-Nasai|Sunan Ibn Majah)[,\s]+Hadith\s+(\d+)",
        re.IGNORECASE)
    matches = pattern1.findall(text)
    references.extend([("hadith", book, number) for book, number in matches])

    # Pattern 2: Bukhari 123
    pattern2 = re.compile(r"(Bukhari|Muslim|Abu Dawood|Tirmidhi|Nasai|Ibn Majah)\s+(\d+)", re.IGNORECASE)
    matches = pattern2.findall(text)
    references.extend([("hadith", book, number) for book, number in matches])

    # Pattern 3: narrated by Bukhari (123)
    pattern3 = re.compile(r"narrated by\s+(Bukhari|Muslim|Abu Dawood|Tirmidhi|Nasai|Ibn Majah)[^0-9]*(\d+)",
                          re.IGNORECASE)
    matches = pattern3.findall(text)
    references.extend([("hadith", book, number) for book, number in matches])

    # Remove duplicates while preserving order
    unique_refs = []
    for ref in references:
        if ref not in unique_refs:
            unique_refs.append(ref)

    return unique_refs


def extract_all_references(text):
    """Extract all references from text."""
    quran_refs = extract_quran_references(text)
    hadith_refs = extract_hadith_references(text)
    return quran_refs + hadith_refs


def inject_topic_ayahs(query, raw_context):
    """
    Dynamically identifies query topics and injects relevant Quranic verses.
    Uses Gemini to determine appropriate verses for any topic.
    """
    # Check if we already have good Quran matches
    quran_results = [r for r in raw_context if r.get("source") == "quran"]
    if is_relevant_match(quran_results, threshold=0.5):
        return raw_context

    # Only try to inject Quran verses if the query is about Quran or both
    source_type = detect_source_type(query)
    if source_type == "hadith":
        return raw_context

    # Use Gemini to identify topic and relevant verses
    prompt = f"""
    The following query needs relevant Quranic verses: "{query}"

    First, identify the Islamic topic this query relates to.
    Then, provide 2-3 most relevant Quranic verses about this topic with exact references.
    Format each verse as: "Surah [Name], Ayah [Number]: [Short verse excerpt]"

    Only return the verses without explanation or additional text.
    If no relevant verses exist, return "NO_RELEVANT_VERSES".
    """

    try:
        response = gemini.generate_content(prompt).text.strip()
        if response == "NO_RELEVANT_VERSES":
            return raw_context

        # Add AI-generated verses to context
        verses = response.split("\n")
        for verse in verses:
            if "Surah" in verse and "Ayah" in verse:
                raw_context.append({
                    "source": "quran",
                    "text": verse,
                    "distance": 0.5  # Medium relevance score
                })

        # Re-sort by relevance
        raw_context.sort(key=lambda x: x["distance"])
        return raw_context

    except Exception as e:
        print(f"Error generating topic verses: {e}")
        return raw_context


def add_links_to_references(text):
    """Add links to all references in text."""
    result = text

    # First get all references
    all_refs = extract_all_references(text)
    print(f"Found {len(all_refs)} references to link")

    # Process each reference
    for ref_type, ref1, ref2 in all_refs:
        if ref_type == "quran":
            surah, ayah = ref1, ref2
            link = build_quran_link(surah, ayah)
            if link:
                # Try to find various forms of this reference in text
                ref_forms = [
                    f"Surah {surah}, Ayah {ayah}",
                    f"Surah {surah} Ayah {ayah}",
                    f"Surah {surah}, Verse {ayah}",
                    f"Quran {surah}:{ayah}",
                ]

                # Try each form and replace with linked version
                for form in ref_forms:
                    if form in result and f"({link})" not in result:
                        result = result.replace(form, f"{form} ({link})")
                        print(f"Added Quran link: {form} -> {link}")
                        break

        elif ref_type == "hadith":
            book, number = ref1, ref2
            link = build_hadith_link(book, number)

            # Try to find various forms of this reference in text
            ref_forms = [
                f"{book}, Hadith {number}",
                f"{book} Hadith {number}",
                f"{book} {number}",
            ]

            # Try each form and replace with linked version
            for form in ref_forms:
                if form in result and f"({link})" not in result:
                    result = result.replace(form, f"{form} ({link})")
                    print(f"Added Hadith link: {form} -> {link}")
                    break

    # Final, more aggressive check for any missed references
    # For Quran references like "Surah X, Ayah Y" without links
    quran_pattern = re.compile(r"Surah\s+([^,]+),\s+Ayah\s+(\d+)(?!\s*\(http)", re.IGNORECASE)
    for match in quran_pattern.finditer(result):
        surah, ayah = match.groups()
        ref_text = match.group(0)
        link = build_quran_link(surah, ayah)
        if link:
            result = result.replace(ref_text, f"{ref_text} ({link})")
            print(f"Added missing Quran link: {ref_text} -> {link}")

    # For Hadith references like "Sahih Bukhari, Hadith 123" without links
    hadith_pattern = re.compile(
        r"(Sahih Bukhari|Sahih Muslim|Sunan Abu Dawood|Jami at-Tirmidhi|Sunan an-Nasai|Sunan Ibn Majah)[,\s]+Hadith\s+(\d+)(?!\s*\(http)",
        re.IGNORECASE)
    for match in hadith_pattern.finditer(result):
        book, number = match.groups()
        ref_text = match.group(0)
        link = build_hadith_link(book, number)
        result = result.replace(ref_text, f"{ref_text} ({link})")
        print(f"Added missing Hadith link: {ref_text} -> {link}")

    return result


def ensure_reference_format_consistency(text):
    """Ensure references are formatted consistently for better link detection."""
    # For Quran: Make sure it's "Surah X, Ayah Y"
    # Find patterns like "Surah X Ayah Y" (without comma)
    surah_pattern = re.compile(r"(Surah\s+[^\d,]+)\s+Ayah", re.IGNORECASE)
    text = surah_pattern.sub(r"\1, Ayah", text)

    # For Hadith: Make sure it's "Book X, Hadith Y"
    # Find patterns like "Sahih Bukhari Hadith 123" (without comma)
    hadith_pattern = re.compile(
        r"(Sahih Bukhari|Sahih Muslim|Sunan Abu Dawood|Jami at-Tirmidhi|Sunan an-Nasai|Sunan Ibn Majah)\s+Hadith",
        re.IGNORECASE)
    text = hadith_pattern.sub(r"\1, Hadith", text)

    return text


def ask_islamic_assistant(query):
    # Detect source type
    source_type = detect_source_type(query)
    print(f"Query detected as: {source_type.upper()} query")

    # First try with original query
    raw_results = retrieve_context(query, source_type=source_type, top_k=10)

    # Check if results are relevant
    used_alternatives = []
    if not is_relevant_match(raw_results):
        print("Searching for alternative terms...")
        alternatives = generate_alternatives(query)

        # Try each alternative
        best_results = raw_results
        for alt in alternatives:
            alt_results = retrieve_context(alt, source_type=source_type, top_k=10)
            if is_relevant_match(alt_results) and (
                    not best_results or alt_results[0]["distance"] < best_results[0]["distance"]):
                best_results = alt_results
                used_alternatives.append(alt)

        # If we found better results with alternatives, use those
        if used_alternatives:
            raw_results = best_results

    # Try to inject topic-relevant Quran verses if appropriate
    if source_type in ["quran", "both"]:
        raw_results = inject_topic_ayahs(query, raw_results)

    # Separate results by source for presentation
    quran_texts = [r["text"] for r in raw_results if r.get("source") == "quran"]
    hadith_texts = [r["text"] for r in raw_results if r.get("source") == "hadith"]

    # Build context based on what we found
    context = ""
    if quran_texts:
        context += "QURAN REFERENCES:\n" + "\n\n".join(quran_texts) + "\n\n"
    if hadith_texts:
        context += "HADITH REFERENCES:\n" + "\n\n".join(hadith_texts)

    alternative_note = ""
    if used_alternatives:
        alternative_note = f"""
        Note: The exact term in the query wasn't found. 
        I searched for related concepts like: {', '.join(used_alternatives)}.
        """

    prompt = f"""
    You are an Islamic assistant. You help verify and explain Islamic queries based on the Quran and authentic Hadith.

    1. Use the provided Islamic texts to answer the question clearly and accurately.
    2. Answer in the same language as the user's question (English or Urdu or mix).
    3. ALWAYS include exact references for every claim you make:
       - For Quran: Format EXACTLY as "Surah [Name], Ayah [Number]" 
       - For Hadith: Format EXACTLY as "[Full Book Name], Hadith [Number]"
    4. Always use these EXACT book names:
       - "Sahih Bukhari" (not just "Bukhari")
       - "Sahih Muslim" (not just "Muslim") 
       - "Sunan Abu Dawood" (not just "Abu Dawood")
       - "Jami at-Tirmidhi" (not just "Tirmidhi")
       - "Sunan an-Nasai" (not just "Nasai")
       - "Sunan Ibn Majah" (not just "Ibn Majah")
    5. If both Quran and Hadith are provided, explain how they complement each other.

    The automatic link system will add URLs to your references if they're formatted correctly.
    If the provided context doesn't support the question, clearly state that there isn't clear evidence for it in the sources you have.

    {alternative_note}

    Islamic Context:
    {context}

    User's Question:
    {query}

    Answer:
    """

    # Add tafseer request if needed
    if any(x in query.lower() for x in ["tafseer", "tafsir", "translate", "tarjuma", "translation", "تشریح", "تفسیر"]):
        prompt += "\nAlso provide a simple tafseer/translation of any referenced Ayah."

    # Generate initial response
    response = gemini.generate_content(prompt).text.strip()

    # Include alternative note in the final response if alternatives were used
    if used_alternatives:
        response = f"Note: I didn't find the exact terms you mentioned, so I searched for related Islamic concepts like: {', '.join(used_alternatives)}.\n\n{response}"

    # 1. First ensure references are consistently formatted
    formatted_response = ensure_reference_format_consistency(response)

    # 2. Add links to all references
    linked_response = add_links_to_references(formatted_response)

    # 3. Final check for missed references
    if linked_response.count("http") < 3 and ("Surah" in linked_response or "Hadith" in linked_response):
        # Try once more with a reformatted answer
        print("Fewer links than expected. Trying additional reference formatting...")

        # Ask Gemini to reformat the answer with standardized references
        reformat_prompt = f"""
        Reformat this answer to use standardized Islamic reference formatting.

        For all Quran references: "Surah [Name], Ayah [Number]"
        For all Hadith references: "[Full Book Name], Hadith [Number]"

        Use the EXACT book names (Sahih Bukhari, Sahih Muslim, Sunan Abu Dawood, etc.)
        Keep ALL the content exactly the same, just fix the reference formatting.
        And also add only those links which are correctly related to user query only.

        Original answer:
        {response}
        """

        try:
            reformatted_response = gemini.generate_content(reformat_prompt).text.strip()
            reformatted_response = ensure_reference_format_consistency(reformatted_response)
            new_linked_response = add_links_to_references(reformatted_response)

            # Only use the new version if it has more links
            if new_linked_response.count("http") > linked_response.count("http"):
                linked_response = new_linked_response
        except Exception as e:
            print(f"Error in reformatting: {e}")

    return linked_response


print("🕌 Islamic Truth Verifier (Quran & Hadith)")
print("Type your question about Islamic teachings. Type 'exit' to quit.\n")

while True:
    user_input = input("You: ")
    if user_input.lower() in ["exit", "quit"]:
        print("📘 Chat ended.")
        break
    answer = ask_islamic_assistant(user_input)
    print("\n📖 Answer:\n", answer, "\n")