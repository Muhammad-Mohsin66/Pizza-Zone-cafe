import { Link, useSearchParams } from 'react-router-dom';

/**
 * Order confirmation — shown after successful checkout.
 * Uses existing auth/card visual language without redesigning the storefront.
 */
export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || searchParams.get('id') || '';

  return (
    <div className="page-root">
      <main>
        <div className="auth-wrapper">
          <div className="auth-card">
            <div className="auth-header">
              <img src="assets/images/2020/12/Logo_light1.svg" alt="Pizza Zone & Cafe" className="auth-logo" />
              <h1>Order Confirmed!</h1>
              <p>Thank you for ordering from Pizza Zone & Cafe.</p>
            </div>

            <div
              id="form-status"
              style={{
                display: 'block',
                backgroundColor: '#c8e6c9',
                color: '#1B2A49',
                marginBottom: '20px',
              }}
            >
              {orderId
                ? `Your order has been placed successfully. Order ID: ${orderId}`
                : 'Your order has been placed successfully.'}
            </div>

            <p style={{ textAlign: 'center', marginBottom: '24px', color: '#666' }}>
              You can track your order status anytime from your account.
            </p>

            <Link to="/orders" className="submit-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              View Order History
            </Link>

            <div className="home-link" style={{ marginTop: '16px' }}>
              <Link to="/shop"><i className="fa fa-chevron-left ck-mr-5" /> Continue Shopping</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
