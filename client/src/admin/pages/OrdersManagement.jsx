import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import StatusBadge from '../../shared/components/StatusBadge';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, Spinner } from '../components/AdminUI';
import { useToast, ToastContainer } from '../../shared/components/Toast';

export default function OrdersManagement() {
  const { toasts, removeToast, showError, showSuccess } = useToast();

  // States
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals / Details states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderHistory, setSelectedOrderHistory] = useState([]);
  const [selectedOrderPayment, setSelectedOrderPayment] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Modal toggle states
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [quickVerifyModalOpen, setQuickVerifyModalOpen] = useState(false);

  // Form states
  const [newStatus, setNewStatus] = useState('');
  const [selectedRider, setSelectedRider] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const statusOptions = [
    'Pending',
    'Confirmed',
    'Preparing',
    'Ready',
    'Assigned to Rider',
    'Handover to Rider',
    'Delivered',
    'Cancelled',
    'Refund Requested',
    'Refunded',
  ];

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch up to 1000 orders to avoid default limit of 10
      const res = await api.get('/orders/admin/all?limit=1000');
      setOrders(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      showError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchRiders = async () => {
    try {
      // Fetch users and filter riders (works for both admins and employees)
      const res = await api.get('/auth/users');
      if (res.data?.users) {
        setRiders(res.data.users.filter((u) => u.role === 'rider'));
      }
    } catch (err) {
      console.error('Error fetching riders:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRiders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load chronological order timeline details and payment screenshot if needed
  const loadOrderDetails = async (order) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/orders/${order._id}/details`);
      setSelectedOrder(res.data?.data || order);
      setSelectedOrderHistory(res.data?.statusHistory || []);
    } catch (err) {
      console.error('Error fetching order details:', err);
      showError('Failed to load order details');
    } finally {
      setLoadingDetails(false);
    }

    if (order.paymentMethod === 'Online') {
      setLoadingPayment(true);
      try {
        const res = await api.get(`/payments/admin/all?order=${order._id}`);
        setSelectedOrderPayment(res.data?.data?.[0] || null);
      } catch (err) {
        console.error('Error fetching payment screenshot:', err);
      } finally {
        setLoadingPayment(false);
      }
    } else {
      setSelectedOrderPayment(null);
    }
  };

  const handleViewOrder = (order) => {
    loadOrderDetails(order);
  };

  const handleQuickVerify = async (order) => {
    setSelectedOrder(order);
    setLoadingPayment(true);
    setQuickVerifyModalOpen(true);
    try {
      const res = await api.get(`/payments/admin/all?order=${order._id}`);
      setSelectedOrderPayment(res.data?.data?.[0] || null);
    } catch (err) {
      console.error('Error fetching payment screenshot:', err);
      showError('Failed to load payment details');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleOpenStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setStatusModalOpen(true);
  };

  const handleOpenAssignModal = (order) => {
    setSelectedOrder(order);
    setSelectedRider(order.rider?._id || order.rider || '');
    setAssignModalOpen(true);
  };

  const handleConfirmStatus = async (statusOverride = null) => {
    const statusToUpdate = statusOverride || newStatus;
    const orderId = selectedOrder?._id;
    if (!orderId || !statusToUpdate) return;

    try {
      setSubmitting(true);
      await api.patch(`/orders/${orderId}/status`, {
        orderStatus: statusToUpdate,
      });
      showSuccess(`Order status updated to ${statusToUpdate}`);
      
      // Reload orders list and modal details
      await fetchData();
      if (selectedOrder) {
        const updatedOrder = orders.find(o => o._id === orderId) || selectedOrder;
        loadOrderDetails({ ...updatedOrder, orderStatus: statusToUpdate });
      }

      setStatusModalOpen(false);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmAssign = async () => {
    const orderId = selectedOrder?._id;
    if (!orderId) return;
    if (!selectedRider) {
      showError('Please select a rider');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/orders/${orderId}/assign-rider`, {
        riderId: selectedRider,
      });
      showSuccess('Rider assigned successfully');
      
      await fetchData();
      if (selectedOrder) {
        const updatedOrder = orders.find(o => o._id === orderId) || selectedOrder;
        loadOrderDetails(updatedOrder);
      }

      setAssignModalOpen(false);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to assign rider');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    const orderId = selectedOrder?._id;
    if (!orderId) return;
    if (!cancellationReason.trim()) {
      showError('Please enter a cancellation reason');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/orders/${orderId}/status`, {
        orderStatus: 'Cancelled',
        reason: cancellationReason.trim(),
      });
      showSuccess('Order cancelled successfully');
      
      await fetchData();
      if (selectedOrder) {
        const updatedOrder = orders.find(o => o._id === orderId) || selectedOrder;
        loadOrderDetails({ ...updatedOrder, orderStatus: 'Cancelled' });
      }

      setCancelModalOpen(false);
      setCancellationReason('');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPayment = async () => {
    const paymentId = selectedOrderPayment?._id;
    if (!paymentId) return;

    try {
      setSubmitting(true);
      await api.patch(`/payments/${paymentId}/verify`);
      showSuccess('Payment verified successfully');
      
      await fetchData();
      if (selectedOrder) {
        loadOrderDetails(selectedOrder);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to verify payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectPayment = async () => {
    const paymentId = selectedOrderPayment?._id;
    if (!paymentId) return;
    if (!rejectionReason.trim()) {
      showError('Please enter rejection reason');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/payments/${paymentId}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      showSuccess('Payment rejected');
      
      await fetchData();
      if (selectedOrder) {
        loadOrderDetails(selectedOrder);
      }

      setRejectModalOpen(false);
      setRejectionReason('');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to reject payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Filters
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'All' || order.orderStatus === statusFilter;
    const matchesSearch =
      order._id?.toLowerCase().includes(search.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      order.phoneNumber?.includes(search) ||
      order.shippingAddress?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Columns Configuration
  const columns = [
    { key: '_id', label: 'Order ID', render: (v) => <strong style={{ color: '#555' }}>#{v ? v.slice(-8).toUpperCase() : ''}</strong> },
    { key: 'customer', label: 'Customer', render: (v, row) => row.customer?.name || 'N/A' },
    { key: 'grandTotal', label: 'Total', render: (v) => <strong style={{ color: '#FF6B35' }}>Rs. {v || 0}</strong> },
    { key: 'paymentStatus', label: 'Payment', render: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <StatusBadge type="payment" status={v} />
        {row.paymentMethod === 'Online' && v === 'Pending' && (
          <Btn size="sm" onClick={() => handleQuickVerify(row)} style={{ padding: '2px 6px', fontSize: 11, minHeight: 'auto' }}>Verify</Btn>
        )}
      </div>
    ) },
    { key: 'orderStatus', label: 'Order Status', render: (v) => <StatusBadge type="order" status={v} /> },
    { key: 'rider', label: 'Assigned Rider', render: (v) => v?.name || '—' },
    { key: 'createdAt', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
  ];

  const tableActions = [
    { label: 'View Details', icon: '👁️', onClick: handleViewOrder },
    { label: 'Status', icon: '⚙️', onClick: handleOpenStatusModal },
    { label: 'Assign Rider', icon: '🏍️', onClick: handleOpenAssignModal }
  ];

  const getPaymentImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
    const serverUrl = apiBase.replace('/api', '');
    return `${serverUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <PageHeader 
        title="Orders Management" 
        subtitle="Manage storefront orders, payments verification, and rider assignments"
        action={<Btn variant="ghost" onClick={fetchData} size="sm">🔄 Refresh Data</Btn>}
      />

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="📦" label="Total Orders" value={orders.length} />
        <StatsCard icon="⏳" label="Pending Orders" value={orders.filter(o => o.orderStatus === 'Pending').length} color="#FFC107" />
        <StatsCard icon="🍳" label="Preparing / Ready" value={orders.filter(o => ['Confirmed', 'Preparing', 'Ready'].includes(o.orderStatus)).length} color="#FF9800" />
        <StatsCard icon="🏍️" label="Out for Delivery" value={orders.filter(o => ['Assigned to Rider', 'Handover to Rider'].includes(o.orderStatus)).length} color="#00BCD4" />
        <StatsCard icon="✅" label="Delivered" value={orders.filter(o => o.orderStatus === 'Delivered').length} color="#4CAF50" />
      </div>

      {/* Main card containing table, search, and status filters */}
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search orders by ID, name, or phone…" />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 13,
                outline: 'none',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              <option value="All">All Statuses</option>
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}><Spinner /></div>
        ) : (
          <Table 
            columns={columns} 
            data={filteredOrders} 
            actions={tableActions} 
            emptyMessage="No orders match your search criteria."
          />
        )}
      </Card>

      {/* 1. View Details Modal */}
      <Modal 
        isOpen={!!selectedOrder && !statusModalOpen && !assignModalOpen && !cancelModalOpen && !quickVerifyModalOpen} 
        title={`Order details — #${selectedOrder?._id?.slice(-8).toUpperCase()}`} 
        onClose={() => setSelectedOrder(null)}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            {selectedOrder && !['Cancelled', 'Delivered', 'Refunded'].includes(selectedOrder.orderStatus) && (
              <Btn variant="danger" size="sm" onClick={() => setCancelModalOpen(true)}>Cancel Order</Btn>
            )}
            <Btn variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>Close</Btn>
          </div>
        }
      >
        {selectedOrder && (
          <div>
            {loadingDetails ? <Spinner /> : (
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                
                {/* Visual quick status strip */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9fb', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
                  <div>
                    <span style={{ color: '#888', fontSize: 11, display: 'block', textTransform: 'uppercase' }}>Current Status</span>
                    <div style={{ marginTop: 4 }}><StatusBadge type="order" status={selectedOrder.orderStatus} /></div>
                  </div>
                  <div>
                    <span style={{ color: '#888', fontSize: 11, display: 'block', textTransform: 'uppercase' }}>Payment Details</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontWeight: 700 }}>{selectedOrder.paymentMethod}</span>
                      <StatusBadge type="payment" status={selectedOrder.paymentStatus} />
                    </div>
                  </div>
                </div>

                {/* Customer Details info block */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div style={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>👤 Customer Details</h4>
                    <p style={{ margin: '4px 0' }}><strong>Name:</strong> {selectedOrder.customer?.name || 'N/A'}</p>
                    <p style={{ margin: '4px 0' }}><strong>Email:</strong> {selectedOrder.customer?.email || 'N/A'}</p>
                    <p style={{ margin: '4px 0' }}>
                      <strong>Phone:</strong> <a href={`tel:${selectedOrder.phoneNumber}`} style={{ color: '#FF6B35', fontWeight: 600 }}>📞 {selectedOrder.phoneNumber}</a>
                    </p>
                  </div>
                  
                  <div style={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>📍 Delivery Address</h4>
                    <p style={{ margin: '4px 0', fontStyle: 'italic', color: '#555' }}>{selectedOrder.shippingAddress}</p>
                    {selectedOrder.notes && (
                      <div style={{ marginTop: 8, padding: 6, backgroundColor: '#fef3c7', borderRadius: 4, borderLeft: '3px solid #f59e0b', fontSize: 11 }}>
                        <strong>Note:</strong> {selectedOrder.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Online payment verification section */}
                {selectedOrder.paymentMethod === 'Online' && (
                  <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 20, backgroundColor: '#fdfefe' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>💳 Online Payment Receipt Verification</h4>
                    {loadingPayment ? <Spinner /> : selectedOrderPayment ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span><strong>Transaction ID:</strong> {selectedOrderPayment.transactionId || '—'}</span>
                          <span><strong>Uploaded:</strong> {new Date(selectedOrderPayment.createdAt).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <a 
                            href={getPaymentImageUrl(selectedOrderPayment.screenshot)} 
                            target="_blank" 
                            rel="noreferrer" 
                            title="Click to view full image"
                          >
                            <img 
                              src={getPaymentImageUrl(selectedOrderPayment.screenshot)} 
                              alt="Payment proof screenshot" 
                              style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer' }}
                            />
                          </a>
                          <div>
                            <p style={{ fontSize: 12, color: '#666', margin: '0 0 8px 0' }}>Double check the transaction ID & screenshot verification details.</p>
                            {selectedOrderPayment.status === 'Pending' ? (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <Btn variant="primary" size="sm" onClick={handleVerifyPayment} disabled={submitting}>Verify payment (Approve)</Btn>
                                <Btn variant="danger" size="sm" onClick={() => setRejectModalOpen(true)}>Reject</Btn>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, fontWeight: 600, color: selectedOrderPayment.status === 'Verified' ? '#16a34a' : '#dc2626' }}>
                                Payment Status has been: {selectedOrderPayment.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: '#aaa', fontStyle: 'italic', margin: 0 }}>Customer has not uploaded payment proof screenshot yet.</p>
                    )}
                  </div>
                )}

                {/* Stepper Quick-Actions Panel */}
                <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 20, backgroundColor: '#fff' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>🛠️ Order Workflow Quick Actions</h4>
                  
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    {selectedOrder.orderStatus === 'Pending' && selectedOrder.paymentMethod === 'COD' && (
                      <Btn variant="primary" size="sm" onClick={() => handleConfirmStatus('Confirmed')} disabled={submitting}>Confirm Order</Btn>
                    )}
                    
                    {selectedOrder.orderStatus === 'Pending' && selectedOrder.paymentMethod === 'Online' && (
                      <div style={{ fontSize: 12, color: '#b45309', fontWeight: 600 }}>
                        ⚠️ Verification of online payment required before confirmation.
                      </div>
                    )}

                    {selectedOrder.orderStatus === 'Confirmed' && (
                      <Btn variant="primary" size="sm" onClick={() => handleConfirmStatus('Preparing')} disabled={submitting}>Start Preparing</Btn>
                    )}

                    {selectedOrder.orderStatus === 'Preparing' && (
                      <Btn variant="primary" size="sm" onClick={() => handleConfirmStatus('Ready')} disabled={submitting}>Mark as Ready</Btn>
                    )}

                    {selectedOrder.orderStatus === 'Ready' && (
                      <>
                        <Btn variant="primary" size="sm" onClick={() => setAssignModalOpen(true)}>Assign Rider</Btn>
                        {selectedOrder.rider && (
                          <Btn variant="secondary" size="sm" onClick={() => handleConfirmStatus('Handover to Rider')} disabled={submitting}>Handover to Rider</Btn>
                        )}
                      </>
                    )}

                    {selectedOrder.orderStatus === 'Assigned to Rider' && (
                      <Btn variant="secondary" size="sm" onClick={() => handleConfirmStatus('Handover to Rider')} disabled={submitting}>Handover to Rider</Btn>
                    )}

                    {selectedOrder.orderStatus === 'Handover to Rider' && (
                      <Btn variant="primary" size="sm" onClick={() => handleConfirmStatus('Delivered')} disabled={submitting}>Mark as Delivered</Btn>
                    )}

                    {selectedOrder.orderStatus === 'Delivered' && (
                      <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                        🎉 Order completed and delivered successfully.
                      </div>
                    )}

                    {selectedOrder.orderStatus === 'Cancelled' && (
                      <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                        ❌ Order has been cancelled. (Reason: {selectedOrder.cancellationReason || 'N/A'})
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items Table */}
                <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 700 }}>🛒 Order Items</h4>
                <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#fafaf8', borderBottom: '1px solid #ebebeb' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', color: '#666' }}>Item</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11, textTransform: 'uppercase', color: '#666', width: 80 }}>Size</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11, textTransform: 'uppercase', color: '#666', width: 80 }}>Qty</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, textTransform: 'uppercase', color: '#666', width: 100 }}>Price</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, textTransform: 'uppercase', color: '#666', width: 100 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.orderItems || []).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f5f5f3' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{item.name}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}><Badge status={item.size} /></td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>Rs. {item.price}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Rs. {item.quantity * item.price}</td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#fafaf8', borderTop: '2px solid #ddd' }}>
                        <td colSpan="3" style={{ padding: '8px 12px' }}></td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#888' }}>Subtotal:</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Rs. {selectedOrder.totalAmount}</td>
                      </tr>
                      {selectedOrder.deliveryCharge > 0 && (
                        <tr style={{ backgroundColor: '#fafaf8' }}>
                          <td colSpan="3" style={{ padding: '4px 12px' }}></td>
                          <td style={{ padding: '4px 12px', textAlign: 'right', color: '#888' }}>Delivery Charge:</td>
                          <td style={{ padding: '4px 12px', textAlign: 'right', fontWeight: 600 }}>Rs. {selectedOrder.deliveryCharge}</td>
                        </tr>
                      )}
                      <tr style={{ backgroundColor: '#fafaf8', fontSize: 14 }}>
                        <td colSpan="3" style={{ padding: '8px 12px' }}></td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800 }}>Grand Total:</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#FF6B35' }}>Rs. {selectedOrder.grandTotal}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Order status history timeline */}
                <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 700 }}>📋 Status Change History Logs</h4>
                {selectedOrderHistory.length === 0 ? (
                  <p style={{ color: '#aaa', fontStyle: 'italic', margin: 0 }}>No status changes logged yet.</p>
                ) : (
                  <div style={{ borderLeft: '2px solid #e5e7eb', marginLeft: 12, paddingLeft: 16 }}>
                    {selectedOrderHistory.map((history, idx) => (
                      <div key={idx} style={{ position: 'relative', marginBottom: 12 }}>
                        <div style={{
                          position: 'absolute',
                          left: -22,
                          top: 4,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: idx === 0 ? '#FF6B35' : '#d1d5db',
                          border: '2px solid #fff'
                        }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: idx === 0 ? '#FF6B35' : '#4b5563' }}>{history.newStatus}</span>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(history.createdAt).toLocaleString()}</span>
                        </div>
                        <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#6b7280' }}>
                          Changed by: <strong>{history.changedBy?.name || 'System'} ({history.changedBy?.role || 'Guest'})</strong>
                        </p>
                        {history.notes && <p style={{ margin: '2px 0 0 0', fontSize: 11, fontStyle: 'italic', color: '#888' }}>Note: {history.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 2. Update Status overrides Modal */}
      <Modal
        isOpen={statusModalOpen}
        title="Override Order Status"
        onClose={() => setStatusModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="primary" size="sm" onClick={() => handleConfirmStatus(null)} disabled={submitting}>Update</Btn>
            <Btn variant="ghost" size="sm" onClick={() => setStatusModalOpen(false)}>Cancel</Btn>
          </div>
        }
      >
        <div>
          <p style={{ fontSize: 13, color: '#555', margin: '0 0 8px 0' }}>Select new status:</p>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #e0e0e0',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* 3. Assign Rider Modal */}
      <Modal
        isOpen={assignModalOpen}
        title="Assign Delivery Rider"
        onClose={() => setAssignModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="primary" size="sm" onClick={handleConfirmAssign} disabled={submitting}>Assign</Btn>
            <Btn variant="ghost" size="sm" onClick={() => setAssignModalOpen(false)}>Cancel</Btn>
          </div>
        }
      >
        <div>
          <p style={{ fontSize: 13, color: '#555', margin: '0 0 8px 0' }}>Select rider for delivery:</p>
          <select
            value={selectedRider}
            onChange={(e) => setSelectedRider(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #e0e0e0',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            <option value="">-- Choose Rider --</option>
            {riders.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name} - {r.phone} {r.isActive ? '(Active)' : '(Inactive)'}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* 4. Cancel Order Reason Modal */}
      <Modal
        isOpen={cancelModalOpen}
        title="Cancel Order Confirmation"
        onClose={() => setCancelModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="danger" size="sm" onClick={handleCancelOrder} disabled={submitting}>Confirm Cancel</Btn>
            <Btn variant="ghost" size="sm" onClick={() => setCancelModalOpen(false)}>Cancel</Btn>
          </div>
        }
      >
        <div>
          <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, margin: '0 0 10px 0' }}>
            ⚠️ Are you sure you want to cancel this order? This action will automatically restore the product stock levels.
          </p>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Cancellation Reason:</label>
          <input 
            type="text"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="e.g. Out of stock, customer requested, etc."
            style={{
              width: '100%',
              padding: '9px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              fontSize: 13,
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </Modal>

      {/* 5. Reject Payment Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        title="Reject Payment Receipt"
        onClose={() => setRejectModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="danger" size="sm" onClick={handleRejectPayment} disabled={submitting}>Confirm Reject</Btn>
            <Btn variant="ghost" size="sm" onClick={() => setRejectModalOpen(false)}>Cancel</Btn>
          </div>
        }
      >
        <div>
          <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, margin: '0 0 10px 0' }}>
            Reject this online payment upload. The customer will be prompted to resubmit a valid screenshot proof.
          </p>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Rejection Reason:</label>
          <input 
            type="text"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Transaction ID mismatch, fake receipt, etc."
            style={{
              width: '100%',
              padding: '9px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              fontSize: 13,
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </Modal>

      {/* 6. Quick Verify Modal */}
      <Modal
        isOpen={quickVerifyModalOpen}
        title="Verify Online Payment"
        onClose={() => setQuickVerifyModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" size="sm" onClick={() => setQuickVerifyModalOpen(false)}>Close</Btn>
          </div>
        }
      >
        <div>
          {loadingPayment ? <div style={{ textAlign: 'center', padding: '40px 0' }}><Spinner /></div> : selectedOrderPayment ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span><strong>Transaction ID:</strong> {selectedOrderPayment.transactionId || '—'}</span>
                <span><strong>Uploaded:</strong> {new Date(selectedOrderPayment.createdAt).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
                <a href={getPaymentImageUrl(selectedOrderPayment.screenshot)} target="_blank" rel="noreferrer" title="Click to view full image">
                  <img 
                    src={getPaymentImageUrl(selectedOrderPayment.screenshot)} 
                    alt="Payment proof screenshot" 
                    style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer', backgroundColor: '#f9f9f9' }}
                  />
                </a>
                <p style={{ fontSize: 12, color: '#666', margin: '0' }}>Please double check the transaction ID & screenshot details.</p>
                {selectedOrderPayment.status === 'Pending' ? (
                  <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 8 }}>
                    <Btn variant="primary" style={{ flex: 1 }} onClick={async () => {
                      await handleVerifyPayment();
                      setQuickVerifyModalOpen(false);
                    }} disabled={submitting}>Verify payment (Approve)</Btn>
                    <Btn variant="danger" style={{ flex: 1 }} onClick={() => {
                      setQuickVerifyModalOpen(false);
                      setRejectModalOpen(true);
                    }}>Reject</Btn>
                  </div>
                ) : (
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: selectedOrderPayment.status === 'Verified' ? '#dcfce7' : '#fee2e2', color: selectedOrderPayment.status === 'Verified' ? '#16a34a' : '#dc2626', width: '100%', textAlign: 'center', fontWeight: '600' }}>
                    Payment Status is: {selectedOrderPayment.status}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p style={{ color: '#aaa', fontStyle: 'italic', margin: 0, textAlign: 'center', padding: '20px 0' }}>Customer has not uploaded payment proof screenshot yet.</p>
          )}
        </div>
      </Modal>

    </div>
  );
}
