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
    name = surah_name.strip().replace("'", "'")
    surah_no = SURAH_MAP.get(name)
    if surah_no:
        return f"https://quran.com/{surah_no}:{ayah_num}"
    return None


def extract_references(answer_text):
    """
    Finds patterns like 'Surah Al-Ahzab, Ayah 59' and Hadith references
    Returns list of references with their types.
    """
    references = []

    # Quran reference patterns (multiple formats)
    quran_patterns = [
        # Standard format: Surah Al-Ahzab, Ayah 59
        re.compile(
            r"(?:Surah|Sura|سورة)\s+([A-Za-zÀ-ÖØ-öø-ÿ'\-]+)[, ]+\s*(?:Ayah|آية|Ayat)\s+(\d+)",
            flags=re.IGNORECASE
        ),
        # Alternative format: Al-Ahzab 59
        re.compile(
            r"(?:Surah|Sura|سورة)?\s*([A-Za-zÀ-ÖØ-öø-ÿ'\-]+)\s+(\d+)(?!\s*:)",
            flags=re.IGNORECASE
        ),
        # Quran citation format: 2:255
        re.compile(r"Quran\s+(\d+):(\d+)", flags=re.IGNORECASE),
    ]

    for pattern in quran_patterns:
        for match in pattern.finditer(answer_text):
            surah, ayah = match.groups()
            references.append(("quran", surah, ayah))

    # Hadith reference patterns (multiple formats)
    hadith_patterns = [
        # Standard format: Sahih Bukhari, Hadith 123
        re.compile(
            r"(Sahih Bukhari|Sahih Muslim|Sunan Abu Dawood|Jami at-Tirmidhi|Sunan an-Nasa'i|Sunan Ibn Majah)"
            r"[,\s]*(?:Hadith|حدیث)?[,\s]*(?:#|No\.?|Number)?[,\s]*(\d+)",
            flags=re.IGNORECASE
        ),
        # Alternative format: Bukhari 123
        re.compile(
            r"(Bukhari|Muslim|Abu Dawood|Dawud|Tirmidhi|Tirmizi|Nasai|Nasa'i|Ibn Majah)"
            r"[,\s]*(?:Hadith|حدیث)?[,\s]*(?:#|No\.?|Number)?[,\s]*(\d+)",
            flags=re.IGNORECASE
        )
    ]

    for pattern in hadith_patterns:
        for match in pattern.finditer(answer_text):
            book, number = match.groups()
            references.append(("hadith", book, number))

    return references


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


def normalize_hadith_book_name(book_name):
    """Convert different variations of hadith book names to standard format for links."""
    book_name = book_name.lower()

    if "bukhari" in book_name:
        return "bukhari"
    elif "muslim" in book_name:
        return "muslim"
    elif "dawood" in book_name or "dawud" in book_name:
        return "abudawud"
    elif "tirmidhi" in book_name or "tirmizi" in book_name:
        return "tirmidhi"
    elif "nasai" in book_name or "nasa'i" in book_name:
        return "nasai"
    elif "ibn majah" in book_name:
        return "ibnmajah"
    else:
        return book_name.replace(" ", "-")


def annotate_with_links(answer_text):
    """Add links to Quran verses and reference info for Hadiths"""
    references = extract_references(answer_text)

    # First make a copy to avoid modification issues during iteration
    processed_text = answer_text

    for ref_type, *args in references:
        if ref_type == "quran":
            surah, ayah = args
            # Try to build a Quran link
            link = None

            # If it's a numeric Surah reference
            if surah.isdigit():
                link = f"https://quran.com/{surah}:{ayah}"
            else:
                link = build_quran_link(surah, ayah)

            if link:
                # Look for different reference formats
                ref_patterns = [
                    f"Surah {surah}, Ayah {ayah}",
                    f"Sura {surah}, Ayah {ayah}",
                    f"Surah {surah}, Verse {ayah}",
                    f"Quran {surah}:{ayah}",
                    f"{surah} {ayah}"
                ]

                for ref_str in ref_patterns:
                    if ref_str in processed_text:
                        processed_text = processed_text.replace(
                            ref_str,
                            f"{ref_str} ({link})"
                        )
                        break

        elif ref_type == "hadith":
            book, number = args
            # Standardize book name for different formats
            book_url = normalize_hadith_book_name(book)
            link = f"https://sunnah.com/{book_url}:{number}"

            # Look for different reference formats
            ref_patterns = [
                f"{book}, Hadith {number}",
                f"{book} {number}",
                f"Hadith {number} in {book}"
            ]

            for ref_str in ref_patterns:
                if ref_str in processed_text and "sunnah.com" not in processed_text:
                    processed_text = processed_text.replace(
                        ref_str,
                        f"{ref_str} ({link})"
                    )
                    break

    return processed_text


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
       - For Quran: Format as "Surah [Name], Ayah [Number]" 
       - For Hadith: Format as "[Book Name], Hadith [Number]"
    4. Always mention the full correct book names: "Sahih Bukhari", "Sahih Muslim", "Sunan Abu Dawood", etc.
    5. If both Quran and Hadith are provided, explain how they complement each other.
    6. Always include specific references even if they were implicit in the context.

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

    response = gemini.generate_content(prompt).text.strip()

    # Include alternative note in the final response if alternatives were used
    if used_alternatives:
        response = f"Note: I didn't find the exact terms you mentioned, so I searched for related Islamic concepts like: {', '.join(used_alternatives)}.\n\n{response}"

    # Add links to references
    linked_response = annotate_with_links(response)

    # Check if links were added; if not, force links through additional processing
    if "http" not in linked_response:
        print("Enhanced link generation in progress...")
        # Force link generation by explicitly asking the model to include standardized references
        augmented_prompt = f"""
        Your previous response needs links added to all Quranic verses and Hadith references.

        Rewrite your answer with exact same content but format all references consistently:
        - For Quran: "Surah [Name], Ayah [Number]"
        - For Hadith: "Sahih Bukhari, Hadith [Number]" (use full book names)

        Original response:
        {response}
        """

        try:
            augmented_response = gemini.generate_content(augmented_prompt).text.strip()
            linked_response = annotate_with_links(augmented_response)
        except:
            # If generation fails, use original with manual link injection
            linked_response = response

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