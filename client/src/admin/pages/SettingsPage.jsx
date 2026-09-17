import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Spinner } from '../components/AdminUI';

const CATEGORY_MAP = {
  general:      { label: 'General',      bg: '#f3f4f6', color: '#374151' },
  payment:      { label: 'Payment',      bg: '#dcfce7', color: '#16a34a' },
  delivery:     { label: 'Delivery',     bg: '#e0f2fe', color: '#0369a1' },
  notification: { label: 'Notification', bg: '#fce7f3', color: '#be185d' },
  security:     { label: 'Security',     bg: '#fee2e2', color: '#dc2626' },
  email:        { label: 'Email',        bg: '#ede9fe', color: '#7c3aed' },
};

export default function SettingsPage() {
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState({});
  const [messages, setMessages] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      setGrouped(res.data?.data || {});
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allSettings = Object.values(grouped).flat();
  const filtered = search ? allSettings.filter((s) => s.key.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase())) : null;

  const handleEdit = (setting) => {
    setEditing((e) => ({ ...e, [setting.key]: String(setting.value) }));
  };

  const handleSave = async (setting) => {
    try {
      setSaving((s) => ({ ...s, [setting.key]: true }));
      await api.put(`/settings/${setting.key}`, { value: editing[setting.key] });
      setMessages((m) => ({ ...m, [setting.key]: 'Saved ✓' }));
      setTimeout(() => setMessages((m) => ({ ...m, [setting.key]: '' })), 2000);
      setEditing((e) => { const n = { ...e }; delete n[setting.key]; return n; });
      fetchData();
    } catch {
      setMessages((m) => ({ ...m, [setting.key]: '✗ Failed' }));
    } finally {
      setSaving((s) => ({ ...s, [setting.key]: false }));
    }
  };

  const handleCancel = (key) => {
    setEditing((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const renderSetting = (setting) => {
    const isEditing = setting.key in editing;
    const isSaving = saving[setting.key];
    const msg = messages[setting.key];
    const isEditable = setting.isEditable !== false;

    return (
      <div key={setting.key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid #f5f5f3', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 200 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{setting.key}</div>
          {setting.description && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{setting.description}</div>}
          <Badge status={setting.category || 'general'} map={CATEGORY_MAP} />
        </div>
        <div style={{ flex: 3, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {isEditing ? (
            <input
              value={editing[setting.key]}
              onChange={(e) => setEditing((ed) => ({ ...ed, [setting.key]: e.target.value }))}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #FF6B35', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif', minWidth: 120 }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(setting); if (e.key === 'Escape') handleCancel(setting.key); }}
            />
          ) : (
            <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#333', background: '#f8f8f6', padding: '7px 12px', borderRadius: 8, wordBreak: 'break-all' }}>
              {String(setting.value)}
            </span>
          )}
          {isEditable && (
            isEditing ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn size="sm" onClick={() => handleSave(setting)} disabled={isSaving}>{isSaving ? '…' : '✓ Save'}</Btn>
                <Btn size="sm" variant="ghost" onClick={() => handleCancel(setting.key)}>✕</Btn>
              </div>
            ) : (
              <Btn size="sm" variant="ghost" onClick={() => handleEdit(setting)}>✏️ Edit</Btn>
            )
          )}
          {msg && <span style={{ fontSize: 12, fontWeight: 600, color: msg.includes('✓') ? '#16a34a' : '#dc2626' }}>{msg}</span>}
        </div>
      </div>
    );
  };

  const settingsToShow = filtered || null;
  const groupsToShow = settingsToShow ? { Results: settingsToShow } : grouped;
  const totalSettings = Object.values(grouped).flat().length;
  const editableCount = Object.values(grouped).flat().filter((s) => s.isEditable !== false).length;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader title="⚙️ System Settings" subtitle="Configure global platform settings"
        action={<Btn variant="ghost" onClick={fetchData} size="sm">🔄 Refresh</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="⚙️" label="Total Settings" value={totalSettings} />
        <StatsCard icon="✏️" label="Editable" value={editableCount} color="#0369a1" />
        <StatsCard icon="🔒" label="Read-only" value={totalSettings - editableCount} color="#888" />
      </div>

      <div style={{ marginBottom: 20 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search settings by key or description…" />
      </div>

      {loading ? <Spinner /> : Object.keys(groupsToShow).length === 0 ? (
        <Card><div style={{ padding: '60px 24px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>No settings found. Create some via the API seed script.</div></Card>
      ) : (
        Object.entries(groupsToShow).map(([cat, settings]) => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>{CATEGORY_MAP[cat]?.label ? '' : ''}</span>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#555', margin: 0, textTransform: 'capitalize' }}>
                <Badge status={cat} map={CATEGORY_MAP} /> {cat.charAt(0).toUpperCase() + cat.slice(1)} Settings
              </h2>
              <span style={{ fontSize: 12, color: '#aaa' }}>({settings.length})</span>
            </div>
            <Card>
              {settings.map(renderSetting)}
            </Card>
          </div>
        ))
      )}
    </div>
  );
}
