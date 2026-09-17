import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { getAdminPostAuthRedirectPath } from '../../storefront/utils/checkoutAuth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const STAFF_ROLES = ['admin', 'employee', 'rider'];

/**
 * AdminLoginPage — Staff-only login at /admin
 * Redirects to the appropriate panel based on role.
 */
export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login: authLogin, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' }); // type: 'error' | 'success' | 'info'
  const [loading, setLoading] = useState(false);

  // If already logged in as staff, redirect immediately
  useEffect(() => {
    if (isAuthenticated && user && STAFF_ROLES.includes(user.role)) {
      navigate(getAdminPostAuthRedirectPath(user), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setStatus({ message: 'Please enter your email and password.', type: 'error' });
      return;
    }

    setLoading(true);
    setStatus({ message: 'Signing in…', type: 'info' });

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ message: data.message || 'Invalid credentials.', type: 'error' });
        setLoading(false);
        return;
      }

      const { user: loggedInUser, token } = data;

      // Only allow staff roles
      if (!STAFF_ROLES.includes(loggedInUser?.role)) {
        setStatus({
          message: 'This portal is for staff only. Please use the customer login.',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      authLogin(loggedInUser, token);
      setStatus({ message: 'Login successful! Redirecting…', type: 'success' });
      setTimeout(() => navigate(getAdminPostAuthRedirectPath(loggedInUser), { replace: true }), 700);
    } catch {
      setStatus({ message: 'Could not connect to server. Is the backend running?', type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Background blobs */}
      <div style={styles.blobTop} />
      <div style={styles.blobBottom} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <img
            src="/assets/images/2020/12/Logo_light1.svg"
            alt="Pizza Zone & Cafe"
            style={styles.logo}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span style={styles.logoFallback}>🍔</span>
        </div>

        <h1 style={styles.title}>Staff Portal</h1>
        <p style={styles.subtitle}>Sign in to access your panel</p>

        {/* Status message */}
        {status.message && (
          <div style={{ ...styles.statusBox, ...styles.statusTypes[status.type] }}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="admin-email" style={styles.label}>Email Address</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              placeholder="staff@pizzazone.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="admin-password" style={styles.label}>Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
            <div style={styles.forgotPasswordWrap}>
              <a href="/forgot-password" style={styles.forgotPasswordLink}>Forgot password?</a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={styles.backLink}>
          <a href="/" style={styles.link}>← Back to Website</a>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F0F0F',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: 'relative',
    overflow: 'hidden',
    padding: '24px',
  },
  blobTop: {
    position: 'absolute',
    top: '-200px',
    right: '-200px',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  blobBottom: {
    position: 'absolute',
    bottom: '-200px',
    left: '-200px',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,193,7,0.10) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: '#1A1A1A',
    border: '1px solid rgba(255,107,53,0.2)',
    borderRadius: '20px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
  },
  logoWrap: {
    textAlign: 'center',
    marginBottom: '8px',
  },
  logo: {
    height: '48px',
    objectFit: 'contain',
  },
  logoFallback: {
    fontSize: '40px',
    display: 'none',
  },
  title: {
    textAlign: 'center',
    fontSize: '26px',
    fontWeight: 800,
    color: '#F5F5F0',
    margin: '16px 0 4px',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#888888',
    margin: '0 0 28px',
  },
  statusBox: {
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  statusTypes: {
    error: { backgroundColor: 'rgba(231,76,60,0.15)', color: '#E74C3C', border: '1px solid rgba(231,76,60,0.3)' },
    success: { backgroundColor: 'rgba(46,204,113,0.15)', color: '#2ECC71', border: '1px solid rgba(46,204,113,0.3)' },
    info: { backgroundColor: 'rgba(52,152,219,0.15)', color: '#3498DB', border: '1px solid rgba(52,152,219,0.3)' },
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#AAAAAA',
    letterSpacing: '0.3px',
  },
  input: {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: '#242424',
    color: '#F5F5F0',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  btn: {
    marginTop: '8px',
    padding: '13px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #FF6B35, #e55a25)',
    color: 'white',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 16px rgba(255,107,53,0.35)',
    letterSpacing: '0.3px',
  },
  backLink: {
    textAlign: 'center',
    marginTop: '24px',
  },
  link: {
    color: '#666666',
    fontSize: '13px',
    textDecoration: 'none',
  },
  forgotPasswordWrap: {
    textAlign: 'right',
    marginTop: '4px',
  },
  forgotPasswordLink: {
    color: '#FF6B35',
    fontSize: '12px',
    textDecoration: 'none',
    fontWeight: '600',
  },
};
