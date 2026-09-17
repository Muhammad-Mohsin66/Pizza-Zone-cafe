import { Route, Routes, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import StorefrontGuard from '../shared/guards/StorefrontGuard';
import { useAuth } from '../shared/context/AuthContext';
import NotificationBell from '../shared/components/NotificationBell';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import CustomerOrders from './pages/CustomerOrders';
import NotificationsPage from './pages/NotificationsPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import CheckoutAuthRedirect from './components/CheckoutAuthRedirect';
import {
  useBodyClass,
  useGlobalStyles,
  useHamburgerToggle,
  useLegacyLinkInterceptor,
  useNavLabelNormalization,
  useNavbarProfile,
  usePreventRefreshMonitor,
  useScrollTopButton,
} from './hooks';

function RouteFrame({ bodyClass, title, disableNavEnhancements = false, children }) {
  useGlobalStyles();
  useBodyClass(bodyClass);
  useLegacyLinkInterceptor();
  useHamburgerToggle();
  useNavLabelNormalization(!disableNavEnhancements);
  useNavbarProfile(!disableNavEnhancements);
  useScrollTopButton();
  usePreventRefreshMonitor();

  const location = useLocation();

  useEffect(() => {
    document.title = title;
  }, [title]);

  return <div key={location.pathname}>{children}</div>;
}

const NavbarBellPortal = () => {
  const [container, setContainer] = useState(null);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setContainer(null);
      return;
    }

    const findContainer = () => {
      const el = document.getElementById('navbar-bell-container');
      if (el && el !== container) {
        setContainer(el);
      } else if (!el && container) {
        setContainer(null);
      }
    };

    findContainer();
    // Poll the DOM for the container to handle route transitions
    const interval = setInterval(findContainer, 200);

    return () => clearInterval(interval);
  }, [isAuthenticated, container, location.pathname]);

  if (!isAuthenticated || !container) return null;
  return createPortal(<NotificationBell />, container);
};

/**
 * StorefrontRoutes — Customer-facing module only.
 * No admin, inventory, or internal business operations.
 */
export default function StorefrontRoutes() {
  return (
    <>
      <NavbarBellPortal />
      <Routes>
      {/* Public */}
      <Route
        path="/"
        element={
          <RouteFrame
            bodyClass="home wp-singular page-template page-template-templates page-template-page-full page-template-templatespage-full-php page page-id-2493 wp-embed-responsive wp-theme-cheezka theme-cheezka woocommerce-no-js lines singular enable-search-modal missing-post-thumbnail has-no-pagination not-showing-comments show-avatars page-full footer-top-visible elementor-default elementor-kit-10 elementor-page elementor-page-2493"
            title="Pizza Zone & Cafe"
          >
            <HomePage />
          </RouteFrame>
        }
      />
      <Route
        path="/shop"
        element={
          <RouteFrame bodyClass="page lines" title="Shop / Menu – Pizza Zone & Cafe">
            <ShopPage />
          </RouteFrame>
        }
      />
      <Route
        path="/about"
        element={
          <RouteFrame bodyClass="page lines" title="About Us – Pizza Zone & Cafe">
            <AboutPage />
          </RouteFrame>
        }
      />
      <Route
        path="/contact"
        element={
          <RouteFrame bodyClass="page lines" title="Contact Us – Pizza Zone & Cafe">
            <ContactPage />
          </RouteFrame>
        }
      />

      {/* Auth */}
      <Route
        path="/login"
        element={
          <RouteFrame bodyClass="auth-page" title="Login – Pizza Zone & Cafe" disableNavEnhancements>
            <LoginPage />
          </RouteFrame>
        }
      />
      <Route
        path="/signup"
        element={
          <RouteFrame bodyClass="auth-page" title="Sign Up – Pizza Zone & Cafe" disableNavEnhancements>
            <SignupPage />
          </RouteFrame>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <RouteFrame bodyClass="auth-page" title="Forgot Password – Pizza Zone & Cafe" disableNavEnhancements>
            <ForgotPasswordPage />
          </RouteFrame>
        }
      />
      <Route
        path="/verify-email"
        element={
          <RouteFrame bodyClass="auth-page" title="Verify Email – Pizza Zone & Cafe" disableNavEnhancements>
            <VerifyEmailPage />
          </RouteFrame>
        }
      />

      {/* Customer authenticated */}
      <Route
        path="/dashboard"
        element={
          <StorefrontGuard>
            <RouteFrame bodyClass="page lines" title="Dashboard – Pizza Zone & Cafe">
              <DashboardPage />
            </RouteFrame>
          </StorefrontGuard>
        }
      />
      <Route
        path="/orders"
        element={
          <StorefrontGuard>
            <RouteFrame bodyClass="page lines" title="My Orders – Pizza Zone & Cafe">
              <OrdersPage />
            </RouteFrame>
          </StorefrontGuard>
        }
      />
      <Route
        path="/orders/:orderId/track"
        element={
          <StorefrontGuard>
            <RouteFrame bodyClass="page lines" title="Track Order – Pizza Zone & Cafe">
              <OrderTrackingPage />
            </RouteFrame>
          </StorefrontGuard>
        }
      />
      <Route
        path="/customer/orders"
        element={
          <StorefrontGuard>
            <RouteFrame bodyClass="page lines" title="My Orders – Pizza Zone & Cafe">
              <CustomerOrders />
            </RouteFrame>
          </StorefrontGuard>
        }
      />
      <Route
        path="/notifications"
        element={
          <StorefrontGuard>
            <RouteFrame bodyClass="page lines" title="Notifications – Pizza Zone & Cafe">
              <NotificationsPage />
            </RouteFrame>
          </StorefrontGuard>
        }
      />

      {/* Checkout — auth required only at this step */}
      <Route
        path="/checkout"
        element={
          <RouteFrame bodyClass="page lines" title="Checkout – Pizza Zone & Cafe">
            <CheckoutAuthRedirect />
          </RouteFrame>
        }
      />

      {/* Order confirmation */}
      <Route
        path="/order-confirmation"
        element={
          <StorefrontGuard>
            <RouteFrame bodyClass="auth-page" title="Order Confirmed – Pizza Zone & Cafe" disableNavEnhancements>
              <OrderConfirmationPage />
            </RouteFrame>
          </StorefrontGuard>
        }
      />

      {/* Legacy path redirects */}
      <Route path="/menu" element={<Navigate to="/shop" replace />} />
      <Route path="/cart" element={<Navigate to="/shop?cart=1" replace />} />
      <Route path="/register" element={<Navigate to="/signup" replace />} />

      {/* Legacy HTML redirects */}
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="/index_clean.html" element={<Navigate to="/" replace />} />
      <Route path="/shop.html" element={<Navigate to="/shop" replace />} />
      <Route path="/about.html" element={<Navigate to="/about" replace />} />
      <Route path="/contact.html" element={<Navigate to="/contact" replace />} />
      <Route path="/pages.html" element={<Navigate to="/" replace />} />
      <Route path="/login.html" element={<Navigate to="/login" replace />} />
      <Route path="/signup.html" element={<Navigate to="/signup" replace />} />
      <Route path="/dashboard.html" element={<Navigate to="/dashboard" replace />} />
      <Route path="/orders.html" element={<Navigate to="/orders" replace />} />

      {/* Block admin paths from storefront router */}
      <Route path="/admin/*" element={<Navigate to="/unauthorized" replace />} />
      <Route path="/employee/*" element={<Navigate to="/unauthorized" replace />} />
      <Route path="/rider/*" element={<Navigate to="/unauthorized" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
