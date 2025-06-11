const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getAllJobPosts,
    createJob,
    getJobs,
    getJobById,
    getJobsByRecruiter,
    updateJob,
    deleteJob,
    applyForJob,
    getMyApplications,
    getRecruiterApplications,
    updateApplicationStatus
} = require('../controllers/job.controller');
const router = express.Router();

// Configure multer for resume uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'resumes');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept PDF, DOC, and DOCX files
        if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
            return cb(new Error('Only PDF, DOC, and DOCX files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Public routes
router.get('/', authMiddleware, getJobs); // Get all active jobs
router.get('/all', getAllJobPosts); // Get all jobs (including inactive)

// Candidate routes
router.get('/applications', authMiddleware, getMyApplications); // Get user's applications

// Recruiter routes
router.post('/', authMiddleware, createJob); // Create new job
router.get('/recruiter/jobs', authMiddleware, getJobsByRecruiter); // Get jobs posted by recruiter
router.get('/recruiter/applications', authMiddleware, getRecruiterApplications); // Get applications for recruiter's jobs
router.put('/applications/:applicationId/status', authMiddleware, updateApplicationStatus); // Update application status

// Job-specific routes
router.get('/:jobId', authMiddleware, getJobById); // Get specific job details
router.put('/:jobId', authMiddleware, updateJob); // Update job
router.delete('/:jobId', authMiddleware, deleteJob); // Delete job
router.post('/:jobId/apply', authMiddleware, upload.single('resume'), applyForJob); // Apply for a job

module.exports = router;