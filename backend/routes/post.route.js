const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// router.get('/',getAllPosts);
// router.get('/user/posts', authMiddleware, getUserPosts);
// router.post('/create', authMiddleware, createPost);
// router.put('/:postId', authMiddleware, updatePost);
// router.delete('/:postId', authMiddleware, deletePost);

module.exports = router;