import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, FormField, Input, Select, Spinner } from '../components/AdminUI';

const STOCK_STATUS_MAP = {
  in_stock:    { label: 'In Stock',     bg: '#dcfce7', color: '#16a34a' },
  low_stock:   { label: 'Low Stock',    bg: '#fef3c7', color: '#d97706' },
  out_of_stock:{ label: 'Out of Stock', bg: '#fee2e2', color: '#dc2626' },
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ action: 'increase', quantity: '', reason: 'manual', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [invRes, sumRes] = await Promise.all([
        api.get('/inventory?all=true'),
        api.get('/inventory/summary?all=true'),
      ]);
      setInventory(invRes.data?.data || []);
      setSummary(sumRes.data?.data || {});
    } catch { setError('Failed to load inventory'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = inventory.filter((item) => {
    const matchSearch = item.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || item.stockStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAdjust = (item) => { setSelected(item); setAdjustForm({ action: 'increase', quantity: '', reason: 'manual', notes: '' }); setModal(true); };

  const handleAdjust = async () => {
    if (!adjustForm.quantity || Number(adjustForm.quantity) < 0) { setError('Enter a valid quantity'); return; }
    try {
      setSaving(true); setError('');
      await api.post('/inventory/adjust', { productId: selected._id, action: adjustForm.action, quantity: Number(adjustForm.quantity), reason: adjustForm.reason, notes: adjustForm.notes });
      setModal(false); fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Adjustment failed'); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'image', label: '', width: 50, render: (v) => v ? <img src={v} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>📦</span> },
    { key: 'name', label: 'Product', render: (v) => <strong>{v}</strong> },
    { key: 'category', label: 'Category', render: (v, row) => row.category?.name || '—' },
    { key: 'stockQuantity', label: 'Stock', render: (v, row) => <span style={{ fontWeight: 800, fontSize: 16, color: row.stockStatus === 'out_of_stock' ? '#dc2626' : row.stockStatus === 'low_stock' ? '#d97706' : '#16a34a' }}>{v}</span> },
    { key: 'lowStockThreshold', label: 'Min. Stock', render: (v) => v },
    { key: 'stockStatus', label: 'Status', render: (v) => <Badge status={v} map={STOCK_STATUS_MAP} /> },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader title="Inventory / Stock Levels" subtitle="Monitor and adjust product stock quantities" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="📦" label="Total Products" value={summary.totalProducts || 0} />
        <StatsCard icon="✅" label="In Stock" value={summary.inStock || 0} color="#16a34a" />
        <StatsCard icon="⚠️" label="Low Stock" value={summary.lowStock || 0} color="#d97706" />
        <StatsCard icon="🛑" label="Out of Stock" value={summary.outOfStock || 0} color="#dc2626" />
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search products…" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '7px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, color: '#555', background: 'white' }}>
            <option value="">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <Btn variant="ghost" onClick={fetchData} size="sm">🔄 Refresh</Btn>
        </div>
        {loading ? <Spinner /> : <Table columns={columns} data={filtered} actions={[{ label: 'Adjust Stock', icon: '🔧', onClick: openAdjust }]} emptyMessage="No inventory records found" />}
      </Card>

      <Modal isOpen={modal} title={`Adjust Stock — ${selected?.name}`} onClose={() => { setModal(false); setError(''); }}
        footer={<><Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn><Btn onClick={handleAdjust} disabled={saving}>{saving ? 'Applying…' : 'Apply Adjustment'}</Btn></>}
      >
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
        {selected && <div style={{ background: '#f8f8f6', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
          <span style={{ color: '#999' }}>Current stock: </span>
          <strong style={{ color: selected.stockQuantity === 0 ? '#dc2626' : '#16a34a', fontSize: 18 }}>{selected.stockQuantity}</strong>
        </div>}
        <FormField label="Action">
          <Select value={adjustForm.action} onChange={(v) => setAdjustForm((f) => ({ ...f, action: v }))}>
            <option value="increase">Increase (Restock)</option>
            <option value="reduce">Reduce (Remove)</option>
            <option value="set">Set Exact Value</option>
          </Select>
        </FormField>
        <FormField label="Quantity *"><Input type="number" value={adjustForm.quantity} onChange={(v) => setAdjustForm((f) => ({ ...f, quantity: v }))} placeholder="0" /></FormField>
        <FormField label="Reason">
          <Select value={adjustForm.reason} onChange={(v) => setAdjustForm((f) => ({ ...f, reason: v }))}>
            <option value="manual">Manual Adjustment</option>
            <option value="restock">Restock / Purchase</option>
            <option value="damage">Damaged / Waste</option>
            <option value="return">Customer Return</option>
          </Select>
        </FormField>
        <FormField label="Notes"><Input value={adjustForm.notes} onChange={(v) => setAdjustForm((f) => ({ ...f, notes: v }))} placeholder="Optional notes…" /></FormField>
      </Modal>
    </div>
  );
}
