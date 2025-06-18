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
index = faiss.read_index("quran_english.index")
with open("quran_english_metadata.json", "r", encoding="utf-8") as f:
    metadata = json.load(f)


def retrieve_context(query, top_k=10):
    query_embedding = model.encode([query]).astype("float32")
    distances, indices = index.search(query_embedding, top_k)
    results = []
    for i, idx in enumerate(indices[0]):
        results.append({
            "text": metadata[idx]["text"],
            "distance": float(distances[0][i])
        })
    return results


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
    Finds patterns like 'Surah Al-Ahzab, Ayah 59' (or Urdu variants)
    Returns list of (surah, ayah) tuples.
    """
    pattern = re.compile(
        r"(?:Surah|Sura|سورة)\s+([A-Za-zÀ-ÖØ-öø-ÿ'\-]+)[, ]+\s*(?:Ayah|آية|Ayat)\s+(\d+)",
        flags=re.IGNORECASE
    )
    return pattern.findall(answer_text)


def inject_topic_ayahs(query, raw_context):
    """
    Dynamically identifies query topics and injects relevant Quranic verses.
    Uses Gemini to determine appropriate verses for any topic.
    """
    # Check if results are already good enough
    if is_relevant_match(raw_context, threshold=0.5):
        return "\n".join([r["text"] for r in raw_context])

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
            return "\n".join([r["text"] for r in raw_context])

        # Add links to the verses
        verses = response.split("\n")
        verses_with_links = []

        for verse in verses:
            if "Surah" in verse and "Ayah" in verse:
                # Extract surah and ayah for link generation
                match = re.search(r"Surah\s+([^,]+),\s+Ayah\s+(\d+)", verse)
                if match:
                    surah, ayah = match.groups()
                    link = build_quran_link(surah, ayah)
                    if link:
                        verse = f"{verse} ({link})"
                verses_with_links.append(verse)

        # Combine AI-generated verses with embedding search results
        return "\n".join(verses_with_links) + "\n" + "\n".join([r["text"] for r in raw_context])

    except Exception as e:
        print(f"Error generating topic verses: {e}")
        return "\n".join([r["text"] for r in raw_context])


def annotate_with_links(answer_text):
    refs = extract_references(answer_text)
    for surah, ayah in refs:
        link = build_quran_link(surah, ayah)
        if link:
            # append link after the reference in the answer
            ref_str = f"Surah {surah}, Ayah {ayah}"
            answer_text = answer_text.replace(
                ref_str,
                f"{ref_str} ({link})"
            )
    return answer_text


def ask_gemini(query):
    # First try with original query
    raw_results = retrieve_context(query, top_k=10)

    # Check if results are relevant
    used_alternatives = []
    if not is_relevant_match(raw_results):
        print("Searching for alternative terms...")
        alternatives = generate_alternatives(query)

        # Try each alternative
        best_results = raw_results
        for alt in alternatives:
            alt_results = retrieve_context(alt, top_k=10)
            if is_relevant_match(alt_results) and (
                    not best_results or alt_results[0]["distance"] < best_results[0]["distance"]):
                best_results = alt_results
                used_alternatives.append(alt)

        # If we found better results with alternatives, use those
        if used_alternatives:
            raw_results = best_results

    context = inject_topic_ayahs(query, raw_results)

    alternative_note = ""
    if used_alternatives:
        alternative_note = f"""
        Note: The exact term in the query wasn't found in the Quran. 
        I searched for related concepts like: {', '.join(used_alternatives)}.
        """

    prompt = f"""
    You are an Islamic assistant. You are helping verify and explain Islamic queries based on Quranic context.

    1. Use the provided Quranic text to answer the question clearly and accurately.
    2. Answer in the same language as the user's question (English or Urdu or mix).
    3. Always return:
       - The answer
       - The **Surah name and Ayah number**
       - The **Quran.com** link (e.g., https://quran.com/24/31)
       - (Optional) short explanation/tafsir if user asks

    If the Quranic context supports the question, give reference. Otherwise, say:
    "Is baat ka Quran mein koi wazeh saboot nahi milta."

    {alternative_note}

    Quranic Context:
    {context}

    User's Question:
    {query}

    Answer:
    """
    if any(x in query.lower() for x in ["tafseer", "tafsir", "translate", "tarjuma", "translation", "تشریح", "تفسیر"]):
        prompt += "\nAlso provide a simple tafseer/translation of any referenced Ayah."

    response = gemini.generate_content(prompt).text.strip()

    # Include alternative note in the final response if alternatives were used
    if used_alternatives:
        response = f"Note: I didn't find the exact terms you mentioned, so I searched for related Islamic concepts like: {', '.join(used_alternatives)}.\n\n{response}"

    return annotate_with_links(response)


print("🕌 Islamic Quran Bot (English)")
print("Type your question about the Quran. Type 'exit' to quit.\n")

while True:
    user_input = input("You: ")
    if user_input.lower() in ["exit", "quit"]:
        print("📘 Chat ended.")
        break
    answer = ask_gemini(user_input)
    print("\n📖 Answer:\n", answer, "\n")