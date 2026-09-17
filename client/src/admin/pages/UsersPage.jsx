import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, FormField, Input, Select, Spinner } from '../components/AdminUI';

const ROLE_MAP = {
  admin:    { label: 'Admin',    bg: '#fee2e2', color: '#dc2626' },
  employee: { label: 'Employee', bg: '#e0f2fe', color: '#0369a1' },
  rider:    { label: 'Rider',    bg: '#dcfce7', color: '#16a34a' },
  customer: { label: 'Customer', bg: '#ede9fe', color: '#7c3aed' },
};

const STATUS_MAP = {
  true:  { label: 'Active',   bg: '#dcfce7', color: '#16a34a' },
  false: { label: 'Inactive', bg: '#fee2e2', color: '#dc2626' },
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'employee' });
  const [pwdModal, setPwdModal] = useState(null);
  const [newPwd, setNewPwd] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        api.get(`/users?limit=200${roleFilter ? `&role=${roleFilter}` : ''}`),
        api.get('/users/stats'),
      ]);
      setUsers(usersRes.data?.data || []);
      setStats(statsRes.data?.data || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [roleFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm({ name: '', email: '', phone: '', password: '', role: 'employee' }); setSelected(null); setModal('create'); };
  const openEdit = (u) => { setForm({ name: u.name, email: u.email, phone: u.phone, password: '', role: u.role }); setSelected(u); setModal('edit'); };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.phone) { setError('Name, email, and phone are required'); return; }
    if (modal === 'create' && !form.password) { setError('Password is required for new users'); return; }
    try {
      setSaving(true); setError('');
      const payload = { name: form.name, email: form.email, phone: form.phone, role: form.role, ...(form.password ? { password: form.password } : {}) };
      modal === 'create' ? await api.post('/users', payload) : await api.put(`/users/${selected._id}`, payload);
      setModal(null); fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (u) => { await api.patch(`/users/${u._id}/toggle`); fetchData(); };
  const handleDelete = async (u) => { if (!window.confirm(`Delete user "${u.name}"?`)) return; await api.delete(`/users/${u._id}`); fetchData(); };
  const handleResetPwd = async () => {
    if (!newPwd || newPwd.length < 6) { return; }
    try {
      await api.patch(`/users/${pwdModal._id}/password`, { newPassword: newPwd });
      setPwdModal(null); setNewPwd('');
    } catch { /* silently fail */ }
  };

  const getStatCount = (role) => stats.find((s) => s._id === role)?.count || 0;

  const columns = [
    { key: 'name', label: 'Name', render: (v) => <strong>{v}</strong> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role', render: (v) => <Badge status={v} map={ROLE_MAP} /> },
    { key: 'isActive', label: 'Status', render: (v) => <Badge status={String(v)} map={STATUS_MAP} /> },
    { key: 'createdAt', label: 'Joined', render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader title="User Accounts" subtitle="Manage all platform users — admins, staff, riders, and customers"
        action={<Btn onClick={openCreate}>＋ Create User</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="👥" label="Total Users" value={users.length} />
        <StatsCard icon="🔑" label="Admins" value={getStatCount('admin')} color="#dc2626" />
        <StatsCard icon="🧑‍💼" label="Employees" value={getStatCount('employee')} color="#0369a1" />
        <StatsCard icon="🏍️" label="Riders" value={getStatCount('rider')} color="#16a34a" />
        <StatsCard icon="👤" label="Customers" value={getStatCount('customer')} color="#7c3aed" />
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search users…" />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ padding: '7px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, color: '#555', background: 'white' }}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="employee">Employee</option>
            <option value="rider">Rider</option>
            <option value="customer">Customer</option>
          </select>
        </div>
        {loading ? <Spinner /> : (
          <Table columns={columns} data={filtered}
            actions={[
              { label: 'Edit', icon: '✏️', onClick: openEdit },
              { label: 'Pwd', icon: '🔒', onClick: (u) => { setPwdModal(u); setNewPwd(''); } },
              { label: 'Toggle', icon: '🔄', onClick: handleToggle },
              { label: 'Delete', icon: '🗑️', onClick: handleDelete, danger: true },
            ]}
            emptyMessage="No users found"
          />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={!!modal} title={modal === 'create' ? 'Create User' : 'Edit User'} onClose={() => { setModal(null); setError(''); }}
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn></>}
      >
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
        <FormField label="Full Name *"><Input value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Full Name" /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Email *"><Input type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="user@pizzazone.com" /></FormField>
          <FormField label="Phone *"><Input value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="3001234567" /></FormField>
          <FormField label="Role *">
            <Select value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))}>
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
              <option value="rider">Rider</option>
              <option value="customer">Customer</option>
            </Select>
          </FormField>
          {modal === 'create' && (
            <FormField label="Password *"><Input type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="Min 6 characters" /></FormField>
          )}
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={!!pwdModal} title={`Reset Password — ${pwdModal?.name}`} onClose={() => setPwdModal(null)}
        footer={<><Btn variant="ghost" onClick={() => setPwdModal(null)}>Cancel</Btn><Btn onClick={handleResetPwd}>Reset Password</Btn></>}
      >
        <FormField label="New Password (min 6 chars)"><Input type="password" value={newPwd} onChange={setNewPwd} placeholder="New password" /></FormField>
      </Modal>
    </div>
  );
}
