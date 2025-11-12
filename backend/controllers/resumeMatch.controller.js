const { analyzeResume } = require('../utils/aiClient');
const path = require('path');

/**
 * Analyze resume against job description
 * POST /api/resume-match
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.jobDescription - Job description text
 * @param {Object} req.file - Uploaded resume file (from multer)
 * @param {Object} res - Express response object
 */
const analyzeResumeMatch = async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Resume file is required'
            });
        }

        // Get job description from request body
        const { jobDescription } = req.body;

        // Validate job description
        if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Job description is required and cannot be empty'
            });
        }

        // Get the uploaded file path
        const resumePath = req.file.path;

        console.log(`Analyzing resume: ${req.file.filename}`);
        console.log(`Job description length: ${jobDescription.length} characters`);

        // Call AI service to analyze resume
        const analysisResult = await analyzeResume(resumePath, jobDescription);

        console.log(`Similarity score: ${analysisResult.similarity_score}%`);
        console.log(`Matched keywords: ${analysisResult.matched_keywords.join(', ')}`);
        console.log(`Missing keywords: ${analysisResult.missing_keywords.join(', ')}`);

        // Return the analysis results
        const responseData = {
            success: true,
            similarityScore: analysisResult.similarity_score,
            matchedKeywords: Array.isArray(analysisResult.matched_keywords) ? analysisResult.matched_keywords : [],
            missingKeywords: Array.isArray(analysisResult.missing_keywords) ? analysisResult.missing_keywords : []
        };
        
        console.log('Sending response:', JSON.stringify(responseData, null, 2));
        
        res.status(200).json(responseData);

    } catch (error) {
        console.error('Error analyzing resume:', error);

        // Handle specific error cases
        if (error.message.includes('not responding') || error.message.includes('cannot connect')) {
            return res.status(503).json({
                success: false,
                message: 'AI service is not available. Please try again later.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('Unsupported file type')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        // Generic error response
        res.status(500).json({
            success: false,
            message: 'Error analyzing resume',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    analyzeResumeMatch
};

