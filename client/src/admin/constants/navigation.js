/**
 * Admin panel navigation — grouped sections with 21 modules.
 * Used by DashboardLayout to build the collapsible sidebar.
 */

export const NAV_SECTIONS = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    ],
  },
  {
    section: 'Orders & Billing',
    items: [
      { label: 'Orders', path: '/admin/orders', icon: '🛒', badge: 'orders' },
      { label: 'Payments', path: '/admin/payments', icon: '💳' },
      { label: 'Refunds', path: '/admin/refunds', icon: '↩️' },
    ],
  },
  {
    section: 'Catalog',
    items: [
      { label: 'Products', path: '/admin/products', icon: '🍔' },
      { label: 'Categories', path: '/admin/categories', icon: '🏷️' },
      { label: 'Deals & Promos', path: '/admin/deals', icon: '🎁' },
    ],
  },
  {
    section: 'Inventory',
    items: [
      { label: 'Stock Levels', path: '/admin/inventory', icon: '📦' },
      { label: 'Stock Alerts', path: '/admin/stock-alerts', icon: '⚠️', badge: 'stock' },
      { label: 'Inventory Logs', path: '/admin/inventory-logs', icon: '📋' },
    ],
  },
  {
    section: 'Customers',
    items: [
      { label: 'Customers', path: '/admin/customers', icon: '👤' },
      { label: 'Notifications', path: '/admin/notifications', icon: '🔔', badge: 'notifications' },
    ],
  },
  {
    section: 'Delivery',
    items: [
      { label: 'Deliveries', path: '/admin/deliveries', icon: '🚴' },
      { label: 'Riders', path: '/admin/riders', icon: '🏍️' },
      { label: 'Delivery Zones', path: '/admin/delivery-zones', icon: '📍' },
    ],
  },
  {
    section: 'Staff',
    items: [
      { label: 'Employees', path: '/admin/employees', icon: '👥' },
    ],
  },
  {
    section: 'Finance',
    items: [
      { label: 'Bank Accounts', path: '/admin/bank-accounts', icon: '🏦' },
      { label: 'Reports', path: '/admin/reports', icon: '📈' },
    ],
  },
  {
    section: 'Administration',
    items: [
      { label: 'User Accounts', path: '/admin/users', icon: '🔑' },
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: '🛡️' },
      { label: 'Settings', path: '/admin/settings', icon: '⚙️' },
    ],
  },
];

// Flat list for role menus
export const ADMIN_MENU = NAV_SECTIONS.flatMap((s) => s.items);

export const EMPLOYEE_MENU = [
  { label: 'Dashboard', path: '/employee/dashboard', icon: '📊' },
  { label: 'Orders', path: '/employee/orders', icon: '🛒' },
  { label: 'Payments', path: '/employee/payments', icon: '💳' },
];

export const RIDER_MENU = [
  { label: 'Dashboard', path: '/rider/dashboard', icon: '📊' },
  { label: 'Deliveries', path: '/rider/deliveries', icon: '🚴' },
];

export function getMenuItemsForRole(role) {
  switch (role) {
    case 'admin':
      return ADMIN_MENU;
    case 'employee':
      return EMPLOYEE_MENU;
    case 'rider':
      return RIDER_MENU;
    default:
      return [];
  }
}

export function getNavSectionsForRole(role) {
  if (role === 'admin') return NAV_SECTIONS;
  if (role === 'employee') return [{ section: '', items: EMPLOYEE_MENU }];
  if (role === 'rider') return [{ section: '', items: RIDER_MENU }];
  return [];
}
