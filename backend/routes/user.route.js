const express = require('express');
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'profile');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

const {
    testMe,
    getProfile,
    updateProfile,
    deleteUser,
    getUserById,
    searchUsers,
    getSuggestions,
    createExperience,
    updateExperience,
    deleteExperience,
    createEducation,
    updateEducation,
    deleteEducation
} = require('../controllers/user.controller');

// Specific routes first
router.get('/me', authMiddleware, testMe);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, upload.single('profilePicture'), updateProfile);
router.delete('/profile', authMiddleware, deleteUser);
router.get('/search', authMiddleware, searchUsers);
router.get('/suggestions', authMiddleware, getSuggestions);

// Experience routes
router.post('/experience', authMiddleware, createExperience);
router.put('/experience/:id', authMiddleware, updateExperience);
router.delete('/experience/:id', authMiddleware, deleteExperience);

// Education routes
router.post('/education', authMiddleware, createEducation);
router.put('/education/:id', authMiddleware, updateEducation);
router.delete('/education/:id', authMiddleware, deleteEducation);

// Generic routes last
router.get('/:userId', authMiddleware, getUserById);

module.exports = router;