import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, Table, Modal, FormField, Input, Select, Spinner } from '../components/AdminUI';

const STOCK_MAP = {
  low_stock:    { label: 'Low Stock',    bg: '#fef3c7', color: '#d97706' },
  out_of_stock: { label: 'Out of Stock', bg: '#fee2e2', color: '#dc2626' },
};

export default function StockAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ action: 'increase', quantity: '', reason: 'manual', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/alerts');
      setAlerts(res.data?.data || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const openAdjust = (item) => { setSelected(item); setAdjustForm({ action: 'increase', quantity: '', reason: 'manual', notes: '' }); setModal(true); };

  const handleAdjust = async () => {
    if (!adjustForm.quantity || Number(adjustForm.quantity) < 0) { setError('Enter a valid quantity'); return; }
    try {
      setSaving(true); setError('');
      await api.post('/inventory/adjust', { productId: selected._id, action: adjustForm.action, quantity: Number(adjustForm.quantity), reason: adjustForm.reason, notes: adjustForm.notes });
      setModal(false); fetchAlerts();
    } catch (err) { setError(err.response?.data?.message || 'Adjustment failed'); }
    finally { setSaving(false); }
  };

  const outOfStock = alerts.filter((a) => a.stockStatus === 'out_of_stock');
  const lowStock = alerts.filter((a) => a.stockStatus === 'low_stock');

  const columns = [
    { key: 'image', label: '', width: 50, render: (v) => v ? <img src={v} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>📦</span> },
    { key: 'name', label: 'Product', render: (v) => <strong>{v}</strong> },
    { key: 'category', label: 'Category', render: (v, row) => row.category?.name || '—' },
    { key: 'stockQuantity', label: 'Current Stock', render: (v, row) => <span style={{ fontWeight: 800, fontSize: 16, color: v === 0 ? '#dc2626' : '#d97706' }}>{v}</span> },
    { key: 'lowStockThreshold', label: 'Min. Required', render: (v) => v },
    { key: 'stockStatus', label: 'Alert', render: (v) => <Badge status={v} map={STOCK_MAP} /> },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader
        title="⚠️ Stock Alerts"
        subtitle="Products requiring immediate restocking attention"
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" onClick={fetchAlerts} size="sm">🔄 Refresh</Btn>
            <Link to="/admin/inventory"><Btn variant="secondary" size="sm">Go to Inventory →</Btn></Link>
          </div>
        }
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="🚨" label="Total Alerts" value={alerts.length} color="#dc2626" />
        <StatsCard icon="🛑" label="Out of Stock" value={outOfStock.length} color="#dc2626" />
        <StatsCard icon="⚠️" label="Low Stock" value={lowStock.length} color="#d97706" />
      </div>

      {outOfStock.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginBottom: 12 }}>🛑 Out of Stock ({outOfStock.length})</h2>
          <Card>
            {loading ? <Spinner /> : <Table columns={columns} data={outOfStock} actions={[{ label: 'Adjust Stock', icon: '🔧', onClick: openAdjust }]} emptyMessage="No out-of-stock items" />}
          </Card>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#d97706', marginBottom: 12 }}>⚠️ Low Stock ({lowStock.length})</h2>
        <Card>
          {loading ? <Spinner /> : <Table columns={columns} data={lowStock} actions={[{ label: 'Adjust Stock', icon: '🔧', onClick: openAdjust }]} emptyMessage="No low-stock alerts — you're fully stocked! 🎉" />}
        </Card>
      </div>

      {/* Adjust Stock Modal */}
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
