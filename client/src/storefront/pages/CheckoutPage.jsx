import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { getCart, setCart as persistCart, clearCart } from '../utils/cart';
import { createOrder } from '../utils/api';
import api from '../../shared/services/api';
import '../styles/Checkout.css';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [cart, setCartState] = useState(() => getCart());
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'Cash on Delivery',
    notes: '',
  });
  const [status, setStatus] = useState({ message: '', error: false });
  const [placing, setPlacing] = useState(false);
  const notesRef = React.useRef(null);

  // Delivery Zones dynamic integration states
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [settings, setSettings] = useState({ TAX_PERCENTAGE: 5, MIN_ORDER_VALUE: 0 });

  // Pre-populate user details when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [isAuthenticated, user]);

  // Read saved checkout form entries
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('pizzazone_checkout_form') || '{}');
      if (saved) {
        setForm((prev) => ({
          ...prev,
          name: prev.name || saved.name || '',
          phone: prev.phone || saved.phone || '',
          address: prev.address || saved.address || '',
          paymentMethod: prev.paymentMethod || saved.paymentMethod || 'Cash on Delivery',
          notes: prev.notes || saved.notes || '',
        }));
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  // Fetch active delivery zones on mount
  useEffect(() => {
    const fetchZonesAndBanks = async () => {
      try {
        const [zoneRes, bankRes, settingsRes] = await Promise.all([
          api.get('/delivery-zones'),
          api.get('/bank-accounts'),
          api.get('/settings/public')
        ]);
        
        const activeZones = (zoneRes.data?.data || []).filter((z) => z.isActive);
        setDeliveryZones(activeZones);
        if (activeZones.length > 0) {
          setSelectedZoneId(activeZones[0]._id);
        }

        setBankAccounts(bankRes.data?.data || []);
        
        if (settingsRes.data?.success) {
          setSettings((prev) => ({ ...prev, ...settingsRes.data.data }));
        }
      } catch (err) {
        console.error('Error fetching checkout data:', err);
      }
    };
    fetchZonesAndBanks();
  }, []);

  // Auto-resize notes textarea
  useEffect(() => {
    if (notesRef.current) {
      notesRef.current.style.height = '38px';
      notesRef.current.style.height = `${notesRef.current.scrollHeight}px`;
    }
  }, [form.notes]);

  // Sync state changes with localStorage
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      localStorage.setItem('pizzazone_checkout_form', JSON.stringify(next));
      return next;
    });
  };

  const updateCart = (updater) => {
    setCartState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persistCart(next);
      // Dispatch storage event to notify other components/Header of changes
      window.dispatchEvent(new Event('storage'));
      return next;
    });
  };

  const handleQtyChange = (index, action) => {
    updateCart((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;

      if (action === 'plus') {
        next[index] = { ...next[index], qty: next[index].qty + 1 };
      } else if (action === 'minus') {
        next[index] = { ...next[index], qty: next[index].qty - 1 };
      }

      if (action === 'remove' || next[index].qty <= 0) {
        next.splice(index, 1);
      }

      return next;
    });
  };

  // Pricing calculations (dynamic using active delivery zone base charge)
  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  const selectedZone = deliveryZones.find((z) => z._id === selectedZoneId);
  const fallbackCharge = settings.DELIVERY_BASE_CHARGE !== undefined ? Number(settings.DELIVERY_BASE_CHARGE) : 100;
  const deliveryFee = selectedZone ? selectedZone.baseCharge : fallbackCharge;
  const taxRate = settings.TAX_PERCENTAGE / 100;
  const tax = Math.round(subtotal * taxRate);
  const grandTotal = subtotal + deliveryFee + tax;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cart.length) {
      setStatus({ message: 'Your cart is empty. Add items first.', error: true });
      return;
    }

    if (settings.MIN_ORDER_VALUE > 0 && subtotal < settings.MIN_ORDER_VALUE) {
      setStatus({ message: `Minimum order value is Rs. ${settings.MIN_ORDER_VALUE}. Please add more items.`, error: true });
      return;
    }

    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setStatus({ message: 'Please fill name, phone, and address.', error: true });
      return;
    }

    setPlacing(true);
    setStatus({ message: '', error: false });

    try {
      // Normalize payment method for backend validation (Online or COD)
      const mappedPaymentMethod = form.paymentMethod === 'Online Payment' ? 'Online' : 'COD';

      // Map sizes matching backend schemas ('S', 'M', 'L', 'XL')
      const mappedItems = cart.map((item) => {
        let normalizedSize = 'M';
        if (item.size === 'S' || item.size === 'Single') normalizedSize = 'S';
        else if (item.size === 'M' || item.size === 'Regular') normalizedSize = 'M';
        else if (item.size === 'L' || item.size === 'Large') normalizedSize = 'L';
        else if (item.size === 'XL') normalizedSize = 'XL';

        return {
          product: item.product || undefined,
          name: item.name,
          size: normalizedSize,
          quantity: item.qty,
          price: item.price,
        };
      });

      // Normalize phone format into strict 11 digits
      let normalizedPhone = form.phone.replace(/[^0-9]/g, '');
      if (normalizedPhone.length > 11) normalizedPhone = normalizedPhone.slice(-11);
      else if (normalizedPhone.length < 11) normalizedPhone = normalizedPhone.padStart(11, '0');

      const savedOrder = await createOrder({
        orderItems: mappedItems,
        shippingAddress: `${selectedZone ? `[Zone: ${selectedZone.name}] ` : ''}${form.address.trim()}`,
        phoneNumber: normalizedPhone,
        paymentMethod: mappedPaymentMethod,
        deliveryCharge: deliveryFee,
        notes: form.notes.trim(),
      });

      const orderId = savedOrder?._id || savedOrder?.data?._id || savedOrder?.order_id || '';
      clearCart();
      localStorage.removeItem('pizzazone_checkout_form');
      updateCart([]);
      navigate(orderId ? `/order-confirmation?orderId=${encodeURIComponent(orderId)}` : '/order-confirmation');
    } catch (err) {
      setStatus({ message: `Order placement failed: ${err.message}`, error: true });
    } finally {
      setPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="checkout-container text-center" style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <i className="fa fa-shopping-basket" style={{ fontSize: '3.5rem', color: '#fbb731', marginBottom: '20px' }}></i>
          <h2 style={{ fontFamily: 'Nunito Sans, sans-serif', color: '#1B2A49', fontWeight: 800 }}>Your Cart is Empty</h2>
          <p style={{ color: '#666', margin: '15px 0 25px' }}>Add delicious street food to your cart before checking out!</p>
          <button onClick={() => navigate('/shop')} className="btn-place-order" style={{ display: 'inline-block', width: 'auto', padding: '12px 30px' }}>
            Go to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header" style={{ background: 'linear-gradient(135deg, #0C4C7B 0%, #1B2A49 100%)' }}>
        <h1>Checkout</h1>
        <p>Review your items and complete billing details</p>
      </div>

      <div className="checkout-layout">
        {/* Left: Cart Items Review */}
        <div className="summary-section" style={{ position: 'static' }}>
          <div className="order-summary-box" style={{ borderTop: '4px solid #fbb731' }}>
            <h2 style={{ fontFamily: 'Nunito Sans, sans-serif', fontWeight: 800, color: '#1B2A49' }}>
              <i className="fa fa-shopping-basket" style={{ marginRight: '8px', color: '#fbb731' }}></i>
              Review Your Items
            </h2>

            <div className="checkout-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="checkout-item-card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 15px',
                    border: '1px solid #eef0f4',
                    borderRadius: '8px',
                    background: '#f9f9f9',
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#1B2A49' }}>{item.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#fbb731', fontWeight: 700 }}>Size: {item.size || 'Regular'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div className="qty-controls" style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #ddd', borderRadius: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(index, 'minus')}
                        style={{ background: 'none', border: 'none', padding: '4px 10px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <span style={{ padding: '0 5px', minWidth: '20px', textAlign: 'center', fontSize: '0.9rem' }}>{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(index, 'plus')}
                        style={{ background: 'none', border: 'none', padding: '4px 10px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>

                    <span style={{ fontWeight: 700, color: '#0C4C7B', fontSize: '0.95rem', minWidth: '70px', textAlign: 'right' }}>
                      Rs. {item.qty * item.price}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleQtyChange(index, 'remove')}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem' }}
                      title="Remove Item"
                    >
                      <i className="fa fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-breakdown" style={{ background: '#f5f7fa', padding: '15px', borderRadius: '8px' }}>
              <div className="breakdown-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eef0f4' }}>
                <span>Subtotal</span>
                <strong>Rs. {subtotal}</strong>
              </div>
              <div className="breakdown-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eef0f4' }}>
                <span>Delivery Fee</span>
                <strong>{deliveryFee === 0 ? 'Free' : `Rs. ${deliveryFee}`}</strong>
              </div>
              <div className="breakdown-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eef0f4' }}>
                <span>Sales Tax ({settings.TAX_PERCENTAGE}%)</span>
                <strong>Rs. {tax}</strong>
              </div>
              <div className="breakdown-row total" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: '5px', fontSize: '1.2rem', fontWeight: 800, color: '#1B2A49' }}>
                <span>Total</span>
                <span style={{ color: '#F37335' }}>Rs. {grandTotal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Checkout Billing Details Form */}
        <div className="payment-section" style={{ borderTop: '4px solid #fbb731' }}>
          <h2 style={{ fontFamily: 'Nunito Sans, sans-serif', fontWeight: 800, color: '#1B2A49', marginBottom: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>
            <i className="fa fa-credit-card" style={{ marginRight: '8px', color: '#fbb731' }}></i>
            Delivery & Payment Details
          </h2>

          <form onSubmit={handleSubmit} className="checkout-form">
            {status.message && (
              <div
                className="error-message"
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '15px',
                  background: status.error ? '#fee2e2' : '#dcfce7',
                  border: status.error ? '1px solid #fca5a5' : '1px solid #86efac',
                  color: status.error ? '#dc2626' : '#16a34a',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                {status.message}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 700, color: '#1B2A49', marginBottom: '6px', display: 'block' }}>Full Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Full Name"
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 700, color: '#1B2A49', marginBottom: '6px', display: 'block' }}>Phone Number *</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Phone Number (e.g. 03001234567)"
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
                required
              />
            </div>

            {deliveryZones.length > 0 && (
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 700, color: '#1B2A49', marginBottom: '6px', display: 'block' }}>Delivery Area *</label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', background: '#fff' }}
                  required
                >
                  {deliveryZones.map((z) => (
                    <option key={z._id} value={z._id}>
                      {z.name} (Rs. {z.baseCharge})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 700, color: '#1B2A49', marginBottom: '6px', display: 'block' }}>Delivery Address *</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Complete Delivery Address"
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 700, color: '#1B2A49', marginBottom: '6px', display: 'block' }}>Payment Method *</label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleInputChange}
                className="form-input"
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', background: '#fff' }}
              >
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="Online Payment">Online Payment</option>
              </select>
            </div>

            {form.paymentMethod === 'Online Payment' && bankAccounts.length > 0 && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '15px' }}>
                  <i className="fa fa-info-circle" style={{ color: '#3b82f6', marginRight: '6px' }}></i>
                  Bank Transfer Instructions
                </h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                  Please transfer exactly <strong>Rs. {grandTotal}</strong> to any of the following accounts. Your order will be processed once the payment is verified.
                </p>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {bankAccounts.map((bank) => (
                    <div key={bank._id} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{bank.bankName}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', fontSize: '13px', color: '#334155', gap: '4px' }}>
                        <span style={{ color: '#64748b' }}>Title:</span> <span style={{ fontWeight: 600 }}>{bank.accountTitle}</span>
                        <span style={{ color: '#64748b' }}>Acc No:</span> <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{bank.accountNumber}</span>
                        {bank.iban && (
                          <><span style={{ color: '#64748b' }}>IBAN:</span> <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{bank.iban}</span></>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 700, color: '#1B2A49', marginBottom: '6px', display: 'block' }}>Order Notes (optional)</label>
              <textarea
                ref={notesRef}
                name="notes"
                value={form.notes}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Special instructions or rider notes..."
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', minHeight: '38px', height: '38px', overflow: 'hidden', resize: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <button
              type="submit"
              disabled={placing}
              className="btn-place-order"
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #fbb731 0%, #F37335 100%)',
                color: '#1B2A49',
                fontWeight: 800,
                fontSize: '1rem',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              {placing ? 'Placing Order…' : 'Place Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
