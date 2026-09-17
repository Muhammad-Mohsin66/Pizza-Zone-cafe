import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, FormField, Input, Select, Spinner } from '../components/AdminUI';

const STATUS_MAP = {
  true:  { label: 'Active',   bg: '#dcfce7', color: '#16a34a' },
  false: { label: 'Expired',  bg: '#fee2e2', color: '#dc2626' },
};

export default function DealsPage() {
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ title: '', description: '', dealPrice: '', originalPrice: '', discount: '', startDate: today, endDate: '', maxUses: '', products: [] });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [dRes, pRes] = await Promise.all([api.get('/deals'), api.get('/products')]);
      setDeals(dRes.data?.data || []);
      setProducts(pRes.data?.data || []);
    } catch { setError('Failed to load deals'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = deals.filter((d) => d.title?.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setForm({ title: '', description: '', dealPrice: '', originalPrice: '', discount: '', startDate: today, endDate: '', maxUses: '', products: [] });
    setSelected(null); setModal('create');
  };

  const openEdit = (deal) => {
    setForm({
      title: deal.title, description: deal.description || '',
      dealPrice: deal.dealPrice, originalPrice: deal.originalPrice || '',
      discount: deal.discount || '', startDate: deal.startDate?.split('T')[0] || today,
      endDate: deal.endDate?.split('T')[0] || '',
      maxUses: deal.maxUses || '', products: deal.products?.map((p) => p._id || p) || [],
    });
    setSelected(deal); setModal('edit');
  };

  const handleSave = async () => {
    if (!form.title || !form.dealPrice || !form.startDate || !form.endDate) { setError('Title, deal price, start and end dates are required'); return; }
    try {
      setSaving(true); setError('');
      const payload = { ...form, dealPrice: Number(form.dealPrice), originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined, discount: form.discount ? Number(form.discount) : 0, maxUses: form.maxUses ? Number(form.maxUses) : null };
      modal === 'create' ? await api.post('/deals', payload) : await api.put(`/deals/${selected._id}`, payload);
      setModal(null); fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (deal) => {
    await api.patch(`/deals/${deal._id}/toggle`);
    fetchData();
  };

  const handleDelete = async (deal) => {
    if (!window.confirm(`Delete deal "${deal.title}"?`)) return;
    await api.delete(`/deals/${deal._id}`);
    fetchData();
  };

  const columns = [
    { key: 'title', label: 'Title', render: (v) => <strong>{v}</strong> },
    { key: 'products', label: 'Included Products', render: (v) => {
      if (!v || v.length === 0) return '—';
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {v.map((p) => (
            <span key={p._id || p} style={{
              fontSize: 10,
              fontWeight: 600,
              backgroundColor: '#f3f4f6',
              color: '#374151',
              padding: '2px 6px',
              borderRadius: 4
            }}>
              {p.name || 'Product'}
            </span>
          ))}
        </div>
      );
    }},
    { key: 'dealPrice', label: 'Deal Price', render: (v) => <span style={{ color: '#FF6B35', fontWeight: 700 }}>Rs. {v}</span> },
    { key: 'discount', label: 'Discount', render: (v) => v ? `${v}%` : '—' },
    { key: 'startDate', label: 'Start', render: (v) => new Date(v).toLocaleDateString() },
    { key: 'endDate', label: 'End', render: (v) => new Date(v).toLocaleDateString() },
    { key: 'usedCount', label: 'Used', render: (v, row) => `${v || 0}${row.maxUses ? ` / ${row.maxUses}` : ''}` },
    { key: 'isActive', label: 'Status', render: (v) => <Badge status={String(v)} map={STATUS_MAP} /> },
  ];

  const actions = [
    { label: 'Edit', icon: '✏️', onClick: openEdit },
    { label: 'Toggle', icon: '🔄', onClick: handleToggle },
    { label: 'Delete', icon: '🗑️', onClick: handleDelete, danger: true },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader title="Deals & Promotions" subtitle="Create and manage limited-time deals for your customers"
        action={<Btn onClick={openCreate}>＋ Create Deal</Btn>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="🎁" label="Total Deals" value={deals.length} />
        <StatsCard icon="✅" label="Active" value={deals.filter((d) => d.isActive).length} color="#16a34a" />
        <StatsCard icon="⌛" label="Expired" value={deals.filter((d) => !d.isActive).length} color="#dc2626" />
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search deals…" />
        </div>
        {loading ? <Spinner /> : <Table columns={columns} data={filtered} actions={actions} emptyMessage="No deals found" />}
      </Card>

      <Modal isOpen={!!modal} title={modal === 'create' ? 'Create Deal' : 'Edit Deal'} onClose={() => { setModal(null); setError(''); }}
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Deal'}</Btn></>}
      >
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
        <FormField label="Deal Title *"><Input value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="e.g. Weekend Special" /></FormField>
        <FormField label="Description"><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the deal…" style={{ width: '100%', padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, resize: 'vertical', minHeight: 64, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} /></FormField>
        <FormField label="Included Products">
          <div style={{
            maxHeight: '150px',
            overflowY: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: '10px',
            backgroundColor: '#fafafa',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            {products.map((p) => {
              const checked = form.products.includes(p._id);
              return (
                <label key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500, margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm((f) => ({ ...f, products: [...f.products, p._id] }));
                      } else {
                        setForm((f) => ({ ...f, products: f.products.filter((id) => id !== p._id) }));
                      }
                    }}
                  />
                  {p.name} <span style={{ color: '#FF6B35', fontWeight: 700 }}>(Rs. {p.basePrice})</span>
                </label>
              );
            })}
            {products.length === 0 && <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: 12 }}>No products available</span>}
          </div>
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Deal Price (Rs.) *"><Input type="number" value={form.dealPrice} onChange={(v) => setForm((f) => ({ ...f, dealPrice: v }))} placeholder="0" /></FormField>
          <FormField label="Original Price (Rs.)"><Input type="number" value={form.originalPrice} onChange={(v) => setForm((f) => ({ ...f, originalPrice: v }))} placeholder="0" /></FormField>
          <FormField label="Discount %"><Input type="number" value={form.discount} onChange={(v) => setForm((f) => ({ ...f, discount: v }))} placeholder="0" /></FormField>
          <FormField label="Max Uses"><Input type="number" value={form.maxUses} onChange={(v) => setForm((f) => ({ ...f, maxUses: v }))} placeholder="Unlimited" /></FormField>
          <FormField label="Start Date *"><Input type="date" value={form.startDate} onChange={(v) => setForm((f) => ({ ...f, startDate: v }))} /></FormField>
          <FormField label="End Date *"><Input type="date" value={form.endDate} onChange={(v) => setForm((f) => ({ ...f, endDate: v }))} /></FormField>
        </div>
      </Modal>
    </div>
  );
}
