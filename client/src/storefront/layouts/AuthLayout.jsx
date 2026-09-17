import React from 'react';

/**
 * AuthLayout — Clean, focused layout for authentication pages.
 * No storefront navbar, no footer. Only the auth content is rendered.
 */
const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout">
      {children}
    </div>
  );
};

export default AuthLayout;
