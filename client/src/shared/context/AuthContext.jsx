import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

const STAFF_ROLES = ['admin', 'employee', 'rider'];

export const AuthProvider = ({ children }) => {
  // Storefront customer session states
  const [customerUser, setCustomerUser] = useState(null);
  const [customerIsAuthenticated, setCustomerIsAuthenticated] = useState(false);

  // Staff (admin/employee/rider) session states
  const [staffUser, setStaffUser] = useState(null);
  const [staffIsAuthenticated, setStaffIsAuthenticated] = useState(false);

  const [loading, setLoading] = useState(true);

  const location = useLocation();

  // Initialize auth on mount
  useEffect(() => {
    const loadUsers = async () => {
      // 1. Try to load customer session
      try {
        const response = await api.get('/auth/me', {
          headers: { 'X-Session-Type': 'customer' }
        });
        const userData = response.data.user || response.data.data || null;
        if (userData && !STAFF_ROLES.includes(userData.role)) {
          setCustomerUser(userData);
          setCustomerIsAuthenticated(true);
          localStorage.setItem('pizzazone_user', JSON.stringify(userData));
        }
      } catch (error) {
        localStorage.removeItem('pizzazone_user');
        localStorage.removeItem('customerToken');
        setCustomerUser(null);
        setCustomerIsAuthenticated(false);
      }

      // 2. Try to load staff session
      try {
        const response = await api.get('/auth/me', {
          headers: { 'X-Session-Type': 'staff' }
        });
        const userData = response.data.user || response.data.data || null;
        if (userData && STAFF_ROLES.includes(userData.role)) {
          setStaffUser(userData);
          setStaffIsAuthenticated(true);
          sessionStorage.setItem('staffUser', JSON.stringify(userData));
          localStorage.removeItem('staffUser'); // Clean up old data
        }
      } catch (error) {
        sessionStorage.removeItem('staffUser');
        sessionStorage.removeItem('staffToken');
        localStorage.removeItem('staffUser'); // Clean up old data
        setStaffUser(null);
        setStaffIsAuthenticated(false);
      }

      setLoading(false);
    };

    loadUsers();
  }, []);

  const login = (userData, token) => {
    const isStaff = STAFF_ROLES.includes(userData?.role);
    if (isStaff) {
      sessionStorage.setItem('staffUser', JSON.stringify(userData));
      if (token) sessionStorage.setItem('staffToken', token);
      localStorage.removeItem('staffUser'); // Clean up old data
      setStaffUser(userData);
      setStaffIsAuthenticated(true);
    } else {
      localStorage.setItem('pizzazone_user', JSON.stringify(userData));
      if (token) localStorage.setItem('customerToken', token);
      setCustomerUser(userData);
      setCustomerIsAuthenticated(true);
    }
  };

  const logout = async () => {
    const isStaffRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/employee') || location.pathname.startsWith('/rider');
    
    // Call backend to clear cookie
    try {
      await api.post('/auth/logout', {}, {
        headers: { 'X-Session-Type': isStaffRoute ? 'staff' : 'customer' }
      });
    } catch (e) {
      console.error('Logout request failed', e);
    }

    if (isStaffRoute) {
      sessionStorage.removeItem('staffUser');
      sessionStorage.removeItem('staffToken');
      localStorage.removeItem('staffUser'); // Clean up old data
      setStaffUser(null);
      setStaffIsAuthenticated(false);
    } else {
      localStorage.removeItem('pizzazone_user');
      localStorage.removeItem('customerToken');
      setCustomerUser(null);
      setCustomerIsAuthenticated(false);
    }
  };

  const updateUser = (updatedUserData) => {
    const isStaff = STAFF_ROLES.includes(updatedUserData?.role);
    if (isStaff) {
      setStaffUser(updatedUserData);
      sessionStorage.setItem('staffUser', JSON.stringify(updatedUserData));
      localStorage.removeItem('staffUser'); // Clean up old data
    } else {
      setCustomerUser(updatedUserData);
      localStorage.setItem('pizzazone_user', JSON.stringify(updatedUserData));
    }
  };

  // Determine active context based on routing
  const isStaffRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/employee') || location.pathname.startsWith('/rider');

  const user = isStaffRoute ? staffUser : customerUser;
  const isAuthenticated = isStaffRoute ? staffIsAuthenticated : customerIsAuthenticated;

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
