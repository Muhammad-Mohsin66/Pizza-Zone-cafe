import React from 'react';

/**
 * StatusBadge Component
 * Displays order/payment status with appropriate colors
 * 
 * Props:
 * - type: 'order' | 'payment'
 * - status: order/payment status string
 */
const StatusBadge = ({ type = 'order', status }) => {
  const getOrderStatusColor = (status) => {
    const statusMap = {
      'Pending': '#FFC107',
      'Confirmed': '#2196F3',
      'Preparing': '#FF9800',
      'Ready': '#8BC34A',
      'Assigned': '#9C27B0',
      'Assigned to Rider': '#9C27B0',
      'Handover to Rider': '#00BCD4',
      'Delivered': '#4CAF50',
      'Cancelled': '#F44336',
    };
    return statusMap[status] || '#999999';
  };

  const getPaymentStatusColor = (status) => {
    const statusMap = {
      'Pending': '#FFC107',
      'Paid': '#4CAF50',
      'Verified': '#4CAF50',
      'Failed': '#F44336',
      'Refunded': '#2196F3',
    };
    return statusMap[status] || '#999999';
  };

  const color = type === 'order' 
    ? getOrderStatusColor(status) 
    : getPaymentStatusColor(status);

  return (
    <div style={{
      display: 'inline-block',
      backgroundColor: color,
      color: 'white',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'capitalize',
    }}>
      {status}
    </div>
  );
};

export default StatusBadge;
