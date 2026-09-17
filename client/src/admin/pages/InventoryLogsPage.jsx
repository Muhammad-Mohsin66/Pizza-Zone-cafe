import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Select, Spinner } from '../components/AdminUI';

const CHANGE_MAP = {
  increase: { label: '▲ Increase', bg: '#dcfce7', color: '#16a34a' },
  decrease: { label: '▼ Decrease', bg: '#fee2e2', color: '#dc2626' },
};

const REASON_MAP = {
  order:   { label: 'Order',    bg: '#e0f2fe', color: '#0369a1' },
  cancel:  { label: 'Cancel',   bg: '#fef3c7', color: '#b45309' },
  manual:  { label: 'Manual',   bg: '#ede9fe', color: '#7c3aed' },
  restock: { label: 'Restock',  bg: '#dcfce7', color: '#16a34a' },
  damage:  { label: 'Damage',   bg: '#fee2e2', color: '#dc2626' },
  return:  { label: 'Return',   bg: '#fce7f3', color: '#9d174d' },
};

export default function InventoryLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (reasonFilter) params.set('reason', reasonFilter);
      params.set('limit', '1000');
      const res = await api.get(`/inventory/logs?${params.toString()}`);
      setLogs(res.data?.data || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [reasonFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter((l) =>
    l.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.performedBy?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleString() },
    { key: 'product', label: 'Product', render: (v) => <strong>{v?.name || '—'}</strong> },
    { key: 'changeType', label: 'Change', render: (v) => <Badge status={v} map={CHANGE_MAP} /> },
    { key: 'quantity', label: 'Qty', render: (v, row) => <span style={{ fontWeight: 700 }}>{row.changeType === 'decrease' ? `-${v}` : `+${v}`}</span> },
    { key: 'previousStock', label: 'Before', render: (v) => v },
    { key: 'newStock', label: 'After', render: (v) => <strong style={{ color: '#FF6B35' }}>{v}</strong> },
    { key: 'reason', label: 'Reason', render: (v) => <Badge status={v} map={REASON_MAP} /> },
    { key: 'performedBy', label: 'By', render: (v) => v?.name || '—' },
    { key: 'notes', label: 'Notes', render: (v) => v || '—' },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader
        title="Inventory Logs"
        subtitle="Complete audit trail of all stock changes"
        action={<Btn variant="ghost" onClick={fetchLogs} size="sm">🔄 Refresh</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="📋" label="Total Entries" value={logs.length} />
        <StatsCard icon="▲" label="Increases" value={logs.filter((l) => l.changeType === 'increase').length} color="#16a34a" />
        <StatsCard icon="▼" label="Decreases" value={logs.filter((l) => l.changeType === 'decrease').length} color="#dc2626" />
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search product or user…" />
          <Select value={reasonFilter} onChange={setReasonFilter} style={{ width: 'auto', minWidth: 150, height: 38, padding: '0 12px' }}>
            <option value="">All Reasons</option>
            {Object.keys(REASON_MAP).map((r) => <option key={r} value={r}>{REASON_MAP[r].label}</option>)}
          </Select>
        </div>
        {loading ? <Spinner /> : <Table columns={columns} data={filtered} emptyMessage="No inventory log entries found" />}
      </Card>
    </div>
  );
}
