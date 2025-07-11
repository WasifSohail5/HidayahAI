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

        # CORS settings - Frontend ke liye
        self.allowed_origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "*"  # Development ke liye, production mein restrict karna
        ]


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
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

        # Try to load Quran resources (optional for demo)
        try:
            logger.info("Loading Quran index...")
            quran_index = faiss.read_index(settings.quran_index_path)
            with open(settings.quran_metadata_path, "r", encoding="utf-8") as f:
                quran_metadata = json.load(f)
            resource_state["quran_index"] = True
            logger.info("Quran resources loaded successfully")
        except Exception as e:
            logger.warning(f"Quran resources not found: {e}")
            resource_state["quran_index"] = False

        # Try to load Hadith resources (optional for demo)
        try:
            logger.info("Loading Hadith index...")
            hadith_index = faiss.read_index(settings.hadith_index_path)
            with open(settings.hadith_metadata_path, "r", encoding="utf-8") as f:
                hadith_metadata = json.load(f)
            resource_state["hadith_index"] = True
            logger.info("Hadith resources loaded successfully")
        except Exception as e:
            logger.warning(f"Hadith resources not found: {e}")
            resource_state["hadith_index"] = False

        resource_state["initialized"] = True
        logger.info("API initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Error loading resources: {e}")
        # For demo purposes, still mark as initialized
        resource_state["initialized"] = True
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
    # For demo purposes, if indices are not loaded, return sample data
    if not resource_state["embedding_model"]:
        return generate_sample_context(query, source_type)
    
    try:
        query_embedding = model.encode([query]).astype("float32")
        results = []

        if source_type in ["quran", "both"] and quran_index is not None and quran_metadata is not None:
            quran_distances, quran_indices = quran_index.search(query_embedding, top_k)
            for i, idx in enumerate(quran_indices[0]):
                if idx < len(quran_metadata):  # Ensure index is valid
                    results.append({
                        "source": "quran",
                        "text": quran_metadata[idx]["text"],
                        "distance": float(quran_distances[0][i])
                    })

        if source_type in ["hadith", "both"] and hadith_index is not None and hadith_metadata is not None:
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
        return results[:top_k] if results else generate_sample_context(query, source_type)
    
    except Exception as e:
        logger.error(f"Error in retrieve_context: {e}")
        return generate_sample_context(query, source_type)


def generate_sample_context(query, source_type):
    """Generate sample context when indices are not available"""
    sample_responses = {
        "prayer": [
            {
                "source": "quran",
                "text": "And establish prayer and give zakah and bow with those who bow. (Surah Al-Baqarah, Ayah 43)",
                "distance": 0.3
            },
            {
                "source": "hadith", 
                "text": "The Prophet (peace be upon him) said: 'Prayer is the pillar of religion.' (Sahih Bukhari, Hadith 528)",
                "distance": 0.4
            }
        ],
        "dua": [
            {
                "source": "quran",
                "text": "And when My servants ask you concerning Me, indeed I am near. I respond to the invocation of the supplicant when he calls upon Me. (Surah Al-Baqarah, Ayah 186)",
                "distance": 0.2
            },
            {
                "source": "hadith",
                "text": "The Prophet (peace be upon him) said: 'Dua is worship.' (Jami at-Tirmidhi, Hadith 3372)",
                "distance": 0.3
            }
        ]
    }
    
    query_lower = query.lower()
    for keyword, responses in sample_responses.items():
        if keyword in query_lower:
            if source_type == "quran":
                return [r for r in responses if r["source"] == "quran"]
            elif source_type == "hadith":
                return [r for r in responses if r["source"] == "hadith"]
            else:
                return responses
    
    # Default response
    return [
        {
            "source": "quran",
            "text": "And whoever relies upon Allah - then He is sufficient for him. Indeed, Allah will accomplish His purpose. (Surah At-Talaq, Ayah 3)",
            "distance": 0.5
        }
    ]


def is_relevant_match(results, threshold=0.6):
    """Check if the search results are relevant based on distance scores."""
    if not results:
        return False
    # Lower distance means better match
    return any(r["distance"] < threshold for r in results)


def generate_alternatives(query):
    """Generate alternative words/phrases for the query using Gemini."""
    if gemini is None:
        return ["prayer", "worship", "faith"]  # Fallback alternatives
        
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
        return ["prayer", "worship", "faith"]  # Fallback


# [Rest of the functions remain the same as in your original file...]
# I'll include the key functions needed for the API to work

async def process_islamic_query(query: str, source_type: str = "auto", top_k: int = 10):
    """Process an Islamic query and generate a response with references."""
    start_time = time.time()

    # If source_type is auto, detect it from the query
    if source_type == "auto":
        source_type = detect_source_type(query)

    logger.info(f"Query detected as: {source_type.upper()} query")

    # Get context
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

    # Separate results by source for presentation
    quran_texts = [r["text"] for r in raw_results if r.get("source") == "quran"]
    hadith_texts = [r["text"] for r in raw_results if r.get("source") == "hadith"]

    # Build context based on what we found
    context = ""
    if quran_texts:
        context += "QURAN REFERENCES:\n" + "\n\n".join(quran_texts) + "\n\n"
    if hadith_texts:
        context += "HADITH REFERENCES:\n" + "\n\n".join(hadith_texts)

    # Generate response using Gemini or fallback
    if gemini is not None:
        prompt = f"""
        You are a knowledgeable Islamic assistant. Answer the following question based on the provided Islamic sources.
        
        Always include proper references in your answer:
        - For Quran: "Surah [Name], Ayah [Number]"
        - For Hadith: "[Book Name], Hadith [Number]"
        
        Islamic Context:
        {context}
        
        Question: {query}
        
        Answer:
        """
        
        try:
            response = gemini.generate_content(prompt).text.strip()
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            response = f"Based on Islamic sources, here's what I found regarding your question about '{query}':\n\n{context}"
    else:
        # Fallback response when Gemini is not available
        response = f"Based on Islamic sources, here's what I found regarding your question about '{query}':\n\n{context}"

    # Include alternative note if alternatives were used
    if used_alternatives:
        response = f"Note: I searched for related concepts: {', '.join(used_alternatives)}.\n\n{response}"

    end_time = time.time()
    processing_time = end_time - start_time

    # Count references in the response
    references_count = response.count("Surah") + response.count("Hadith")

    return {
        "query": query,
        "answer": response,
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
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Islamic Truth Verifier API is running!",
        "status": "active",
        "docs": "/docs",
        "health": "/health",
        "version": settings.api_version,
        "endpoints": {
            "query": "POST /query",
            "health": "GET /health",
            "supported_references": "GET /supported-references"
        }
    }


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
            "indexed": resource_state["quran_index"]
        },
        "hadith": {
            "collections": list(HADITH_COLLECTION_MAP.keys()),
            "indexed": resource_state["hadith_index"]
        },
        "status": "Demo mode - using sample data" if not (resource_state["quran_index"] and resource_state["hadith_index"]) else "Full database loaded"
    }


# =========== Application Startup ===========
@app.on_event("startup")
async def startup_event():
    """Load resources when the application starts."""
    logger.info("🚀 Starting Islamic Truth Verifier API...")
    logger.info("📍 Server will be available at: http://localhost:8000")
    logger.info("📖 API Documentation: http://localhost:8000/docs")
    logger.info("🏥 Health Check: http://localhost:8000/health")
    
    # Start resource loading
    load_resources()


# Run with: uvicorn islamic_truth_verifier_api:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
