import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/notifications', {
        withCredentials: true,
      });
      setNotifications(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`http://localhost:3000/api/notifications/${notificationId}/read`, {}, {
        withCredentials: true,
      });
      setNotifications(notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('http://localhost:3000/api/notifications/read-all', {}, {
        withCredentials: true,
      });
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!notificationId) {
      console.error('Invalid notification ID:', notificationId);
      setDeleteError('Invalid notification ID');
      setTimeout(() => setDeleteError(null), 3000);
      return;
    }

    try {
      setDeleteError(null);
      const response = await axios.delete(`http://localhost:3000/api/notifications/${notificationId}`, {
        withCredentials: true,
      });
      setNotifications(notifications.filter(notification => notification.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
      console.error('Notification ID:', notificationId);
      console.error('Error response:', err.response?.data);
      setDeleteError(err.response?.data?.message || 'Failed to delete notification');           
      setTimeout(() => setDeleteError(null), 3000);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Notifications</h2>
        {notifications.some(n => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="text-teal-600 hover:text-teal-800 text-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      {deleteError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {deleteError}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No notifications yet
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${
                notification.read ? 'bg-white' : 'bg-teal-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-800">{notification.message}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-teal-600 hover:text-teal-800 text-sm"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications; 