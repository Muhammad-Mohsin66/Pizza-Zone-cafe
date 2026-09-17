import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import CheckoutPage from '../pages/CheckoutPage';
import {
  CHECKOUT_AUTH_MESSAGE,
  saveCheckoutReturnPath,
} from '../utils/checkoutAuth';

/**
 * Redirects unauthenticated users to login before checkout.
 * Authenticated customers proceed to the dedicated Checkout page.
 */
export default function CheckoutAuthRedirect() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      saveCheckoutReturnPath('/checkout');
      navigate('/login?from=checkout', {
        replace: true,
        state: { message: CHECKOUT_AUTH_MESSAGE },
      });
      return;
    }

    if (user?.role !== 'customer') {
      navigate('/unauthorized', { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  if (loading) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p>Loading…</p>
      </div>
    );
  }

  if (isAuthenticated && user?.role === 'customer') {
    return <CheckoutPage />;
  }

  return null;
}
