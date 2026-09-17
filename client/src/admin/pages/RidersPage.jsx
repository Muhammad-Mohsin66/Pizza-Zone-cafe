import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, FormField, Input, Select, Spinner } from '../components/AdminUI';

const AVAIL_MAP = {
  true:  { label: 'Available',    bg: '#dcfce7', color: '#16a34a' },
  false: { label: 'Unavailable',  bg: '#fee2e2', color: '#dc2626' },
};

export default function RidersPage() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewModal, setViewModal] = useState(null);
  const [riderDeliveries, setRiderDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  // CRUD states
  const [modal, setModal] = useState(null); // 'create' | 'edit'
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', isActive: true });
  const [pwdModal, setPwdModal] = useState(null);
  const [newPwd, setNewPwd] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?role=rider&limit=200');
      setRiders(res.data?.data || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = riders.filter((r) =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.phone?.includes(search) ||
    r.email?.toLowerCase().includes(search.toLowerCase())
  );

  const viewRider = async (rider) => {
    setViewModal(rider);
    setLoadingDeliveries(true);
    try {
      const res = await api.get(`/orders/admin/all?rider=${rider._id}&limit=5`);
      setRiderDeliveries(res.data?.data || []);
    } catch { setRiderDeliveries([]); }
    finally { setLoadingDeliveries(false); }
  };

  const openCreate = () => {
    setForm({ name: '', email: '', phone: '', password: '', isActive: true });
    setSelected(null);
    setError('');
    setModal('create');
  };

  const openEdit = (r) => {
    setForm({ name: r.name, email: r.email, phone: r.phone, password: '', isActive: r.isActive });
    setSelected(r);
    setError('');
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.phone) {
      setError('Name, email, and phone are required');
      return;
    }
    if (modal === 'create' && !form.password) {
      setError('Password is required for new riders');
      return;
    }
    if (form.password && form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const payload = {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        phone: form.phone.trim(),
        role: 'rider',
        isActive: form.isActive,
        ...(form.password ? { password: form.password } : {})
      };
      if (modal === 'create') {
        await api.post('/users', payload);
      } else {
        await api.put(`/users/${selected._id}`, payload);
      }
      setModal(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rider) => {
    try {
      await api.patch(`/users/${rider._id}/toggle`);
      fetchData();
    } catch { /* silently fail */ }
  };

  const handleDelete = async (rider) => {
    if (!window.confirm(`Are you sure you want to deactivate rider "${rider.name}"?`)) return;
    try {
      await api.delete(`/users/${rider._id}`);
      fetchData();
    } catch { /* silently fail */ }
  };

  const handleResetPwd = async () => {
    if (!newPwd || newPwd.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    try {
      setError('');
      await api.patch(`/users/${pwdModal._id}/password`, { newPassword: newPwd });
      setPwdModal(null);
      setNewPwd('');
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (v) => <strong>{v}</strong> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'isActive', label: 'Status', render: (v) => <Badge status={String(v)} map={AVAIL_MAP} /> },
    { key: 'createdAt', label: 'Joined', render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader title="Riders" subtitle="Manage delivery riders and view their delivery history"
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" onClick={fetchData} size="sm">🔄 Refresh</Btn>
            <Btn onClick={openCreate} size="sm">＋ Create Rider</Btn>
          </div>
        }
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="🏍️" label="Total Riders" value={riders.length} />
        <StatsCard icon="✅" label="Active" value={riders.filter((r) => r.isActive).length} color="#16a34a" />
        <StatsCard icon="❌" label="Inactive" value={riders.filter((r) => !r.isActive).length} color="#dc2626" />
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search riders…" />
        </div>
        {loading ? <Spinner /> : (
          <Table columns={columns} data={filtered}
            actions={[
              { label: 'View', icon: '👁️', onClick: viewRider },
              { label: 'Edit', icon: '✏️', onClick: openEdit },
              { label: 'Pwd', icon: '🔒', onClick: (r) => { setPwdModal(r); setNewPwd(''); setError(''); } },
              { label: 'Toggle', icon: '🔄', onClick: handleToggle },
              { label: 'Delete', icon: '🗑️', onClick: handleDelete, danger: true },
            ]}
            emptyMessage="No riders found"
          />
        )}
      </Card>

      {/* Details Modal */}
      <Modal isOpen={!!viewModal} title={`Rider — ${viewModal?.name}`} onClose={() => setViewModal(null)}
        footer={<Btn variant="ghost" onClick={() => setViewModal(null)}>Close</Btn>}
      >
        {viewModal && (
          <>
            <div style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>
              {[
                ['Name', viewModal.name],
                ['Email', viewModal.email],
                ['Phone', viewModal.phone],
                ['Status', viewModal.isActive ? '✅ Active' : '❌ Inactive'],
                ['Joined', new Date(viewModal.createdAt).toLocaleString()]
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', borderBottom: '1px solid #f5f5f5', padding: '7px 0' }}>
                  <span style={{ color: '#888', minWidth: 80 }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#555' }}>Recent Deliveries</h4>
            {loadingDeliveries ? <Spinner /> : riderDeliveries.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center' }}>No deliveries yet</p>
            ) : riderDeliveries.map((o) => (
              <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                <span>#{o._id.slice(-8).toUpperCase()}</span>
                <span style={{ color: '#555', fontWeight: 600 }}>{o.orderStatus}</span>
                <span style={{ color: '#888' }}>{new Date(o.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={!!modal} title={modal === 'create' ? 'Create Rider' : 'Edit Rider'} onClose={() => { setModal(null); setError(''); }}
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn></>}
      >
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
        <FormField label="Full Name *"><Input value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Full Name" /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Email *"><Input type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="rider@pizzazone.com" /></FormField>
          <FormField label="Phone *"><Input value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="03001234567" /></FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {modal === 'create' ? (
            <FormField label="Password *"><Input type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="Min 8 characters" /></FormField>
          ) : <div />}
          <FormField label="Availability *">
            <Select value={String(form.isActive)} onChange={(v) => setForm((f) => ({ ...f, isActive: v === 'true' }))}>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </Select>
          </FormField>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={!!pwdModal} title={`Reset Password — ${pwdModal?.name}`} onClose={() => { setPwdModal(null); setError(''); }}
        footer={<><Btn variant="ghost" onClick={() => setPwdModal(null)}>Cancel</Btn><Btn onClick={handleResetPwd}>Reset Password</Btn></>}
      >
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
        <FormField label="New Password (min 8 chars)"><Input type="password" value={newPwd} onChange={setNewPwd} placeholder="New password" /></FormField>
      </Modal>
    </div>
  );
}
