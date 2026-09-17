import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, FormField, Input, Select, Spinner } from '../components/AdminUI';

const ROLE_MAP = {
  admin:    { label: 'Admin',    bg: '#fee2e2', color: '#dc2626' },
  employee: { label: 'Employee', bg: '#e0f2fe', color: '#0369a1' },
  rider:    { label: 'Rider',    bg: '#dcfce7', color: '#16a34a' },
};

const STATUS_MAP = {
  true:  { label: 'Active',   bg: '#dcfce7', color: '#16a34a' },
  false: { label: 'Inactive', bg: '#fee2e2', color: '#dc2626' },
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
      const [empRes, riderRes, adminRes] = await Promise.all([
        api.get('/users?role=employee&limit=200'),
        api.get('/users?role=rider&limit=200'),
        api.get('/users?role=admin&limit=200'),
      ]);
      setEmployees([
        ...(adminRes.data?.data || []),
        ...(empRes.data?.data || []),
        ...(riderRes.data?.data || []),
      ]);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = employees.filter((e) =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm({ name: '', email: '', phone: '', password: '', role: 'employee' }); setSelected(null); setModal('create'); };
  const openEdit = (emp) => { setForm({ name: emp.name, email: emp.email, phone: emp.phone, password: '', role: emp.role }); setSelected(emp); setModal('edit'); };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.phone) { setError('Name, email, and phone are required'); return; }
    if (modal === 'create' && !form.password) { setError('Password is required for new staff'); return; }
    if (modal === 'create' && form.password.length < 8) { setError('Password must be at least 8 characters long'); return; }
    try {
      setSaving(true); setError('');
      const payload = { name: form.name, email: form.email, phone: form.phone, role: form.role, ...(form.password ? { password: form.password } : {}) };
      modal === 'create' ? await api.post('/users', payload) : await api.put(`/users/${selected._id}`, payload);
      setModal(null); fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (emp) => {
    try {
      await api.patch(`/users/${emp._id}/toggle`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Toggle status failed');
    }
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(`Remove "${emp.name}" from staff?`)) return;
    try {
      await api.delete(`/users/${emp._id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Remove failed');
    }
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
    { key: 'role', label: 'Role', render: (v) => <Badge status={v} map={ROLE_MAP} /> },
    { key: 'isActive', label: 'Status', render: (v) => <Badge status={String(v)} map={STATUS_MAP} /> },
    { key: 'createdAt', label: 'Joined', render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader title="Employees / Staff" subtitle="Manage internal staff accounts and roles"
        action={<Btn onClick={openCreate}>＋ Add Staff Member</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="👥" label="Total Staff" value={employees.length} />
        <StatsCard icon="🔑" label="Admins" value={employees.filter((e) => e.role === 'admin').length} color="#dc2626" />
        <StatsCard icon="🧑‍💼" label="Employees" value={employees.filter((e) => e.role === 'employee').length} color="#0369a1" />
        <StatsCard icon="🏍️" label="Riders" value={employees.filter((e) => e.role === 'rider').length} color="#16a34a" />
        <StatsCard icon="✅" label="Active" value={employees.filter((e) => e.isActive).length} color="#16a34a" />
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search staff…" />
        </div>
        {loading ? <Spinner /> : (
          <Table columns={columns} data={filtered}
            actions={[
              { label: 'Edit', icon: '✏️', onClick: openEdit },
              { label: 'Pwd', icon: '🔒', onClick: (emp) => { setPwdModal(emp); setNewPwd(''); setError(''); } },
              { label: 'Toggle', icon: '🔄', onClick: handleToggle },
              { label: 'Remove', icon: '🗑️', onClick: handleDelete, danger: true },
            ]}
            emptyMessage="No staff members found"
          />
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal isOpen={!!modal} title={modal === 'create' ? 'Add Staff Member' : 'Edit Staff Member'} onClose={() => { setModal(null); setError(''); }}
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn></>}
      >
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
        <FormField label="Full Name *"><Input value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="John Doe" /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Email *"><Input type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="john@pizzazone.com" /></FormField>
          <FormField label="Phone *"><Input value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="3001234567" /></FormField>
          <FormField label="Role">
            <Select value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))}>
              <option value="employee">Employee</option>
              <option value="rider">Rider</option>
              <option value="admin">Admin</option>
            </Select>
          </FormField>
          {modal === 'create' && (
            <FormField label="Password *">
              <Input type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="Min 8 characters" />
            </FormField>
          )}
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
