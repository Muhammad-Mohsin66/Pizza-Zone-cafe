import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Spinner } from '../components/AdminUI';

const ACTION_MAP = {
  create:  { label: 'Create',  bg: '#dcfce7', color: '#16a34a' },
  read:    { label: 'Read',    bg: '#e0f2fe', color: '#0369a1' },
  update:  { label: 'Update',  bg: '#fef3c7', color: '#b45309' },
  delete:  { label: 'Delete',  bg: '#fee2e2', color: '#dc2626' },
  approve: { label: 'Approve', bg: '#dcfce7', color: '#15803d' },
  reject:  { label: 'Reject',  bg: '#fee2e2', color: '#be123c' },
  assign:  { label: 'Assign',  bg: '#ede9fe', color: '#7c3aed' },
  login:   { label: 'Login',   bg: '#e0f2fe', color: '#0369a1' },
  logout:  { label: 'Logout',  bg: '#f3f4f6', color: '#6b7280' },
};

const STATUS_MAP = {
  success: { label: 'Success', bg: '#dcfce7', color: '#16a34a' },
  failed:  { label: 'Failed',  bg: '#fee2e2', color: '#dc2626' },
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 50 });
      if (actionFilter) params.set('action', actionFilter);
      const [logsRes, statsRes] = await Promise.all([
        api.get(`/audit-logs?${params.toString()}`),
        api.get('/audit-logs/stats'),
      ]);
      setLogs(logsRes.data?.data || []);
      setTotalPages(logsRes.data?.pages || 1);
      setStats(statsRes.data?.data?.stats || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [page, actionFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = logs.filter((l) =>
    l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.targetName?.toLowerCase().includes(search.toLowerCase()) ||
    l.targetCollection?.toLowerCase().includes(search.toLowerCase())
  );

  const totalActions = stats.reduce((sum, s) => sum + s.count, 0);

  const columns = [
    { key: 'createdAt', label: 'Timestamp', render: (v) => new Date(v).toLocaleString() },
    { key: 'user', label: 'User', render: (v) => v ? <div><div style={{ fontWeight: 600 }}>{v.name}</div><div style={{ fontSize: 11, color: '#999' }}>{v.role}</div></div> : '—' },
    { key: 'action', label: 'Action', render: (v) => <Badge status={v} map={ACTION_MAP} /> },
    { key: 'targetCollection', label: 'Module', render: (v) => v || '—' },
    { key: 'targetName', label: 'Target', render: (v) => v || '—' },
    { key: 'ipAddress', label: 'IP', render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#888' }}>{v || '—'}</span> },
    { key: 'status', label: 'Result', render: (v) => <Badge status={v || 'success'} map={STATUS_MAP} /> },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader title="🛡️ Audit Logs" subtitle="Complete trail of all administrative actions across the platform"
        action={<Btn variant="ghost" onClick={fetchData} size="sm">🔄 Refresh</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="📋" label="Total Actions" value={totalActions} />
        {stats.slice(0, 4).map((s) => (
          <StatsCard key={s._id} icon={ACTION_MAP[s._id]?.label[0] || '•'} label={ACTION_MAP[s._id]?.label || s._id} value={s.count} color={ACTION_MAP[s._id]?.color || '#555'} />
        ))}
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by user, module, target…" />
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} style={{ padding: '7px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, color: '#555', background: 'white' }}>
            <option value="">All Actions</option>
            {Object.keys(ACTION_MAP).map((a) => <option key={a} value={a}>{ACTION_MAP[a].label}</option>)}
          </select>
        </div>
        {loading ? <Spinner /> : <Table columns={columns} data={filtered} emptyMessage="No audit logs found" />}
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '16px', borderTop: '1px solid #f0f0f0' }}>
            <Btn variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Prev</Btn>
            <span style={{ fontSize: 13, color: '#555', padding: '6px 12px' }}>Page {page} of {totalPages}</span>
            <Btn variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</Btn>
          </div>
        )}
      </Card>
    </div>
  );
}
