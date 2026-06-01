import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Package } from 'lucide-react';

export default function ProductsView({ apiBaseUrl, showToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedProductId, setSelectedProductId] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    quantity: ''
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/products`);
      if (!response.ok) throw new Error('Failed to retrieve products list.');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Error loading products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [apiBaseUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', sku: '', price: '', quantity: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setModalMode('edit');
    setSelectedProductId(product.id);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      quantity: product.quantity.toString()
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validations
    if (!formData.name.trim() || !formData.sku.trim() || formData.price === '' || formData.quantity === '') {
      showToast('All fields are required.', 'error');
      return;
    }

    const priceNum = parseFloat(formData.price);
    const quantityNum = parseInt(formData.quantity, 10);

    if (isNaN(priceNum) || priceNum < 0) {
      showToast('Price must be a positive number.', 'error');
      return;
    }

    if (isNaN(quantityNum) || quantityNum < 0) {
      showToast('Quantity cannot be negative.', 'error');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      price: priceNum,
      quantity: quantityNum
    };

    try {
      let response;
      if (modalMode === 'add') {
        response = await fetch(`${apiBaseUrl}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${apiBaseUrl}/products/${selectedProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || 'An error occurred while saving the product.');
      }

      showToast(
        modalMode === 'add' ? 'Product created successfully.' : 'Product updated successfully.',
        'success'
      );
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Failed to save product.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`${apiBaseUrl}/products/${id}`, {
        method: 'DELETE'
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to delete the product.');
      }

      showToast('Product deleted successfully.', 'success');
      fetchProducts();
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Failed to delete product.', 'error');
    }
  };

  // Local filtering
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ padding: '24px 0' }}>
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Product Inventory</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your catalog, stock quantities, and SKU configurations.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Filters bar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search by Name or SKU..."
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

      {/* Products table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginLeft: '12px' }}>Loading catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Package size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No products found</p>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Try adjusting your search filters or add a new product.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>Product Details</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>SKU / Code</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>Unit Price</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>Stock Status</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const isLowStock = product.quantity < 10;
                const isOutOfStock = product.quantity === 0;

                return (
                  <tr key={product.id} style={{ borderBottom: '1px solid var(--card-border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>{product.name}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <code style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                        {product.sku}
                      </code>
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: 500 }}>${parseFloat(product.price).toFixed(2)}</td>
                    <td style={{ padding: '16px 24px' }}>
                      {isOutOfStock ? (
                        <span className="badge badge-danger">Out of Stock</span>
                      ) : isLowStock ? (
                        <span className="badge badge-warning">Low Stock ({product.quantity})</span>
                      ) : (
                        <span className="badge badge-success">Healthy ({product.quantity})</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => openEditModal(product)} className="btn-icon" title="Edit Product">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="btn-icon" style={{ hoverColor: 'var(--danger)' }} title="Delete Product">
                          <Trash2 size={16} style={{ color: 'rgba(239, 68, 68, 0.7)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
              {modalMode === 'add' ? 'Add New Product' : 'Modify Product Details'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
              Configure SKU inventory codes, stock capacities, and prices.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Mechanical Keyboard"
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
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>SKU / Inventory Code *</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="e.g. KB-MECH-01"
                  required
                  disabled={modalMode === 'edit'} // SKU editing is traditionally restricted for integrity
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)',
                    background: modalMode === 'edit' ? 'rgba(255, 255, 255, 0.01)' : 'rgba(255, 255, 255, 0.03)',
                    color: modalMode === 'edit' ? 'var(--text-secondary)' : 'white'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                    min="0"
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Stock Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="0"
                    required
                    min="0"
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
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'add' ? 'Add Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
