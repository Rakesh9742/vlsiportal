import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './NotificationBanner.css';

const NotificationBanner = () => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkForNotifications();
      // Check for notifications every 30 seconds
      const interval = setInterval(checkForNotifications, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const checkForNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const notifications = response.data.notifications || [];
      const unreadNotifications = notifications.filter(notif => !notif.is_read);
      
      if (unreadNotifications.length > 0) {
        setNotifications(unreadNotifications);
        setIsVisible(true);
      } else {
        setNotifications([]);
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  const dismissNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      if (notifications.length <= 1) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const dismissAll = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications([]);
      setIsVisible(false);
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
    }
  };

  const navigateToQuery = (queryId, notificationId) => {
    if (queryId) {
      // Mark notification as read before navigating
      dismissNotification(notificationId);
      
      // For admin/domain_admin users, redirect to edit mode
      if (['admin', 'domain_admin'].includes(user?.role)) {
        window.location.href = `/queries/${queryId}/edit`;
      } else {
        window.location.href = `/queries/${queryId}`;
      }
    } else {
      console.error('No query ID available for navigation');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-banner">
      <div className="notification-header">
        <h3>🔔 New Notifications</h3>
        <button className="dismiss-all-btn" onClick={dismissAll}>
          Dismiss All
        </button>
      </div>
      <div className="notification-list">
        {notifications.map((notification) => (
          <div key={notification.id} className="notification-item">
            <div className="notification-content">
              <div className="notification-title">
                <strong>{notification.title}</strong>
              </div>
              <div className="notification-details">
                {notification.message}
              </div>
              <div className="notification-time">
                {formatTime(notification.created_at)}
              </div>
            </div>
            <div className="notification-actions">
              <button 
                className="view-btn" 
                onClick={() => navigateToQuery(notification.custom_query_id, notification.id)}
              >
                View Query
              </button>
              <button 
                className="dismiss-btn" 
                onClick={() => dismissNotification(notification.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationBanner;