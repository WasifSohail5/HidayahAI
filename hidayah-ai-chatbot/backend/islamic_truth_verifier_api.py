from fastapi import FastAPI, HTTPException, Query, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import faiss
import json
import numpy as np
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
import re
import time
import logging
import os
from typing import Optional, List, Dict, Any
from enum import Enum

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("islamic_truth_verifier_api")


# =========== Configuration ===========
class Settings:
    def __init__(self):
        # API configuration
        self.api_version = "1.0.0"
        self.api_title = "Islamic Truth Verifier API"
        self.api_description = "RAG-based chatbot for Islamic queries using Quran and authentic Hadith"

        # Model paths
        self.quran_index_path = "quran_english.index"
        self.quran_metadata_path = "quran_english_metadata.json"
        self.hadith_index_path = "hadith.index"
        self.hadith_metadata_path = "processed_hadith/hadith_chunks.json"

        # Gemini API key
        self.gemini_api_key = os.environ.get("GEMINI_API_KEY", "AIzaSyA1RJISbzG7WJ0T_ZRQIEVj_WWkhiHKml4")

        # Embedding model
        self.embedding_model = "all-MiniLM-L6-v2";

        # Default parameters
        self.default_top_k = 10
        self.default_relevance_threshold = 0.6

        # CORS settings
        self.allowed_origins = ["*"]  # Restrict this in production


settings = Settings()

# =========== API Definition ===========
app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========== Data Models ===========
class QuerySource(str, Enum):
    QURAN = "quran"
    HADITH = "hadith"
    BOTH = "both"
    AUTO = "auto"  # Let the system detect based on query content


class QueryRequest(BaseModel):
    query: str
    source_type: QuerySource = QuerySource.AUTO
    language: Optional[str] = None  # For future multilingual support
    top_k: Optional[int] = None


class QueryResponse(BaseModel):
    query: str
    answer: str
    source_type: str
    processing_time: float
    references_count: int
    alternatives_used: Optional[List[str]] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    indices_loaded: bool
    embedding_model_loaded: bool


# =========== Resource Loading ===========
# Setup loading state tracking
resource_state = {
    "quran_index": False,
    "hadith_index": False,
    "embedding_model": False,
    "initialized": False
}

# Resources to be loaded
quran_index = None
quran_metadata = None
hadith_index = None
hadith_metadata = None
model = None
gemini = None


def load_resources():
    """Load all required resources for the API"""
    global quran_index, quran_metadata, hadith_index, hadith_metadata, model, gemini, resource_state

    try:
        # Configure Gemini
        genai.configure(api_key=settings.gemini_api_key)
        gemini = genai.GenerativeModel(model_name="gemini-1.5-flash")

        # Load embedding model
        logger.info("Loading embedding model...")
        model = SentenceTransformer(settings.embedding_model)
        resource_state["embedding_model"] = True

        # Load Quran resources
        logger.info("Loading Quran index...")
        quran_index = faiss.read_index(settings.quran_index_path)
        with open(settings.quran_metadata_path, "r", encoding="utf-8") as f:
            quran_metadata = json.load(f)
        resource_state["quran_index"] = True

        # Load Hadith resources
        logger.info("Loading Hadith index...")
        hadith_index = faiss.read_index(settings.hadith_index_path)
        with open(settings.hadith_metadata_path, "r", encoding="utf-8") as f:
            hadith_metadata = json.load(f)
        resource_state["hadith_index"] = True

        resource_state["initialized"] = True
        logger.info("All resources loaded successfully")
        return True
    except Exception as e:
        logger.error(f"Error loading resources: {e}")
        return False


# Map for hadith collections as used by sunnah.com
HADITH_COLLECTION_MAP = {
    "sahih bukhari": "bukhari",
    "bukhari": "bukhari",
    "sahih muslim": "muslim",
    "muslim": "muslim",
    "sunan abu dawood": "abudawud",
    "abu dawood": "abudawud",
    "dawud": "abudawud",
    "abu dawud": "abudawud",
    "jami at-tirmidhi": "tirmidhi",
    "tirmidhi": "tirmidhi",
    "tirmizi": "tirmidhi",
    "sunan an-nasai": "nasai",
    "nasai": "nasai",
    "nasa'i": "nasai",
    "sunan ibn majah": "ibnmajah",
    "ibn majah": "ibnmajah"
}

# Surah mapping is imported from surah_map.py in the original code
# For API purposes, we'll need to include it directly here

# A simplified version of SURAH_MAP for common surahs
SURAH_MAP = {
    "Al-Fatihah": 1, "Al-Baqarah": 2, "Ali 'Imran": 3, "An-Nisa": 4, "Al-Ma'idah": 5,
    "Al-An'am": 6, "Al-A'raf": 7, "Al-Anfal": 8, "At-Tawbah": 9, "Yunus": 10,
    "Hud": 11, "Yusuf": 12, "Ar-Ra'd": 13, "Ibrahim": 14, "Al-Hijr": 15,
    "An-Nahl": 16, "Al-Isra": 17, "Al-Kahf": 18, "Maryam": 19, "Ta-Ha": 20,
    "Al-Anbiya": 21, "Al-Hajj": 22, "Al-Mu'minun": 23, "An-Nur": 24, "Al-Furqan": 25,
    "Ash-Shu'ara": 26, "An-Naml": 27, "Al-Qasas": 28, "Al-Ankabut": 29, "Ar-Rum": 30,
    "Luqman": 31, "As-Sajdah": 32, "Al-Ahzab": 33, "Saba": 34, "Fatir": 35,
    "Ya-Sin": 36, "As-Saffat": 37, "Sad": 38, "Az-Zumar": 39, "Ghafir": 40,
    "Fussilat": 41, "Ash-Shura": 42, "Az-Zukhruf": 43, "Ad-Dukhan": 44, "Al-Jathiyah": 45,
    "Al-Ahqaf": 46, "Muhammad": 47, "Al-Fath": 48, "Al-Hujurat": 49, "Qaf": 50,
    "Adh-Dhariyat": 51, "At-Tur": 52, "An-Najm": 53, "Al-Qamar": 54, "Ar-Rahman": 55,
    "Al-Waqi'ah": 56, "Al-Hadid": 57, "Al-Mujadilah": 58, "Al-Hashr": 59, "Al-Mumtahinah": 60,
    "As-Saff": 61, "Al-Jumu'ah": 62, "Al-Munafiqun": 63, "At-Taghabun": 64, "At-Talaq": 65,
    "At-Tahrim": 66, "Al-Mulk": 67, "Al-Qalam": 68, "Al-Haqqah": 69, "Al-Ma'arij": 70,
    "Nuh": 71, "Al-Jinn": 72, "Al-Muzzammil": 73, "Al-Muddathir": 74, "Al-Qiyamah": 75,
    "Al-Insan": 76, "Al-Mursalat": 77, "An-Naba": 78, "An-Nazi'at": 79, "Abasa": 80,
    "At-Takwir": 81, "Al-Infitar": 82, "Al-Mutaffifin": 83, "Al-Inshiqaq": 84, "Al-Buruj": 85,
    "At-Tariq": 86, "Al-A'la": 87, "Al-Ghashiyah": 88, "Al-Fajr": 89, "Al-Balad": 90,
    "Ash-Shams": 91, "Al-Lail": 92, "Ad-Duha": 93, "Ash-Sharh": 94, "At-Tin": 95,
    "Al-Alaq": 96, "Al-Qadr": 97, "Al-Bayyinah": 98, "Az-Zalzalah": 99, "Al-Adiyat": 100,
    "Al-Qari'ah": 101, "At-Takathur": 102, "Al-Asr": 103, "Al-Humazah": 104, "Al-Fil": 105,
    "Quraish": 106, "Al-Ma'un": 107, "Al-Kawthar": 108, "Al-Kafirun": 109, "An-Nasr": 110,
    "Al-Masad": 111, "Al-Ikhlas": 112, "Al-Falaq": 113, "An-Nas": 114
}


# =========== Core Functions ===========
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
        logger.error(f"Error generating alternatives: {e}")
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

    # Direct mapping to the exact collection IDs you specified
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
    elif "majah" in book_name:
        return "ibnmajah"

    # If we can't identify it, use a default
    return "bukhari"


def build_hadith_link(book_name, hadith_number):
    """Build a working sunnah.com link based on the correct URL format."""
    collection_id = get_sunnah_collection_id(book_name)
    # sunnah.com uses collection:number format
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
        logger.error(f"Error generating topic verses: {e}")
        return raw_context


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


def add_links_to_references(text):
    """Add links to all references in text."""
    result = text

    # First get all references
    all_refs = extract_all_references(text)
    logger.info(f"Found {len(all_refs)} references to link")

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
                        logger.info(f"Added Quran link: {form} -> {link}")
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
                    logger.info(f"Added Hadith link: {form} -> {link}")
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
            logger.info(f"Added missing Quran link: {ref_text} -> {link}")

    # For Hadith references like "Sahih Bukhari, Hadith 123" without links
    hadith_pattern = re.compile(
        r"(Sahih Bukhari|Sahih Muslim|Sunan Abu Dawood|Jami at-Tirmidhi|Sunan an-Nasai|Sunan Ibn Majah)[,\s]+Hadith\s+(\d+)(?!\s*\(http)",
        re.IGNORECASE)
    for match in hadith_pattern.finditer(result):
        book, number = match.groups()
        ref_text = match.group(0)
        link = build_hadith_link(book, number)
        result = result.replace(ref_text, f"{ref_text} ({link})")
        logger.info(f"Added missing Hadith link: {ref_text} -> {link}")

    return result


async def process_islamic_query(query: str, source_type: str = "auto", top_k: int = 10):
    """Process an Islamic query and generate a response with references."""
    start_time = time.time()

    # If source_type is auto, detect it from the query
    if source_type == "auto":
        source_type = detect_source_type(query)

    logger.info(f"Query detected as: {source_type.upper()} query")

    # First try with original query
    raw_results = retrieve_context(query, source_type=source_type, top_k=top_k)

    # Check if results are relevant
    used_alternatives = []
    if not is_relevant_match(raw_results):
        logger.info("Searching for alternative terms...")
        alternatives = generate_alternatives(query)

        # Try each alternative
        best_results = raw_results
        for alt in alternatives:
            alt_results = retrieve_context(alt, source_type=source_type, top_k=top_k)
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
        logger.info("Fewer links than expected. Trying additional reference formatting...")

        # Ask Gemini to reformat the answer with standardized references
        reformat_prompt = f"""
        Reformat this answer to use standardized Islamic reference formatting.

        For all Quran references: "Surah [Name], Ayah [Number]"
        For all Hadith references: "[Full Book Name], Hadith [Number]"

        Use the EXACT book names (Sahih Bukhari, Sahih Muslim, Sunan Abu Dawood, etc.)
        Keep ALL the content exactly the same, just fix the reference formatting.

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
            logger.error(f"Error in reformatting: {e}")

    end_time = time.time()
    processing_time = end_time - start_time

    # Count references in the final response
    references_count = linked_response.count("http")

    return {
        "query": query,
        "answer": linked_response,
        "source_type": source_type,
        "processing_time": processing_time,
        "references_count": references_count,
        "alternatives_used": used_alternatives if used_alternatives else None
    }


# =========== Dependency for checking if resources are loaded ===========
def get_resource_status():
    """Get the current status of loaded resources."""
    if not resource_state["initialized"]:
        # Try loading resources if they're not already loaded
        load_resources()
    return resource_state


def check_resources():
    """Check if necessary resources are loaded."""
    status = get_resource_status()
    if not status["initialized"]:
        raise HTTPException(
            status_code=503,
            detail="API resources are still initializing. Please try again shortly."
        )
    return status


# =========== API Endpoints ===========
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check the health status of the API and its components."""
    status = get_resource_status()

    return {
        "status": "healthy" if status["initialized"] else "initializing",
        "version": settings.api_version,
        "indices_loaded": status["quran_index"] and status["hadith_index"],
        "embedding_model_loaded": status["embedding_model"]
    }


@app.post("/query", response_model=QueryResponse)
async def query_endpoint(
        request: QueryRequest,
        resource_status: Dict = Depends(check_resources)
):
    """
    Query the Islamic Truth Verifier with a question about Islam.

    The API will search both Quran and Hadith sources (unless specified otherwise)
    and generate a comprehensive answer with references and links.

    - For Quran references, links to quran.com will be provided
    - For Hadith references, links to sunnah.com will be provided
    """
    try:
        # Process the query based on parameters
        source_type = request.source_type.value if request.source_type != QuerySource.AUTO else "auto"
        top_k = request.top_k or settings.default_top_k

        result = await process_islamic_query(
            query=request.query,
            source_type=source_type,
            top_k=top_k
        )

        return result

    except Exception as e:
        logger.error(f"Error processing query: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your query: {str(e)}"
        )


@app.get("/supported-references")
async def get_supported_references():
    """Get information about supported Quran surahs and Hadith collections"""
    return {
        "quran": {
            "surah_count": 114,
            "indexed": True
        },
        "hadith": {
            "collections": list(HADITH_COLLECTION_MAP.keys()),
            "indexed": True
        }
    }


# =========== Application Startup ===========
@app.on_event("startup")
async def startup_event():
    """Load resources when the application starts."""
    # Start resource loading in background to avoid blocking startup
    load_resources()


# Run with: uvicorn islamic_truth_verifier_api:app --reload
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)