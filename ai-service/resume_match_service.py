
import logging
import io
from typing import Annotated, List, Set, Tuple
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import pdfplumber
from docx import Document
import numpy as np
import spacy
from collections import Counter
import re

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


model = None
nlp = None


TECH_KEYWORDS = {
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab',
    'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue', 'node.js',
    'spring', 'spring boot', 'django', 'flask', 'express', 'fastapi',
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'html', 'css', 'sass', 'bootstrap', 'tailwind',
    'ci/cd', 'devops', 'agile', 'scrum', 'kubernetes', 'terraform', 'ansible',
    'machine learning', 'ml', 'ai', 'deep learning', 'tensorflow', 'pytorch',
    'microservices', 'rest api', 'graphql', 'grpc',
    'linux', 'unix', 'bash', 'shell scripting',
    'jira', 'confluence', 'slack', 'jenkins', 'circleci', 'travis ci'
}


def load_model():
    """Load the SentenceTransformer model on startup."""
    global model
    try:
        logger.info("Loading SentenceTransformer model: BAAI/bge-small-en-v1.5")
        model = SentenceTransformer('BAAI/bge-small-en-v1.5')
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise


def load_spacy_model():
    """Load the spaCy language model on startup."""
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
    """Load the models when the application starts."""
    load_model()
    load_spacy_model()


def extract_text_from_pdf(file_content: bytes) -> str:
    """
    Extract text from a PDF file.
    
    Args:
        file_content: Binary content of the PDF file
        
    Returns:
        Extracted text as a string
    """
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
    """
    Extract text from a DOCX file.
    
    Args:
        file_content: Binary content of the DOCX file
        
    Returns:
        Extracted text as a string
    """
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
    """
    Extract text from resume file based on file type.
    
    Args:
        file: UploadFile object with file metadata
        file_content: Binary content of the file
        
    Returns:
        Extracted text as a string
    """
    content_type = file.content_type
    filename = file.filename.lower() if file.filename else ""
    
    logger.info(f"Processing resume file: {filename}, content_type: {content_type}")
    
    # Check file type and extract text accordingly
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
    """
    Extract top keywords (nouns and tech skills) from text using spaCy.
    
    Args:
        text: Input text to extract keywords from
        max_keywords: Maximum number of keywords to return
        
    Returns:
        List of top keywords (strings)
    """
    if nlp is None:
        logger.warning("spaCy model not loaded, using fallback keyword extraction")
        return extract_keywords_fallback(text, max_keywords)
    
    try:
        doc = nlp(text.lower())
        
        # Extract nouns, proper nouns, and tech-related terms
        keywords = []
        seen = set()
        
        # First, look for known tech keywords (case-insensitive matching)
        text_lower = text.lower()
        for tech_keyword in TECH_KEYWORDS:
            if tech_keyword in text_lower and tech_keyword not in seen:
                keywords.append(tech_keyword.title() if tech_keyword.islower() else tech_keyword)
                seen.add(tech_keyword.lower())
        
        # Extract nouns and proper nouns
        for token in doc:
            # Skip stop words, punctuation, and very short tokens
            if (token.is_stop or token.is_punct or len(token.text) < 2 or 
                token.text.lower() in seen):
                continue
            
            # Prioritize nouns, proper nouns, and technical terms
            if (token.pos_ in ['NOUN', 'PROPN'] and 
                len(token.text) >= 2 and 
                not token.like_num and
                token.text.lower() not in seen):
                
                # Clean the token
                cleaned = token.text.strip()
                if len(cleaned) >= 2:
                    keywords.append(cleaned)
                    seen.add(cleaned.lower())
        
        # Also extract noun phrases (multi-word technical terms)
        for chunk in doc.noun_chunks:
            chunk_text = chunk.text.strip().lower()
            if (len(chunk_text) >= 3 and 
                chunk_text not in seen and
                not any(char.isdigit() for char in chunk_text) and
                len(chunk_text.split()) <= 3):  # Max 3 words per phrase
                keywords.append(chunk.text.strip())
                seen.add(chunk_text)
        
        # Remove duplicates while preserving order, and limit to max_keywords
        unique_keywords = []
        seen_unique = set()
        for kw in keywords:
            kw_lower = kw.lower()
            if kw_lower not in seen_unique:
                unique_keywords.append(kw)
                seen_unique.add(kw_lower)
                if len(unique_keywords) >= max_keywords:
                    break
        
        logger.info(f"Extracted {len(unique_keywords)} keywords from text")
        return unique_keywords[:max_keywords]
        
    except Exception as e:
        logger.error(f"Error extracting keywords with spaCy: {str(e)}")
        return extract_keywords_fallback(text, max_keywords)


def extract_keywords_fallback(text: str, max_keywords: int = 10) -> List[str]:
    """
    Fallback keyword extraction using simple regex when spaCy is not available.
    
    Args:
        text: Input text
        max_keywords: Maximum number of keywords to return
        
    Returns:
        List of keywords
    """
    keywords = []
    seen = set()
    
    # Look for known tech keywords
    text_lower = text.lower()
    for tech_keyword in TECH_KEYWORDS:
        if tech_keyword in text_lower and tech_keyword.lower() not in seen:
            keywords.append(tech_keyword.title() if tech_keyword.islower() else tech_keyword)
            seen.add(tech_keyword.lower())
    
    # Extract capitalized words (likely proper nouns/tech terms)
    capitalized_words = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
    for word in capitalized_words:
        word_lower = word.lower()
        if (word_lower not in seen and 
            len(word) >= 2 and 
            word_lower not in ['the', 'and', 'or', 'for', 'with', 'from']):
            keywords.append(word)
            seen.add(word_lower)
            if len(keywords) >= max_keywords:
                break
    
    return keywords[:max_keywords]


def find_matched_and_missing_keywords(
    resume_keywords: List[str], 
    job_keywords: List[str]
) -> Tuple[List[str], List[str]]:
    """
    Find matched and missing keywords between resume and job description.
    
    Args:
        resume_keywords: Keywords extracted from resume
        job_keywords: Keywords extracted from job description
        
    Returns:
        Tuple of (matched_keywords, missing_keywords)
    """
    # Normalize keywords for comparison (case-insensitive)
    resume_keywords_lower = {kw.lower() for kw in resume_keywords}
    job_keywords_lower = {kw.lower() for kw in job_keywords}
    
    # Find matched keywords (keywords in both resume and job)
    matched = []
    for job_kw in job_keywords:
        job_kw_lower = job_kw.lower()
        # Check exact match
        if job_kw_lower in resume_keywords_lower:
            matched.append(job_kw)
        else:
            # Check for partial matches (e.g., "Spring Boot" matches "Spring")
            for resume_kw in resume_keywords:
                resume_kw_lower = resume_kw.lower()
                if (job_kw_lower in resume_kw_lower or 
                    resume_kw_lower in job_kw_lower or
                    job_kw_lower.split()[0] in resume_kw_lower.split() or
                    resume_kw_lower.split()[0] in job_kw_lower.split()):
                    matched.append(job_kw)
                    break
    
    # Find missing keywords (keywords in job but not in resume)
    matched_lower = {kw.lower() for kw in matched}
    missing = [
        kw for kw in job_keywords 
        if kw.lower() not in matched_lower
    ]
    
    # Remove duplicates while preserving order
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


def compute_similarity(text1: str, text2: str) -> float:
    """
    Compute cosine similarity between two texts using the loaded model.
    
    Args:
        text1: First text (job description)
        text2: Second text (resume)
        
    Returns:
        Similarity score as a float (0-100)
    """
    try:
        # Encode both texts into embeddings
        logger.info("Encoding texts into embeddings...")
        embeddings = model.encode([text1, text2])
        
        # Compute cosine similarity
        similarity_matrix = cosine_similarity([embeddings[0]], [embeddings[1]])
        similarity_score = float(similarity_matrix[0][0])  # Convert numpy float to Python float
        
        # Convert to percentage (0-100) and round to 2 decimal places
        score = round(similarity_score * 100, 2)
        
        logger.info("Similarity score computed: %.2f", score)
        return score
    except Exception as e:
        logger.error(f"Error computing similarity: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compute similarity: {str(e)}"
        )


@app.post("/analyze")
async def analyze_resume(
    job_description: Annotated[str, Form(description="Job description text")],
    resume_file: Annotated[UploadFile, File(description="Resume file (PDF or DOCX)")]
):
    """
    Analyze resume-job description similarity.
    
    Args:
        job_description: Job description text
        resume_file: Resume file (PDF or DOCX)
        
    Returns:
        JSON response with similarity_score
    """
    try:
        # Log incoming request
        logger.info(f"Received analyze request for file: {resume_file.filename}")
        logger.info(f"Job description length: {len(job_description)} characters")
        
        # Validate model is loaded
        if model is None:
            raise HTTPException(
                status_code=500,
                detail="Model not loaded. Please check server logs."
            )
        
        # Read file content
        file_content = await resume_file.read()
        
        if len(file_content) == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty"
            )
        
        # Extract text from resume
        resume_text = extract_text_from_resume(resume_file, file_content)
        
        if not resume_text or len(resume_text.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="No text could be extracted from the resume file"
            )
        
        logger.info("Resume text length: %d characters", len(resume_text))
        
        # Validate job description
        if not job_description or len(job_description.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="Job description cannot be empty"
            )
        
        # Compute similarity
        similarity_score = compute_similarity(job_description, resume_text)
        
        # Extract keywords from both texts
        logger.info("Extracting keywords from job description and resume...")
        job_keywords = extract_keywords(job_description, max_keywords=10)
        resume_keywords = extract_keywords(resume_text, max_keywords=10)
        
        # Find matched and missing keywords
        matched_keywords, missing_keywords = find_matched_and_missing_keywords(
            resume_keywords, job_keywords
        )
        
        # Return enhanced result
        return {
            "similarity_score": similarity_score,
            "matched_keywords": matched_keywords,
            "missing_keywords": missing_keywords
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in analyze endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "spacy_loaded": nlp is not None
    }


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": "Resume Match Service",
        "version": "1.0.0",
        "endpoints": {
            "POST /analyze": "Analyze resume-job description similarity",
            "GET /health": "Health check endpoint",
            "GET /": "API information"
        },
        "usage": "uvicorn resume_match_service:app --reload --host 0.0.0.0 --port 8000"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

