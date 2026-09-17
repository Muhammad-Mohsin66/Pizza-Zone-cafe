import React from 'react';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

const STAFF_ROLES = ['admin', 'employee', 'rider'];

/**
 * StorefrontGuard — Customer-only route protection.
 * Blocks staff accounts from customer account pages.
 */
export default function StorefrontGuard({ children, requireAuth = true }) {
  if (!requireAuth) {
    return children;
  }

  return (
    <ProtectedRoute
      allowedRoles={['customer', 'admin']}
      fallbackForWrongRole={
        <Navigate to="/unauthorized" replace state={{ from: 'storefront' }} />
      }
    >
      {children}
    </ProtectedRoute>
  );
}

export { STAFF_ROLES };
