# Resume Match API

API endpoint for analyzing resume-job description similarity using the AI service.

## Endpoint

**POST** `/api/resume-match`

## Request

### Content-Type
`multipart/form-data`

### Form Fields
- `jobDescription` (string, required): Job description text
- `resumeFile` (file, required): Resume file (PDF, DOC, or DOCX)

### File Restrictions
- Maximum file size: 10MB
- Allowed formats: PDF (.pdf), DOC (.doc), DOCX (.docx)

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "similarityScore": 61.75
}
```

### Error Responses

#### Missing File (400 Bad Request)
```json
{
  "success": false,
  "message": "Resume file is required"
}
```

#### Missing Job Description (400 Bad Request)
```json
{
  "success": false,
  "message": "Job description is required and cannot be empty"
}
```

#### Invalid File Type (400 Bad Request)
```json
{
  "success": false,
  "message": "Only PDF, DOC, and DOCX files are allowed!"
}
```

#### File Too Large (400 Bad Request)
```json
{
  "success": false,
  "message": "File size exceeds the maximum limit of 10MB"
}
```

#### AI Service Unavailable (503 Service Unavailable)
```json
{
  "success": false,
  "message": "AI service is not available. Please try again later."
}
```

#### Server Error (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Error analyzing resume",
  "error": "Detailed error message (development only)"
}
```

## Usage Examples

### cURL
```bash
curl -X POST "http://localhost:3000/api/resume-match" \
  -F "jobDescription=Software Engineer with 3+ years of experience in Python, JavaScript, and React." \
  -F "resumeFile=@/path/to/resume.pdf"
```

### JavaScript (Fetch API)
```javascript
const formData = new FormData();
formData.append('jobDescription', 'Software Engineer with Python experience...');
formData.append('resumeFile', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/resume-match', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log('Similarity Score:', data.similarityScore);
```

### Axios
```javascript
const formData = new FormData();
formData.append('jobDescription', 'Software Engineer with Python experience...');
formData.append('resumeFile', fileInput.files[0]);

const response = await axios.post('http://localhost:3000/api/resume-match', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

console.log('Similarity Score:', response.data.similarityScore);
```

### React Example
```jsx
import React, { useState } from 'react';
import axios from 'axios';

function ResumeMatchForm() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [similarityScore, setSimilarityScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('jobDescription', jobDescription);
      formData.append('resumeFile', resumeFile);

      const response = await axios.post('/api/resume-match', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSimilarityScore(response.data.similarityScore);
    } catch (err) {
      setError(err.response?.data?.message || 'Error analyzing resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Job Description:</label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Resume File:</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setResumeFile(e.target.files[0])}
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Resume'}
      </button>
      {similarityScore !== null && (
        <div>
          <h3>Similarity Score: {similarityScore}%</h3>
        </div>
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
}
```

## Notes

- The endpoint does not require authentication (can be added if needed)
- Files are uploaded to `backend/uploads/resumes/` directory
- The AI service must be running on `http://localhost:8000` (or configured via `AI_SERVICE_URL` environment variable)
- Processing time depends on file size and AI service load (typically 1-5 seconds)
- The similarity score is a number between 0 and 100

## Integration with Job Applications

This endpoint can be integrated with job application flows to automatically calculate similarity scores when candidates apply for jobs:

```javascript
// In job application controller
const { analyzeResumeMatch } = require('../controllers/resumeMatch.controller');

// After uploading resume, analyze it against job description
const job = await JobPost.findByPk(jobId);
const similarityScore = await analyzeResume(resumePath, job.description);

// Store similarity score with application
await JobApplication.create({
  jobId,
  userId: req.user.id,
  resumePath,
  similarityScore,
  // ... other fields
});
```

## See Also

- [AI Client Module](../utils/AI_CLIENT_README.md)
- [AI Service Documentation](../../ai-service/README.md)

