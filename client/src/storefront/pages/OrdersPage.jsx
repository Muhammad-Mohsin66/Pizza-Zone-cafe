import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrdersPage } from '../hooks/pageHooks';
import RefundRequestModal from '../../shared/components/RefundRequestModal';
import { requestRefund } from '../utils/api';
import { useToast, ToastContainer } from '../../shared/components/Toast';

/**
 * OrdersPage — Customer-facing orders view.
 * READ-ONLY: Customers can view their order history and status,
 * but cannot modify order statuses.
 * Order status management is exclusively available in the Admin Panel.
 */
export default function OrdersPage() {
  const { status, orders, lastUpdated, refresh } = useOrdersPage();
  const { toasts, removeToast, showError, showSuccess } = useToast();
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  const handleOpenRefundModal = (order) => {
    setSelectedOrder(order);
    setRefundModalOpen(true);
  };

  const handleRefundSubmit = async (reason) => {
    if (!selectedOrder) return;
    try {
      setRefundSubmitting(true);
      await requestRefund(selectedOrder.order_id, reason);
      showSuccess('Refund request submitted successfully!');
      setRefundModalOpen(false);
      setSelectedOrder(null);
      refresh();
    } catch (err) {
      console.error(err);
      showError(err.message || 'Failed to submit refund request.');
    } finally {
      setRefundSubmitting(false);
    }
  };

  return (
    <div className="page-root">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
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
                    <li className="menu-item"><a href="/shop">MENU</a></li>
                    <li className="menu-item current-menu-item"><a href="/orders" className="ck-nav-active">ORDERS</a></li>
                    <li className="menu-item"><a href="/orders">TRACK ORDER</a></li>
                    <li className="menu-item ck-ml-8"><a href="/login" className="ck-nav-cta"><i className="fa fa-sign-in-alt ck-mr-6" />LOGIN</a></li>
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
            <h1>My Orders</h1>
            <p>Track your online orders in real time</p>
          </div>
        </div>
        <div className="container ck-pb-60">
          <div id="status-box" className={`status-box ${status.visible ? '' : 'ck-hidden'} ${status.error ? 'err' : 'ok'}`}>{status.message}</div>
          <div className="refresh-meta">
            <span id="last-updated">Last updated: {lastUpdated}</span>
            <button id="refresh-orders-btn" className="status-save-btn ck-pad-7-12" onClick={refresh}>Refresh</button>
          </div>
          <div id="orders-list">
            {orders === null ? (
              <div className="empty-box">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="empty-box">No online orders found.</div>
            ) : (
              orders.map((order) => (
                <div className="order-card" key={order.order_id}>
                  <div className="order-head">
                    <div>
                      <div className="order-id">{order.order_id}</div>
                      <div className="order-date">{new Date(order.created_at).toLocaleString()}</div>
                    </div>
                    {/* Status badge — display only, no editing for customers */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <div className="order-status">{order.status}</div>
                      {order.refund && (
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          textTransform: 'uppercase',
                          backgroundColor: 
                            order.refund.status === 'Requested' ? '#fef3c7' :
                            order.refund.status === 'Approved' ? '#ede9fe' :
                            order.refund.status === 'Processed' ? '#dcfce7' : '#fee2e2',
                          color: 
                            order.refund.status === 'Requested' ? '#b45309' :
                            order.refund.status === 'Approved' ? '#7c3aed' :
                            order.refund.status === 'Processed' ? '#16a34a' : '#dc2626',
                        }}>
                          ↩️ Refund {order.refund.status}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="meta-grid">
                    <div className="meta-box"><div className="meta-title">Customer</div><div className="meta-value">{order.customer_name}</div></div>
                    <div className="meta-box"><div className="meta-title">Phone</div><div className="meta-value">{order.customer_phone}</div></div>
                    <div className="meta-box"><div className="meta-title">Address</div><div className="meta-value">{order.customer_address}</div></div>
                    <div className="meta-box"><div className="meta-title">Payment</div><div className="meta-value">{order.payment_method}</div></div>
                  </div>
                  {order.notes ? <div className="meta-box ck-mb-10"><div className="meta-title">Notes</div><div className="meta-value">{order.notes}</div></div> : null}
                  {order.refund && order.refund.status === 'Rejected' && order.refund.adminNote && (
                    <div className="meta-box ck-mb-10" style={{ borderLeft: '3px solid #dc2626', paddingLeft: '10px', backgroundColor: '#fef2f2', borderRadius: '4px' }}>
                      <div className="meta-title" style={{ color: '#991b1b', fontWeight: 'bold' }}>Refund Rejection Reason</div>
                      <div className="meta-value" style={{ color: '#991b1b' }}>{order.refund.adminNote}</div>
                    </div>
                  )}
                  <div className="items-wrap">
                    {(order.items || []).map((item, idx) => (
                      <div className="item-row" key={`${order.order_id}-${idx}`}>
                        <div>
                          <div className="item-name">{item.name}</div>
                          <div className="item-info">Size: {item.size} | Qty: {item.qty}</div>
                        </div>
                        <div className="item-price">Rs. {(item.qty || 0) * (item.price || 0)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="order-total-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #eee' }}>
                    <div className="order-total" style={{ margin: 0 }}>Total: Rs. {order.total}</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {/* Refund Button */}
                      {['Delivered', 'Cancelled'].includes(order.status) &&
                       order.payment_method !== 'COD' &&
                       order.payment_status === 'Verified' &&
                       !order.refund && (
                        <button
                          onClick={() => handleOpenRefundModal(order)}
                          className="status-save-btn"
                          style={{
                            backgroundColor: '#fff',
                            color: '#FF6B35',
                            border: '1px solid #FF6B35',
                            padding: '8px 18px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            cursor: 'pointer'
                          }}
                        >
                          Request Refund
                        </button>
                      )}
                      <Link to={`/orders/${order.order_id}/track`} className="status-save-btn" style={{ textDecoration: 'none', backgroundColor: '#FF6B35', color: '#fff', padding: '8px 18px', borderRadius: '4px', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Track Order
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <RefundRequestModal
        isOpen={refundModalOpen}
        orderId={selectedOrder?.order_id}
        amount={selectedOrder?.total}
        onSubmit={handleRefundSubmit}
        onClose={() => {
          setRefundModalOpen(false);
          setSelectedOrder(null);
        }}
        isLoading={refundSubmitting}
      />
    </div>
  );
}
