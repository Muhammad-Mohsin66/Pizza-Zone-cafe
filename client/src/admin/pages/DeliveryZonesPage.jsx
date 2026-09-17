import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, FormField, Input, Select, Spinner } from '../components/AdminUI';

const STATUS_MAP = {
  true:  { label: 'Active',   bg: '#dcfce7', color: '#16a34a' },
  false: { label: 'Inactive', bg: '#fee2e2', color: '#dc2626' },
};

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', baseCharge: '', perKmRate: '', estimatedTime: '', radius: '' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/delivery-zones');
      setZones(res.data?.data || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = zones.filter((z) => z.name?.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setForm({ name: '', description: '', baseCharge: '', perKmRate: '', estimatedTime: '', radius: '' }); setSelected(null); setModal('create'); };
  const openEdit = (zone) => { setForm({ name: zone.name, description: zone.description || '', baseCharge: zone.baseCharge, perKmRate: zone.perKmRate, estimatedTime: zone.estimatedTime, radius: zone.radius }); setSelected(zone); setModal('edit'); };

  const handleSave = async () => {
    if (!form.name || !form.baseCharge || !form.perKmRate || !form.estimatedTime || !form.radius) { setError('All fields are required'); return; }
    try {
      setSaving(true); setError('');
      const payload = { ...form, baseCharge: Number(form.baseCharge), perKmRate: Number(form.perKmRate), estimatedTime: Number(form.estimatedTime), radius: Number(form.radius), coordinates: { type: 'Point', coordinates: [0, 0] } };
      modal === 'create' ? await api.post('/delivery-zones', payload) : await api.put(`/delivery-zones/${selected._id}`, payload);
      setModal(null); fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (zone) => { await api.patch(`/delivery-zones/${zone._id}/toggle`); fetchData(); };
  const handleDelete = async (zone) => { if (!window.confirm(`Delete zone "${zone.name}"?`)) return; await api.delete(`/delivery-zones/${zone._id}`); fetchData(); };

  const columns = [
    { key: 'name', label: 'Zone Name', render: (v) => <strong>{v}</strong> },
    { key: 'description', label: 'Description', render: (v) => v || '—' },
    { key: 'baseCharge', label: 'Base Charge', render: (v) => `Rs. ${v}` },
    { key: 'perKmRate', label: 'Per Km', render: (v) => `Rs. ${v}` },
    { key: 'estimatedTime', label: 'Est. Time', render: (v) => `${v} min` },
    { key: 'radius', label: 'Radius', render: (v) => `${v} km` },
    { key: 'isActive', label: 'Status', render: (v) => <Badge status={String(v)} map={STATUS_MAP} /> },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader title="Delivery Zones" subtitle="Manage delivery coverage areas and rates"
        action={<Btn onClick={openCreate}>＋ Add Zone</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="📍" label="Total Zones" value={zones.length} />
        <StatsCard icon="✅" label="Active" value={zones.filter((z) => z.isActive).length} color="#16a34a" />
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search zones…" />
        </div>
        {loading ? <Spinner /> : (
          <Table columns={columns} data={filtered}
            actions={[{ label: 'Edit', icon: '✏️', onClick: openEdit }, { label: 'Toggle', icon: '🔄', onClick: handleToggle }, { label: 'Delete', icon: '🗑️', onClick: handleDelete, danger: true }]}
            emptyMessage="No delivery zones found"
          />
        )}
      </Card>

      <Modal isOpen={!!modal} title={modal === 'create' ? 'Add Delivery Zone' : 'Edit Delivery Zone'} onClose={() => { setModal(null); setError(''); }}
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Zone'}</Btn></>}
      >
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
        <FormField label="Zone Name *"><Input value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. City Centre" /></FormField>
        <FormField label="Description"><Input value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Optional" /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Base Charge (Rs.) *"><Input type="number" value={form.baseCharge} onChange={(v) => setForm((f) => ({ ...f, baseCharge: v }))} placeholder="50" /></FormField>
          <FormField label="Per Km Rate (Rs.) *"><Input type="number" value={form.perKmRate} onChange={(v) => setForm((f) => ({ ...f, perKmRate: v }))} placeholder="10" /></FormField>
          <FormField label="Estimated Time (min) *"><Input type="number" value={form.estimatedTime} onChange={(v) => setForm((f) => ({ ...f, estimatedTime: v }))} placeholder="30" /></FormField>
          <FormField label="Radius (km) *"><Input type="number" value={form.radius} onChange={(v) => setForm((f) => ({ ...f, radius: v }))} placeholder="5" /></FormField>
        </div>
      </Modal>
    </div>
  );
}
