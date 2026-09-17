import React, { useState, useEffect } from 'react';

/**
 * RefundRequestModal Component
 * Reusable modal for customer to request a refund for an order.
 * 
 * Props:
 * - isOpen: boolean
 * - orderId: string
 * - amount: number
 * - onSubmit: function (reason) => Promise<void>
 * - onClose: function
 * - isLoading: boolean
 */
export default function RefundRequestModal({
  isOpen,
  orderId,
  amount,
  onSubmit,
  onClose,
  isLoading = false,
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Reset fields on open/close
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanReason = reason.trim();

    if (!cleanReason) {
      setError('Refund reason is required.');
      return;
    }
    if (cleanReason.length < 10) {
      setError('Reason must be at least 10 characters long.');
      return;
    }
    if (cleanReason.length > 500) {
      setError('Reason cannot exceed 500 characters.');
      return;
    }

    setError('');
    onSubmit(cleanReason);
  };

  const getShortId = (id) => (id ? id.slice(-8).toUpperCase() : '');

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={styles.closeButton}
          disabled={isLoading}
        >
          ✕
        </button>

        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>↩️ Request Refund</h2>
          <p style={styles.subtitle}>Order #{getShortId(orderId)}</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Info Banner */}
          <div style={styles.infoBanner}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Refundable Amount:</span>
              <span style={styles.infoValue}>Rs. {amount}</span>
            </div>
            <p style={styles.infoNote}>
              Note: Refund requests are only processed for verified online payments.
            </p>
          </div>

          {/* Text Area */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Please explain the reason for your refund request:
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim().length >= 10) {
                  setError('');
                }
              }}
              placeholder="e.g. Items were missing from the package, food delivered was cold or spoiled, wrong items were sent..."
              style={styles.textarea}
              disabled={isLoading}
              rows={4}
            />
            <div style={styles.helperRow}>
              <span style={{ color: reason.trim().length < 10 ? '#dc2626' : '#666' }}>
                {reason.trim().length} / 500 characters (min 10)
              </span>
            </div>
          </div>

          {/* Error Alert */}
          {error && <div style={styles.errorAlert}>⚠️ {error}</div>}

          {/* Footer Actions */}
          <div style={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.submitButton,
                opacity: isLoading ? 0.6 : 1,
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '28px',
    maxWidth: '460px',
    width: '90%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    position: 'relative',
    animation: 'refundSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#9ca3af',
    transition: 'color 0.2s ease',
    padding: '4px 8px',
  },
  header: {
    marginBottom: '20px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#111827',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#4b5563',
    fontWeight: '600',
    margin: 0,
  },
  form: {
    margin: 0,
  },
  infoBanner: {
    backgroundColor: '#fff7ed',
    border: '1px solid #ffedd5',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '20px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  infoLabel: {
    fontSize: '13px',
    color: '#7c2d12',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '16px',
    color: '#ea580c',
    fontWeight: '800',
  },
  infoNote: {
    fontSize: '11px',
    color: '#9a3412',
    margin: 0,
    lineHeight: '1.4',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '13px',
    lineHeight: '1.5',
    color: '#1f2937',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  },
  helperRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '6px',
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fee2e2',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '12px',
    color: '#991b1b',
    fontWeight: '500',
    marginBottom: '20px',
  },
  footer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
};

// Injection of CSS animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes refundSlideUp {
      from {
        opacity: 0;
        transform: translateY(24px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;
  document.head.appendChild(style);
}
