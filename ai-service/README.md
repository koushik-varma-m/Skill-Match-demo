# AI Service - Resume Match Service

FastAPI-based AI service for analyzing resume-job description similarity using OpenAI embeddings and GPT models.

## 🎯 Overview

This service provides AI-powered endpoints to analyze resume-job description matches, generate improvement suggestions, and summarize job descriptions/resumes. It uses OpenAI's text embeddings for semantic similarity calculation and GPT-3.5-turbo for generating intelligent suggestions and summaries.

## 🛠️ Tech Stack

- **Python 3.8+** - Programming language
- **FastAPI** - Modern, fast web framework
- **Uvicorn** - ASGI server
- **OpenAI API** - Text embeddings (text-embedding-3-small) and GPT-3.5-turbo for suggestions/summaries
- **scikit-learn** - Cosine similarity calculation
- **pdfplumber** - PDF parsing and text extraction
- **python-docx** - Microsoft Word document processing
- **spaCy** - Natural language processing for keyword extraction
- **NumPy** - Numerical computations

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)
- **OpenAI API Key** - Required for service operation

## 🚀 Quick Start

### 1. Create Virtual Environment

```bash
cd ai-service
python3 -m venv venv
```

### 2. Activate Virtual Environment

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Download spaCy Model

```bash
python -m spacy download en_core_web_sm
```

### 5. Configure Environment Variables

Create a `.env` file in the `ai-service` directory:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Or copy from example:
```bash
cp .env.example .env
# Then edit .env and add your OpenAI API key
```

### 6. Start the Service

```bash
uvicorn resume_match_service:app --host 0.0.0.0 --port 8000
```

The service will be available at http://localhost:8000

## 📦 Dependencies

All dependencies are listed in `requirements.txt`:

- **fastapi** - Web framework
- **uvicorn** - ASGI server
- **openai** - OpenAI API client
- **python-dotenv** - Environment variable management
- **pdfplumber** - PDF parsing
- **python-docx** - DOCX file processing
- **python-multipart** - Form data handling
- **spacy** - NLP library for keyword extraction
- **scikit-learn** - Machine learning utilities (cosine similarity)
- **numpy** - Numerical operations

## 🔌 API Endpoints

### Health Check
**GET** `/health`

**Response:**
```json
{
  "status": "healthy",
  "models": {
    "openai": true,
    "spacy": true
  },
  "model": "openai"
}
```

### API Information
**GET** `/`

**Response:**
```json
{
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
```

### Analyze Resume
**POST** `/analyze`

Analyzes resume-job description similarity and provides improvement suggestions.

**Request:** `multipart/form-data`
- `job_description` (string, required) - Job description text
- `resume_file` (file, required) - Resume file (PDF or DOCX)

**Response:**
```json
{
  "similarity_score": 84.67,
  "matched_keywords": ["Python", "React", "JavaScript", "Node.js"],
  "missing_keywords": ["Docker", "AWS", "TypeScript"],
  "model_used": "openai",
  "improvement_suggestions": {
    "suggestions": [
      "Add experience with containerization tools like Docker",
      "Highlight cloud platform experience (AWS, GCP, Azure)"
    ],
    "actionable_items": [
      "Add Docker containerization experience",
      "Include AWS cloud services in skills section"
    ],
    "keywords_to_add": ["Docker", "AWS", "Kubernetes"],
    "score_impact": "Expected +10-15% improvement"
  }
}
```

### Summarize Text
**POST** `/summarize`

Summarizes job descriptions or resumes using AI.

**Request:** `multipart/form-data`
- `text` (string, required) - Text to summarize
- `text_type` (string, optional) - Type of text: `"job_description"` or `"resume"` (default: `"job_description"`)

**Response (for job_description):**
```json
{
  "text_type": "job_description",
  "original_length": 2500,
  "summary": {
    "summary": "Brief 2-3 sentence summary of the job...",
    "key_skills": ["Python", "React", "Node.js"],
    "key_responsibilities": ["Develop web applications", "Collaborate with teams"],
    "qualifications": ["Bachelor's degree", "3+ years experience"]
  },
  "model_used": "openai"
}
```

**Response (for resume):**
```json
{
  "text_type": "resume",
  "original_length": 1800,
  "summary": {
    "summary": "Brief 2-3 sentence summary of the candidate...",
    "key_skills": ["Python", "JavaScript", "SQL"],
    "experience_highlights": ["5 years software development", "Led team of 4"],
    "education": "Bachelor's in Computer Science"
  },
  "model_used": "openai"
}
```

### Suggest Improvements
**POST** `/suggest-improvements`

Get detailed, actionable suggestions to improve resume match score.

**Request:** `multipart/form-data`
- `job_description` (string, required) - Job description text
- `resume_file` (file, required) - Resume file (PDF or DOCX)

**Response:**
```json
{
  "current_score": 72.5,
  "matched_keywords": ["Python", "React"],
  "missing_keywords": ["TypeScript", "AWS", "Docker"],
  "improvement_suggestions": {
    "suggestions": ["Add TypeScript experience", "Include cloud platform certifications"],
    "actionable_items": ["Add TypeScript projects to portfolio", "Get AWS certification"],
    "missing_skills": ["TypeScript", "AWS", "Docker"],
    "missing_experiences": ["Cloud deployment", "CI/CD pipelines"],
    "keywords_to_add": ["TypeScript", "AWS", "Docker", "Kubernetes"],
    "score_impact": "Expected +15-20% improvement",
    "priority_recommendations": ["Add TypeScript experience", "Include AWS projects"]
  },
  "model_used": "openai"
}
```

**Error Responses:**

**Empty File (400):**
```json
{
  "detail": "Uploaded file is empty"
}
```

**Unsupported File Type (400):**
```json
{
  "detail": "Unsupported file type. Please upload a PDF or DOCX file."
}
```

**Empty Job Description/Text (400):**
```json
{
  "detail": "Job description cannot be empty"
}
```

**No Text Extracted (400):**
```json
{
  "detail": "No text could be extracted from the resume file"
}
```

**OpenAI Service Unavailable (503):**
```json
{
  "detail": "OpenAI service is not available. Please check OPENAI_API_KEY configuration."
}
```

**Server Error (500):**
```json
{
  "detail": "Internal server error: [error message]"
}
```

## 🧪 Testing

### Analyze Resume

**Using cURL:**
```bash
curl -X POST "http://localhost:8000/analyze" \
  -F "job_description=Software Engineer with 3+ years of experience in Python, JavaScript, and React." \
  -F "resume_file=@/path/to/resume.pdf"
```

**Using Python:**
```python
import requests

url = "http://localhost:8000/analyze"

with open("resume.pdf", "rb") as f:
    files = {"resume_file": f}
    data = {"job_description": "Software Engineer with Python experience"}
    response = requests.post(url, files=files, data=data)
    print(response.json())
```

### Summarize Text

**Using cURL:**
```bash
curl -X POST "http://localhost:8000/summarize" \
  -F "text=Long job description text here..." \
  -F "text_type=job_description"
```

**Using Python:**
```python
import requests

url = "http://localhost:8000/summarize"
data = {
    "text": "Long job description text...",
    "text_type": "job_description"
}
response = requests.post(url, data=data)
print(response.json())
```

### Health Check

```bash
curl http://localhost:8000/health
```

## 🔧 Configuration

### Port Configuration

Default port is 8000. To change:

```bash
uvicorn resume_match_service:app --host 0.0.0.0 --port 8001
```

### OpenAI Configuration

The service requires an OpenAI API key. Set it in your `.env` file:

```bash
OPENAI_API_KEY=sk-...
```

**Models Used:**
- **text-embedding-3-small** - For generating embeddings for similarity calculation
- **gpt-3.5-turbo** - For generating improvement suggestions and summaries

### Development Mode

For development with auto-reload:

```bash
uvicorn resume_match_service:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

For production with multiple workers:

```bash
uvicorn resume_match_service:app --host 0.0.0.0 --port 8000 --workers 4
```

Or use Gunicorn with Uvicorn workers:

```bash
gunicorn resume_match_service:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 📊 How It Works

1. **Text Extraction**
   - PDF files are parsed using `pdfplumber`
   - DOCX files are parsed using `python-docx`
   - Text is extracted and cleaned

2. **Keyword Extraction**
   - spaCy is used to extract keywords from both resume and job description
   - Dynamic keyword extraction using NLP techniques (no hardcoded keywords)
   - Identifies matched and missing keywords

3. **Similarity Calculation**
   - Both resume and job description are converted to embeddings using OpenAI's `text-embedding-3-small`
   - Cosine similarity is computed between the embeddings
   - Result is converted to a percentage (0-100)

4. **AI-Powered Suggestions**
   - GPT-3.5-turbo analyzes the resume and job description
   - Generates actionable improvement suggestions
   - Provides keywords to add and expected score impact

5. **Text Summarization**
   - GPT-3.5-turbo summarizes job descriptions or resumes
   - Extracts key skills, responsibilities, and qualifications
   - Provides concise summaries for quick understanding

6. **Response**
   - Similarity score, keywords, and suggestions are returned to the client

## 📁 File Structure

```
ai-service/
├── resume_match_service.py  # Main FastAPI application
├── requirements.txt          # Python dependencies
├── .env.example             # Example environment file
├── .env                     # Environment variables (not in git)
├── README.md                # This file
└── venv/                    # Virtual environment (not in git)
```

## 🔍 Model Details

### OpenAI Models

**text-embedding-3-small:**
- **Type:** Text Embedding Model
- **Language:** English (and others)
- **Use Case:** Semantic similarity, information retrieval
- **Performance:** Fast and efficient embeddings

**gpt-3.5-turbo:**
- **Type:** Large Language Model
- **Use Case:** Text generation, summarization, suggestions
- **Performance:** Fast response times, high quality output

### spaCy Model

**en_core_web_sm:**
- **Type:** English language model
- **Use Case:** Keyword extraction, NLP processing
- **Size:** ~12MB

## 🐛 Troubleshooting

### OpenAI API Key Issues

If you get "OpenAI service is not available":
1. Check that `.env` file exists in `ai-service` directory
2. Verify `OPENAI_API_KEY` is set correctly
3. Ensure the API key is valid and has credits
4. Check API key format (should start with `sk-`)

### spaCy Model Not Found

```bash
python -m spacy download en_core_web_sm
```

### Memory Issues

If you encounter memory errors:
- Process files in batches
- Increase system memory
- Consider using smaller text chunks for summarization

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Import Errors

Ensure virtual environment is activated:
```bash
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
```

### API Rate Limits

If you hit OpenAI rate limits:
- Add retry logic with exponential backoff
- Consider implementing request queuing
- Upgrade OpenAI API tier if needed

## 📈 Performance

- **Request Time:** ~2-5 seconds (depends on file size and API latency)
- **Embedding Generation:** ~1-2 seconds
- **GPT Generation:** ~1-3 seconds
- **File Processing:** ~0.5-1 second (depends on file size)

## 🔒 Security Considerations

- **API Key Security:** Never commit `.env` file to version control
- **File Size Limits:** Consider adding file size limits (currently processes any size)
- **File Type Validation:** Currently validates PDF/DOCX
- **Input Sanitization:** Job descriptions and text are processed as-is
- **CORS:** Configure CORS for production (currently allows all origins)
- **Rate Limiting:** Consider adding rate limiting for production
- **API Key Rotation:** Implement API key rotation policy

## 🚀 Production Deployment

### Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -m spacy download en_core_web_sm

COPY resume_match_service.py .
COPY .env .env

CMD ["uvicorn", "resume_match_service:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Note:** In production, use environment variables or secrets management for API keys instead of `.env` file.

### Using Systemd (Linux)

Create `/etc/systemd/system/resume-match.service`:

```ini
[Unit]
Description=Resume Match AI Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/ai-service
Environment="PATH=/path/to/ai-service/venv/bin"
Environment="OPENAI_API_KEY=your_key_here"
ExecStart=/path/to/ai-service/venv/bin/uvicorn resume_match_service:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable resume-match
sudo systemctl start resume-match
```

## 📝 Logging

The service logs to console. For production, consider:
- File logging with rotation
- Structured logging (JSON format)
- Log aggregation (ELK stack, CloudWatch, etc.)
- Log level configuration

## 🔄 Updates

To update dependencies:

```bash
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Uvicorn Documentation](https://www.uvicorn.org/)
- [spaCy Documentation](https://spacy.io/)
- [scikit-learn Documentation](https://scikit-learn.org/)

## 🤝 Integration with Backend

The backend integrates with this service via:
- HTTP requests to `/analyze`, `/summarize`, and `/suggest-improvements` endpoints
- See `backend/utils/aiClient.js` for client implementation
- See `backend/controllers/resumeMatch.controller.js` for API route handling

## 🎯 Features

### Current Features
- ✅ Resume-job description similarity analysis
- ✅ Keyword matching and extraction
- ✅ AI-powered improvement suggestions
- ✅ Job description summarization
- ✅ Resume summarization
- ✅ Dynamic keyword extraction (no hardcoded keywords)

### Future Enhancements
- [ ] Support for multiple resume formats
- [ ] Batch processing capabilities
- [ ] Caching for frequently requested analyses
- [ ] Custom model configuration
- [ ] Multi-language support

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs for error messages
3. Verify all dependencies are installed
4. Ensure Python version is 3.8+
5. Verify OpenAI API key is configured correctly

---

**Note:** This service requires an active OpenAI API key and internet connection for API calls.
