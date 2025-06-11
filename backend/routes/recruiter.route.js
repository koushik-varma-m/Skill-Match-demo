const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/recruiter.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Get recruiter dashboard statistics
router.get('/dashboard/stats', authMiddleware, getDashboardStats);

module.exports = router; 