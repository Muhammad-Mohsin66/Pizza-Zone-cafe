import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="logo">
          <span className="logo-icon">🍕</span>
          <span className="logo-text">PIZZA ZONE & CAFÉ</span>
        </Link>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation */}
        <nav className={`nav ${mobileMenuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <Link to="/menu" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
            Menu
          </Link>
          <Link to="/cart" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
            Cart 🛒
          </Link>

          {user?.role === 'customer' && (
            <Link to="/dashboard" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </Link>
          )}
        </nav>

        {/* User Section */}
        <div className="user-section">
          {user ? (
            <div className="user-menu">
              <span className="welcome">👤 {user.name}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="btn-login">
                Login
              </Link>
              <Link to="/register" className="btn-register">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
