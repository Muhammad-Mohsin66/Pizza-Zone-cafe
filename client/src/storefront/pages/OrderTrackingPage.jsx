import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderDetails, requestRefund } from '../utils/api';
import RefundRequestModal from '../../shared/components/RefundRequestModal';
import { useToast, ToastContainer } from '../../shared/components/Toast';

const STEPS = [
  { label: 'Placed', key: 'Pending', description: 'Order received' },
  { label: 'Confirmed', key: 'Confirmed', description: 'Order accepted' },
  { label: 'Preparing', key: 'Preparing', description: 'Preparing food' },
  { label: 'Out for Delivery', key: 'Handover', description: 'Rider on the way' },
  { label: 'Delivered', key: 'Delivered', description: 'Food delivered' }
];

const getActiveStepIndex = (status) => {
  if (status === 'Pending') return 0;
  if (status === 'Confirmed') return 1;
  if (status === 'Preparing') return 2;
  if (['Ready', 'Assigned to Rider', 'Handover to Rider'].includes(status)) return 3;
  if (status === 'Delivered') return 4;
  return -1; // e.g. Cancelled, Refunded
};

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Refund states
  const { toasts, removeToast, showError, showSuccess } = useToast();
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  const handleOpenRefundModal = () => {
    setRefundModalOpen(true);
  };

  const handleRefundSubmit = async (reason) => {
    if (!order) return;
    try {
      setRefundSubmitting(true);
      await requestRefund(order._id, reason);
      showSuccess('Refund request submitted successfully!');
      setRefundModalOpen(false);
      await fetchTrackingData(false);
    } catch (err) {
      console.error(err);
      showError(err.message || 'Failed to submit refund request.');
    } finally {
      setRefundSubmitting(false);
    }
  };

  const fetchTrackingData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await getOrderDetails(orderId);
      if (res?.success && res?.data) {
        setOrder(res.data);
        setStatusHistory(res.statusHistory || []);
        setError(null);
      } else {
        setError('Order details could not be parsed.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch order details.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData(true);
    
    // Auto refresh order status every 15 seconds
    const interval = setInterval(() => {
      fetchTrackingData(false);
    }, 15000);

    setRefreshInterval(interval);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="page-root">
        <div className="tracking-loading-container">
          <div className="tracking-spinner"></div>
          <p>Fetching real-time tracking details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-root">
        <div className="tracking-error-container">
          <span className="error-icon">⚠️</span>
          <h2>Tracking Error</h2>
          <p>{error || 'Order not found'}</p>
          <div className="error-actions">
            <button onClick={() => fetchTrackingData(true)} className="status-save-btn">Retry</button>
            <Link to="/orders" className="tracking-back-link">Back to Orders</Link>
          </div>
        </div>
      </div>
    );
  }

  const activeIndex = getActiveStepIndex(order.orderStatus);
  const isCancelled = order.orderStatus === 'Cancelled';
  const isRefunded = ['Refund Requested', 'Refunded'].includes(order.orderStatus);

  return (
    <div className="page-root">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <style>{`
        .tracking-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 30px;
          margin-top: 30px;
        }

        @media (max-width: 991px) {
          .tracking-layout {
            grid-template-columns: 1fr;
          }
        }

        .tracking-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          border: 1px solid #ebebeb;
          margin-bottom: 24px;
          animation: trackingFadeIn 0.35s ease;
        }

        @keyframes trackingFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tracking-loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          color: #666;
        }

        .tracking-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #ebebeb;
          border-top: 4px solid #FF6B35;
          border-radius: 50%;
          animation: trackingSpin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes trackingSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .tracking-error-container {
          max-width: 500px;
          margin: 60px auto;
          background: #fff;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          border: 1px solid #ffcdd2;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .error-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }

        .error-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 24px;
        }

        .tracking-back-link {
          display: inline-block;
          padding: 10px 20px;
          border: 1px solid #ccc;
          border-radius: 6px;
          color: #555;
          text-decoration: none;
          font-weight: 700;
          transition: all 0.2s ease;
        }

        .tracking-back-link:hover {
          background: #f5f5f5;
        }

        .status-badge-tracking {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .status-badge-tracking.pending { background: #fff3e0; color: #e65100; }
        .status-badge-tracking.confirmed { background: #e8f5e9; color: #2e7d32; }
        .status-badge-tracking.preparing { background: #e3f2fd; color: #1565c0; }
        .status-badge-tracking.ready { background: #f3e5f5; color: #6a1b9a; }
        .status-badge-tracking.delivery { background: #e0f7fa; color: #00838f; }
        .status-badge-tracking.delivered { background: #e8f5e9; color: #2e7d32; }
        .status-badge-tracking.cancelled { background: #ffebee; color: #c62828; }

        /* Stepper styles */
        .stepper-container {
          display: flex;
          justify-content: space-between;
          position: relative;
          padding: 30px 0 20px;
          margin-bottom: 20px;
          overflow-x: auto;
        }

        .stepper-line {
          position: absolute;
          top: 48px;
          left: 5%;
          right: 5%;
          height: 4px;
          background: #ebebeb;
          z-index: 1;
        }

        .stepper-line-active {
          position: absolute;
          top: 48px;
          left: 5%;
          height: 4px;
          background: #4CAF50;
          z-index: 2;
          transition: width 0.4s ease;
        }

        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          z-index: 3;
          min-width: 80px;
          flex: 1;
        }

        .step-bubble {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #ebebeb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #999;
          font-size: 14px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        }

        .step-item.active .step-bubble {
          border-color: #4CAF50;
          color: #4CAF50;
          transform: scale(1.15);
          box-shadow: 0 4px 10px rgba(76, 175, 80, 0.2);
        }

        .step-item.completed .step-bubble {
          background: #4CAF50;
          border-color: #4CAF50;
          color: white;
        }

        .step-label {
          font-size: 13px;
          font-weight: 700;
          margin-top: 12px;
          color: #888;
        }

        .step-item.active .step-label {
          color: #1a1a1a;
        }

        .step-item.completed .step-label {
          color: #4CAF50;
        }

        .step-description {
          font-size: 10px;
          color: #aaa;
          margin-top: 4px;
        }

        /* Timeline styles */
        .timeline-container {
          margin-top: 25px;
          border-left: 2px solid #ebebeb;
          padding-left: 20px;
          margin-left: 10px;
        }

        .timeline-item {
          position: relative;
          margin-bottom: 24px;
        }

        .timeline-item:last-child {
          margin-bottom: 0;
        }

        .timeline-dot {
          position: absolute;
          left: -27px;
          top: 4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #4CAF50;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
        }

        .timeline-item:not(:first-child) .timeline-dot {
          background: #ccc;
          box-shadow: none;
        }

        .timeline-content {
          background: #f9f9f7;
          border-radius: 8px;
          padding: 12px 16px;
          border: 1px solid #eee;
        }

        .timeline-status {
          font-weight: 700;
          font-size: 14px;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .timeline-meta {
          font-size: 13px;
          color: #555;
          margin-bottom: 6px;
        }

        .timeline-time {
          font-size: 11px;
          color: #999;
          display: block;
        }

        /* Rider Card */
        .rider-section {
          background: linear-gradient(135deg, #FF6B35 0%, #ff8b54 100%);
          color: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }

        .rider-section::after {
          content: '🚴';
          position: absolute;
          right: 15px;
          bottom: -10px;
          font-size: 80px;
          opacity: 0.15;
        }

        .rider-section h3 {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rider-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rider-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          border-bottom: 1px solid rgba(255,255,255,0.15);
          padding-bottom: 6px;
        }

        .rider-row a {
          color: white;
          font-weight: 700;
          text-decoration: underline;
        }

        /* Order Summary Side panel */
        .summary-header {
          font-size: 16px;
          font-weight: 800;
          color: #1a1a1a;
          border-bottom: 2px solid #f6f6f4;
          padding-bottom: 10px;
          margin-bottom: 15px;
          text-transform: uppercase;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 8px;
          color: #555;
        }

        .summary-row.total {
          border-top: 2px solid #f6f6f4;
          padding-top: 10px;
          margin-top: 15px;
          font-weight: 800;
          font-size: 15px;
          color: #1a1a1a;
        }

        .item-list-mini {
          max-height: 250px;
          overflow-y: auto;
          margin-bottom: 15px;
        }

        .item-row-mini {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 8px 0;
          border-bottom: 1px dashed #eee;
        }

        .item-qty-name {
          color: #1a1a1a;
          font-weight: 500;
        }

        .item-price-mini {
          color: #FF6B35;
          font-weight: 700;
        }

        .tracking-meta-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
          margin-bottom: 20px;
        }

        .tracking-meta-left h2 {
          font-size: 22px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0;
        }

        .tracking-meta-left p {
          font-size: 12px;
          color: #888;
          margin: 5px 0 0 0;
        }
      `}</style>

      <div className="top-fixed">
        <div className="container navp0">
          <div className="row overflows smallscreen-wrapper align-items-center">
            <div className="col pt-1 pb-1">
              <nav className="navbar pl-0 pr-0 navbar-expand-lg minicartfix">
                <a className="navbar-brand" href="/" title="Pizza Zone & Cafe" rel="home">
                  <img src="assets/images/2020/12/Logo_light.svg" alt="Pizza Zone & Cafe" />
                </a>
                <button className="navbar-toggler first-button pt-1" type="button" data-toggle="collapse" data-target="#main_nav" aria-controls="main_nav" aria-expanded="false" aria-label="Toggle navigation">
                  <span className="animated-icon1"><span /><span /><span /></span>
                </button>
                <div className="justify-content-end custom-mega-menu custom-mega-menub collapse navbar-collapse" id="main_nav">
                  <ul id="menu-menu-1" className="navbar-nav">
                    <li className="menu-item"><a href="/">HOME</a></li>
                    <li className="menu-item"><a href="/shop">SHOP</a></li>
                    <li className="menu-item"><a href="/about">ABOUT</a></li>
                    <li className="menu-item"><a href="/pages">PAGES</a></li>
                    <li className="menu-item"><a href="/contact">CONTACT</a></li>
                    <li className="menu-item"><a href="/orders" className="ck-nav-active">ORDERS</a></li>
                    <li className="menu-item ck-ml-8"><a href="/contact" className="ck-nav-cta"><i className="fa fa-envelope ck-mr-6" />CONTACT US</a></li>
                  </ul>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <main>
        <div className="page-banner">
          <div className="container">
            <h1>Track Order</h1>
            <p>Real-time delivery status tracking</p>
          </div>
        </div>

        <div className="container ck-pb-60">
          <div className="tracking-layout">
            {/* Left Main Content Panel */}
            <div className="layout-left">
              <div className="tracking-card">
                <div className="tracking-meta-header">
                  <div className="tracking-meta-left">
                    <h2>Order ID: {order._id}</h2>
                    <p>Placed on: {new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className={`status-badge-tracking ${order.orderStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>

                {order.refund && (
                  <div style={{
                    backgroundColor: 
                      order.refund.status === 'Requested' ? '#fffbeb' :
                      order.refund.status === 'Approved' ? '#f5f3ff' :
                      order.refund.status === 'Processed' ? '#f0fdf4' : '#fef2f2',
                    border: '1px solid',
                    borderColor: 
                      order.refund.status === 'Requested' ? '#fef3c7' :
                      order.refund.status === 'Approved' ? '#ede9fe' :
                      order.refund.status === 'Processed' ? '#dcfce7' : '#fee2e2',
                    borderLeft: '4px solid',
                    borderLeftColor: 
                      order.refund.status === 'Requested' ? '#d97706' :
                      order.refund.status === 'Approved' ? '#8b5cf6' :
                      order.refund.status === 'Processed' ? '#16a34a' : '#ef4444',
                    padding: '16px',
                    borderRadius: '8px',
                    color: 
                      order.refund.status === 'Requested' ? '#92400e' :
                      order.refund.status === 'Approved' ? '#5b21b6' :
                      order.refund.status === 'Processed' ? '#166534' : '#991b1b',
                    fontWeight: 600,
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>↩️ Refund Request Status: {order.refund.status}</span>
                      <span style={{ fontSize: '11px', opacity: 0.8 }}>
                        Updated: {new Date(order.refund.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    {order.refund.adminNote && (
                      <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 500, fontStyle: 'italic', opacity: 0.9 }}>
                        Note: "{order.refund.adminNote}"
                      </div>
                    )}
                  </div>
                )}

                {isCancelled ? (
                  <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '16px', borderRadius: '8px', border: '1px solid #ffcdd2', fontWeight: 600, marginBottom: '20px' }}>
                    🚫 This order was cancelled. Reason: {order.cancellationReason || 'No reason provided.'}
                  </div>
                ) : isRefunded ? (
                  <div style={{ backgroundColor: '#f3e5f5', color: '#6a1b9a', padding: '16px', borderRadius: '8px', border: '1px solid #e1bee7', fontWeight: 600, marginBottom: '20px' }}>
                    ↩️ Refund status for this order: {order.orderStatus}
                  </div>
                ) : (
                  /* Stepper Progress Visualizer */
                  <div className="stepper-container">
                    <div className="stepper-line"></div>
                    <div 
                      className="stepper-line-active" 
                      style={{ width: `${activeIndex >= 0 ? (activeIndex / (STEPS.length - 1)) * 90 : 0}%` }}
                    ></div>
                    {STEPS.map((step, idx) => {
                      const isActive = idx === activeIndex;
                      const isCompleted = idx < activeIndex;
                      return (
                        <div key={idx} className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                          <div className="step-bubble">
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <div className="step-label">{step.label}</div>
                          <div className="step-description">{step.description}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status Update Timeline */}
              <div className="tracking-card">
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a', marginBottom: '20px', textTransform: 'uppercase' }}>
                  ⏳ Tracking History
                </h3>
                {statusHistory.length === 0 ? (
                  <p style={{ color: '#999', fontSize: '14px', fontStyle: 'italic' }}>No tracking updates available yet.</p>
                ) : (
                  <div className="timeline-container">
                    {statusHistory.map((log, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <div className="timeline-status">{log.newStatus}</div>
                          <div className="timeline-meta">
                            {log.notes || log.reason || `Status changed from ${log.previousStatus || 'None'} to ${log.newStatus}`}
                          </div>
                          <span className="timeline-time">
                            {new Date(log.createdAt).toLocaleString()} 
                            {log.changedBy ? ` • updated by ${log.changedBy.name} (${log.changedBy.role})` : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Summary Sidebar Panel */}
            <div className="layout-right">
              {/* Assigned Rider details */}
              {order.rider && ['Handover to Rider', 'Delivered'].includes(order.orderStatus) ? (
                <div className="rider-section">
                  <h3>Assigned Rider</h3>
                  <div className="rider-details">
                    <div className="rider-row">
                      <span>Rider Name</span>
                      <strong>{order.rider.name}</strong>
                    </div>
                    <div className="rider-row">
                      <span>Contact Phone</span>
                      <strong>
                        <a href={`tel:${order.rider.phone}`}>{order.rider.phone}</a>
                      </strong>
                    </div>
                    <div className="rider-row" style={{ border: 'none' }}>
                      <span>Status</span>
                      <strong style={{ textTransform: 'uppercase' }}>On Delivery</strong>
                    </div>
                  </div>
                </div>
              ) : (
                !isCancelled && !isRefunded && (
                  <div className="tracking-card" style={{ background: '#fcfcfc', border: '1px dashed #ccc', textAlign: 'center', color: '#888', padding: '24px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🛵</div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Rider assignment pending</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#aaa' }}>We will assign a delivery rider shortly.</p>
                  </div>
                )
              )}

              {/* Order Info Summary */}
              <div className="tracking-card">
                <div className="summary-header">Order Summary</div>
                <div className="item-list-mini">
                  {(order.orderItems || []).map((item, idx) => (
                    <div className="item-row-mini" key={idx}>
                      <span className="item-qty-name">{item.quantity}x {item.name} ({item.size})</span>
                      <span className="item-price-mini">Rs. {item.quantity * item.price}</span>
                    </div>
                  ))}
                </div>

                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>Rs. {order.totalAmount}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span>Rs. {order.deliveryCharge}</span>
                </div>
                <div className="summary-row total">
                  <span>Grand Total</span>
                  <span>Rs. {order.grandTotal}</span>
                </div>

                {['Delivered', 'Cancelled'].includes(order.orderStatus) &&
                 order.paymentMethod !== 'COD' &&
                 order.paymentStatus === 'Verified' &&
                 !order.refund && (
                  <button
                    onClick={handleOpenRefundModal}
                    className="status-save-btn"
                    style={{
                      width: '100%',
                      marginTop: '15px',
                      backgroundColor: '#ffffff',
                      color: '#FF6B35',
                      border: '1px solid #FF6B35',
                      padding: '10px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      cursor: 'pointer'
                    }}
                  >
                    ↩️ Request Refund
                  </button>
                )}

                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f6f6f4' }}>
                  <div className="summary-row">
                    <span>Payment Method</span>
                    <strong>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Payment Status</span>
                    <strong>{order.paymentStatus}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Deliver to</span>
                    <span style={{ fontSize: '11px', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>
                      {order.shippingAddress}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <Link to="/orders" className="tracking-back-link" style={{ width: '100%', display: 'block' }}>
                  ← View Order History
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <RefundRequestModal
        isOpen={refundModalOpen}
        orderId={order?._id}
        amount={order?.grandTotal}
        onSubmit={handleRefundSubmit}
        onClose={() => setRefundModalOpen(false)}
        isLoading={refundSubmitting}
      />
    </div>
  );
}
