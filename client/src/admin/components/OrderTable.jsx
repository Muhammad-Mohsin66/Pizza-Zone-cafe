import React from 'react';

/**
 * Table Component
 * Reusable responsive table with sorting and actions
 * 
 * Props:
 * - columns: array of { key, label, width?, render? }
 * - data: array of row objects
 * - actions: array of { label, onClick, color?, icon? }
 * - isLoading: boolean
 * - isEmpty: boolean
 * - emptyMessage: string
 */
const Table = ({
  columns,
  data,
  actions = [],
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No data available',
}) => {
  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isEmpty || data.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <p style={styles.emptyText}>📭 {emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>
        {/* Header */}
        <thead>
          <tr style={styles.headerRow}>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  ...styles.headerCell,
                  width: column.width || 'auto',
                }}
              >
                {column.label}
              </th>
            ))}
            {actions.length > 0 && (
              <th style={styles.headerCell}>Actions</th>
            )}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={{
                ...styles.bodyRow,
                backgroundColor: rowIndex % 2 === 0 ? 'white' : '#F5F5F0',
              }}
            >
              {columns.map((column) => (
                <td
                  key={`${rowIndex}-${column.key}`}
                  style={{
                    ...styles.bodyCell,
                    width: column.width || 'auto',
                  }}
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}

              {/* Actions Cell */}
              {actions.length > 0 && (
                <td style={styles.bodyCell}>
                  <div style={styles.actionsContainer}>
                    {actions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => action.onClick(row)}
                        style={{
                          ...styles.actionButton,
                          color: action.color || '#FF6B35',
                        }}
                        title={action.label}
                      >
                        {action.icon || action.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  headerRow: {
    backgroundColor: '#1A1A1A',
    color: 'white',
  },
  headerCell: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  bodyRow: {
    borderBottom: '1px solid #E8E8E3',
    transition: 'background-color 0.2s ease',
  },
  bodyCell: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#2A2A2A',
  },
  actionsContainer: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #E8E8E3',
    borderTop: '4px solid #FF6B35',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '16px',
  },
  emptyContainer: {
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: '16px',
    color: '#999999',
  },
};

// Add animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default Table;
