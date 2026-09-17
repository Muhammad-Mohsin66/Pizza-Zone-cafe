import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { getNavSectionsForRole } from '../constants/navigation';
import api from '../../shared/services/api';
import './DashboardLayout.css';

/* ─── DashboardLayout ────────────────────────────────────────────────────────── */
const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [badges, setBadges] = useState({ orders: 0, stock: 0, notifications: 0 });
  const [currentOrderIds, setCurrentOrderIds] = useState([]);
  const [currentStockIds, setCurrentStockIds] = useState([]);
  
  const [seenOrderIds, setSeenOrderIds] = useState(() => JSON.parse(localStorage.getItem('seenOrderIds') || '[]'));
  const [seenStockIds, setSeenStockIds] = useState(() => JSON.parse(localStorage.getItem('seenStockIds') || '[]'));
  
  const { user, logout } = useAuth();
  const location = useLocation();

  const sections = getNavSectionsForRole(user?.role);

  // Compute page title from current path
  const currentPath = location.pathname;
  const allItems = sections.flatMap((s) => s.items);
  const currentItem = allItems.find((i) => i.path === currentPath);
  const pageTitle = currentItem?.label || 'Admin Panel';

  // Poll for badge counts every 60 s
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [orderRes, stockRes, notifRes] = await Promise.allSettled([
          api.get('/orders/admin/all?limit=50'),
          api.get('/inventory/alerts'),
          api.get('/notifications/unread/count'),
        ]);

        const pendingOrders = orderRes.status === 'fulfilled' 
          ? (orderRes.value.data?.data || []).filter(o => o.orderStatus === 'Pending') 
          : [];
        const pendingOrderIds = pendingOrders.map(o => o._id);
        setCurrentOrderIds(pendingOrderIds);

        const stockAlerts = stockRes.status === 'fulfilled' ? (stockRes.value.data?.data || []) : [];
        const stockAlertIds = stockAlerts.map(s => s._id);
        setCurrentStockIds(stockAlertIds);

        setBadges({
          orders: pendingOrders.filter(o => !seenOrderIds.includes(o._id)).length,
          stock: stockAlerts.filter(s => !seenStockIds.includes(s._id)).length,
          notifications: notifRes.status === 'fulfilled' ? notifRes.value.data?.data?.unreadCount || 0 : 0,
        });
      } catch {
        // Silently ignore
      }
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 30000); // 30s
    return () => clearInterval(interval);
  }, [seenOrderIds, seenStockIds]);

  // Update badge acknowledgements when navigating to respective screens
  useEffect(() => {
    if (location.pathname === '/admin/stock-alerts' && currentStockIds.length > 0) {
      const merged = Array.from(new Set([...seenStockIds, ...currentStockIds]));
      setSeenStockIds(merged);
      localStorage.setItem('seenStockIds', JSON.stringify(merged));
      setBadges((prev) => ({ ...prev, stock: 0 }));
    }
    if (location.pathname === '/admin/orders' && currentOrderIds.length > 0) {
      const merged = Array.from(new Set([...seenOrderIds, ...currentOrderIds]));
      setSeenOrderIds(merged);
      localStorage.setItem('seenOrderIds', JSON.stringify(merged));
      setBadges((prev) => ({ ...prev, orders: 0 }));
    }
    if (location.pathname === '/admin/notifications') {
      setBadges((prev) => ({ ...prev, notifications: 0 }));
    }
  }, [location.pathname, currentStockIds, currentOrderIds, seenStockIds, seenOrderIds]);

  const getBadgeValue = (badgeKey) => {
    if (!badgeKey) return 0;
    return badges[badgeKey] || 0;
  };

  return (
    <div className="ck-admin-root">
      {/* Mobile Backdrop */}
      <div 
        className={`ck-sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`ck-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Logo */}
        <div className="ck-sidebar-logo">
          <img src="/assets/images/pizza_zone_logo.jpg" alt="Pizza Zone & Cafe" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid white' }} />
          {sidebarOpen && (
            <div>
              <div className="ck-logo-text">Pizza Zone & Cafe</div>
              <div className="ck-logo-sub">Admin Panel</div>
            </div>
          )}
        </div>

        {/* Toggle */}
        <button
          className="ck-toggle"
          onClick={() => setSidebarOpen((v) => !v)}
          type="button"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? '‹' : '›'}
        </button>

        {/* Navigation */}
        <div className="ck-nav-scroll">
          {sections.map((section, si) => (
            <div key={si}>
              {si > 0 && <div className="ck-section-divider" />}
              {section.section && (
                <div className="ck-section-label">{section.section}</div>
              )}
              {section.items.map((item) => {
                const badgeVal = getBadgeValue(item.badge);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`ck-nav-item ${currentPath === item.path ? 'active' : ''}`}
                    onClick={() => {
                      if (window.innerWidth <= 768) setSidebarOpen(false);
                    }}
                  >
                    <span className="ck-nav-icon">{item.icon}</span>
                    <span className="ck-nav-label">{item.label}</span>
                    {badgeVal > 0 && (
                      <span className="ck-badge">{badgeVal > 99 ? '99+' : badgeVal}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User info */}
        <div className="ck-user-card">
          <div className="ck-avatar">{user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}</div>
          {sidebarOpen && (
            <div className="ck-user-info">
              <div className="ck-user-name">{user?.name || user?.email}</div>
              <div className="ck-user-role">{user?.role}</div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          type="button"
          className="ck-logout-btn"
        >
          <span>🚪</span>
          <span className="ck-logout-label">Logout</span>
        </button>
      </aside>

      {/* Main */}
      <main className={`ck-main ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Top bar */}
        <header className="ck-topbar">
          <button
            className="ck-mobile-hamburger"
            onClick={() => setSidebarOpen(true)}
            style={{ display: 'none', background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', marginRight: 12, color: '#1a1a1a' }}
          >
            ☰
          </button>
          <span className="ck-topbar-title">{pageTitle}</span>

          {badges.stock > 0 && (
            <Link to="/admin/stock-alerts" className="ck-topbar-badge alert">
              ⚠️ {badges.stock} Low Stock
            </Link>
          )}

          <div className="ck-topbar-user">
            <span style={{ fontSize: 12, color: '#999' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <div className="ck-topbar-avatar">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="ck-page-content">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
