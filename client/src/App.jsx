import './index.css';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './shared/context/AuthContext';
import { AdminRoutes, EmployeeRoutes, RiderRoutes } from './admin/routes';
import StorefrontRoutes from './storefront/routes';
import Unauthorized from './shared/components/Unauthorized';

/**
 * App — Root router with fully isolated modules:
 *  • /admin/*    → Admin panel (admin role)
 *  • /employee/* → Employee panel
 *  • /rider/*    → Rider panel
 *  • /*          → Storefront (customer-facing)
 */
export default function App() {
  const hostname = window.location.hostname;
  const isStaffSubdomain = hostname.startsWith('admin.') || hostname.startsWith('employee.') || hostname.startsWith('rider.');

  return (
    <AuthProvider>
      <Routes>
        {isStaffSubdomain && <Route path="/" element={<Navigate to="/admin/login" replace />} />}
        
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/employee/*" element={<EmployeeRoutes />} />
        <Route path="/rider/*" element={<RiderRoutes />} />

        <Route path="/*" element={<StorefrontRoutes />} />
      </Routes>
    </AuthProvider>
  );
}
