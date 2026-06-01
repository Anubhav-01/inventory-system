import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, X, User } from 'lucide-react';

export default function CustomersView({ apiBaseUrl, showToast }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/customers`);
      if (!response.ok) throw new Error('Failed to retrieve customers list.');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Error loading customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [apiBaseUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddModal = () => {
    setFormData({ name: '', email: '', phone: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validations
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Name and Email are required fields.', 'error');
      return;
    }

    // Email regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim() || null
    };

    try {
      const response = await fetch(`${apiBaseUrl}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || 'An error occurred while creating the customer.');
      }

      showToast('Customer created successfully.', 'success');
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Failed to create customer.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer? This will also delete all associated orders.')) return;

    try {
      const response = await fetch(`${apiBaseUrl}/customers/${id}`, {
        method: 'DELETE'
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to delete the customer.');
      }

      showToast('Customer and associated orders deleted successfully.', 'success');
      fetchCustomers();
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Failed to delete customer.', 'error');
    }
  };

  // Local filtering
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ padding: '24px 0' }}>
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Customer Relations</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your accounts, customer registrations, and contacts.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      {/* Filters bar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search by Name or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 40px',
              borderRadius: '8px',
              border: '1px solid var(--card-border)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: 'white',
              fontSize: '0.95rem'
            }}
          />
        </div>
      </div>

      {/* Customers table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginLeft: '12px' }}>Loading customers database...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <User size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No customers found</p>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Try adjusting your search filters or add a new customer.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>Full Name</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>Email Address</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>Phone Number</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} style={{ borderBottom: '1px solid var(--card-border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{customer.name}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ color: 'var(--cyan)', fontWeight: 500 }}>{customer.email}</span>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                    {customer.phone || 'N/A'}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleDelete(customer.id)} className="btn-icon" title="Delete Customer">
                        <Trash2 size={16} style={{ color: 'rgba(239, 68, 68, 0.7)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '28px', position: 'relative' }}>
            <button 
              onClick={() => setIsModalOpen(false)} 
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Add Customer Account</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
              Register new client profiles with verified contact details.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'white'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. john@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'white'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. +1 (555) 019-2834"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'white'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
