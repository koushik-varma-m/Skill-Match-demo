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
    updateApplicationStatus,
    getJobWithMatchScore,
    findMatchingJobs
} = require('../controllers/job.controller');
const router = express.Router();

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
        cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
            return cb(new Error('Only PDF, DOC, and DOCX files are allowed!'), false);
        }
        cb(null, true);
    }
});

router.get('/', authMiddleware, getJobs);
router.get('/all', getAllJobPosts);

router.get('/applications', authMiddleware, getMyApplications);
router.get('/matching', authMiddleware, findMatchingJobs);

router.post('/', authMiddleware, createJob);
router.get('/recruiter/jobs', authMiddleware, getJobsByRecruiter);
router.get('/recruiter/applications', authMiddleware, getRecruiterApplications);
router.put('/applications/:applicationId/status', authMiddleware, updateApplicationStatus);

router.get('/:jobId', authMiddleware, getJobById);
router.put('/:jobId', authMiddleware, updateJob);
router.delete('/:jobId', authMiddleware, deleteJob);
router.post('/:jobId/apply', authMiddleware, upload.single('resume'), applyForJob);
router.get('/:jobId/match', authMiddleware, getJobWithMatchScore);

module.exports = router;