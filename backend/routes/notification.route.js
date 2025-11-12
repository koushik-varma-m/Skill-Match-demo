const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} = require('../controllers/notification.controller');

router.get('/', authMiddleware, getNotifications);

router.put('/:id/read', authMiddleware, markAsRead);

router.put('/read-all', authMiddleware, markAllNotificationsAsRead);

router.delete('/:id', authMiddleware, deleteNotification);

module.exports = router;