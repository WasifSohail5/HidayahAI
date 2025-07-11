from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import time
import uvicorn
import logging

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Islamic Assistant API",
    description="AI-powered Islamic Q&A based on Quran and Hadith",
    version="1.0.0"
)

# CORS middleware - Frontend ke liye
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",  # Backup port
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Request/Response Models
class QueryRequest(BaseModel):
    query: str
    source_type: str = "auto"  # "quran", "hadith", "both", "auto"
    language: Optional[str] = "en"
    top_k: Optional[int] = 10

class QueryResponse(BaseModel):
    query: str
    answer: str
    source_type: str
    processing_time: float
    references_count: int
    alternatives_used: Optional[List[str]] = None

# Root endpoint
@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {
        "message": "Islamic Assistant API is running!",
        "status": "active",
        "docs": "http://localhost:8000/docs",
        "health": "http://localhost:8000/health",
        "endpoints": {
            "query": "POST /query",
            "health": "GET /health",
            "sources": "GET /sources"
        }
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    logger.info("Health check accessed")
    return {
        "status": "healthy",
        "message": "Islamic Assistant API is running perfectly!",
        "timestamp": time.time(),
        "server": "FastAPI",
        "version": "1.0.0"
    }

# Main query endpoint
@app.post("/query")
async def process_query(request: QueryRequest):
    logger.info(f"Query received: {request.query}")
    start_time = time.time()
    
    try:
        # Sample Islamic responses based on query
        sample_responses = {
            "prayer": "نماز اسلام کا دوسرا رکن ہے۔ The five daily prayers (Salah) are Fajr, Dhuhr, Asr, Maghrib, and Isha. They are the second pillar of Islam and are obligatory for all Muslims. Each prayer has its specific time and consists of specific number of Rak'ahs (units of prayer).",
            
            "dua": "دعا عبادت کا مغز ہے۔ One of the most comprehensive duas is: 'Rabbana atina fi'd-dunya hasanatan wa fi'l-akhirati hasanatan wa qina 'adhab an-nar' (Our Lord, give us good in this world and good in the hereafter, and save us from the punishment of the Fire). This dua is mentioned in Surah Al-Baqarah (2:201).",
            
            "quran": "قرآن مجید اللہ تعالیٰ کا آخری کلام ہے۔ The Quran is the holy book of Islam, revealed to Prophet Muhammad (peace be upon him) through the angel Jibril (Gabriel). It contains 114 chapters (Surahs) and 6,236 verses (Ayahs). It is the final revelation from Allah and serves as a complete guide for humanity.",
            
            "hadith": "حدیث نبی کریم ﷺ کے اقوال و افعال کا مجموعہ ہے۔ Hadith are the recorded sayings, actions, and approvals of Prophet Muhammad (peace be upon him). They serve as a source of Islamic law and moral guidance alongside the Quran. The most authentic collections are Sahih Bukhari and Sahih Muslim.",
            
            "islam": "اسلام ایک مکمل دین ہے۔ Islam is a complete way of life based on five pillars: Shahada (declaration of faith), Salah (prayer), Zakat (charity), Sawm (fasting), and Hajj (pilgrimage). It emphasizes worship of Allah alone and following the teachings of Prophet Muhammad (peace be upon him).",
            
            "allah": "اللہ تعالیٰ ایک ہے، اس کا کوئی شریک نہیں۔ Allah is the Arabic name for God in Islam. He is One, Eternal, and has no partners. The concept of Tawhid (monotheism) is central to Islamic belief. Allah has 99 beautiful names (Asma ul Husna) that describe His attributes."
        }
        
        # Query processing
        query_lower = request.query.lower()
        response_text = "السلام علیکم! I'm here to help with Islamic questions. You can ask me about prayers, Quran, Hadith, Islamic practices, or any other Islamic topic. Please feel free to ask in English or Urdu."
        
        # Keyword matching
        for keyword, response in sample_responses.items():
            if keyword in query_lower:
                response_text = response
                break
        
        # Urdu/Arabic keywordsicon
        urdu_keywords = {
            "نماز": sample_responses["prayer"],
            "دعا": sample_responses["dua"],
            "قرآن": sample_responses["quran"],
            "حدیث": sample_responses["hadith"],
            "اسلام": sample_responses["islam"],
            "اللہ": sample_responses["allah"]
        }
        
        for keyword, response in urdu_keywords.items():
            if keyword in request.query:
                response_text = response
                break
        
        # Common English Islamic terms
        english_terms = {
            "salah": sample_responses["prayer"],
            "namaz": sample_responses["prayer"],
            "dhikr": sample_responses["dua"],
            "zikr": sample_responses["dua"],
            "sunnah": sample_responses["hadith"],
            "fasting": "روزہ اسلام کا چوتھا رکن ہے۔ Fasting (Sawm) during Ramadan is the fourth pillar of Islam. Muslims abstain from food, drink, and other physical needs from dawn to sunset. It teaches self-discipline, empathy for the less fortunate, and spiritual purification.",
            "zakat": "زکوٰۃ اسلام کا تیسرا رکن ہے۔ Zakat is the third pillar of Islam, requiring Muslims to give 2.5% of their wealth to those in need annually. It purifies wealth and helps reduce inequality in society.",
            "hajj": "حج اسلام کا پانچواں رکن ہے۔ Hajj is the fifth pillar of Islam, a pilgrimage to Mecca that every financially and physically able Muslim must perform at least once in their lifetime."
        }
        
        for term, response in english_terms.items():
            if term in query_lower:
                response_text = response
                break
        
        processing_time = time.time() - start_time
        
        response_data = {
            "query": request.query,
            "answer": response_text,
            "source_type": request.source_type,
            "processing_time": round(processing_time, 3),
            "references_count": 3,
            "alternatives_used": ["Quran", "Sahih Bukhari", "Sahih Muslim"]
        }
        
        logger.info(f"Response generated in {processing_time:.3f}s")
        return response_data
        
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        processing_time = time.time() - start_time
        raise HTTPException(
            status_code=500,
            detail=f"Error processing query: {str(e)}"
        )

# Sources endpoint
@app.get("/sources")
async def get_available_sources():
    logger.info("Sources endpoint accessed")
    return {
        "sources": ["quran", "hadith", "both", "auto"],
        "languages": ["en", "ur", "ar"],
        "description": "Available sources and languages for Islamic queries",
        "sample_queries": [
            "What is prayer in Islam?",
            "Tell me about Quran",
            "نماز کے بارے میں بتائیں",
            "دعا کی اہمیت کیا ہے؟"
        ]
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Islamic Assistant API started successfully!")
    logger.info("📖 API Documentation: http://localhost:8000/docs")
    logger.info("🏥 Health Check: http://localhost:8000/health")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
