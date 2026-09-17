import api from './api';

/**
 * Notification Service
 * Handles all notification-related API calls.
 * Backend model uses `isRead` field — all frontend checks use `isRead`.
 */
const notificationService = {
  /**
   * Fetch all notifications with pagination
   */
  getNotifications: async (page = 1, limit = 20) => {
    try {
      const response = await api.get('/notifications', {
        params: { page, limit },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   * Backend route: PUT /api/notifications/mark-all-read
   */
  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Get unread notification count from a local array.
   * Uses `isRead` to match the backend Notification model.
   */
  getUnreadCount: (notifications = []) => {
    return notifications.filter((n) => !n.isRead).length;
  },

  /**
   * Format time difference to human-readable string
   */
  formatTimeAgo: (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now - notificationDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return notificationDate.toLocaleDateString();
  },
};

export default notificationService;
