import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import {
  PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, FormField, Input, Select, Spinner, EmptyState,
} from '../components/AdminUI';

const STATUS_MAP = {
  true:  { label: 'Active',   bg: '#dcfce7', color: '#16a34a' },
  false: { label: 'Inactive', bg: '#fee2e2', color: '#dc2626' },
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const SERVER_URL = API_BASE_URL.replace('/api', '');

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '', basePrice: '', stockQuantity: '', lowStockThreshold: '5', image: '', isActive: true, sizes: [{ size: 'M', price: '' }] });
  const [error, setError] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploadingImage(true);
      const token = sessionStorage.getItem('staffToken');
      const res = await fetch(`${API_BASE_URL}/upload/product`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-Type': 'staff'
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to upload image');
      setForm((f) => ({ ...f, image: data.url }));
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      setError(`Upload Error: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        api.get('/products?all=true'),
        api.get('/categories?all=true'),
      ]);
      setProducts(pRes.data?.data || []);
      setCategories(cRes.data?.data || []);
    } catch { setError('Failed to load products'); }
    finally { setLoading(false); }
  }, []);

  const handleAddSizeField = () => {
    setForm((f) => ({
      ...f,
      sizes: [...f.sizes, { size: 'M', price: '' }]
    }));
  };

  const handleRemoveSizeField = (index) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.filter((_, i) => i !== index)
    }));
  };

  const handleSizeFieldChange = (index, key, value) => {
    setForm((f) => {
      const updated = [...f.sizes];
      updated[index] = { ...updated[index], [key]: value };
      return { ...f, sizes: updated };
    });
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = products
    .filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => showInactive || p.isActive)
    .sort((a, b) => {
      const catA = a.category?.name || 'Uncategorized';
      const catB = b.category?.name || 'Uncategorized';
      if (catA < catB) return -1;
      if (catA > catB) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

  const openCreate = () => {
    setForm({ name: '', description: '', category: categories[0]?._id || '', basePrice: '', stockQuantity: '', lowStockThreshold: '5', image: '', isActive: true, sizes: [{ size: 'M', price: '' }] });
    setSelected(null);
    setModal('create');
  };

  const openEdit = (product) => {
    setForm({
      name: product.name, description: product.description || '',
      category: product.category?._id || product.category || '',
      basePrice: product.basePrice, stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold || 5,
      image: product.image || '', isActive: product.isActive,
      sizes: product.sizes?.length ? product.sizes : [{ size: 'M', price: '' }],
    });
    setSelected(product);
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.name || !form.basePrice || !form.category) {
      setError('Name, category, and base price are required'); return;
    }
    const validSizes = form.sizes.filter((s) => s.price).map((s) => ({ size: s.size, price: Number(s.price) }));
    if (validSizes.length === 0) {
      setError('At least one size variant with a valid price is required');
      return;
    }
    try {
      setSaving(true); setError('');
      const payload = {
        name: form.name, description: form.description,
        category: form.category, basePrice: Number(form.basePrice),
        stockQuantity: Number(form.stockQuantity),
        lowStockThreshold: Number(form.lowStockThreshold),
        image: form.image, isActive: form.isActive,
        sizes: validSizes,
      };
      if (modal === 'create') {
        await api.post('/products', payload);
      } else {
        await api.put(`/products/${selected._id}`, payload);
      }
      setModal(null);
      fetchData();
    } catch (err) {
      console.error("SAVE ERROR:", err, err.response);
      const details = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      setError(`Error: ${err.response?.status} - ${details}`);
    } finally { setSaving(false); }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Deactivate "${product.name}"?`)) return;
    await api.delete(`/products/${product._id}`);
    fetchData();
  };

  const columns = [
    { key: 'image', label: 'Image', width: 60, render: (v) => v ? <img src={getImageUrl(v)} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} /> : <span style={{ fontSize: 28 }}>🍔</span> },
    { key: 'name', label: 'Name', render: (v) => <strong>{v}</strong> },
    { key: 'category', label: 'Category', render: (v, row) => row.category?.name || '—' },
    { key: 'basePrice', label: 'Price', render: (v) => `Rs. ${v?.toFixed(0) || 0}` },
    { key: 'stockQuantity', label: 'Stock', render: (v, row) => (
      <span style={{ color: v === 0 ? '#dc2626' : v <= row.lowStockThreshold ? '#f59e0b' : '#16a34a', fontWeight: 700 }}>{v}</span>
    )},
    { key: 'isActive', label: 'Status', render: (v) => <Badge status={String(v)} map={STATUS_MAP} /> },
  ];

  const actions = [
    { label: 'Edit', icon: '✏️', onClick: openEdit },
    { label: 'Delete', icon: '🗑️', onClick: handleDelete, danger: true },
  ];

  const active = products.filter((p) => p.isActive).length;
  const lowStock = products.filter((p) => p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0).length;
  const outStock = products.filter((p) => p.stockQuantity === 0).length;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader
        title="Products"
        subtitle="Manage your food catalog, pricing and availability"
        action={<Btn onClick={openCreate}>＋ Add Product</Btn>}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="🍔" label="Total Products" value={products.length} />
        <StatsCard icon="✅" label="Active" value={active} color="#16a34a" />
        <StatsCard icon="⚠️" label="Low Stock" value={lowStock} color="#f59e0b" />
        <StatsCard icon="🛑" label="Out of Stock" value={outStock} color="#dc2626" />
      </div>

      {/* Table */}
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search products…" />
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="checkbox" 
              id="showInactive" 
              checked={showInactive} 
              onChange={(e) => setShowInactive(e.target.checked)} 
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="showInactive" style={{ fontSize: 14, color: '#555', cursor: 'pointer' }}>Show Inactive</label>
          </div>
        </div>
        {loading ? <Spinner /> : (
          <Table columns={columns} data={filtered} actions={actions} emptyMessage="No products found" />
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={!!modal}
        title={modal === 'create' ? 'Add Product' : 'Edit Product'}
        onClose={() => { setModal(null); setError(''); }}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</Btn>
          </>
        }
      >
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
        <FormField label="Product Name *">
          <Input value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Classic Burger" />
        </FormField>
        <FormField label="Category *">
          <Select value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))}>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Base Price (Rs.) *">
            <Input type="number" value={form.basePrice} onChange={(v) => {
              setForm((f) => {
                const oldBase = f.basePrice;
                const newSizes = f.sizes.map(s => {
                  if (String(s.price) === String(oldBase) || !s.price) {
                    return { ...s, price: v };
                  }
                  return s;
                });
                return { ...f, basePrice: v, sizes: newSizes };
              });
            }} placeholder="0" />
          </FormField>
          <FormField label="Stock Quantity">
            <Input type="number" value={form.stockQuantity} onChange={(v) => setForm((f) => ({ ...f, stockQuantity: v }))} placeholder="0" />
          </FormField>
        </div>

        {/* Sizes Configuration UI */}
        <div style={{ marginTop: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Variant Sizes & Prices *</label>
            <Btn variant="secondary" size="xs" onClick={handleAddSizeField}>＋ Add Size</Btn>
          </div>
          {form.sizes.map((s, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
              <select
                value={s.size}
                onChange={(e) => handleSizeFieldChange(idx, 'size', e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                <option value="S">Small (S)</option>
                <option value="M">Medium (M)</option>
                <option value="L">Large (L)</option>
                <option value="XL">Extra Large (XL)</option>
              </select>
              <input
                type="number"
                value={s.price}
                onChange={(e) => handleSizeFieldChange(idx, 'price', e.target.value)}
                placeholder="Price (Rs.)"
                style={{
                  flex: 2,
                  padding: '8px 10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
              {form.sizes.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSizeField(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: 4
                  }}
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>

        <FormField label="Description">
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Describe the product…"
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, resize: 'vertical', minHeight: 72, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
          />
        </FormField>
        <FormField label="Product Image">
          <div style={{ width: '100%', height: 160, border: '1px dashed #ccc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#f9f9f9', position: 'relative' }}>
            {form.image ? (
              <img src={getImageUrl(form.image)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#888' }}>
                {uploadingImage ? <Spinner /> : <span>Click to select image</span>}
              </div>
            )}
            <input type="file" accept="image/*" onClick={(e) => { e.target.value = null; }} onChange={handleImageUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} disabled={uploadingImage} />
          </div>
          {form.image && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{form.image}</span>
              <button type="button" onClick={() => setForm(f => ({ ...f, image: '' }))} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Remove Image</button>
            </div>
          )}
        </FormField>
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
