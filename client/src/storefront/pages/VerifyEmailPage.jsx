import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { verifyEmail } from '../utils/api';
import '../styles/Auth.css';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ success: false, message: '' });

  const token = searchParams.get('token');

  useEffect(() => {
    let isMounted = true;

    async function triggerVerification() {
      if (!token) {
        if (isMounted) {
          setStatus({
            success: false,
            message: 'No verification token was found. Please check your verification link.',
          });
          setLoading(false);
        }
        return;
      }

      try {
        const data = await verifyEmail(token);
        if (isMounted) {
          if (data.success) {
            setStatus({
              success: true,
              message: data.message || 'Your email has been verified successfully!',
            });
          } else {
            setStatus({
              success: false,
              message: data.message || 'Invalid or expired verification token.',
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          setStatus({
            success: false,
            message: err.message || 'An error occurred during verification. Please try again.',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    triggerVerification();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <AuthLayout>
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-wrapper">
          <div className="auth-card" style={{ maxWidth: '480px', padding: '40px 30px', textAlign: 'center' }}>
            <div className="auth-header" style={{ marginBottom: '24px' }}>
              <img
                src="/assets/images/2020/12/Logo_light1.svg"
                alt="Pizza Zone & Cafe"
                className="auth-logo"
                style={{ maxHeight: '48px', marginBottom: '15px' }}
              />
              <h1>Email Verification</h1>
            </div>

            <div style={{ margin: '30px 0', minHeight: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {loading ? (
                <>
                  <div className="verify-spinner" style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid rgba(243, 115, 53, 0.1)',
                    borderTop: '4px solid #F37335',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '20px'
                  }} />
                  <p style={{ fontSize: '1.1rem', color: '#666', fontWeight: 600 }}>Verifying your email address, please wait...</p>
                </>
              ) : status.success ? (
                <>
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    backgroundColor: '#d4edda',
                    color: '#28a745',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    marginBottom: '20px',
                    border: '2px solid #28a745',
                    boxShadow: '0 4px 10px rgba(40, 167, 69, 0.2)'
                  }}>
                    ✓
                  </div>
                  <p style={{ fontSize: '1.15rem', color: '#155724', fontWeight: 700, marginBottom: '10px' }}>
                    Verification Successful!
                  </p>
                  <p style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.5' }}>
                    {status.message}
                  </p>
                </>
              ) : (
                <>
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    backgroundColor: '#f8d7da',
                    color: '#dc3545',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    marginBottom: '20px',
                    border: '2px solid #dc3545',
                    boxShadow: '0 4px 10px rgba(220, 53, 69, 0.2)'
                  }}>
                    ✗
                  </div>
                  <p style={{ fontSize: '1.15rem', color: '#721c24', fontWeight: 700, marginBottom: '10px' }}>
                    Verification Failed
                  </p>
                  <p style={{ fontSize: '0.95rem', color: '#721c24', lineHeight: '1.5' }}>
                    {status.message}
                  </p>
                </>
              )}
            </div>

            {!loading && (
              <div style={{ marginTop: '20px' }}>
                {status.success ? (
                  <button
                    onClick={() => navigate('/login')}
                    className="submit-btn"
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #fbb731 0%, #F37335 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 800,
                      color: '#1B2A49',
                      width: '100%',
                      boxShadow: '0 4px 15px rgba(243, 115, 53, 0.3)',
                      transition: 'all 0.2s'
                    }}
                  >
                    Login to Your Account
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/signup')}
                    className="submit-btn"
                    style={{
                      padding: '12px 24px',
                      background: '#0C4C7B',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 800,
                      color: '#fff',
                      width: '100%',
                      transition: 'all 0.2s'
                    }}
                  >
                    Back to Sign Up
                  </button>
                )}
              </div>
            )}

            <div className="home-link" style={{ textAlign: 'center', marginTop: '25px', fontSize: '0.85rem' }}>
              <a href="/" style={{ color: '#888', textDecoration: 'none' }}>
                <i className="fa fa-chevron-left" style={{ marginRight: '5px' }} /> Back to Home
              </a>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    </AuthLayout>
  );
}
