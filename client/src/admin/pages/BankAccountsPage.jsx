import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, FormField, Input, Spinner } from '../components/AdminUI';

const STATUS_MAP = {
  active:   { label: 'Active',   bg: '#dcfce7', color: '#16a34a' },
  inactive: { label: 'Inactive', bg: '#fee2e2', color: '#dc2626' },
};

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ bankName: '', accountTitle: '', accountNumber: '', iban: '' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/bank-accounts/admin');
      setAccounts(res.data?.data || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = accounts.filter((a) =>
    a.bankName?.toLowerCase().includes(search.toLowerCase()) ||
    a.accountTitle?.toLowerCase().includes(search.toLowerCase()) ||
    a.accountNumber?.includes(search)
  );

  const activeAccounts = accounts.filter(a => a.isActive).length;

  const openCreate = () => { setForm({ bankName: '', accountTitle: '', accountNumber: '', iban: '' }); setSelected(null); setModal('create'); };
  const openEdit = (acc) => { setForm({ bankName: acc.bankName, accountTitle: acc.accountTitle, accountNumber: acc.accountNumber, iban: acc.iban || '' }); setSelected(acc); setModal('edit'); };

  const handleSave = async () => {
    if (!form.bankName || !form.accountTitle || !form.accountNumber) { setError('Bank name, account title, and account number are required'); return; }
    try {
      setSaving(true); setError('');
      const payload = { ...form };
      modal === 'create' ? await api.post('/bank-accounts', payload) : await api.patch(`/bank-accounts/${selected._id}`, payload);
      setModal(null); fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (acc) => { 
    if (!window.confirm(`Are you sure you want to deactivate "${acc.accountTitle}"? Customers will no longer see this account for online payments.`)) return; 
    try {
      await api.patch(`/bank-accounts/${acc._id}/deactivate`); 
      fetchData(); 
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate');
    }
  };

  const columns = [
    { key: 'bankName', label: 'Bank', render: (v) => <strong>{v}</strong> },
    { key: 'accountTitle', label: 'Account Title' },
    { key: 'accountNumber', label: 'Account No.', render: (v) => <span style={{ fontFamily: 'monospace' }}>{v}</span> },
    { key: 'iban', label: 'IBAN', render: (v) => <span style={{ fontFamily: 'monospace', color: '#666' }}>{v || '-'}</span> },
    { key: 'isActive', label: 'Status', render: (v) => <Badge status={v ? 'active' : 'inactive'} map={STATUS_MAP} /> },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader title="Bank Accounts" subtitle="Manage bank accounts for online payments"
        action={<Btn onClick={openCreate}>＋ Add Account</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="🏦" label="Total Accounts" value={accounts.length} />
        <StatsCard icon="🟢" label="Active Accounts" value={activeAccounts} />
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search bank accounts…" />
        </div>
        {loading ? <Spinner /> : (
          <Table columns={columns} data={filtered}
            actions={[
              { label: 'Edit', icon: '✏️', onClick: openEdit }, 
              { label: 'Deactivate', icon: '🚫', onClick: handleDeactivate, danger: true, hidden: (row) => !row.isActive }
            ]}
            emptyMessage="No bank accounts found"
          />
        )}
      </Card>

      <Modal isOpen={!!modal} title={modal === 'create' ? 'Add Bank Account' : 'Edit Bank Account'} onClose={() => { setModal(null); setError(''); }}
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Account'}</Btn></>}
      >
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
        <FormField label="Bank Name *"><Input value={form.bankName} onChange={(v) => setForm((f) => ({ ...f, bankName: v }))} placeholder="e.g. Meezan Bank" /></FormField>
        <FormField label="Account Title *"><Input value={form.accountTitle} onChange={(v) => setForm((f) => ({ ...f, accountTitle: v }))} placeholder="e.g. Pizza Zone & Cafe" /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Account Number *"><Input value={form.accountNumber} onChange={(v) => setForm((f) => ({ ...f, accountNumber: v }))} placeholder="0000-000000000" /></FormField>
          <FormField label="IBAN (Optional)"><Input value={form.iban} onChange={(v) => setForm((f) => ({ ...f, iban: v }))} placeholder="PK00MEZN000..." /></FormField>
        </div>
      </Modal>
    </div>
  );
}
