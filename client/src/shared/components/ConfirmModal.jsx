import React from 'react';

/**
 * ConfirmModal Component
 * Reusable confirmation dialog for actions like cancel, delete, etc.
 * 
 * Props:
 * - isOpen: boolean
 * - title: string
 * - message: string
 * - confirmText: string (default: "Confirm")
 * - cancelText: string (default: "Cancel")
 * - onConfirm: function
 * - onCancel: function
 * - isLoading: boolean
 * - isDangerous: boolean (red color)
 */
const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  isDangerous = false,
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          onClick={onCancel}
          style={styles.closeButton}
          disabled={isLoading}
        >
          ✕
        </button>

        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
        </div>

        {/* Message */}
        <p style={styles.message}>{message}</p>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            onClick={onCancel}
            style={styles.cancelButton}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              ...styles.confirmButton,
              backgroundColor: isDangerous ? '#F44336' : '#FF6B35',
              opacity: isLoading ? 0.6 : 1,
            }}
            disabled={isLoading}
          >
            {isLoading ? '⏳ Loading...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    position: 'relative',
    animation: 'slideUp 0.3s ease',
  },
  closeButton: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999999',
    transition: 'color 0.3s ease',
    padding: '4px 8px',
  },
  header: {
    marginBottom: '16px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1A1A1A',
    margin: 0,
  },
  message: {
    fontSize: '14px',
    color: '#666666',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  footer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    backgroundColor: '#F5F5F0',
    color: '#1A1A1A',
    border: '1px solid #E8E8E3',
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  confirmButton: {
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

// Add animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}

export default ConfirmModal;
