import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  // State for API data
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  
  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Chart colors
  const COLORS = ['#FF6B35', '#FFC107', '#2ECC71', '#3498DB', '#E74C3C', '#9B59B6'];

  // Fetch all dashboard data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all endpoints in parallel
      // Note: api base URL already includes /api, so paths here start with /reports/
      const [dashRes, revRes, productsRes, paymentRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/reports/revenue?type=monthly'),
        api.get('/reports/most-selling'),
        api.get('/reports/payment-breakdown')
      ]);

      // Process dashboard data — shape: { success, data: { totalOrders, totalRevenue, ... } }
      if (dashRes.data?.data) {
        setDashboardData(dashRes.data.data);
      }

      // Process revenue data — shape: { success, data: { type, report: [...] } }
      const reportArr = revRes.data?.data?.report;
      if (Array.isArray(reportArr)) {
        // Normalise each entry to { month, revenue } for the chart
        setRevenueData(
          reportArr.map((r) => ({
            month: r._id?.month ? `${r._id.year}/${String(r._id.month).padStart(2, '0')}` : String(r._id),
            revenue: r.totalRevenue || 0,
          }))
        );
      }

      // Process top products — shape: { success, data: [{ _id, productName, totalQuantity, ... }] }
      if (Array.isArray(productsRes.data?.data)) {
        setTopProducts(
          productsRes.data.data.map((p) => ({
            name: p.productName || 'Unknown',
            salesCount: p.totalQuantity || 0,
            revenue: p.totalRevenue || 0,
          }))
        );
      }

      // Process payment breakdown — shape: { success, data: { summary, breakdown: [...] } }
      const breakdown = paymentRes.data?.data?.breakdown;
      if (Array.isArray(breakdown)) {
        setPaymentData(
          breakdown.map((b) => ({
            name: b.paymentMethod || 'Unknown',
            amount: b.totalAmount || 0,
            count: b.orderCount || 0,
          }))
        );
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>⚠️ {error}</p>
          <button onClick={handleRefresh} style={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, {user?.email || 'Admin'}!</p>
        </div>
        <button 
          onClick={handleRefresh} 
          style={{ ...styles.refreshButton, opacity: refreshing ? 0.6 : 1 }}
          disabled={refreshing}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        {/* Total Revenue Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>💰</span>
            <h3 style={styles.cardTitle}>Total Revenue</h3>
          </div>
          <p style={styles.cardValue}>
            Rs. {(dashboardData?.totalRevenue || 0).toFixed(0)}
          </p>
          <p style={styles.cardSubtext}>This month</p>
        </div>

        {/* Total Orders Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>📦</span>
            <h3 style={styles.cardTitle}>Total Orders</h3>
          </div>
          <p style={styles.cardValue}>
            {dashboardData?.totalOrders || 0}
          </p>
          <p style={styles.cardSubtext}>
            +{dashboardData?.pendingOrders || 0} pending
          </p>
        </div>

        {/* Total Refunds Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>↩️</span>
            <h3 style={styles.cardTitle}>Total Refunds</h3>
          </div>
          <p style={styles.cardValue}>
            Rs. {(dashboardData?.totalRefundAmount || 0).toFixed(0)}
          </p>
          <p style={styles.cardSubtext}>
            Total refunded
          </p>
        </div>

        {/* Active Customers Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>👥</span>
            <h3 style={styles.cardTitle}>Active Customers</h3>
          </div>
          <p style={styles.cardValue}>
            {dashboardData?.totalCustomers || 0}
          </p>
          <p style={styles.cardSubtext}>This month</p>
        </div>

        {/* Low Stock Items Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>⚠️</span>
            <h3 style={styles.cardTitle}>Low Stock Items</h3>
          </div>
          <p style={{ ...styles.cardValue, color: '#E74C3C' }}>
            {dashboardData?.lowStockProducts || 0}
          </p>
          <p style={styles.cardSubtext}>Need attention</p>
        </div>

        {/* Out of Stock Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>🛑</span>
            <h3 style={styles.cardTitle}>Out of Stock</h3>
          </div>
          <p style={{ ...styles.cardValue, color: '#C0392B' }}>
            {dashboardData?.outOfStockProducts || 0}
          </p>
          <p style={styles.cardSubtext}>Unavailable items</p>
        </div>
      </div>

      {/* Charts Section */}
      <div style={styles.chartsContainer}>
        {/* Revenue Chart */}
        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>📈 Revenue Trend</h2>
          <p style={styles.chartSubtitle}>Monthly revenue analysis</p>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E3" />
                <XAxis 
                  dataKey="month" 
                  stroke="#666666"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#666666"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F5F5F0'
                  }}
                  formatter={(value) => [`Rs. ${value.toFixed(0)}`, 'Revenue']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#FF6B35" 
                  strokeWidth={3}
                  dot={{ fill: '#FF6B35', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={styles.noDataText}>No revenue data available</p>
          )}
        </div>

        {/* Top Products Chart */}
        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>🏆 Top Selling Products</h2>
          <p style={styles.chartSubtitle}>Best performers this month</p>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E3" />
                <XAxis 
                  dataKey="name" 
                  stroke="#666666"
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis 
                  stroke="#666666"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F5F5F0'
                  }}
                  formatter={(value) => [value, 'Units Sold']}
                />
                <Legend />
                <Bar 
                  dataKey="salesCount" 
                  fill="#FFC107"
                  name="Units Sold"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={styles.noDataText}>No product data available</p>
          )}
        </div>

        {/* Payment Breakdown Chart */}
        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>💳 Payment Methods</h2>
          <p style={styles.chartSubtitle}>Distribution of payment methods</p>
          {paymentData.length > 0 ? (
            <div style={styles.pieChartWrapper}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => 
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                    isAnimationActive={true}
                    animationDuration={800}
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1A1A1A',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F5F5F0'
                    }}
                    formatter={(value) => `Rs. ${value.toFixed(0)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Payment Method Legend */}
              <div style={styles.paymentLegend}>
                {paymentData.map((item, index) => (
                  <div key={index} style={styles.legendItem}>
                    <div 
                      style={{
                        ...styles.legendColor,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    ></div>
                    <span>{item.name}</span>
                    <span style={styles.legendValue}>
                      Rs. {item.amount.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={styles.noDataText}>No payment data available</p>
          )}
        </div>

        {/* Detailed Metrics */}
        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>📊 Detailed Metrics</h2>
          <div style={styles.metricsTable}>
            <div style={styles.metricRow}>
              <span style={styles.metricLabel}>Total Orders:</span>
              <span style={styles.metricValue}>
                {dashboardData?.totalOrders || 0}
              </span>
            </div>
            <div style={styles.metricRow}>
              <span style={styles.metricLabel}>Pending Orders:</span>
              <span style={styles.metricValue}>
                {dashboardData?.pendingOrders || 0}
              </span>
            </div>
            <div style={styles.metricRow}>
              <span style={styles.metricLabel}>Total Customers:</span>
              <span style={styles.metricValue}>
                {dashboardData?.totalCustomers || 0}
              </span>
            </div>
            <div style={styles.metricRow}>
              <span style={styles.metricLabel}>Total Revenue:</span>
              <span style={styles.metricValue}>
                Rs. {(dashboardData?.totalRevenue || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== STYLES ====================
const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#F5F5F0',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },

  title: {
    fontSize: '36px',
    fontWeight: 800,
    color: '#1A1A1A',
    margin: 0,
    marginBottom: '4px',
  },

  subtitle: {
    fontSize: '14px',
    color: '#666666',
    margin: 0,
  },

  refreshButton: {
    backgroundColor: '#FF6B35',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
  },

  // Summary Cards
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },

  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    border: '1px solid #E8E8E3',
  },

  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '12px',
  },

  cardIcon: {
    fontSize: '28px',
  },

  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666666',
    margin: 0,
  },

  cardValue: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#FF6B35',
    margin: '12px 0 8px 0',
  },

  cardSubtext: {
    fontSize: '12px',
    color: '#999999',
    margin: 0,
  },

  // Charts
  chartsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },

  chartCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #E8E8E3',
  },

  chartTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1A1A1A',
    margin: '0 0 4px 0',
  },

  chartSubtitle: {
    fontSize: '12px',
    color: '#999999',
    margin: '0 0 16px 0',
  },

  noDataText: {
    textAlign: 'center',
    color: '#999999',
    padding: '40px 20px',
    fontSize: '14px',
  },

  pieChartWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  paymentLegend: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginTop: '16px',
    width: '100%',
  },

  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    padding: '8px',
    backgroundColor: '#F5F5F0',
    borderRadius: '6px',
  },

  legendColor: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    flexShrink: 0,
  },

  legendValue: {
    marginLeft: 'auto',
    fontWeight: '600',
    color: '#FF6B35',
  },

  // Metrics Table
  metricsTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#F5F5F0',
    borderRadius: '6px',
  },

  metricLabel: {
    fontSize: '13px',
    color: '#666666',
    fontWeight: '500',
  },

  metricValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#FF6B35',
  },

  // Loading & Error States
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },

  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #E8E8E3',
    borderTop: '4px solid #FF6B35',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '16px',
  },

  loadingText: {
    fontSize: '16px',
    color: '#666666',
  },

  errorContainer: {
    backgroundColor: 'white',
    border: '2px solid #E74C3C',
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
  },

  errorText: {
    fontSize: '16px',
    color: '#E74C3C',
    marginBottom: '16px',
  },

  retryButton: {
    backgroundColor: '#FF6B35',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
};

// Add keyframe animation to document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default AdminDashboard;
