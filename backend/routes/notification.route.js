const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} = require('../controllers/notification.controller');

// Get all notifications for the authenticated user
router.get('/', authMiddleware, getNotifications);

// Mark a notification as read
router.put('/:id/read', authMiddleware, markAsRead);

// Mark all notifications as read
router.put('/read-all', authMiddleware, markAllNotificationsAsRead);

// Delete a notification
router.delete('/:id', authMiddleware, deleteNotification);

module.exports = router; 