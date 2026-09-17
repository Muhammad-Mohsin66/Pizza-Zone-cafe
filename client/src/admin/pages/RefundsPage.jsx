import React, { useState, useEffect } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, Spinner } from '../components/AdminUI';
import { useToast, ToastContainer } from '../../shared/components/Toast';

const STATUS_MAP = {
  Requested:   { label: 'Requested',   bg: '#fef3c7', color: '#b45309' },
  Approved:    { label: 'Approved',    bg: '#ede9fe', color: '#7c3aed' },
  Rejected:    { label: 'Rejected',    bg: '#fee2e2', color: '#dc2626' },
  Processed:   { label: 'Processed',   bg: '#dcfce7', color: '#16a34a' },
};

export default function RefundsPage() {
  const { toasts, removeToast, showError, showSuccess } = useToast();

  const getPaymentImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
    const serverUrl = apiBase.replace('/api', '');
    return `${serverUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // States
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals & Action states
  const [viewModal, setViewModal] = useState(null);
  const [actionModal, setActionModal] = useState(null); // 'approve' | 'reject' | 'process'
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch up to 1000 refunds to avoid default limit of 10
      const res = await api.get('/refunds/admin/all?limit=1000');
      setRefunds(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching refunds:', err);
      showError('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenActionModal = (actionType) => {
    setActionModal(actionType);
    setAdminNote('');
  };

  const handleExecuteAction = async () => {
    const refundId = viewModal?._id;
    if (!refundId || !actionModal) return;

    // Reject action REQUIRES a rejection reason (adminNote)
    if (actionModal === 'reject' && !adminNote.trim()) {
      showError('Rejection reason is required');
      return;
    }

    try {
      setProcessing(true);
      
      let endpoint = '';
      if (actionModal === 'approve') endpoint = 'approve';
      else if (actionModal === 'reject') endpoint = 'reject';
      else if (actionModal === 'process') endpoint = 'process';

      await api.patch(`/refunds/${refundId}/${endpoint}`, {
        adminNote: adminNote.trim()
      });

      showSuccess(`Refund successfully ${actionModal}ed`);
      
      // Reload and close modals
      await fetchData();
      setViewModal(null);
      setActionModal(null);
      setAdminNote('');
    } catch (err) {
      showError(err.response?.data?.message || `Failed to ${actionModal} refund`);
    } finally {
      setProcessing(false);
    }
  };

  const filtered = refunds.filter((r) => {
    const matchesSearch =
      r.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.customer?.phone?.includes(search) ||
      r.user?.phone?.includes(search) ||
      r._id?.toLowerCase().includes(search.toLowerCase()) ||
      (r.order?._id || r.order)?.toString().toLowerCase().includes(search.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { key: '_id', label: 'Refund ID', render: (v) => <strong style={{ color: '#555' }}>#{v ? v.slice(-8).toUpperCase() : ''}</strong> },
    { key: 'customer', label: 'Customer', render: (v, row) => row.customer?.name || row.user?.name || '—' },
    { key: 'order', label: 'Order Ref', render: (v) => v ? <strong>#{ (v._id || v).toString().slice(-8).toUpperCase() }</strong> : '—' },
    { key: 'amount', label: 'Amount', render: (v) => <span style={{ color: '#FF6B35', fontWeight: 700 }}>Rs. {v || 0}</span> },
    { key: 'reason', label: 'Reason', render: (v) => <span style={{ maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} map={STATUS_MAP} /> },
    { key: 'createdAt', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <PageHeader 
        title="Refunds" 
        subtitle="Review, approve, and mark customer refund requests as processed"
        action={<Btn variant="ghost" onClick={fetchData} size="sm">🔄 Refresh Data</Btn>}
      />

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="↩️" label="Total Refunds" value={refunds.length} />
        <StatsCard icon="⏳" label="Requested" value={refunds.filter((r) => r.status === 'Requested').length} color="#b45309" />
        <StatsCard icon="✅" label="Approved" value={refunds.filter((r) => r.status === 'Approved').length} color="#7c3aed" />
        <StatsCard icon="💸" label="Processed" value={refunds.filter((r) => r.status === 'Processed').length} color="#16a34a" />
        <StatsCard icon="❌" label="Rejected" value={refunds.filter((r) => r.status === 'Rejected').length} color="#dc2626" />
      </div>

      <Card>
        {/* Filters bar */}
        <div style={{ display: 'flex', gap: 16, padding: '16px 20px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by customer, phone, ID, or order ref…" />
          
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
              <option value="All">All Refunds</option>
              <option value="Requested">Requested</option>
              <option value="Approved">Approved</option>
              <option value="Processed">Processed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}><Spinner /></div>
        ) : (
          <Table 
            columns={columns} 
            data={filtered}
            actions={[{ label: 'View Details', icon: '👁️', onClick: (r) => setViewModal(r) }]}
            emptyMessage="No refund requests found."
          />
        )}
      </Card>

      {/* Refund Details Modal */}
      <Modal 
        isOpen={!!viewModal && !actionModal} 
        title="Refund Request Details" 
        onClose={() => setViewModal(null)}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            {viewModal?.status === 'Requested' && (
              <>
                <Btn variant="primary" size="sm" onClick={() => handleOpenActionModal('approve')}>✅ Approve Refund</Btn>
                <Btn variant="danger" size="sm" onClick={() => handleOpenActionModal('reject')}>❌ Reject Refund</Btn>
              </>
            )}
            {viewModal?.status === 'Approved' && (
              <Btn variant="primary" size="sm" onClick={() => handleOpenActionModal('process')}>💸 Mark Processed</Btn>
            )}
            <Btn variant="ghost" size="sm" onClick={() => setViewModal(null)}>Close</Btn>
          </div>
        }
      >
        {viewModal && (
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>
            {[
              ['Refund ID', `#${viewModal._id?.slice(-8).toUpperCase()}`],
              ['Customer', viewModal.customer?.name || viewModal.user?.name || '—'],
              ['Customer Email', viewModal.user?.email || viewModal.customer?.email || '—'],
              ['Customer Phone', viewModal.user?.phone || viewModal.customer?.phone || '—'],
              ['Order Reference', `#${(viewModal.order?._id || viewModal.order)?.toString().slice(-8).toUpperCase()}`],
              ['Refund Amount', `Rs. ${viewModal.amount}`],
              ['Customer Reason', viewModal.reason],
              ['Current Status', viewModal.status],
              ['Submitted Date', new Date(viewModal.createdAt).toLocaleString()],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', borderBottom: '1px solid #f5f5f5', padding: '8px 0' }}>
                <span style={{ color: '#888', minWidth: 140 }}>{k}</span>
                <span style={{ fontWeight: 600, color: '#222' }}>{v}</span>
              </div>
            ))}

            {/* Admin Note if present */}
            {viewModal.adminNote && (
              <div style={{ marginTop: 14, padding: 10, backgroundColor: '#f9f9fb', borderRadius: 8, borderLeft: '3px solid #FF6B35' }}>
                <strong>Staff Note:</strong> {viewModal.adminNote}
              </div>
            )}

            {/* Online payment receipt screenshot if present */}
            {viewModal.payment?.screenshot && (
              <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 14 }}>
                <strong style={{ display: 'block', marginBottom: 8, color: '#333' }}>💳 Online Payment Receipt Verification</strong>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <a href={getPaymentImageUrl(viewModal.payment.screenshot)} target="_blank" rel="noreferrer" title="Click to view full image">
                    <img 
                      src={getPaymentImageUrl(viewModal.payment.screenshot)} 
                      alt="Payment proof screenshot" 
                      style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer' }}
                    />
                  </a>
                  <div style={{ fontSize: 11, color: '#666', lineHeight: '1.6' }}>
                    <p style={{ margin: '0 0 4px 0' }}><strong>Payment Method:</strong> {viewModal.payment.paymentMethod || 'Online'}</p>
                    <p style={{ margin: '0 0 4px 0' }}><strong>Payment Status:</strong> {viewModal.payment.status || 'Verified'}</p>
                    <p style={{ margin: '0' }}>Click on the thumbnail to open the full size receipt in a new tab.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action Dialog (Approve / Reject / Process) */}
      <Modal
        isOpen={!!actionModal}
        title={`${actionModal?.toUpperCase()} Refund Request`}
        onClose={() => setActionModal(null)}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn 
              variant={actionModal === 'reject' ? 'danger' : 'primary'} 
              size="sm" 
              onClick={handleExecuteAction} 
              disabled={processing}
            >
              Confirm
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => setActionModal(null)}>Cancel</Btn>
          </div>
        }
      >
        <div>
          {actionModal === 'approve' && (
            <p style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
              Are you sure you want to approve this refund request? The order status will update to <strong>Refund Requested</strong>.
            </p>
          )}
          {actionModal === 'reject' && (
            <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 12 }}>
              ⚠️ You are rejecting this refund request. A rejection reason is required below:
            </p>
          )}
          {actionModal === 'process' && (
            <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, marginBottom: 12 }}>
              Marking this refund as processed. The associated order status will automatically update to <strong>Refunded</strong>.
            </p>
          )}

          <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>
            {actionModal === 'reject' ? 'Rejection Reason (Required):' : 'Staff Note (Optional):'}
          </label>
          <input 
            type="text"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder={actionModal === 'reject' ? "e.g. Past 24 hours refund period, order was delivered correct, etc." : "Add comments or reference notes..."}
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
