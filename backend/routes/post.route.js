const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getAllPosts,
    getUserPosts,
    createPost,
    updatePost,
    deletePost,
    createComment,
    deleteComment,
    likePost
} = require('../controllers/post.controller');
const router = express.Router();

// Configure multer for post image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'posts');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
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

// Get all posts
router.get('/', authMiddleware, getAllPosts);

// Get user's posts
router.get('/user/posts', authMiddleware, getUserPosts);

// Create a new post
router.post('/create', authMiddleware, upload.single('image'), createPost);

// Update a post
router.put('/:id', authMiddleware, upload.single('image'), updatePost);

// Delete a post
router.delete('/:id', authMiddleware, deletePost);

// Like/Unlike a post
router.post('/:id/like', authMiddleware, likePost);

// Add a comment to a post
router.post('/:id/comment', authMiddleware, createComment);

// Delete a comment
router.delete('/:id/comment/:commentId', authMiddleware, deleteComment);

module.exports = router;