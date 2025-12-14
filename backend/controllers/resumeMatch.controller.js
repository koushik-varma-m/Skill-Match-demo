const { analyzeResume } = require('../utils/aiClient');

const analyzeResumeMatch = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Resume file is required'
            });
        }

        const { jobDescription } = req.body;
        if (!jobDescription?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Job description is required and cannot be empty'
            });
        }

        const result = await analyzeResume(req.file.path, jobDescription);

        res.status(200).json({
            success: true,
            similarityScore: result.similarity_score,
            matchedKeywords: Array.isArray(result.matched_keywords) ? result.matched_keywords : [],
            missingKeywords: Array.isArray(result.missing_keywords) ? result.missing_keywords : [],
            modelUsed: result.model_used || 'openai',
            improvementSuggestions: result.improvement_suggestions || null
        });

    } catch (error) {
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

