import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import '../styles/Auth.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Request, 2: Verify, 3: Complete
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requestId, setRequestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', error: false });

  // Step 1: Request OTP Reset Session
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus({ message: '', error: false });

    try {
      const res = await fetch(`${API_BASE}/auth/reset-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus({ message: data.message || 'Reset request failed.', error: true });
        setLoading(false);
        return;
      }

      setRequestId(data.requestId);
      setStep(2);
      setStatus({ message: 'OTP verification code sent to your email.', error: false });
    } catch (err) {
      setStatus({ message: 'Could not connect to server. Is the backend running?', error: true });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setStatus({ message: '', error: false });

    try {
      const res = await fetch(`${API_BASE}/auth/reset-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus({ message: data.message || 'OTP verification failed.', error: true });
        setLoading(false);
        return;
      }

      setStep(3);
      setStatus({ message: 'OTP verified successfully. Please enter your new password.', error: false });
    } catch (err) {
      setStatus({ message: 'Could not connect to server. Is the backend running?', error: true });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete password update
  const handleCompleteReset = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setStatus({ message: 'Please enter and confirm your password.', error: true });
      return;
    }

    if (newPassword.length < 8) {
      setStatus({ message: 'Password must be at least 8 characters long.', error: true });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ message: 'Passwords do not match.', error: true });
      return;
    }

    setLoading(true);
    setStatus({ message: '', error: false });

    try {
      const res = await fetch(`${API_BASE}/auth/reset-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus({ message: data.message || 'Failed to complete reset.', error: true });
        setLoading(false);
        return;
      }

      setStatus({ message: 'Password reset successfully! Redirecting to login...', error: false });
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setStatus({ message: 'Could not connect to server. Is the backend running?', error: true });
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-wrapper">
          <div className="auth-card" style={{ maxWidth: '440px', padding: '40px 30px' }}>
            <div className="auth-header" style={{ marginBottom: '24px' }}>
              <img src="/assets/images/2020/12/Logo_light1.svg" alt="Pizza Zone & Cafe" className="auth-logo" style={{ maxHeight: '48px', marginBottom: '15px' }} />
              <h1>Reset Password</h1>
              <p>
                {step === 1 && 'Enter your email to receive an OTP code'}
                {step === 2 && 'Enter the 6-digit code sent to your inbox'}
                {step === 3 && 'Choose a secure new password'}
              </p>
            </div>

            {status.message && (
              <div
                className={status.error ? 'error-message' : 'success-message'}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  backgroundColor: status.error ? '#f8d7da' : '#d4edda',
                  color: status.error ? '#721c24' : '#155724',
                  border: status.error ? '1px solid #f5c6cb' : '1px solid #c3e6cb',
                }}
              >
                {status.message}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleRequestOTP} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="reset-email" style={{ fontWeight: 700, fontSize: '0.9rem' }}>Email Address</label>
                  <input
                    type="email"
                    id="reset-email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input"
                    style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
                <button type="submit" disabled={loading} className="submit-btn" style={{ padding: '12px', background: 'linear-gradient(135deg, #fbb731 0%, #F37335 100%)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, color: '#1B2A49' }}>
                  {loading ? 'Sending OTP…' : 'Send OTP Code'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="reset-otp" style={{ fontWeight: 700, fontSize: '0.9rem' }}>6-Digit OTP Code</label>
                  <input
                    type="text"
                    id="reset-otp"
                    placeholder="123456"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="form-input"
                    style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px', textAlign: 'center', fontSize: '1.25rem', letterSpacing: '4px', fontWeight: 'bold' }}
                  />
                </div>
                <button type="submit" disabled={loading} className="submit-btn" style={{ padding: '12px', background: 'linear-gradient(135deg, #fbb731 0%, #F37335 100%)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, color: '#1B2A49' }}>
                  {loading ? 'Verifying…' : 'Verify OTP'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={handleRequestOTP}
                    disabled={loading}
                    style={{ background: 'none', border: 'none', color: '#0C4C7B', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleCompleteReset} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="reset-password" style={{ fontWeight: 700, fontSize: '0.9rem' }}>New Password</label>
                  <input
                    type="password"
                    id="reset-password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="form-input"
                    style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="reset-confirm-password" style={{ fontWeight: 700, fontSize: '0.9rem' }}>Confirm Password</label>
                  <input
                    type="password"
                    id="reset-confirm-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="form-input"
                    style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
                <button type="submit" disabled={loading} className="submit-btn" style={{ padding: '12px', background: 'linear-gradient(135deg, #fbb731 0%, #F37335 100%)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, color: '#1B2A49' }}>
                  {loading ? 'Changing Password…' : 'Change Password'}
                </button>
              </form>
            )}

            <div className="signup-link" style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#666' }}>
              Back to <a href="/login" style={{ color: '#F37335', fontWeight: 700 }}>Login</a> or <a href="/admin/login" style={{ color: '#0C4C7B', fontWeight: 700 }}>Staff Portal</a>
            </div>
            <div className="home-link" style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.85rem' }}>
              <a href="/" style={{ color: '#888', textDecoration: 'none' }}><i className="fa fa-chevron-left" style={{ marginRight: '5px' }} /> Back to Home</a>
            </div>
          </div>
        </div>
      </main>
    </AuthLayout>
  );
}
