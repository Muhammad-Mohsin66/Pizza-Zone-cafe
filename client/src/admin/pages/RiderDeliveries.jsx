import React, { useState, useEffect } from 'react';
import api from '../../shared/services/api';
import StatusBadge from '../../shared/components/StatusBadge';
import ConfirmModal from '../../shared/components/ConfirmModal';
import OrderTable from '../components/OrderTable';
import { useToast, ToastContainer } from '../../shared/components/Toast';

const RiderDeliveries = () => {
  const { toasts, removeToast, showError, showSuccess } = useToast();

  // States
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [handoverModal, setHandoverModal] = useState(false);
  const [completeModal, setCompleteModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [completing, setCompleting] = useState(false);

  // Fetch deliveries on mount
  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/rider/deliveries');
      if (response.data?.data) {
        setDeliveries(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      showError('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHandover = (orderId) => {
    setSelectedOrderId(orderId);
    setHandoverModal(true);
  };

  const handleConfirmHandover = async () => {
    if (!selectedOrderId) return;

    try {
      setCompleting(true);
      await api.patch(`/orders/${selectedOrderId}/delivery-status`, {
        newStatus: 'Handover to Rider',
      });
      showSuccess('Order marked as received (Handover to Rider)');

      // Update local state
      setDeliveries((prev) =>
        prev.map((delivery) =>
          delivery._id === selectedOrderId
            ? { ...delivery, orderStatus: 'Handover to Rider' }
            : delivery
        )
      );

      setHandoverModal(false);
      setSelectedOrderId(null);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setCompleting(false);
    }
  };

  const handleMarkDelivered = (orderId) => {
    setSelectedOrderId(orderId);
    setCompleteModal(true);
  };

  const handleConfirmDeliver = async () => {
    if (!selectedOrderId) return;

    try {
      setCompleting(true);
      await api.patch(`/orders/${selectedOrderId}/delivery-status`, {
        newStatus: 'Delivered',
      });
      showSuccess('Order marked as delivered');

      // Update local state
      setDeliveries((prev) =>
        prev.map((delivery) =>
          delivery._id === selectedOrderId
            ? { ...delivery, orderStatus: 'Delivered' }
            : delivery
        )
      );

      setCompleteModal(false);
      setSelectedOrderId(null);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to complete delivery');
    } finally {
      setCompleting(false);
    }
  };

  // Table columns
  const columns = [
    {
      key: '_id',
      label: 'Order ID',
      width: '120px',
      render: (value) => `#${value.slice(-8).toUpperCase()}`,
    },
    {
      key: 'customer',
      label: 'Customer',
      width: '150px',
      render: (value, row) => row.customer?.name || 'N/A',
    },
    {
      key: 'phone',
      label: 'Phone',
      width: '130px',
      render: (value, row) => row.phoneNumber || row.customer?.phone || 'N/A',
    },
    {
      key: 'address',
      label: 'Address',
      width: '200px',
      render: (value, row) => row.shippingAddress || 'N/A',
    },
    {
      key: 'grandTotal',
      label: 'Total',
      width: '100px',
      render: (value) => `Rs. ${value || 0}`,
    },
    {
      key: 'paymentMethod',
      label: 'Payment',
      width: '100px',
      render: (value) => (
        <span style={{
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: value === 'COD' ? '#f3f4f6' : '#e0f2fe',
          color: value === 'COD' ? '#374151' : '#0369a1'
        }}>
          {value || 'N/A'}
        </span>
      ),
    },
    {
      key: 'orderStatus',
      label: 'Status',
      width: '150px',
      render: (value) => <StatusBadge type="order" status={value} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '180px',
      render: (value, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {row.orderStatus === 'Assigned to Rider' && (
            <button
              onClick={() => handleMarkHandover(row._id)}
              style={{
                backgroundColor: '#00BCD4',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              🤝 Accept Handover
            </button>
          )}
          {(row.orderStatus === 'Handover to Rider' || row.orderStatus === 'Assigned to Rider') && (
            <button
              onClick={() => handleMarkDelivered(row._id)}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              ✓ Yes, Delivered
            </button>
          )}
        </div>
      ),
    },
  ];

  const actions = [];

  const pendingDeliveries = deliveries.filter(
    (d) => d.orderStatus !== 'Delivered'
  ).length;

  return (
    <div style={styles.container}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>My Deliveries</h1>
        <p style={styles.subtitle}>Track and complete your delivery orders</p>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Assigned</p>
          <p style={styles.statValue}>{deliveries.length}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Pending Delivery</p>
          <p style={{ ...styles.statValue, color: '#FF9800' }}>
            {pendingDeliveries}
          </p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Completed</p>
          <p style={{ ...styles.statValue, color: '#4CAF50' }}>
            {deliveries.filter((d) => d.orderStatus === 'Delivered').length}
          </p>
        </div>
      </div>

      {/* Deliveries Table */}
      <div style={styles.tableCard}>
        <OrderTable
          columns={columns}
          data={deliveries}
          actions={actions}
          isLoading={loading}
          isEmpty={deliveries.length === 0}
          emptyMessage="No deliveries assigned"
        />
      </div>

      {/* Accept Handover Modal */}
      <ConfirmModal
        isOpen={handoverModal}
        title="Accept Handover?"
        message="Have you received this order from the branch/staff? Confirming will change the status to Handover to Rider."
        confirmText="Yes, Received"
        cancelText="Cancel"
        onConfirm={handleConfirmHandover}
        onCancel={() => setHandoverModal(false)}
        isLoading={completing}
      />

      {/* Complete Delivery Modal */}
      <ConfirmModal
        isOpen={completeModal}
        title="Mark as Delivered?"
        message={
          deliveries.find(d => d._id === selectedOrderId)?.paymentMethod === 'COD' 
            ? `This is a Cash on Delivery order. Have you collected Rs. ${deliveries.find(d => d._id === selectedOrderId)?.grandTotal} from the customer and completed the delivery?` 
            : "Have you completed the delivery for this order? Please confirm when the customer has received their order."
        }
        confirmText={
          deliveries.find(d => d._id === selectedOrderId)?.paymentMethod === 'COD' 
            ? "Yes, Payment Received & Delivered" 
            : "Yes, Delivered"
        }
        cancelText="Cancel"
        onConfirm={handleConfirmDeliver}
        onCancel={() => setCompleteModal(false)}
        isLoading={completing}
      />
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#F5F5F0',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1A1A1A',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666666',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #E8E8E3',
  },
  statLabel: {
    fontSize: '12px',
    color: '#999999',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#FF6B35',
    margin: 0,
  },
  tableCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
  },
};

export default RiderDeliveries;
