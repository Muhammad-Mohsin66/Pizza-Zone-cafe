/**
 * AdminPageWrapper — premium page shell used by all admin modules.
 * Provides consistent header, stats strip, and content card.
 */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={styles.pageHeader}>
      <div>
        <h1 style={styles.pageTitle}>{title}</h1>
        {subtitle && <p style={styles.pageSubtitle}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function StatsCard({ icon, label, value, color = '#FF6B35', sub }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statCardTop}>
        <span style={styles.statIcon}>{icon}</span>
        <span style={styles.statLabel}>{label}</span>
      </div>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      {sub && <div style={styles.statSub}>{sub}</div>}
    </div>
  );
}

export function Card({ children, style }) {
  return <div style={{ ...styles.card, ...style }}>{children}</div>;
}

export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, type = 'button', style: extraStyle }) {
  const base = styles.btn;
  const variantStyle = styles[`btn_${variant}`] || styles.btn_primary;
  const sizeStyle = size === 'sm' ? styles.btn_sm : size === 'lg' ? styles.btn_lg : {};
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variantStyle, ...sizeStyle, opacity: disabled ? 0.6 : 1, ...extraStyle }}
    >
      {children}
    </button>
  );
}

export function Badge({ status, map = {} }) {
  const { label, bg, color } = map[status] || { label: status, bg: '#e8e8e3', color: '#555' };
  return (
    <span style={{ ...styles.badge, background: bg, color }}>
      {label}
    </span>
  );
}

export function EmptyState({ icon = '📭', title = 'No data found', sub }) {
  return (
    <div style={styles.emptyState}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>{icon}</div>
      <div style={styles.emptyTitle}>{title}</div>
      {sub && <div style={styles.emptySub}>{sub}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div style={styles.spinnerWrap}>
      <div style={styles.spinner} />
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div style={styles.searchWrap}>
      <span style={styles.searchIcon}>🔍</span>
      <input
        style={styles.searchInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function Modal({ isOpen, title, onClose, children, footer }) {
  if (!isOpen) return null;
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{title}</h3>
          <button style={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={styles.modalBody}>{children}</div>
        {footer && <div style={styles.modalFooter}>{footer}</div>}
      </div>
    </div>
  );
}

export function FormField({ label, children, error }) {
  return (
    <div style={styles.formField}>
      <label style={styles.fieldLabel}>{label}</label>
      {children}
      {error && <span style={styles.fieldError}>{error}</span>}
    </div>
  );
}

export function Input({ value, onChange, placeholder, type = 'text', style: extra }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...styles.input, ...extra }}
    />
  );
}

export function Select({ value, onChange, children, style: extra }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...styles.input, ...extra }}>
      {children}
    </select>
  );
}

export function Table({ columns, data, actions, isLoading, emptyMessage = 'No records found' }) {
  if (isLoading) return <Spinner />;
  if (!data || data.length === 0) return <EmptyState title={emptyMessage} />;

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ ...styles.th, width: col.width }}>
                {col.label}
              </th>
            ))}
            {actions && actions.length > 0 && <th style={styles.th}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={row._id || ri} style={styles.tr}>
              {columns.map((col) => (
                <td key={col.key} style={styles.td}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
              {actions && actions.length > 0 && (
                <td style={styles.td}>
                  <div style={styles.actionRow}>
                    {actions.map((action, ai) => (
                      <button
                        key={ai}
                        onClick={() => action.onClick(row)}
                        style={{ ...styles.actionBtn, ...(action.danger ? styles.actionBtnDanger : {}) }}
                        title={action.label}
                      >
                        {action.icon} {action.label}
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
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  pageHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 28, flexWrap: 'wrap', gap: 12,
  },
  pageTitle: { fontSize: 26, fontWeight: 800, color: '#1a1a1a', margin: 0 },
  pageSubtitle: { fontSize: 13, color: '#888', margin: '4px 0 0', fontWeight: 400 },

  statCard: {
    background: 'white', borderRadius: 12, padding: '18px 22px',
    border: '1px solid #ebebeb', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    transition: 'all 0.2s',
  },
  statCardTop: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  statIcon: { fontSize: 20 },
  statLabel: { fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.8px' },
  statValue: { fontSize: 28, fontWeight: 800, color: '#FF6B35' },
  statSub: { fontSize: 11, color: '#bbb', marginTop: 4 },

  card: {
    background: 'white', borderRadius: 12,
    border: '1px solid #ebebeb', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },

  btn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    border: 'none', borderRadius: 8, cursor: 'pointer',
    fontSize: 13, fontWeight: 600, padding: '9px 18px',
    transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
  },
  btn_primary: { background: '#FF6B35', color: 'white' },
  btn_secondary: { background: '#f0f0ed', color: '#333' },
  btn_danger: { background: '#fee2e2', color: '#dc2626' },
  btn_ghost: { background: 'transparent', color: '#555', border: '1px solid #e0e0e0' },
  btn_sm: { fontSize: 11, padding: '6px 12px' },
  btn_lg: { fontSize: 15, padding: '12px 24px' },

  badge: {
    display: 'inline-flex', alignItems: 'center',
    borderRadius: 20, fontSize: 11, fontWeight: 600,
    padding: '3px 10px',
  },

  emptyState: {
    textAlign: 'center', padding: '60px 24px',
    color: '#999', fontFamily: 'Inter, sans-serif',
  },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: '#555', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#aaa' },

  spinnerWrap: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    padding: '60px 0',
  },
  spinner: {
    width: 40, height: 40, border: '3px solid #f0f0f0',
    borderTop: '3px solid #FF6B35', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#f8f8f6', border: '1px solid #e8e8e3',
    borderRadius: 8, padding: '0 12px', height: 38,
    flex: 1, maxWidth: 320,
  },
  searchIcon: { fontSize: 13, color: '#aaa', flexShrink: 0 },
  searchInput: {
    border: 'none', background: 'transparent', outline: 'none',
    fontSize: 13, color: '#333', flex: 1, fontFamily: 'Inter, sans-serif',
  },

  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 16,
  },
  modal: {
    background: 'white', borderRadius: 16, width: '100%', maxWidth: 520,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
    animation: 'fadeIn 0.2s ease',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '18px 24px', borderBottom: '1px solid #f0f0f0',
  },
  modalTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a1a' },
  modalClose: {
    background: 'none', border: 'none', fontSize: 16, cursor: 'pointer',
    color: '#999', padding: '4px 8px', borderRadius: 4,
  },
  modalBody: { padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto' },
  modalFooter: {
    display: 'flex', gap: 10, justifyContent: 'flex-end',
    padding: '14px 24px', borderTop: '1px solid #f0f0f0',
    background: '#fafaf8',
  },

  formField: { marginBottom: 16 },
  fieldLabel: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 },
  fieldError: { display: 'block', fontSize: 11, color: '#e74c3c', marginTop: 4 },

  input: {
    width: '100%', padding: '9px 12px', border: '1px solid #e0e0e0',
    borderRadius: 8, fontSize: 13, color: '#333', outline: 'none',
    fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
    background: 'white',
  },

  tableWrap: { overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'Inter, sans-serif', tableLayout: 'auto' },
  th: {
    background: '#fafaf8', padding: '11px 16px',
    textAlign: 'left', fontWeight: 600, color: '#666',
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px',
    borderBottom: '1px solid #ebebeb', whiteSpace: 'nowrap',
  },
  tr: { transition: 'background 0.15s' },
  td: {
    padding: '12px 16px', color: '#333',
    borderBottom: '1px solid #f5f5f3', verticalAlign: 'middle',
    whiteSpace: 'nowrap',
  },
  actionRow: { display: 'flex', gap: 6, flexWrap: 'nowrap' },
  actionBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '5px 10px', borderRadius: 6, border: '1px solid #e0e0e0',
    background: '#f8f8f6', color: '#555', fontSize: 11, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
  },
  actionBtnDanger: { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' },
};
