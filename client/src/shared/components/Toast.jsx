import React, { useState, useEffect } from 'react';

/**
 * Toast Notification Component
 * Shows temporary notifications for success/error messages
 * 
 * Usage: useToast() hook returns { showToast, showError, showSuccess }
 */
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div style={styles.container}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            ...styles.toast,
            backgroundColor: toast.type === 'error' ? '#F44336' : '#4CAF50',
          }}
        >
          <span style={styles.icon}>
            {toast.type === 'error' ? '❌' : '✅'}
          </span>
          <span style={styles.message}>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            style={styles.closeButton}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 2000,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '400px',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '14px 16px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    animation: 'slideIn 0.3s ease',
    fontSize: '13px',
  },
  icon: {
    fontSize: '18px',
    flexShrink: 0,
  },
  message: {
    flex: 1,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0 4px',
    flexShrink: 0,
  },
};

// Add animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(400px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * useToast Hook
 * Manages toast notifications
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showToast = (message) => addToast(message, 'success');
  const showError = (message) => addToast(message, 'error');
  const showSuccess = (message) => addToast(message, 'success');

  return { toasts, removeToast, showToast, showError, showSuccess };
};

export { ToastContainer };
export default ToastContainer;
