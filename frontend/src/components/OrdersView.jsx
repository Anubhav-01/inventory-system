import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Search, X, ShoppingCart, Calendar } from 'lucide-react';

export default function OrdersView({ apiBaseUrl, showToast }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // New Order Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        fetch(`${apiBaseUrl}/orders`),
        fetch(`${apiBaseUrl}/products`),
        fetch(`${apiBaseUrl}/customers`)
      ]);

      if (!ordersRes.ok || !productsRes.ok || !customersRes.ok) {
        throw new Error('Failed to retrieve system records.');
      }

      const [ordersData, productsData, customersData] = await Promise.all([
        ordersRes.json(),
        productsRes.json(),
        customersRes.json()
      ]);

      setOrders(ordersData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Error loading records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiBaseUrl]);

  const openCreateModal = () => {
    if (customers.length === 0) {
      showToast('You must create a customer before placing an order.', 'error');
      return;
    }
    if (products.length === 0) {
      showToast('You must add products before placing an order.', 'error');
      return;
    }
    setSelectedCustomerId('');
    setOrderItems([{ product_id: '', quantity: 1 }]);
    setIsCreateOpen(true);
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    if (field === 'product_id') {
      newItems[index].product_id = value;
      // Default quantity to 1 when selecting a product
      newItems[index].quantity = 1;
    } else if (field === 'quantity') {
      newItems[index].quantity = parseInt(value, 10) || 1;
    }
    setOrderItems(newItems);
  };

  const openDetailsModal = async (orderId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/orders/${orderId}`);
      if (!response.ok) throw new Error('Failed to retrieve order details.');
      const data = await response.json();
      setSelectedOrder(data);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error(error);
      showToast('Could not load order details.', 'error');
    }
  };

  // Calculate current live total
  const calculateLiveTotal = () => {
    return orderItems.reduce((acc, item) => {
      const product = products.find((p) => p.id === parseInt(item.product_id, 10));
      if (product) {
        return acc + parseFloat(product.price) * item.quantity;
      }
      return acc;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      showToast('Please select a customer.', 'error');
      return;
    }

    // Validate items
    const validItems = orderItems.filter((item) => item.product_id !== '');
    if (validItems.length === 0) {
      showToast('Please add at least one product to the order.', 'error');
      return;
    }

    // Check for duplicate products in selection list
    const productIds = validItems.map(item => item.product_id);
    const hasDuplicates = productIds.some((val, i) => productIds.indexOf(val) !== i);
    if (hasDuplicates) {
      showToast('Please do not add duplicate products. Modify the quantity of the existing line instead.', 'error');
      return;
    }

    // Validate quantities against stock
    for (const item of validItems) {
      const product = products.find((p) => p.id === parseInt(item.product_id, 10));
      if (!product) {
        showToast('Invalid product selected.', 'error');
        return;
      }
      if (product.quantity < item.quantity) {
        showToast(
          `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`,
          'error'
        );
        return;
      }
    }

    const payload = {
      customer_id: parseInt(selectedCustomerId, 10),
      items: validItems.map((item) => ({
        product_id: parseInt(item.product_id, 10),
        quantity: item.quantity
      }))
    };

    try {
      const response = await fetch(`${apiBaseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to place the order.');
      }

      showToast('Order created successfully.', 'success');
      setIsCreateOpen(false);
      fetchData(); // Reloads orders, products (for stock reduction), etc.
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Failed to create order.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel/delete this order? Inventory stock will be restored.')) return;

    try {
      const response = await fetch(`${apiBaseUrl}/orders/${id}`, {
        method: 'DELETE'
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to cancel the order.');
      }

      showToast('Order canceled and stock restored successfully.', 'success');
      fetchData(); // Reloads orders, products (for restored stock)
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Failed to cancel order.', 'error');
    }
  };

  // Local filtering
  const filteredOrders = orders.filter(
    (order) =>
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toString().includes(searchQuery)
  );

  return (
    <div className="animate-fade-in" style={{ padding: '24px 0' }}>
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Sales & Orders</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Track billing, create new receipts, and manage inventory operations.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} />
          Create Order
        </button>
      </div>

      {/* Filters bar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search by Customer name or Order ID..."
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

      {/* Orders list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginLeft: '12px' }}>Loading sales directory...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No orders found</p>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Try adjusting your search query or place a new order.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>Order ID</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>Customer Name</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>Date Placed</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>Total Receipt</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const dateObj = new Date(order.created_at);
                const dateStr = dateObj.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--card-border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 700 }}>#{order.id}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>{order.customer_name}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        {dateStr}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--success)' }}>
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => openDetailsModal(order.id)} className="btn-icon" title="View Details">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleDelete(order.id)} className="btn-icon" title="Cancel/Delete Order">
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

      {/* CREATE ORDER MODAL */}
      {isCreateOpen && (
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
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '640px', padding: '28px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              onClick={() => setIsCreateOpen(false)} 
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Create Sales Receipt</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
              Create a purchase record. Select products and quantity levels below.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Customer selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Select Customer Account *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'white',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="" disabled style={{ background: 'var(--bg-color)' }}>-- Select a Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: 'var(--bg-color)' }}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              {/* Order items list */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Items List *</label>
                  <button type="button" onClick={handleAddItem} className="btn-secondary" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                    + Add Product Row
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {orderItems.map((item, index) => {
                    // Find product configuration for stock checks
                    const selectedProd = products.find((p) => p.id === parseInt(item.product_id, 10));
                    const maxStock = selectedProd ? selectedProd.quantity : 0;
                    const price = selectedProd ? parseFloat(selectedProd.price) : 0;

                    return (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                        {/* Product Dropdown */}
                        <select
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                          required
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--card-border)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            color: 'white',
                            fontSize: '0.9rem',
                            minWidth: 0
                          }}
                        >
                          <option value="" disabled style={{ background: 'var(--bg-color)' }}>-- Select Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id} disabled={p.quantity <= 0} style={{ background: 'var(--bg-color)' }}>
                              {p.name} {p.quantity <= 0 ? '(Out of Stock)' : `($${parseFloat(p.price).toFixed(2)})`}
                            </option>
                          ))}
                        </select>

                        {/* Inventory stock display */}
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0 4px' }}>
                          {item.product_id ? (
                            <span>Stock: <strong style={{ color: maxStock < 10 ? 'var(--warning)' : 'var(--success)' }}>{maxStock}</strong></span>
                          ) : (
                            <span>-</span>
                          )}
                        </div>

                        {/* Quantity input */}
                        <input
                          type="number"
                          min="1"
                          max={maxStock || 1}
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          required
                          disabled={!item.product_id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--card-border)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            color: 'white',
                            fontSize: '0.9rem',
                            width: '100%',
                            minWidth: 0
                          }}
                        />

                        {/* Remove item button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          disabled={orderItems.length === 1}
                          className="btn-icon"
                          style={{ border: 'none', color: 'var(--danger)', opacity: orderItems.length === 1 ? 0.3 : 1 }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Summary and Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '20px', marginTop: '10px' }}>
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimated Total Billing:</p>
                  <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)' }}>
                    ${calculateLiveTotal().toFixed(2)}
                  </h4>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Confirm Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS DIALOG */}
      {isDetailsOpen && selectedOrder && (
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
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '540px', padding: '28px', position: 'relative' }}>
            <button 
              onClick={() => setIsDetailsOpen(false)} 
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <ShoppingCart size={22} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Receipt Details #{selectedOrder.id}</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.85rem' }}>
              Date Placed: {new Date(selectedOrder.created_at).toLocaleString()}
            </p>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)', marginBottom: '24px' }}>
              <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Bill To:</p>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px', marginBottom: '2px' }}>{selectedOrder.customer_name}</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--cyan)' }}>Customer Ref ID: #{selectedOrder.customer_id}</p>
            </div>

            {/* List of items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Line Items</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {selectedOrder.items.map((item) => {
                  const lineTotal = parseFloat(item.price) * item.quantity;
                  return (
                    <div key={item.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '10px 14px', 
                      background: 'rgba(255, 255, 255, 0.01)', 
                      border: '1px solid rgba(255, 255, 255, 0.03)', 
                      borderRadius: '8px'
                    }}>
                      <div>
                        <h5 style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>{item.product_name}</h5>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Qty: {item.quantity} @ ${parseFloat(item.price).toFixed(2)} each
                        </p>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        ${lineTotal.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '20px' }}>
              <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-secondary)' }}>Total Paid Receipt:</span>
              <span style={{ fontWeight: 800, fontSize: '1.6rem', color: 'var(--success)' }}>
                ${parseFloat(selectedOrder.total_amount).toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setIsDetailsOpen(false)} className="btn-primary" style={{ padding: '8px 24px' }}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
