
import logging
import io
import os
import json
from typing import Annotated, List, Set, Tuple
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sklearn.metrics.pairwise import cosine_similarity
import pdfplumber
from docx import Document
import numpy as np
import spacy
from collections import Counter
import re
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Resume Match Service",
    description="Service for analyzing resume-job description similarity",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


openai_client = None
nlp = None


# Common stop words to filter out (expanded list)
COMMON_STOP_WORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
    'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him', 'us', 'them',
    'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just',
    'don', 'should', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', 'couldn',
    'didn', 'doesn', 'hadn', 'hasn', 'haven', 'isn', 'ma', 'mightn', 'mustn', 'needn',
    'shan', 'shouldn', 'wasn', 'weren', 'won', 'wouldn'
}


def init_openai_client():
    global openai_client
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.error("OPENAI_API_KEY not found in environment variables. Please set it in .env file.")
        raise ValueError("OPENAI_API_KEY is required. Please set it in your .env file.")
    
    try:
        openai_client = OpenAI(api_key=api_key)
        logger.info("OpenAI client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {str(e)}")
        raise


def load_spacy_model():

    global nlp
    try:
        logger.info("Loading spaCy model: en_core_web_sm")
        nlp = spacy.load("en_core_web_sm")
        logger.info("spaCy model loaded successfully")
    except OSError:
        logger.warning("spaCy model 'en_core_web_sm' not found. Attempting to download...")
        import subprocess
        import sys
        try:
            subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
            nlp = spacy.load("en_core_web_sm")
            logger.info("spaCy model downloaded and loaded successfully")
        except Exception as e:
            logger.error(f"Failed to download spaCy model: {str(e)}")
            logger.error("Please run: python -m spacy download en_core_web_sm")
            raise
    except Exception as e:
        logger.error(f"Error loading spaCy model: {str(e)}")
        raise


@app.on_event("startup")
async def startup_event():
    init_openai_client()
    load_spacy_model()


def extract_text_from_pdf(file_content: bytes) -> str:
    try:
        text = ""
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to extract text from PDF: {str(e)}"
        )


def extract_text_from_docx(file_content: bytes) -> str:
    try:
        doc = Document(io.BytesIO(file_content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from DOCX: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to extract text from DOCX: {str(e)}"
        )


def extract_text_from_resume(file: UploadFile, file_content: bytes) -> str:
    content_type = file.content_type
    filename = file.filename.lower() if file.filename else ""
    logger.info(f"Processing resume file: {filename}, content_type: {content_type}")
    
    if content_type == "application/pdf" or filename.endswith(".pdf"):
        return extract_text_from_pdf(file_content)
    elif content_type in [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
    ] or filename.endswith((".docx", ".doc")):
        return extract_text_from_docx(file_content)
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a PDF or DOCX file."
        )


def extract_keywords(text: str, max_keywords: int = 10) -> List[str]:
    if nlp is None:
        logger.warning("spaCy model not loaded, using fallback keyword extraction")
        return extract_keywords_fallback(text, max_keywords)
    
    try:
        doc = nlp(text)
        keyword_scores = {}
        seen = set()
        
        for chunk in doc.noun_chunks:
            chunk_text = chunk.text.strip().lower()
            if (len(chunk_text) >= 3 and 
                chunk_text not in seen and
                not any(char.isdigit() for char in chunk_text) and
                len(chunk_text.split()) <= 4 and  
                chunk_text not in COMMON_STOP_WORDS):
                original_text = chunk.text.strip()
                keyword_scores[original_text] = keyword_scores.get(original_text, 0) + 3
                seen.add(chunk_text)
        
        for token in doc:
            token_text = token.text.strip()
            token_lower = token.text.lower().strip()
            
            if (token_lower in seen or 
                len(token_text) < 2 or
                token.is_stop or 
                token.is_punct or
                token.is_space or
                token.like_num or
                token_lower in COMMON_STOP_WORDS):
                continue
            
            if token.pos_ == 'PROPN':
                keyword_scores[token_text] = keyword_scores.get(token_text, 0) + 5
                seen.add(token_lower)
            elif token.pos_ == 'NOUN':
                keyword_scores[token_text] = keyword_scores.get(token_text, 0) + 3
                seen.add(token_lower)
            elif token.pos_ == 'ADJ' and len(token_text) >= 3:
                keyword_scores[token_text] = keyword_scores.get(token_text, 0) + 1
                seen.add(token_lower)
        
        for ent in doc.ents:
            ent_text = ent.text.strip()
            ent_lower = ent.text.lower().strip()
            if (len(ent_text) >= 2 and 
                ent_lower not in seen and
                ent.label_ in ['ORG', 'PRODUCT', 'TECHNOLOGY']):
                keyword_scores[ent_text] = keyword_scores.get(ent_text, 0) + 4
                seen.add(ent_lower)
        
        sorted_keywords = sorted(keyword_scores.items(), key=lambda x: x[1], reverse=True)
        keywords = [kw for kw, score in sorted_keywords[:max_keywords]]
        
        if len(keywords) < max_keywords:
            for token in doc:
                if len(keywords) >= max_keywords:
                    break
                token_text = token.text.strip()
                token_lower = token.text.lower().strip()
                if (token_lower not in seen and
                    len(token_text) >= 2 and
                    not token.is_stop and
                    not token.is_punct and
                    not token.like_num and
                    token_lower not in COMMON_STOP_WORDS and
                    token.pos_ in ['NOUN', 'PROPN', 'VERB']):
                    keywords.append(token_text)
                    seen.add(token_lower)
        
        logger.info(f"Extracted {len(keywords)} keywords dynamically from text")
        return keywords[:max_keywords]
        
    except Exception as e:
        logger.error(f"Error extracting keywords with spaCy: {str(e)}")
        return extract_keywords_fallback(text, max_keywords)


def extract_keywords_fallback(text: str, max_keywords: int = 10) -> List[str]:
    keywords = []
    seen = set()
    capitalized_pattern = r'\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\b'
    capitalized_words = re.findall(capitalized_pattern, text)
    
    for word in capitalized_words:
        word_lower = word.lower()
        if (word_lower not in seen and 
            len(word) >= 2 and 
            word_lower not in COMMON_STOP_WORDS):
            keywords.append(word)
            seen.add(word_lower)
            if len(keywords) >= max_keywords:
                break
    
    tech_patterns = [
        r'\b[A-Za-z]+\.(?:js|py|java|ts|jsx|tsx|net|core)\b',  
        r'\b[A-Za-z]+\+{1,2}\b',  
        r'\b[A-Z][a-z]+(?:\.[A-Z][a-z]+)+\b',  
    ]
    
    for pattern in tech_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            match_lower = match.lower()
            if match_lower not in seen:
                keywords.append(match)
                seen.add(match_lower)
                if len(keywords) >= max_keywords:
                    break
        if len(keywords) >= max_keywords:
            break
    
    phrase_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b'
    phrases = re.findall(phrase_pattern, text)
    
    for phrase in phrases:
        phrase_lower = phrase.lower()
        if (phrase_lower not in seen and
            len(phrase.split()) >= 2 and
            phrase_lower not in COMMON_STOP_WORDS):
            keywords.append(phrase)
            seen.add(phrase_lower)
            if len(keywords) >= max_keywords:
                break
    
    return keywords[:max_keywords]


async def generate_resume_suggestions(job_description: str, resume_text: str, missing_keywords: List[str], similarity_score: float) -> dict:
    if openai_client is None:
        return {
            "suggestions": ["OpenAI service not available"],
            "actionable_items": [],
            "score_impact": "N/A"
        }
    
    try:
        prompt = f"""Analyze the following resume and job description. The current match score is {similarity_score}%.

Job Description:
{job_description[:2000]}

Resume:
{resume_text[:2000]}

Missing Keywords Identified: {', '.join(missing_keywords[:10])}

Based on this analysis, provide:
1. Specific, actionable suggestions to add to the resume that would increase the match score
2. Concrete items (skills, experiences, keywords, phrases) that should be added
3. Estimated score impact if these suggestions are implemented

Format your response as JSON with this structure:
{{
    "suggestions": ["specific suggestion 1", "specific suggestion 2", ...],
    "actionable_items": ["item to add 1", "item to add 2", ...],
    "missing_skills": ["skill 1", "skill 2", ...],
    "missing_experiences": ["experience type 1", "experience type 2", ...],
    "keywords_to_add": ["keyword 1", "keyword 2", ...],
    "score_impact": "Expected increase in match score (e.g., +10-15%)",
    "priority_recommendations": ["highest priority item 1", "highest priority item 2"]
}}

Be specific and actionable. Focus on what can actually be added to the resume."""

        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional resume optimization expert. Provide specific, actionable advice."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        content = response.choices[0].message.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        return json.loads(content)
        
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing OpenAI suggestions response: {str(e)}")
        logger.error(f"Response content: {content if 'content' in locals() else 'N/A'}")
        # Fallback: return missing keywords as suggestions
        return {
            "suggestions": [f"Add the following keywords: {', '.join(missing_keywords[:5])}"],
            "actionable_items": missing_keywords[:5],
            "missing_skills": missing_keywords[:5],
            "keywords_to_add": missing_keywords[:5],
            "score_impact": "Expected +5-10%",
            "priority_recommendations": missing_keywords[:3]
        }
    except Exception as e:
        logger.error(f"Error generating resume suggestions: {str(e)}")
        # Fallback: return basic suggestions based on missing keywords
        return {
            "suggestions": [f"Add missing keywords: {', '.join(missing_keywords[:5])}"],
            "actionable_items": missing_keywords[:5],
            "missing_skills": missing_keywords[:5],
            "keywords_to_add": missing_keywords[:5],
            "score_impact": "Expected +5-10%",
            "priority_recommendations": missing_keywords[:3]
        }


def find_matched_and_missing_keywords(
    resume_keywords: List[str], 
    job_keywords: List[str]
) -> Tuple[List[str], List[str]]:
    resume_keywords_lower = {kw.lower() for kw in resume_keywords}
    job_keywords_lower = {kw.lower() for kw in job_keywords}
    
    matched = []
    for job_kw in job_keywords:
        job_kw_lower = job_kw.lower()
        if job_kw_lower in resume_keywords_lower:
            matched.append(job_kw)
        else:
            for resume_kw in resume_keywords:
                resume_kw_lower = resume_kw.lower()
                if (job_kw_lower in resume_kw_lower or 
                    resume_kw_lower in job_kw_lower or
                    job_kw_lower.split()[0] in resume_kw_lower.split() or
                    resume_kw_lower.split()[0] in job_kw_lower.split()):
                    matched.append(job_kw)
                    break
    
    matched_lower = {kw.lower() for kw in matched}
    missing = [
        kw for kw in job_keywords 
        if kw.lower() not in matched_lower
    ]
    
    matched_unique = []
    seen_matched = set()
    for kw in matched:
        if kw.lower() not in seen_matched:
            matched_unique.append(kw)
            seen_matched.add(kw.lower())
    
    missing_unique = []
    seen_missing = set()
    for kw in missing:
        if kw.lower() not in seen_missing:
            missing_unique.append(kw)
            seen_missing.add(kw.lower())
    
    logger.info(f"Found {len(matched_unique)} matched keywords and {len(missing_unique)} missing keywords")
    
    return matched_unique[:10], missing_unique[:10]


async def compute_similarity(text1: str, text2: str) -> float:

    if openai_client is None:
        raise HTTPException(
            status_code=503,
            detail="OpenAI service is not available. Please check OPENAI_API_KEY configuration."
        )
    
    try:
        logger.info("Computing similarity using OpenAI embeddings...")
        
        response1 = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text1
        )
        response2 = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text2
        )
        
        embedding1 = np.array(response1.data[0].embedding)
        embedding2 = np.array(response2.data[0].embedding)
        
        similarity_matrix = cosine_similarity([embedding1], [embedding2])
        similarity_score = float(similarity_matrix[0][0])
        
        score = round(similarity_score * 100, 2)
        
        logger.info("OpenAI similarity score computed: %.2f", score)
        return score
        
    except Exception as e:
        logger.error(f"Error computing similarity with OpenAI: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compute similarity with OpenAI: {str(e)}"
        )


@app.post("/analyze")
async def analyze_resume(
    job_description: Annotated[str, Form(description="Job description text")],
    resume_file: Annotated[UploadFile, File(description="Resume file (PDF or DOCX)")]
):
    try:
        logger.info(f"Received analyze request for file: {resume_file.filename}")
        
        if openai_client is None:
            raise HTTPException(
                status_code=503,
                detail="OpenAI service is not available. Please check OPENAI_API_KEY configuration."
            )
        
        file_content = await resume_file.read()
        
        if len(file_content) == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty"
            )
        
        resume_text = extract_text_from_resume(resume_file, file_content)
        
        if not resume_text or len(resume_text.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="No text could be extracted from the resume file"
            )
        
        logger.info("Resume text length: %d characters", len(resume_text))
        
        if not job_description or len(job_description.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="Job description cannot be empty"
            )
        
        similarity_score = await compute_similarity(job_description, resume_text)
        
        job_keywords = extract_keywords(job_description, max_keywords=10)
        resume_keywords = extract_keywords(resume_text, max_keywords=10)
        matched_keywords, missing_keywords = find_matched_and_missing_keywords(
            resume_keywords, job_keywords
        )
        
        suggestions = await generate_resume_suggestions(
            job_description, resume_text, missing_keywords, similarity_score
        )
        
        return {
            "similarity_score": similarity_score,
            "matched_keywords": matched_keywords,
            "missing_keywords": missing_keywords,
            "model_used": "openai",
            "improvement_suggestions": suggestions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in analyze endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.post("/summarize")
async def summarize_text(
    text: Annotated[str, Form(description="Text to summarize")],
    text_type: Annotated[str, Form(description="Type of text: 'job_description' or 'resume'")] = "job_description"
):
    try:
        if openai_client is None:
            raise HTTPException(
                status_code=503,
                detail="OpenAI service is not available. Please check OPENAI_API_KEY configuration."
            )
        
        if not text or len(text.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="Text cannot be empty"
            )
        
        text_to_summarize = text[:3000]
        
        if text_type == "job_description":
            prompt = f"""Summarize the following job description. Extract the key requirements, responsibilities, and qualifications.

Job Description:
{text_to_summarize}

Provide a concise summary (2-3 sentences) and list the key points:
- Required skills/technologies
- Key responsibilities
- Qualifications/experience needed

Format as JSON:
{{
    "summary": "Brief summary in 2-3 sentences",
    "key_skills": ["skill1", "skill2", ...],
    "key_responsibilities": ["responsibility1", "responsibility2", ...],
    "qualifications": ["qualification1", "qualification2", ...]
}}"""
        else:  # resume
            prompt = f"""Summarize the following resume. Extract key information about the candidate.

Resume:
{text_to_summarize}

Provide a concise summary (2-3 sentences) and list the key points:
- Key skills
- Work experience highlights
- Education/credentials

Format as JSON:
{{
    "summary": "Brief summary in 2-3 sentences",
    "key_skills": ["skill1", "skill2", ...],
    "experience_highlights": ["highlight1", "highlight2", ...],
    "education": "Education summary"
}}"""
        
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes job descriptions and resumes concisely and accurately."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        content = response.choices[0].message.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        summary_data = json.loads(content)
        
        return {
            "text_type": text_type,
            "original_length": len(text),
            "summary": summary_data,
            "model_used": "openai"
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing summary response: {str(e)}")
        # Fallback: return the raw summary text
        return {
            "text_type": text_type,
            "summary": {
                "summary": response.choices[0].message.content if 'response' in locals() else "Unable to generate summary",
                "key_skills": [],
                "key_responsibilities": [] if text_type == "job_description" else [],
                "qualifications": [] if text_type == "job_description" else []
            },
            "model_used": "openai"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate summary: {str(e)}"
        )


@app.post("/suggest-improvements")
async def suggest_resume_improvements(
    job_description: Annotated[str, Form(description="Job description text")],
    resume_file: Annotated[UploadFile, File(description="Resume file (PDF or DOCX)")]
):
    """
    Get detailed suggestions to improve resume match score.
    
    Args:
        job_description: Job description text
        resume_file: Resume file (PDF or DOCX)
        
    Returns:
        JSON response with improvement suggestions, actionable items, and score impact
    """
    try:
        if openai_client is None:
            raise HTTPException(
                status_code=503,
                detail="OpenAI service is not available. Please check OPENAI_API_KEY configuration."
            )
        
        file_content = await resume_file.read()
        
        if len(file_content) == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty"
            )
        
        resume_text = extract_text_from_resume(resume_file, file_content)
        
        if not resume_text or len(resume_text.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="No text could be extracted from the resume file"
            )
        
        if not job_description or len(job_description.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="Job description cannot be empty"
            )
        
        # Compute similarity
        similarity_score = await compute_similarity(job_description, resume_text)
        
        # Extract keywords
        job_keywords = extract_keywords(job_description, max_keywords=15)
        resume_keywords = extract_keywords(resume_text, max_keywords=15)
        
        # Find missing keywords
        matched_keywords, missing_keywords = find_matched_and_missing_keywords(
            resume_keywords, job_keywords
        )
        
        # Generate detailed suggestions
        logger.info("Generating detailed resume improvement suggestions...")
        suggestions = await generate_resume_suggestions(
            job_description, resume_text, missing_keywords, similarity_score
        )
        
        return {
            "current_score": similarity_score,
            "matched_keywords": matched_keywords,
            "missing_keywords": missing_keywords,
            "improvement_suggestions": suggestions,
            "model_used": "openai"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in suggest-improvements endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models": {
            "openai": openai_client is not None,
            "spacy": nlp is not None
        },
        "model": "openai"
    }


@app.get("/")
async def root():   
    return {
        "service": "Resume Match Service",
        "version": "1.0.0",
        "endpoints": {
            "POST /analyze": "Analyze resume-job description similarity with improvement suggestions",
            "POST /suggest-improvements": "Get detailed suggestions to improve resume match score",
            "POST /summarize": "Summarize job descriptions or resumes using AI",
            "GET /health": "Health check endpoint",
            "GET /": "API information"
        },
        "usage": "uvicorn resume_match_service:app --reload --host 0.0.0.0 --port 8000"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

