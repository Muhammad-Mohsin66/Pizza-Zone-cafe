import React from 'react';

/**
 * OrderTimeline Component
 * Displays order status progression with visual timeline
 * 
 * Props:
 * - currentStatus: string (current order status)
 */
const OrderTimeline = ({ currentStatus }) => {
  const statuses = [
    { label: 'Pending', icon: '📋', color: '#FFC107' },
    { label: 'Confirmed', icon: '✓', color: '#2196F3' },
    { label: 'Preparing', icon: '👨‍🍳', color: '#FF9800' },
    { label: 'Ready', icon: '📦', color: '#8BC34A' },
    { label: 'Assigned', icon: '🚗', color: '#9C27B0' },
    { label: 'Handover to Rider', icon: '🤝', color: '#00BCD4' },
    { label: 'Delivered', icon: '✓✓', color: '#4CAF50' },
  ];

  // Find current status index
  const currentIndex = statuses.findIndex(s => s.label === currentStatus);

  return (
    <div style={styles.container}>
      <div style={styles.timeline}>
        {statuses.map((status, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div key={status.label} style={styles.timelineItem}>
              {/* Circle */}
              <div
                style={{
                  ...styles.circle,
                  backgroundColor: isCurrent ? status.color : isCompleted ? '#4CAF50' : '#E8E8E3',
                  borderColor: isCurrent ? status.color : 'transparent',
                }}
              >
                <span style={{
                  fontSize: '16px',
                  color: isUpcoming ? '#999999' : 'white',
                }}>
                  {status.icon}
                </span>
              </div>

              {/* Label */}
              <div
                style={{
                  ...styles.label,
                  color: isCurrent ? status.color : isCompleted ? '#4CAF50' : '#999999',
                  fontWeight: isCurrent || isCompleted ? '600' : '500',
                }}
              >
                {status.label}
              </div>

              {/* Connector Line */}
              {index < statuses.length - 1 && (
                <div
                  style={{
                    ...styles.connector,
                    backgroundColor: index < currentIndex ? '#4CAF50' : '#E8E8E3',
                  }}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    padding: '20px',
    backgroundColor: '#F5F5F0',
    borderRadius: '12px',
  },
  timeline: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    gap: '8px',
    flexWrap: 'wrap',
  },
  timelineItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    minWidth: '100px',
    position: 'relative',
  },
  circle: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid transparent',
    flexShrink: 0,
    transition: 'all 0.3s ease',
  },
  label: {
    fontSize: '11px',
    marginTop: '8px',
    textAlign: 'center',
    transition: 'color 0.3s ease',
  },
  connector: {
    position: 'absolute',
    top: '22px',
    left: '50%',
    width: '100%',
    height: '2px',
    transform: 'translateX(22px)',
    zIndex: -1,
  },
};

export default OrderTimeline;
