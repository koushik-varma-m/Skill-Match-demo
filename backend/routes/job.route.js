const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// router.get('/', authMiddleware, getAllJobPosts);

// router.post('/create', authMiddleware, createJobPosts);
// router.put('/update/:id', authMiddleware, updateJobPost);
// router.delete('/:id',authMiddleware, deleteJobPost);

// router.get('/:id', authMiddleware, getJobById);

module.exports = router;