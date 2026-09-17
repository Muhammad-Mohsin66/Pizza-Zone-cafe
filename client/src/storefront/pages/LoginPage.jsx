import React, { useState } from 'react';
import AuthLayout from '../layouts/AuthLayout';
import { useLoginPage } from '../hooks/pageHooks';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    status,
    onSubmit,
    checkoutNotice,
    fromCheckout,
  } = useLoginPage();

  return (
    <AuthLayout>
      <style>{`
        .password-input-wrapper {
          position: relative;
          width: 100%;
        }
        .password-input-wrapper input {
          padding-right: 40px !important;
        }
        .password-toggle-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
          color: #777;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          outline: none;
          z-index: 10;
        }
        .password-toggle-btn:hover {
          color: #F37335;
        }
      `}</style>
      <main>
        <div className="auth-wrapper">
          <div className="auth-card">
            <div className="auth-header">
              <img src="assets/images/2020/12/Logo_light1.svg" alt="Pizza Zone & Cafe" className="auth-logo" />
              <h1>Welcome Back!</h1>
              <p>Login to your Pizza Zone & Cafe account</p>
            </div>
            {checkoutNotice ? (
              <div
                id="checkout-auth-notice"
                style={{ display: 'block', backgroundColor: '#fff3e0', color: '#e65100', marginBottom: '16px', padding: '12px', borderRadius: '6px' }}
              >
                {checkoutNotice}
              </div>
            ) : null}
            <form id="login-form" method="post" action="#" onSubmit={onSubmit}>
              <div className="form-group">
                <label htmlFor="login-email">Email Address</label>
                <input type="email" id="login-email" name="email" placeholder="your@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <div className="password-input-wrapper">
                  <input type={showPassword ? 'text' : 'password'} id="login-password" name="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="remember-forgot">
                <label className="ck-remember-label">
                  <input type="checkbox" name="remember" id="remember-me" className="ck-mr-5" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Remember me
                </label>
                <a href="/forgot-password">Forgot password?</a>
              </div>
              <div id="form-status" style={{ display: status.message ? 'block' : 'none', backgroundColor: status.bg, color: status.color }}>
                {status.message}
              </div>
              <button type="submit" className="submit-btn">Login Now</button>
            </form>
            <div className="signup-link">
              Don't have an account? <a href={fromCheckout ? '/signup?from=checkout' : '/signup'}>Sign up here</a>
            </div>
            <div className="home-link">
              <a href="/"><i className="fa fa-chevron-left ck-mr-5" /> Back to Home</a>
            </div>
          </div>
        </div>
      </main>
    </AuthLayout>
  );
}
