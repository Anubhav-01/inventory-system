import React, { useEffect, useState } from 'react';
import { ShoppingBag, Users, ShoppingCart, AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardView({ apiBaseUrl, setActiveTab, showToast }) {
  const [data, setData] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await fetch(`${apiBaseUrl}/dashboard/summary`);
      if (!response.ok) throw new Error('Failed to fetch dashboard summary.');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [apiBaseUrl]);

  if (loading) {
    return (
      <div className="flex-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div className="loading-spinner"></div>
        <p style={{ marginLeft: '12px' }}>Loading Dashboard metrics...</p>
      </div>
    );
  }

  const lowStockCount = data.low_stock_products.length;

  return (
    <div className="animate-fade-in" style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Business Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Real-time overview of products, customers, orders, and inventory status.</p>
        </div>
        <button 
          onClick={() => fetchDashboardData(true)} 
          className="btn-icon" 
          disabled={refreshing}
          style={{ gap: '8px', display: 'flex', alignItems: 'center' }}
        >
          <RefreshCw size={16} className={refreshing ? 'spin-anim' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
        {/* Products Card */}
        <div className="glass-panel card-glow-indigo" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Products</p>
            <h3 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', marginBottom: 0 }}>{data.total_products}</h3>
          </div>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '16px', borderRadius: '12px' }}>
            <ShoppingBag size={28} />
          </div>
        </div>

        {/* Customers Card */}
        <div className="glass-panel card-glow-cyan" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Customers</p>
            <h3 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', marginBottom: 0 }}>{data.total_customers}</h3>
          </div>
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--cyan)', padding: '16px', borderRadius: '12px' }}>
            <Users size={28} />
          </div>
        </div>

        {/* Orders Card */}
        <div className="glass-panel card-glow-success" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Orders</p>
            <h3 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', marginBottom: 0 }}>{data.total_orders}</h3>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '16px', borderRadius: '12px' }}>
            <ShoppingCart size={28} />
          </div>
        </div>

        {/* Low Stock Alerts Card */}
        <div className="glass-panel card-glow-danger" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Low Stock Items</p>
            <h3 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', marginBottom: 0, color: lowStockCount > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {lowStockCount}
            </h3>
          </div>
          <div style={{ 
            background: lowStockCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)', 
            color: lowStockCount > 0 ? 'var(--danger)' : 'var(--text-secondary)', 
            padding: '16px', 
            borderRadius: '12px' 
          }}>
            <AlertTriangle size={28} className={lowStockCount > 0 ? 'pulse-anim' : ''} />
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid-cols-2">
        {/* Low Stock List */}
        <div className="glass-panel" style={{ padding: '24px', minHeight: '320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <AlertTriangle size={20} style={{ color: lowStockCount > 0 ? 'var(--danger)' : 'var(--text-secondary)' }} />
            <h4 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Low Stock Alert Center</h4>
          </div>

          {lowStockCount === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--success)', marginBottom: '8px' }}>✓ All inventory levels are healthy</p>
              <p style={{ fontSize: '0.9rem' }}>No products are currently running below the threshold.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
              {data.low_stock_products.map((product) => (
                <div key={product.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 16px', 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid rgba(255, 255, 255, 0.05)', 
                  borderRadius: '10px' 
                }}>
                  <div>
                    <h5 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>{product.name}</h5>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SKU: {product.sku}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                      {product.quantity} left
                    </span>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>${parseFloat(product.price).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px' }}>Quick System Actions</h4>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
              Manage operations efficiently by jumping directly into specific sections of the application.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => setActiveTab('products')} 
                className="btn-secondary" 
                style={{ textAlign: 'left', width: '100%', padding: '14px 20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>📦 Add or Manage Products</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Go to products →</span>
              </button>

              <button 
                onClick={() => setActiveTab('customers')} 
                className="btn-secondary" 
                style={{ textAlign: 'left', width: '100%', padding: '14px 20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>👥 Add or Manage Customers</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Go to customers →</span>
              </button>

              <button 
                onClick={() => setActiveTab('orders')} 
                className="btn-primary" 
                style={{ textAlign: 'left', width: '100%', padding: '14px 20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>🛒 Create a New Customer Order</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Place Order →</span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--card-border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>Database Connection: 🟢 PostgreSQL</span>
            <span>API Status: Healthy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
