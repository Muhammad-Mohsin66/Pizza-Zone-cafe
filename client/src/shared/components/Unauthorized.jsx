import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Unauthorized (403) Page
 * Shown when a user lacks permission for the requested module.
 */
export default function Unauthorized() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleGoHome = () => navigate('/');
  const handleGoLogin = () => navigate('/login');

  return (
    <div style={styles.wrapper}>
      <div style={styles.blobTop} />
      <div style={styles.blobBottom} />

      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <span style={styles.icon}>🔒</span>
        </div>

        <div style={styles.code}>403</div>

        <h1 style={styles.title}>Access Denied</h1>

        <p style={styles.message}>
          {isAuthenticated
            ? `Your account (${user?.email}) doesn't have permission to view this page.`
            : 'You need to be logged in with the right permissions to view this page.'}
        </p>

        <div style={styles.divider} />

        <p style={styles.hint}>
          This area is restricted to authorized users only. If you believe this is a
          mistake, please contact your administrator.
        </p>

        <div style={styles.btnRow}>
          <button id="unauthorized-go-home" style={styles.btnPrimary} type="button" onClick={handleGoHome}>
            ← Go to Homepage
          </button>
          {!isAuthenticated && (
            <button id="unauthorized-go-login" style={styles.btnSecondary} type="button" onClick={handleGoLogin}>
              Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F0F0F',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: '24px',
  },
  blobTop: {
    position: 'absolute',
    top: '-180px',
    right: '-180px',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  blobBottom: {
    position: 'absolute',
    bottom: '-180px',
    left: '-180px',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,193,7,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: '#1A1A1A',
    border: '1px solid rgba(255,107,53,0.25)',
    borderRadius: '20px',
    padding: '56px 48px',
    maxWidth: '520px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  },
  iconWrap: {
    width: '80px',
    height: '80px',
    margin: '0 auto 24px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(255,193,7,0.15))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255,107,53,0.3)',
  },
  icon: {
    fontSize: '36px',
  },
  code: {
    fontSize: '80px',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #FF6B35, #FFC107)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: 1,
    marginBottom: '8px',
    letterSpacing: '-4px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#F5F5F0',
    margin: '0 0 16px 0',
  },
  message: {
    fontSize: '15px',
    color: '#AAAAAA',
    lineHeight: 1.6,
    margin: '0 0 24px 0',
  },
  divider: {
    width: '60px',
    height: '3px',
    background: 'linear-gradient(90deg, #FF6B35, #FFC107)',
    borderRadius: '2px',
    margin: '0 auto 24px',
  },
  hint: {
    fontSize: '13px',
    color: '#666666',
    lineHeight: 1.6,
    margin: '0 0 32px 0',
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    backgroundColor: '#FF6B35',
    color: 'white',
    border: 'none',
    padding: '12px 28px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 16px rgba(255,107,53,0.35)',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    color: '#FF6B35',
    border: '1.5px solid #FF6B35',
    padding: '12px 28px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};
