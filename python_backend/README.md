# SkillMatch Python Backend

A FastAPI-based backend service for matching resumes with job descriptions using transformer models.

## Features

- Resume-Job Description matching using Sentence Transformers
- Cosine similarity-based matching score
- Input validation using Pydantic
- Comprehensive logging
- Health check endpoint

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Service

Start the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### POST /match
Match a resume against a job description.

Request body:
```json
{
    "resume": "Resume text content...",
    "job_description": "Job description text content..."
}
```

Response:
```json
{
    "match_score": 0.85,
    "message": "Excellent match!"
}
```

### GET /health
Health check endpoint.

Response:
```json
{
    "status": "healthy",
    "model_loaded": true
}
```

## API Documentation

Once the server is running, you can access:
- Swagger UI documentation: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

## Model Information

The service uses the `all-MiniLM-L6-v2` model from Sentence Transformers, which is:
- Optimized for semantic similarity tasks
- Lightweight and fast
- Suitable for production use

## Logging

Logs are written to `app.log` with rotation at 500MB. 