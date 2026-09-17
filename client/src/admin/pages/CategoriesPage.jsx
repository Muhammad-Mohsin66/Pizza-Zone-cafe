import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, FormField, Input, Select, Spinner } from '../components/AdminUI';

const STATUS_MAP = {
  true:  { label: 'Active',   bg: '#dcfce7', color: '#16a34a' },
  false: { label: 'Inactive', bg: '#fee2e2', color: '#dc2626' },
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', image: '', isActive: true });
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories?all=true');
      setCategories(res.data?.data || []);
    } catch { setError('Failed to load categories'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm({ name: '', description: '', image: '', isActive: true }); setSelected(null); setModal('create'); };
  const openEdit = (cat) => { setForm({ name: cat.name, description: cat.description || '', image: cat.image || '', isActive: cat.isActive !== false }); setSelected(cat); setModal('edit'); };

  const handleSave = async () => {
    if (!form.name) { setError('Category name is required'); return; }
    try {
      setSaving(true); setError('');
      const payload = { name: form.name.trim(), description: form.description, image: form.image, isActive: form.isActive };
      if (modal === 'create') {
        await api.post('/categories', payload);
      } else {
        await api.put(`/categories/${selected._id}`, payload);
      }
      setModal(null); fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    await api.delete(`/categories/${cat._id}`);
    fetchData();
  };

  const columns = [
    { key: 'image', label: '', width: 50, render: (v) => v ? <img src={v} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>🏷️</span> },
    { key: 'name', label: 'Name', render: (v) => <strong>{v}</strong> },
    { key: 'description', label: 'Description', render: (v) => v || '—' },
    { key: 'productCount', label: 'Products', render: (v) => <span style={{ fontWeight: 700, color: '#FF6B35' }}>{v || 0}</span> },
    { key: 'isActive', label: 'Status', render: (v) => <Badge status={String(v !== false)} map={STATUS_MAP} /> },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader
        title="Categories"
        subtitle="Organise your menu into logical categories"
        action={<Btn onClick={openCreate}>＋ Add Category</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="🏷️" label="Total Categories" value={categories.length} />
        <StatsCard icon="✅" label="Active" value={categories.filter((c) => c.isActive !== false).length} color="#16a34a" />
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search categories…" />
        </div>
        {loading ? <Spinner /> : <Table columns={columns} data={filtered} actions={[{ label: 'Edit', icon: '✏️', onClick: openEdit }, { label: 'Delete', icon: '🗑️', onClick: handleDelete, danger: true }]} emptyMessage="No categories found" />}
      </Card>

      <Modal isOpen={!!modal} title={modal === 'create' ? 'Add Category' : 'Edit Category'} onClose={() => { setModal(null); setError(''); }}
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn></>}
      >
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
        <FormField label="Category Name *"><Input value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Burgers" /></FormField>
        <FormField label="Description"><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description…" style={{ width: '100%', padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, resize: 'vertical', minHeight: 72, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} /></FormField>
        <FormField label="Image URL"><Input value={form.image} onChange={(v) => setForm((f) => ({ ...f, image: v }))} placeholder="https://…" /></FormField>
        <FormField label="Status">
          <Select value={form.isActive ? 'true' : 'false'} onChange={(v) => setForm((f) => ({ ...f, isActive: v === 'true' }))}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </FormField>
      </Modal>
    </div>
  );
}
