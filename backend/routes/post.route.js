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

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'posts');
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
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

router.get('/', authMiddleware, getAllPosts);

router.get('/user/posts', authMiddleware, getUserPosts);

router.post('/create', authMiddleware, upload.single('image'), createPost);

router.put('/:id', authMiddleware, upload.single('image'), updatePost);

router.delete('/:id', authMiddleware, deletePost);

router.post('/:id/like', authMiddleware, likePost);

router.post('/:id/comment', authMiddleware, createComment);

router.delete('/:id/comment/:commentId', authMiddleware, deleteComment);

module.exports = router;