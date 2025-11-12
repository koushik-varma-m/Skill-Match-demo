# AI Client Module

Node.js client for the Resume Match AI Service. This module provides a simple interface to analyze resume-job description similarity by communicating with the FastAPI AI service.

## Installation

The module uses `axios` and `form-data`. These are already installed as dependencies:

- `axios` - Already installed
- `form-data` - Installed as a dependency of axios

## Usage

### Basic Usage

```javascript
const { analyzeResume } = require('./utils/aiClient');

async function checkResume() {
    try {
        const score = await analyzeResume(
            './uploads/resumes/resume.pdf',
            'Software Engineer with 3+ years of experience in Python, JavaScript, and React...'
        );
        
        console.log(`Similarity score: ${score}%`);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkResume();
```

### With Express Route

```javascript
const express = require('express');
const router = express.Router();
const { analyzeResume } = require('../utils/aiClient');

router.post('/analyze-resume', async (req, res) => {
    try {
        const { resumePath, jobDescription } = req.body;
        
        const score = await analyzeResume(resumePath, jobDescription);
        
        res.json({
            success: true,
            similarity_score: score
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
```

### Check Service Health

```javascript
const { isServiceHealthy } = require('./utils/aiClient');

async function checkHealth() {
    const healthy = await isServiceHealthy();
    
    if (healthy) {
        console.log('AI service is ready');
    } else {
        console.log('AI service is not available');
    }
}
```

## API Reference

### `analyzeResume(resumePath, jobDescription)`

Analyzes a resume file against a job description and returns the similarity score.

**Parameters:**
- `resumePath` (string): Path to the resume file (PDF or DOCX). Can be absolute or relative to the current working directory.
- `jobDescription` (string): Job description text to compare against.

**Returns:**
- `Promise<number>`: Similarity score (0-100)

**Throws:**
- `Error`: If the file doesn't exist, request fails, or service returns an error

**Example:**
```javascript
const score = await analyzeResume(
    'uploads/resumes/resume.pdf',
    'Software Engineer with Python experience...'
);
// Returns: 61.37
```

### `isServiceHealthy()`

Checks if the AI service is healthy and ready to process requests.

**Returns:**
- `Promise<boolean>`: True if service is healthy, false otherwise

**Example:**
```javascript
const healthy = await isServiceHealthy();
// Returns: true or false
```

## Configuration

The AI service URL can be configured using environment variables:

```bash
# .env file
AI_SERVICE_URL=http://localhost:8000
```

Default: `http://localhost:8000`

## Error Handling

The module provides detailed error messages for common issues:

- **File not found**: `Resume file not found: <path>`
- **Unsupported file type**: `Unsupported file type: .txt. Only PDF and DOCX files are supported`
- **Service not available**: `AI service is not responding. Please ensure the service is running on http://localhost:8000`
- **Connection refused**: `Cannot connect to AI service at http://localhost:8000. Please ensure the service is running.`
- **Service errors**: `AI service error (500): <error message>`

## Supported File Types

- PDF (`.pdf`)
- DOCX (`.docx`)
- DOC (`.doc`) - Note: DOCX is recommended

## Testing

A test script is provided to test the module:

```bash
node utils/test-ai-client.js <resume-path> <job-description>
```

**Example:**
```bash
node utils/test-ai-client.js uploads/resumes/resume.pdf "Software Engineer with Python experience"
```

## Integration Example

### In Job Application Controller

```javascript
const { analyzeResume } = require('../utils/aiClient');
const path = require('path');

async function createApplication(req, res) {
    try {
        const { jobId, resumePath } = req.body;
        
        // Get job description from database
        const job = await JobPost.findByPk(jobId);
        
        // Analyze resume
        const similarityScore = await analyzeResume(
            resumePath,
            job.description
        );
        
        // Create application with similarity score
        const application = await JobApplication.create({
            jobId,
            userId: req.user.id,
            resumePath,
            similarityScore,
            // ... other fields
        });
        
        res.json({
            success: true,
            application,
            similarity_score: similarityScore
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
```

## Notes

- The module handles both absolute and relative file paths
- File paths are resolved relative to the current working directory
- The request has a 60-second timeout for large files and model processing
- The service must be running before calling `analyzeResume`
- Use `isServiceHealthy()` to check service availability before making requests

## Troubleshooting

### Service Not Responding

1. Check if the AI service is running:
   ```bash
   curl http://localhost:8000/health
   ```

2. Ensure the service is started:
   ```bash
   cd ai-service
   source venv/bin/activate
   uvicorn resume_match_service:app --host 0.0.0.0 --port 8000
   ```

### File Not Found

- Use absolute paths or paths relative to the project root
- Ensure the file exists and is readable
- Check file permissions

### Timeout Errors

- Large files may take longer to process
- Increase the timeout in the module if needed (default: 60 seconds)
- Ensure the AI service has sufficient resources

## See Also

- [AI Service Documentation](../ai-service/README.md)
- [Test Endpoint Documentation](../ai-service/TEST_ENDPOINT.md)

