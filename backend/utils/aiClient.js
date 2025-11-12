/**
 * AI Client Module
 * ================
 * Node.js client for the Resume Match AI Service.
 * 
 * This module provides functionality to analyze resume-job description similarity
 * by communicating with the FastAPI AI service running on localhost:8000.
 * 
 * @module utils/aiClient
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// AI Service configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_ENDPOINT = `${AI_SERVICE_URL}/analyze`;

/**
 * Analyzes a resume file against a job description and returns the analysis results.
 * 
 * @param {string} resumePath - Path to the resume file (PDF or DOCX)
 * @param {string} jobDescription - Job description text
 * @returns {Promise<Object>} Analysis results with similarity_score, matched_keywords, and missing_keywords
 * @returns {Promise<number>} Legacy: Similarity score (0-100) if only score is needed
 * @throws {Error} If the file doesn't exist, request fails, or service returns an error
 * 
 * @example
 * const { analyzeResume } = require('./utils/aiClient');
 * 
 * try {
 *   const result = await analyzeResume(
 *     './uploads/resumes/resume.pdf',
 *     'Software Engineer with Python experience...'
 *   );
 *   console.log(`Similarity score: ${result.similarity_score}`);
 *   console.log(`Matched keywords: ${result.matched_keywords.join(', ')}`);
 *   console.log(`Missing keywords: ${result.missing_keywords.join(', ')}`);
 * } catch (error) {
 *   console.error('Error analyzing resume:', error.message);
 * }
 */
async function analyzeResume(resumePath, jobDescription) {
    try {
        // Validate inputs
        if (!resumePath || typeof resumePath !== 'string') {
            throw new Error('Resume path is required and must be a string');
        }

        if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
            throw new Error('Job description is required and cannot be empty');
        }

        // Resolve the file path (handle both absolute and relative paths)
        const absolutePath = path.isAbsolute(resumePath) 
            ? resumePath 
            : path.resolve(process.cwd(), resumePath);

        // Check if file exists
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Resume file not found: ${absolutePath}`);
        }

        // Check file extension
        const fileExt = path.extname(absolutePath).toLowerCase();
        if (!['.pdf', '.docx', '.doc'].includes(fileExt)) {
            throw new Error(`Unsupported file type: ${fileExt}. Only PDF and DOCX files are supported`);
        }

        // Create form data
        const formData = new FormData();
        
        // Add job description
        formData.append('job_description', jobDescription.trim());
        
        // Add resume file (use the original filename for better compatibility)
        const fileStream = fs.createReadStream(absolutePath);
        const fileName = path.basename(absolutePath);
        formData.append('resume_file', fileStream, {
            filename: fileName,
            contentType: fileExt === '.pdf' 
                ? 'application/pdf' 
                : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        // Make request to AI service
        const response = await axios.post(AI_SERVICE_ENDPOINT, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 60000, // 60 second timeout for large files and model processing
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        // Validate response
        if (!response.data || typeof response.data.similarity_score !== 'number') {
            throw new Error('Invalid response from AI service: missing similarity_score');
        }

        const similarityScore = response.data.similarity_score;

        // Validate score range
        if (similarityScore < 0 || similarityScore > 100) {
            console.warn(`Warning: Similarity score is out of expected range (0-100): ${similarityScore}`);
        }

        // Return full response with similarity_score, matched_keywords, and missing_keywords
        return {
            similarity_score: similarityScore,
            matched_keywords: response.data.matched_keywords || [],
            missing_keywords: response.data.missing_keywords || []
        };

    } catch (error) {
        // Handle axios errors
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            const errorMessage = error.response.data?.detail || error.response.data?.message || 'AI service error';
            throw new Error(`AI service error (${error.response.status}): ${errorMessage}`);
        } else if (error.request) {
            // The request was made but no response was received
            throw new Error(`AI service is not responding. Please ensure the service is running on ${AI_SERVICE_URL}`);
        } else if (error.code === 'ENOENT') {
            // File not found
            throw new Error(`Resume file not found: ${resumePath}`);
        } else if (error.code === 'ECONNREFUSED') {
            // Connection refused
            throw new Error(`Cannot connect to AI service at ${AI_SERVICE_URL}. Please ensure the service is running.`);
        } else {
            // Something else happened
            throw new Error(`Error analyzing resume: ${error.message}`);
        }
    }
}

/**
 * Checks if the AI service is healthy and ready to process requests.
 * 
 * @returns {Promise<boolean>} True if service is healthy, false otherwise
 * 
 * @example
 * const { isServiceHealthy } = require('./utils/aiClient');
 * 
 * const healthy = await isServiceHealthy();
 * if (healthy) {
 *   console.log('AI service is ready');
 * } else {
 *   console.log('AI service is not available');
 * }
 */
async function isServiceHealthy() {
    try {
        const healthUrl = `${AI_SERVICE_URL}/health`;
        const response = await axios.get(healthUrl, {
            timeout: 5000,
        });
        
        return response.data?.status === 'healthy' && response.data?.model_loaded === true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    analyzeResume,
    isServiceHealthy,
    AI_SERVICE_URL,
};

