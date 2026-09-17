import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, Spinner } from '../components/AdminUI';
import { useToast, ToastContainer } from '../../shared/components/Toast';

const METHOD_MAP = {
  'Online':        { label: 'Online',  bg: '#fce7f3', color: '#be185d' },
  'Bank Transfer': { label: 'Bank',    bg: '#ede9fe', color: '#7c3aed' },
  'JazzCash':      { label: 'JazzCash',bg: '#e0f2fe', color: '#0369a1' },
  'EasyPaisa':     { label: 'EasyPaisa',bg: '#dcfce7', color: '#16a34a' },
  'COD':           { label: 'COD',     bg: '#f3f4f6', color: '#374151' },
};

const STATUS_MAP = {
  Pending:   { label: 'Pending',   bg: '#fef3c7', color: '#b45309' },
  Verified:  { label: 'Verified',  bg: '#dcfce7', color: '#16a34a' },
  Rejected:  { label: 'Rejected',  bg: '#fee2e2', color: '#dc2626' },
};

export default function PaymentsPage() {
  const { toasts, removeToast, showError, showSuccess } = useToast();

  // States
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  
  // Modals & form states
  const [viewModal, setViewModal] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch up to 1000 payments and orders to avoid default limit of 10
      const [paymentsRes, ordersRes] = await Promise.all([
        api.get('/payments/admin/all?limit=1000'),
        api.get('/orders/admin/all?limit=1000')
      ]);
      
      const onlinePayments = paymentsRes.data?.data || [];
      const allOrders = ordersRes.data?.data || [];
      
      const codPayments = allOrders
        .filter(o => o.paymentMethod === 'COD')
        .map(o => ({
          _id: o._id,
          customer: o.customer,
          user: o.customer, // Map to handle either structure
          amount: o.grandTotal,
          paymentMethod: 'COD',
          status: o.paymentStatus,
          createdAt: o.createdAt,
          isCod: true
        }));

      const merged = [...onlinePayments, ...codPayments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPayments(merged);
    } catch (err) {
      console.error('Error fetching payments:', err);
      showError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerifyPayment = async (paymentId) => {
    try {
      setSubmitting(true);
      await api.patch(`/payments/${paymentId}/verify`);
      showSuccess('Payment verified successfully');
      
      // Reload and update modal
      await fetchData();
      setViewModal(null);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to verify payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectPayment = async () => {
    const paymentId = viewModal?._id;
    if (!paymentId) return;
    if (!rejectionReason.trim()) {
      showError('Please enter a rejection reason');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/payments/${paymentId}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      showSuccess('Payment rejected successfully');
      
      await fetchData();
      setViewModal(null);
      setRejectModalOpen(false);
      setRejectionReason('');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to reject payment');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p._id?.toLowerCase().includes(search.toLowerCase()) ||
      p.transactionId?.toLowerCase().includes(search.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesMethod = methodFilter === 'All' || p.paymentMethod === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalRevenue = payments
    .filter((p) => p.status === 'Verified')
    .reduce((s, p) => s + (p.amount || 0), 0);

  const columns = [
    { key: '_id', label: 'Payment ID', render: (v) => <strong style={{ color: '#555' }}>#{v ? v.slice(-8).toUpperCase() : ''}</strong> },
    { key: 'customer', label: 'Customer', render: (v, row) => row.customer?.name || row.user?.name || '—' },
    { key: 'amount', label: 'Amount', render: (v) => <span style={{ color: '#FF6B35', fontWeight: 700 }}>Rs. {v?.toFixed(0) || 0}</span> },
    { key: 'paymentMethod', label: 'Method', render: (v) => <Badge status={v} map={METHOD_MAP} /> },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} map={STATUS_MAP} /> },
    { key: 'createdAt', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <PageHeader 
        title="Payments Management" 
        subtitle="Verify user-uploaded screenshots, check transaction IDs, and track business revenue"
        action={<Btn variant="ghost" onClick={fetchData} size="sm">🔄 Refresh Data</Btn>}
      />

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="💳" label="Total Payments" value={payments.length} />
        <StatsCard icon="💰" label="Total Revenue" value={`Rs. ${totalRevenue.toFixed(0)}`} />
        <StatsCard icon="✅" label="Verified" value={payments.filter((p) => p.status === 'Verified').length} color="#16a34a" />
        <StatsCard icon="⏳" label="Pending" value={payments.filter((p) => p.status === 'Pending').length} color="#b45309" />
      </div>

      <Card>
        {/* Filters bar */}
        <div style={{ display: 'flex', gap: 16, padding: '16px 20px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by customer, ID, or Ref ID…" />
          
          {/* Status Filter */}
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
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Method Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 13,
                outline: 'none',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              <option value="All">All Methods</option>
              <option value="Online">Online</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="JazzCash">JazzCash</option>
              <option value="EasyPaisa">EasyPaisa</option>
              <option value="COD">COD</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}><Spinner /></div>
        ) : (
          <Table 
            columns={columns} 
            data={filtered}
            actions={[{ label: 'View Proof', icon: '👁️', onClick: (p) => setViewModal(p) }]}
            emptyMessage="No payment logs found."
          />
        )}
      </Card>

      {/* Payment Proof Details Modal */}
      <Modal 
        isOpen={!!viewModal && !rejectModalOpen} 
        title="Payment proof verification details" 
        onClose={() => setViewModal(null)}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            {viewModal?.status === 'Pending' && !viewModal?.isCod && (
              <>
                <Btn variant="primary" size="sm" onClick={() => handleVerifyPayment(viewModal._id)} disabled={submitting}>Verify & Approve</Btn>
                <Btn variant="danger" size="sm" onClick={() => setRejectModalOpen(true)}>Reject Screenshot</Btn>
              </>
            )}
            <Btn variant="ghost" size="sm" onClick={() => setViewModal(null)}>Close</Btn>
          </div>
        }
      >
        {viewModal && (
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>
            {[
              ['Payment ID', `#${viewModal._id?.slice(-8).toUpperCase()}`],
              ['Customer', viewModal.customer?.name || viewModal.user?.name || '—'],
              ['Amount', `Rs. ${viewModal.amount?.toFixed(0)}`],
              ['Method', viewModal.paymentMethod],
              ['Status', viewModal.status],
              ['Transaction Ref', viewModal.transactionId || '—'],
              ['Date', new Date(viewModal.createdAt).toLocaleString()],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', borderBottom: '1px solid #f5f5f5', padding: '8px 0' }}>
                <span style={{ color: '#888', minWidth: 120 }}>{k}</span>
                <span style={{ fontWeight: 600, color: '#222' }}>{v}</span>
              </div>
            ))}

            {/* Payment screenshot uploaded by user */}
            {viewModal.isCod ? (
              <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: 24, marginBottom: 8 }}>💵</span>
                <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>Cash on Delivery Payment</h4>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>This payment is automatically verified when the delivery rider marks the order as Delivered and collects the cash.</p>
              </div>
            ) : viewModal.screenshot ? (
              <div style={{ marginTop: 16 }}>
                <span style={{ display: 'block', color: '#888', marginBottom: 8, fontWeight: 600 }}>📷 Payment Screenshot Proof:</span>
                <a 
                  href={viewModal.screenshot.startsWith('http') ? viewModal.screenshot : `${import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:5001'}${viewModal.screenshot}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  title="Click to view full size screenshot"
                >
                  <img 
                    src={viewModal.screenshot.startsWith('http') ? viewModal.screenshot : `${import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:5001'}${viewModal.screenshot}`} 
                    alt="Receipt Screenshot" 
                    style={{
                      maxWidth: '100%',
                      maxHeight: 220,
                      objectFit: 'contain',
                      borderRadius: 8,
                      border: '1px solid #eee',
                      cursor: 'pointer',
                      display: 'block',
                      margin: '0 auto'
                    }}
                  />
                </a>
                <span style={{ display: 'block', fontSize: 11, color: '#999', textAlign: 'center', marginTop: 4 }}>Tip: Click the image to view it full-screen in a new tab.</span>
              </div>
            ) : (
              <p style={{ color: '#dc2626', fontStyle: 'italic', marginTop: 14 }}>⚠️ No screenshot uploaded for this online payment.</p>
            )}
          </div>
        )}
      </Modal>

      {/* Reject modal reason input */}
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
            Reject this online payment proof. The customer will be requested to resubmit a valid screenshot proof.
          </p>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Rejection Reason:</label>
          <input 
            type="text"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Transaction Ref ID mismatch, fake bank alert screenshot, etc."
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

    </div>
  );
}
