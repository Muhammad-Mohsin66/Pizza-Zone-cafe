import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
        <p style={textStyle}>
          © {currentYear} PIZZA ZONE & CAFÉ. All rights reserved.
        </p>
        <nav style={navStyle}>
          <a href="#" style={linkStyle}>
            Privacy
          </a>
          <a href="#" style={linkStyle}>
            Terms
          </a>
          <a href="#" style={linkStyle}>
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
};

const footerStyle = {
  backgroundColor: '#f8f9fa',
  borderTop: '1px solid #e9ecef',
  marginTop: 'auto',
  padding: '2rem 0',
};

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 1rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const textStyle = {
  margin: 0,
  color: '#6c757d',
};

const navStyle = {
  display: 'flex',
  gap: '1.5rem',
};

const linkStyle = {
  textDecoration: 'none',
  color: '#007bff',
  cursor: 'pointer',
};

export default Footer;
