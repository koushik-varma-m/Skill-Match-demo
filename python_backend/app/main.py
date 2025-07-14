from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
import numpy as np
from loguru import logger
import os
from typing import Optional

# Initialize FastAPI app
app = FastAPI(
    title="SkillMatch API",
    description="API for matching resumes with job descriptions using transformer models",
    version="1.0.0"
)

# Initialize logger
logger.add("app.log", rotation="500 MB")

# Load the model at startup
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    raise

class MatchRequest(BaseModel):
    resume: str = Field(..., min_length=1, description="Resume text content")
    job_description: str = Field(..., min_length=1, description="Job description text content")

class MatchResponse(BaseModel):
    match_score: float = Field(..., ge=0, le=1, description="Match score between 0 and 1")
    message: Optional[str] = Field(None, description="Additional information about the match")

def compute_cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    return float(np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2)))

@app.post("/match", response_model=MatchResponse)
async def match_resume_job(request: MatchRequest):
    """
    Match a resume against a job description using transformer models.
    
    Args:
        request (MatchRequest): Contains resume and job description text
        
    Returns:
        MatchResponse: Contains match score and optional message
        
    Raises:
        HTTPException: If there's an error processing the request
    """
    try:
        logger.info("Processing match request")
        
        # Encode the texts
        resume_embedding = model.encode(request.resume)
        job_embedding = model.encode(request.job_description)
        
        # Compute similarity
        similarity_score = compute_cosine_similarity(resume_embedding, job_embedding)
        
        # Generate message based on score
        message = None
        if similarity_score >= 0.8:
            message = "Excellent match!"
        elif similarity_score >= 0.6:
            message = "Good match"
        elif similarity_score >= 0.4:
            message = "Moderate match"
        else:
            message = "Poor match"
        
        logger.info(f"Match score computed: {similarity_score}")
        
        return MatchResponse(
            match_score=similarity_score,
            message=message
        )
        
    except Exception as e:
        logger.error(f"Error processing match request: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing match request: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "model_loaded": model is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 