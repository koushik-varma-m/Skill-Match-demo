const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_ENDPOINT = `${AI_SERVICE_URL}/analyze`;

async function analyzeResume(resumePath, jobDescription) {
    try {
        if (!resumePath || typeof resumePath !== 'string') {
            throw new Error('Resume path is required and must be a string');
        }

        if (!jobDescription?.trim()) {
            throw new Error('Job description is required and cannot be empty');
        }

        const absolutePath = path.isAbsolute(resumePath) 
            ? resumePath 
            : path.resolve(process.cwd(), resumePath);

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Resume file not found: ${absolutePath}`);
        }

        const fileExt = path.extname(absolutePath).toLowerCase();
        if (!['.pdf', '.docx', '.doc'].includes(fileExt)) {
            throw new Error(`Unsupported file type: ${fileExt}. Only PDF and DOCX files are supported`);
        }

        const formData = new FormData();
        formData.append('job_description', jobDescription.trim());
        
        const fileStream = fs.createReadStream(absolutePath);
        const fileName = path.basename(absolutePath);
        formData.append('resume_file', fileStream, {
            filename: fileName,
            contentType: fileExt === '.pdf' 
                ? 'application/pdf' 
                : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        const response = await axios.post(AI_SERVICE_ENDPOINT, formData, {
            headers: formData.getHeaders(),
            timeout: 60000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        if (!response.data || typeof response.data.similarity_score !== 'number') {
            throw new Error('Invalid response from AI service: missing similarity_score');
        }

        const score = response.data.similarity_score;
        if (score < 0 || score > 100) {
            console.warn(`Warning: Similarity score out of range (0-100): ${score}`);
        }

        return {
            similarity_score: score,
            matched_keywords: response.data.matched_keywords || [],
            missing_keywords: response.data.missing_keywords || [],
            model_used: response.data.model_used || 'openai',
            improvement_suggestions: response.data.improvement_suggestions || null
        };

    } catch (error) {
        if (error.response) {
            const msg = error.response.data?.detail || error.response.data?.message || 'AI service error';
            throw new Error(`AI service error (${error.response.status}): ${msg}`);
        }
        if (error.request) {
            throw new Error(`AI service is not responding. Please ensure the service is running on ${AI_SERVICE_URL}`);
        }
        if (error.code === 'ENOENT') {
            throw new Error(`Resume file not found: ${resumePath}`);
        }
        if (error.code === 'ECONNREFUSED') {
            throw new Error(`Cannot connect to AI service at ${AI_SERVICE_URL}. Please ensure the service is running.`);
        }
        throw new Error(`Error analyzing resume: ${error.message}`);
    }
}

async function isServiceHealthy() {
    try {
        const res = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
        return res.data?.status === 'healthy' && res.data?.model_loaded === true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    analyzeResume,
    isServiceHealthy,
    AI_SERVICE_URL,
};

