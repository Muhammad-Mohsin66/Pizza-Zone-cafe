import { Route, Routes, Navigate } from 'react-router-dom';
import AdminGuard from '../shared/guards/AdminGuard';
import Unauthorized from '../shared/components/Unauthorized';
import DashboardLayout from './layouts/DashboardLayout';

// Existing pages
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import OrdersManagement from './pages/OrdersManagement';
import RiderDeliveries from './pages/RiderDeliveries';
import Dashboard from './pages/Dashboard';

// New module pages
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import DealsPage from './pages/DealsPage';
import InventoryPage from './pages/InventoryPage';
import StockAlertsPage from './pages/StockAlertsPage';
import InventoryLogsPage from './pages/InventoryLogsPage';
import RefundsPage from './pages/RefundsPage';
import PaymentsPage from './pages/PaymentsPage';
import CustomersPage from './pages/CustomersPage';
import NotificationsPage from './pages/NotificationsPage';
import RidersPage from './pages/RidersPage';
import DeliveryZonesPage from './pages/DeliveryZonesPage';
import EmployeesPage from './pages/EmployeesPage';
import BankAccountsPage from './pages/BankAccountsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';

const withLayout = (element) => (
  <DashboardLayout>{element}</DashboardLayout>
);

/**
 * AdminRoutes — Mounted at /admin/* in App.jsx.
 */
export function AdminRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route index element={<AdminLoginPage />} />
      <Route path="login" element={<AdminLoginPage />} />

      {/* ── Main ── */}
      <Route path="dashboard" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<AdminDashboard />)}</AdminGuard>} />

      {/* ── Orders & Billing ── */}
      <Route path="orders" element={<AdminGuard allowedRoles={['admin', 'employee']}>{withLayout(<OrdersManagement />)}</AdminGuard>} />
      <Route path="payments" element={<AdminGuard allowedRoles={['admin', 'employee']}>{withLayout(<PaymentsPage />)}</AdminGuard>} />
      <Route path="refunds" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<RefundsPage />)}</AdminGuard>} />

      {/* ── Catalog ── */}
      <Route path="products" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<ProductsPage />)}</AdminGuard>} />
      <Route path="categories" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<CategoriesPage />)}</AdminGuard>} />
      <Route path="deals" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<DealsPage />)}</AdminGuard>} />

      {/* ── Inventory ── */}
      <Route path="inventory" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<InventoryPage />)}</AdminGuard>} />
      <Route path="stock-alerts" element={<AdminGuard allowedRoles={['admin', 'employee']}>{withLayout(<StockAlertsPage />)}</AdminGuard>} />
      <Route path="inventory-logs" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<InventoryLogsPage />)}</AdminGuard>} />

      {/* ── Customers ── */}
      <Route path="customers" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<CustomersPage />)}</AdminGuard>} />
      <Route path="notifications" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<NotificationsPage />)}</AdminGuard>} />

      {/* ── Delivery ── */}
      <Route path="deliveries" element={<AdminGuard allowedRoles={['admin', 'employee']}>{withLayout(<RiderDeliveries />)}</AdminGuard>} />
      <Route path="riders" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<RidersPage />)}</AdminGuard>} />
      <Route path="delivery-zones" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<DeliveryZonesPage />)}</AdminGuard>} />

      {/* ── Staff ── */}
      <Route path="employees" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<EmployeesPage />)}</AdminGuard>} />

      {/* ── Finance ── */}
      <Route path="bank-accounts" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<BankAccountsPage />)}</AdminGuard>} />
      <Route path="reports" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<ReportsPage />)}</AdminGuard>} />

      {/* ── Administration ── */}
      <Route path="users" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<UsersPage />)}</AdminGuard>} />
      <Route path="audit-logs" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<AuditLogsPage />)}</AdminGuard>} />
      <Route path="settings" element={<AdminGuard allowedRoles={['admin']}>{withLayout(<SettingsPage />)}</AdminGuard>} />

      {/* stock alias */}
      <Route path="stock" element={<Navigate to="/admin/inventory" replace />} />

      <Route path="*" element={<Unauthorized />} />
    </Routes>
  );
}

/**
 * EmployeeRoutes — Mounted at /employee/* in App.jsx.
 */
export function EmployeeRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<AdminGuard allowedRoles={['employee', 'admin']}>{withLayout(<Dashboard />)}</AdminGuard>} />
      <Route path="orders" element={<AdminGuard allowedRoles={['employee', 'admin']}>{withLayout(<OrdersManagement />)}</AdminGuard>} />
      <Route path="payments" element={<AdminGuard allowedRoles={['employee', 'admin']}>{withLayout(<PaymentsPage />)}</AdminGuard>} />
      <Route index element={<Navigate to="/employee/dashboard" replace />} />
      <Route path="*" element={<Unauthorized />} />
    </Routes>
  );
}

/**
 * RiderRoutes — Mounted at /rider/* in App.jsx.
 */
export function RiderRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<AdminGuard allowedRoles={['rider', 'admin']}>{withLayout(<Dashboard />)}</AdminGuard>} />
      <Route path="deliveries" element={<AdminGuard allowedRoles={['rider', 'admin']}>{withLayout(<RiderDeliveries />)}</AdminGuard>} />
      <Route index element={<Navigate to="/rider/dashboard" replace />} />
      <Route path="*" element={<Unauthorized />} />
    </Routes>
  );
}

export default AdminRoutes;
