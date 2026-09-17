import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, FormField, Input, Select, Spinner } from '../components/AdminUI';

const TYPE_MAP = {
  order:       { label: 'Order',       bg: '#dcfce7', color: '#16a34a' },
  promotion:   { label: 'Promotion',   bg: '#fce7f3', color: '#be185d' },
  system:      { label: 'System',      bg: '#e0f2fe', color: '#0369a1' },
  alert:       { label: 'Alert',       bg: '#fee2e2', color: '#dc2626' },
  reminder:    { label: 'Reminder',    bg: '#fef3c7', color: '#b45309' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'promotion' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications?limit=200');
      setNotifications(res.data?.data?.notifications || res.data?.data || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const markRead = async () => {
      try {
        await api.put('/notifications/mark-all-read');
      } catch { /* silently fail */ }
    };
    markRead();
    fetchData();
  }, [fetchData]);

  const filtered = notifications.filter((n) =>
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.message?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    if (!form.title || !form.message) { setError('Title and message are required'); return; }
    try {
      setSaving(true); setError('');
      await api.post('/notifications', form);
      setModal(false);
      setForm({ title: '', message: '', type: 'promotion' });
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to send'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (n) => {
    if (!window.confirm(`Delete notification "${n.title}"?`)) return;
    await api.delete(`/notifications/${n._id}`);
    fetchData();
  };

  const columns = [
    { key: 'title', label: 'Title', render: (v) => <strong>{v}</strong> },
    { key: 'message', label: 'Message', render: (v) => <span style={{ maxWidth: 300, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span> },
    { key: 'type', label: 'Type', render: (v) => <Badge status={v} map={TYPE_MAP} /> },
    { key: 'isRead', label: 'Read', render: (v) => v ? '✓' : '—' },
    { key: 'createdAt', label: 'Sent', render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader title="Notifications" subtitle="Send and manage system notifications"
        action={<Btn onClick={() => setModal(true)}>📢 Send Notification</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="🔔" label="Total Sent" value={notifications.length} />
        <StatsCard icon="📭" label="Unread" value={notifications.filter((n) => !n.isRead).length} color="#b45309" />
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search notifications…" />
        </div>
        {loading ? <Spinner /> : (
          <Table columns={columns} data={filtered}
            actions={[{ label: 'Delete', icon: '🗑️', onClick: handleDelete, danger: true }]}
            emptyMessage="No notifications found"
          />
        )}
      </Card>

      <Modal isOpen={modal} title="Send Notification" onClose={() => { setModal(false); setError(''); }}
        footer={<><Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn><Btn onClick={handleSend} disabled={saving}>{saving ? 'Sending…' : 'Send'}</Btn></>}
      >
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
        <FormField label="Title *"><Input value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Notification title" /></FormField>
        <FormField label="Type">
          <Select value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v }))}>
            {Object.keys(TYPE_MAP).map((t) => <option key={t} value={t}>{TYPE_MAP[t].label}</option>)}
          </Select>
        </FormField>
        <FormField label="Message *">
          <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            placeholder="Write your notification message…"
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, resize: 'vertical', minHeight: 96, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
          />
        </FormField>
      </Modal>
    </div>
  );
}
