import React, { useState, useEffect } from 'react';
import { LayoutGrid, Package, Users, ShoppingCart, AlertCircle, CheckCircle2 } from 'lucide-react';
import DashboardView from './components/DashboardView';
import ProductsView from './components/ProductsView';
import CustomersView from './components/CustomersView';
import OrdersView from './components/OrdersView';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            apiBaseUrl={API_BASE_URL}
            setActiveTab={setActiveTab}
            showToast={showToast}
          />
        );
      case 'products':
        return (
          <ProductsView
            apiBaseUrl={API_BASE_URL}
            showToast={showToast}
          />
        );
      case 'customers':
        return (
          <CustomersView
            apiBaseUrl={API_BASE_URL}
            showToast={showToast}
          />
        );
      case 'orders':
        return (
          <OrdersView
            apiBaseUrl={API_BASE_URL}
            showToast={showToast}
          />
        );
      default:
        return <div style={{ padding: '40px 0' }}>Tab context not recognized.</div>;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toast && (
        <div 
          className="glass-panel"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '16px 20px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 9999,
            borderLeft: `4px solid ${toast.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
            maxWidth: '380px',
            animation: 'fadeIn 0.2s ease-out forwards'
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 style={{ color: 'var(--success)', flexShrink: 0 }} size={20} />
          ) : (
            <AlertCircle style={{ color: 'var(--danger)', flexShrink: 0 }} size={20} />
          )}
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, color: 'white' }}>
            {toast.message}
          </p>
        </div>
      )}

      {/* Navigation Header */}
      <header className="glass-panel" style={{
        margin: '20px 20px 0 20px',
        padding: '12px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '16px',
        border: '1px solid var(--card-border)'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--purple))',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 0 12px var(--primary-glow)'
          }}>
            <ShoppingCart size={20} style={{ color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Antigravity</h1>
            <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--cyan)', margin: 0, fontWeight: 700 }}>Inventory Hub</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <nav style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              background: activeTab === 'dashboard' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: 'none',
              color: activeTab === 'dashboard' ? 'white' : 'var(--text-secondary)',
              padding: '10px 16px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: activeTab === 'dashboard' ? 600 : 500
            }}
          >
            <LayoutGrid size={16} />
            <span className="nav-text">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            style={{
              background: activeTab === 'products' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: 'none',
              color: activeTab === 'products' ? 'white' : 'var(--text-secondary)',
              padding: '10px 16px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: activeTab === 'products' ? 600 : 500
            }}
          >
            <Package size={16} />
            <span className="nav-text">Products</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            style={{
              background: activeTab === 'customers' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: 'none',
              color: activeTab === 'customers' ? 'white' : 'var(--text-secondary)',
              padding: '10px 16px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: activeTab === 'customers' ? 600 : 500
            }}
          >
            <Users size={16} />
            <span className="nav-text">Customers</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            style={{
              background: activeTab === 'orders' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: 'none',
              color: activeTab === 'orders' ? 'white' : 'var(--text-secondary)',
              padding: '10px 16px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: activeTab === 'orders' ? 600 : 500
            }}
          >
            <ShoppingCart size={16} />
            <span className="nav-text">Orders</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '0 20px 40px 20px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
        {renderContent()}
      </main>
    </div>
  );
}
