import React, { useState, useEffect } from 'react';
import notificationService from '../../shared/services/notificationService';
import './NotificationsPage.css';

/**
 * NotificationsPage Component
 * Full-page view for all notifications with pagination
 */
const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');

  const PAGE_SIZE = 20;

  // Fetch notifications with pagination
  const fetchNotifications = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await notificationService.getNotifications(page, PAGE_SIZE);

      if (data && data.notifications) {
        const filteredNotifications =
          filterStatus === 'all'
            ? data.notifications
            : filterStatus === 'unread'
            ? data.notifications.filter((n) => !n.isRead)
            : data.notifications.filter((n) => n.isRead);

        setNotifications(filteredNotifications);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        setNotifications(Array.isArray(data) ? data : []);
        setTotalPages(1);
      }

      setCurrentPage(page);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error(err);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications(1);
  }, []);

  // Refetch when filter changes
  useEffect(() => {
    fetchNotifications(1);
  }, [filterStatus]);

  // Handle mark as read
  const handleMarkAsRead = async (notificationId) => {
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
    <div className="notifications-page">
      {/* Page Header */}
      <div className="notifications-header">
        <h1>Notifications</h1>
        <p className="notifications-subtitle">
          {unreadCount > 0 && <span>{unreadCount} unread</span>}
        </p>
      </div>

      {/* Actions Bar */}
      <div className="notifications-actions">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filterStatus === 'unread' ? 'active' : ''}`}
            onClick={() => setFilterStatus('unread')}
          >
            Unread
          </button>
          <button
            className={`filter-btn ${filterStatus === 'read' ? 'active' : ''}`}
            onClick={() => setFilterStatus('read')}
          >
            Read
          </button>
        </div>

        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
            Mark All as Read
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="notifications-loading">
          <div className="spinner"></div>
          <p>Loading notifications...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="notifications-error">
          <p>{error}</p>
          <button onClick={() => fetchNotifications(currentPage)} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && notifications.length === 0 && (
        <div className="notifications-empty">
          <div className="empty-icon">🎉</div>
          <h2>No notifications</h2>
          <p>You're all caught up! Come back later for updates.</p>
        </div>
      )}

      {/* Notifications List */}
      {!isLoading && !error && notifications.length > 0 && (
        <>
          <div className="notifications-list-container">
            {notifications.map((notification) => (
              <div
                key={notification._id || notification.id}
                className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
              >
                {/* Unread Indicator */}
                {!notification.isRead && <div className="notification-indicator"></div>}

                {/* Card Content */}
                <div className="notification-card-content">
                  <div className="notification-card-header">
                    <h3 className="notification-card-title">{notification.title}</h3>
                    <span className="notification-card-time">
                      {notificationService.formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>

                  <p className="notification-card-message">{notification.message}</p>

                  {/* Additional metadata if available */}
                  {notification.type && (
                    <div className="notification-metadata">
                      <span className={`notification-type type-${notification.type}`}>
                        {notification.type.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="notification-card-actions">
                  {!notification.isRead && (
                    <button
                      className="action-btn read-btn"
                      onClick={() =>
                        handleMarkAsRead(notification._id || notification.id)
                      }
                      title="Mark as read"
                    >
                      ✓ Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => fetchNotifications(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>

              <div className="pagination-info">
                Page {currentPage} of {totalPages}
              </div>

              <button
                className="pagination-btn"
                onClick={() => fetchNotifications(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationsPage;
