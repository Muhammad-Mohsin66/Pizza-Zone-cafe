/**
 * PlaceholderPage — Admin routes awaiting dedicated UI.
 * Preserves existing "Coming Soon" experience.
 */
export default function PlaceholderPage({ title, icon, description }) {
  return (
    <div style={{
      padding: '60px 24px',
      textAlign: 'center',
      color: '#1A1A1A',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>{icon}</div>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>{title}</h1>
      <p style={{ fontSize: '15px', color: '#666', maxWidth: '400px', margin: '0 auto 32px' }}>{description}</p>
      <div style={{
        display: 'inline-block',
        padding: '12px 28px',
        backgroundColor: '#FF6B35',
        color: 'white',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 600,
      }}>
        🚧 Coming Soon
      </div>
    </div>
  );
}
