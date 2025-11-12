import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);

  const fetchNotifications = async (skipUnreadUpdate = false) => {
    try {
      setLoadingNotifications(true);
      const response = await axios.get('http://localhost:3000/api/notifications', {
        withCredentials: true,
      });
      const allNotifications = response.data;
      // Only update unread count if we're not skipping it (e.g., after marking all as read)
      if (!skipUnreadUpdate) {
        const unread = allNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
      // Store first 3 notifications for dropdown
      setNotifications(allNotifications.slice(0, 3));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    
    // Validate notificationId
    if (!notificationId) {
      console.error('Invalid notification ID:', notificationId);
      return;
    }

    try {
      await axios.delete(`http://localhost:3000/api/notifications/${notificationId}`, {
        withCredentials: true,
      });
      
      // Remove from local state
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);
      // Recalculate unread count from remaining notifications
      const unread = updatedNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      // Refresh all notifications to get updated list and sync unread count
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      console.error('Notification ID:', notificationId);
      console.error('Error response:', error.response?.data);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllAsRead = async () => {
    try {
      // Immediately clear the badge (optimistic update) - badge disappears instantly
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      // Mark all notifications as read on backend
      await axios.put('http://localhost:3000/api/notifications/read-all', {}, {
        withCredentials: true,
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Close dropdown when clicking outside and mark as read when opened
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      // Immediately clear badge when dropdown opens (optimistic update)
      setUnreadCount(0);
      // Mark all notifications as read and then fetch updated list
      markAllAsRead().then(() => {
        // After marking as read, fetch notifications but don't update unread count
        // since we just marked them all as read
        fetchNotifications(true);
      });
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showNotifications]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              to={user ? (user.role === 'RECRUITER' ? '/recruiter/dashboard' : '/candidate/dashboard') : '/'} 
              className="flex-shrink-0 flex items-center"
            >
              <img
                className="h-10 w-auto"
                src="/skillmatch-logo.svg"
                alt="SkillMatch"
              />
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  to="/jobs"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Jobs
                </Link>
                <Link
                  to="/posts"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Posts
                </Link>
                <Link
                  to="/connections"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Connections
                </Link>
                {user.role === 'CANDIDATE' ? (
                  <>
                    <Link
                      to="/resume-match"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Resume Match
                    </Link>
                    <Link
                      to="/my-applications"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      My Applications
                    </Link>
                  </>
                ) : user.role === 'RECRUITER' && (
                  <Link
                    to="/recruiter-applications"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Applications
                  </Link>
                )}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="text-gray-700 hover:text-gray-900 p-2 rounded-full relative transition-colors duration-200"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-teal-600 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                      <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-700">Notifications</h3>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {loadingNotifications ? (
                          <div className="flex justify-center items-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500 text-sm">
                            No notifications yet
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                                  !notification.read ? 'bg-teal-50' : ''
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 break-words">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </p>
                                  </div>
                                  <button
                                    onClick={(e) => deleteNotification(notification.id, e)}
                                    className="ml-2 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                                    title="Delete notification"
                                  >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-2 border-t border-gray-200">
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifications(false)}
                          className="text-teal-600 hover:text-teal-800 text-sm font-medium transition-colors duration-200 text-center block"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 