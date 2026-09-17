import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

/**
 * AdminGuard — Staff-only route protection.
 * Ensures only authorized internal roles can access admin panel routes.
 */
export default function AdminGuard({ children, allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles} loginPath="/admin/login">
      {children}
    </ProtectedRoute>
  );
}
