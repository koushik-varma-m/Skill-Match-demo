# AI Service - Resume Match Service

FastAPI-based AI service for analyzing resume-job description similarity using semantic embeddings.

## 🎯 Overview

This service provides an API endpoint that analyzes how well a resume matches a job description using advanced NLP techniques. It uses sentence transformers to compute semantic similarity between the resume content and job requirements.

## 🛠️ Tech Stack

- **Python 3.8+** - Programming language
- **FastAPI** - Modern, fast web framework
- **Uvicorn** - ASGI server
- **Sentence Transformers** - NLP models for semantic similarity
- **PyTorch** - Deep learning framework
- **pdfplumber** - PDF parsing and text extraction
- **python-docx** - Microsoft Word document processing
- **spaCy** - Natural language processing

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

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

### 5. Start the Service

```bash
uvicorn resume_match_service:app --host 0.0.0.0 --port 8000
```

The service will be available at http://localhost:8000

## 📦 Dependencies

All dependencies are listed in `requirements.txt`:

- **fastapi** - Web framework
- **uvicorn[standard]** - ASGI server with standard extras
- **sentence-transformers** - Semantic similarity models
- **pdfplumber** - PDF parsing
- **python-docx** - DOCX file processing
- **torch** - PyTorch (installed automatically with sentence-transformers)
- **python-multipart** - Form data handling
- **spacy** - NLP library

## 🔌 API Endpoints

### Health Check
**GET** `/health`

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "spacy_loaded": true
}
```

### API Information
**GET** `/`

**Response:**
```json
{
  "message": "Resume Match Service",
  "version": "1.0.0",
  "endpoints": {
    "analyze": "/analyze",
    "health": "/health"
  }
}
```

### Analyze Resume
**POST** `/analyze`

**Request:** `multipart/form-data`
- `job_description` (string, required) - Job description text
- `resume_file` (file, required) - Resume file (PDF or DOCX)

**Response:**
```json
{
  "similarity_score": 84.67
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

**Empty Job Description (400):**
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

**Server Error (500):**
```json
{
  "detail": "Internal server error: [error message]"
}
```

## 🧪 Testing

### Using cURL

```bash
curl -X POST "http://localhost:8000/analyze" \
  -F "job_description=Software Engineer with 3+ years of experience in Python, JavaScript, and React." \
  -F "resume_file=@/path/to/resume.pdf"
```

### Using Python

```python
import requests

url = "http://localhost:8000/analyze"

with open("resume.pdf", "rb") as f:
    files = {"resume_file": f}
    data = {"job_description": "Software Engineer with Python experience"}
    response = requests.post(url, files=files, data=data)
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

### Model Configuration

The service uses **BAAI/bge-small-en-v1.5** sentence transformer model. This model:
- Is automatically downloaded on first use
- Is cached locally for faster subsequent loads
- Provides good balance between accuracy and speed
- Supports English text

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

2. **Text Preprocessing**
   - Text is normalized and cleaned
   - spaCy is used for additional processing (if needed)

3. **Embedding Generation**
   - Both resume and job description are converted to embeddings using sentence transformers
   - Embeddings are high-dimensional vectors representing semantic meaning

4. **Similarity Calculation**
   - Cosine similarity is computed between resume and job description embeddings
   - Result is converted to a percentage (0-100)

5. **Response**
   - Similarity score is returned to the client

## 📁 File Structure

```
ai-service/
├── resume_match_service.py  # Main FastAPI application
├── requirements.txt          # Python dependencies
├── README.md                # This file
└── venv/                    # Virtual environment (not in git)
```

## 🔍 Model Details

### BAAI/bge-small-en-v1.5

- **Type:** Sentence Transformer
- **Language:** English
- **Size:** ~130MB (downloaded automatically)
- **Use Case:** Semantic similarity, information retrieval
- **Performance:** Good balance of speed and accuracy

### Model Loading

- Model is loaded on first request (lazy loading)
- Takes a few seconds on first use
- Subsequent requests are faster
- Model stays in memory for performance

## 🐛 Troubleshooting

### Model Download Issues

If the model fails to download:

1. **Check internet connection**
2. **Manual download:**
   ```python
   from sentence_transformers import SentenceTransformer
   model = SentenceTransformer('BAAI/bge-small-en-v1.5')
   ```

### spaCy Model Not Found

```bash
python -m spacy download en_core_web_sm
```

### Memory Issues

If you encounter memory errors:
- Use a smaller model
- Process files in batches
- Increase system memory
- Use model quantization

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

## 📈 Performance

- **First Request:** ~5-10 seconds (model loading)
- **Subsequent Requests:** ~1-3 seconds
- **File Size Impact:** Larger files take longer to process
- **Model Size:** ~130MB in memory

## 🔒 Security Considerations

- **File Size Limits:** Consider adding file size limits
- **File Type Validation:** Currently validates PDF/DOCX
- **Input Sanitization:** Job descriptions are used as-is
- **CORS:** Configure CORS for production
- **Rate Limiting:** Consider adding rate limiting

## 🚀 Production Deployment

### Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -m spacy download en_core_web_sm

COPY resume_match_service.py .

CMD ["uvicorn", "resume_match_service:app", "--host", "0.0.0.0", "--port", "8000"]
```

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
- File logging
- Structured logging (JSON)
- Log rotation
- Log aggregation

## 🔄 Updates

To update dependencies:

```bash
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Sentence Transformers](https://www.sbert.net/)
- [Uvicorn Documentation](https://www.uvicorn.org/)
- [spaCy Documentation](https://spacy.io/)

## 🤝 Integration with Backend

The backend integrates with this service via:
- HTTP requests to `/analyze` endpoint
- See `backend/utils/aiClient.js` for client implementation
- See `backend/routes/resumeMatch.route.js` for API route

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs for error messages
3. Verify all dependencies are installed
4. Ensure Python version is 3.8+

---

**Note:** The first request may take longer as the model needs to be downloaded and loaded into memory.
