const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeResumeMatch } = require('../controllers/resumeMatch.controller');

const router = express.Router();

// Configure multer for resume file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'resumes');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'resume-match-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit (larger than job applications to allow for detailed resumes)
    },
    fileFilter: function (req, file, cb) {
        // Accept PDF and DOCX files
        const allowedExtensions = ['.pdf', '.doc', '.docx'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (allowedExtensions.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, and DOCX files are allowed!'), false);
        }
    }
});

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size exceeds the maximum limit of 10MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    next();
};

/**
 * POST /api/resume-match
 * 
 * Analyze resume against job description
 * 
 * @body {string} jobDescription - Job description text
 * @body {file} resumeFile - Resume file (PDF or DOCX)
 * 
 * @returns {Object} { success: boolean, similarityScore: number }
 */
router.post('/', upload.single('resumeFile'), handleMulterError, analyzeResumeMatch);

module.exports = router;

