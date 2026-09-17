import React, { useState, useEffect, useRef } from 'react';
import notificationService from '../services/notificationService';
import './NotificationBell.css';

/**
 * NotificationBell Component
 * Displays bell icon with unread count badge and dropdown notification panel
 */
const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await notificationService.getNotifications(1, 10);
      setNotifications(Array.isArray(data) ? data : data.notifications || []);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchNotifications();

    // Set up polling every 30 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Handle mark as read
  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();

    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId || n.id === notificationId
            ? { ...n, isRead: true }
            : n
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const unreadCount = notificationService.getUnreadCount(notifications);

  return (
    <div className="notification-bell" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        className="bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        title="View notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                ✓ Read All
              </button>
            )}
          </div>

          {/* Loading State */}
          {isLoading && notifications.length === 0 && (
            <div className="notification-loading">
              <div className="spinner"></div>
              <p>Loading notifications...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="notification-error">
              <p>{error}</p>
              <button onClick={fetchNotifications} className="retry-btn">
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && notifications.length === 0 && (
            <div className="notification-empty">
              <p>🎉 No notifications</p>
              <small>You're all caught up!</small>
            </div>
          )}

          {/* Notifications List */}
          {!isLoading && notifications.length > 0 && (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div
                  key={notification._id || notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                >
                  {/* Unread Indicator */}
                  {!notification.isRead && <div className="unread-indicator"></div>}

                  {/* Content */}
                  <div className="notification-content">
                    <h4 className="notification-title">{notification.title}</h4>
                    <p className="notification-message">{notification.message}</p>
                    <small className="notification-time">
                      {notificationService.formatTimeAgo(notification.createdAt)}
                    </small>
                  </div>

                  {/* Mark as Read Button */}
                  {!notification.isRead && (
                    <button
                      className="mark-read-btn"
                      onClick={(e) =>
                        handleMarkAsRead(notification._id || notification.id, e)
                      }
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="notification-footer">
            <a href="/notifications" className="view-all-link">
              View All Notifications →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
