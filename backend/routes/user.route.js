const express = require('express');
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {testMe, getProfile, updateProfile, deleteUser} = require('../controllers/user.controller');

router.get('/me', authMiddleware, testMe);

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.delete('/', authMiddleware, deleteUser);

module.exports = router;