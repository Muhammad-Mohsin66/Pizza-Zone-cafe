import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Spinner } from '../components/AdminUI';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#FF6B35', '#FFC107', '#2ECC71', '#3498DB', '#E74C3C', '#9B59B6'];

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, revRes, prodRes, payRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get(`/reports/revenue?type=${period}`),
        api.get('/reports/most-selling'),
        api.get('/reports/payment-breakdown'),
      ]);
      setDashboard(dashRes.data?.data);
      const arr = revRes.data?.data?.report || [];
      setRevenue(arr.map((r) => ({ label: r._id?.month ? `${r._id.year}/${String(r._id.month).padStart(2, '0')}` : String(r._id), revenue: r.totalRevenue || 0 })));
      setTopProducts((prodRes.data?.data || []).map((p) => ({ name: p.productName || 'Unknown', sales: p.totalQuantity || 0, revenue: p.totalRevenue || 0 })));
      setPaymentBreakdown((payRes.data?.data?.breakdown || []).map((b) => ({ name: b.paymentMethod || 'Unknown', amount: b.totalAmount || 0 })));
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div style={{ fontFamily: 'Inter, sans-serif' }}><PageHeader title="Reports & Analytics" /><Spinner /></div>;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader title="Reports & Analytics" subtitle="Business performance insights and trends"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            {['daily', 'weekly', 'monthly'].map((p) => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '7px 14px', borderRadius: 8, border: period === p ? 'none' : '1px solid #e0e0e0', background: period === p ? '#FF6B35' : 'white', color: period === p ? 'white' : '#555', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                {p}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 28 }}>
        <StatsCard icon="💰" label="Total Revenue" value={`Rs. ${(dashboard?.totalRevenue || 0).toFixed(0)}`} />
        <StatsCard icon="📦" label="Total Orders" value={dashboard?.totalOrders || 0} />
        <StatsCard icon="⏳" label="Pending Orders" value={dashboard?.pendingOrders || 0} color="#b45309" />
        <StatsCard icon="👤" label="Total Customers" value={dashboard?.totalCustomers || 0} color="#7c3aed" />
        <StatsCard icon="↩️" label="Refund Amount" value={`Rs. ${(dashboard?.totalRefundAmount || 0).toFixed(0)}`} color="#dc2626" />
        <StatsCard icon="⚠️" label="Low Stock Items" value={dashboard?.lowStockProducts || 0} color="#d97706" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* Revenue Chart */}
        <Card style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>📈 Revenue Trend</h2>
          <p style={{ fontSize: 12, color: '#999', margin: '0 0 20px' }}>{period.charAt(0).toUpperCase() + period.slice(1)} breakdown</p>
          {revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" style={{ fontSize: 11 }} />
                <YAxis style={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`Rs. ${v.toFixed(0)}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={3} dot={{ fill: '#FF6B35', r: 4 }} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign: 'center', padding: '40px 0', color: '#ccc' }}>No revenue data yet</div>}
        </Card>

        {/* Top Products */}
        <Card style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>🏆 Top Selling Products</h2>
          <p style={{ fontSize: 12, color: '#999', margin: '0 0 20px' }}>Best performers by units sold</p>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" style={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis style={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="sales" fill="#FFC107" name="Units Sold" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign: 'center', padding: '40px 0', color: '#ccc' }}>No product data yet</div>}
        </Card>

        {/* Payment Breakdown */}
        <Card style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>💳 Payment Methods</h2>
          <p style={{ fontSize: 12, color: '#999', margin: '0 0 20px' }}>Revenue by payment method</p>
          {paymentBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={paymentBreakdown} cx="50%" cy="50%" outerRadius={90} dataKey="amount" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {paymentBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `Rs. ${v.toFixed(0)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign: 'center', padding: '40px 0', color: '#ccc' }}>No payment data yet</div>}
        </Card>
      </div>
    </div>
  );
}
