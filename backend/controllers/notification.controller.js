const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new notification
const createNotification = async (userId, type, message) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        read: false
      },
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get all notifications for a user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.update({
      where: {
        id: Number.parseInt(id, 10),
        userId: userId
      },
      data: {
        read: true
      }
    });

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Validate id parameter
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    // Parse and validate the ID
    const notificationId = Number.parseInt(id, 10);
    if (Number.isNaN(notificationId) || notificationId <= 0) {
      return res.status(400).json({ message: 'Invalid notification ID format' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Verify the notification belongs to the user before deleting
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Delete the notification
    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.status(500).json({ 
      message: 'Error deleting notification', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  createNotification,
  markAllNotificationsAsRead,
  deleteNotification,
}; 