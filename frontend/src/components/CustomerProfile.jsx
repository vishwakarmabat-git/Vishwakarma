import { useState } from 'react';
import { User, MapPin, ClipboardList, LogOut, Plus, Trash, Download } from 'lucide-react';
import { db } from '../data/db';
import { toast } from 'react-toastify';

export default function CustomerProfile({ currentUser, onLogout, onCloseStorefront }) {
  const [activeTab, setActiveTab] = useState('orders'); // orders, profile, address
  const [orders, setOrders] = useState(() => {
    if (!currentUser) return [];
    const allOrders = db.getOrders();
    return allOrders.filter(o => o.customerId === currentUser.id || o.email === currentUser.email);
  });
  
  // Profile form state
  const [profileForm, setProfileForm] = useState(() => ({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    password: '',
    confirmPassword: ''
  }));
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Address states
  const [addresses, setAddresses] = useState(() => currentUser?.addresses || []);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ type: 'Home', name: '', street: '', city: '', state: 'Gujarat', pincode: '', phone: '' });

  // Order Tracking state
  const [trackingOrder, setTrackingOrder] = useState(null);
  
  // Cancel Order state
  const [cancelOrderData, setCancelOrderData] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  if (!currentUser) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', background: 'var(--black)', color: 'var(--white)' }}>
        <h2>Session expired. Please log in.</h2>
      </div>
    );
  }

  // Profile Update Submission
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });

    if (!profileForm.name || !profileForm.email) {
      setProfileMessage({ type: 'error', text: 'Name and Email are required!' });
      return;
    }

    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      setProfileMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }

    const res = db.updateCustomerProfile(currentUser.id, profileForm.name, profileForm.email, profileForm.password);
    if (!res.success) {
      setProfileMessage({ type: 'error', text: res.message });
      return;
    }

    setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    setProfileForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
  };

  // Address Actions
  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!addressForm.name || !addressForm.street || !addressForm.city || !addressForm.pincode || !addressForm.phone) {
      toast.error("Please fill in all address details!");
      return;
    }
    if (!/[a-zA-Z]/.test(addressForm.name)) {
      toast.error("Name must contain alphabets.");
      return;
    }
    if (!/[a-zA-Z]/.test(addressForm.city) || !/[a-zA-Z]/.test(addressForm.state)) {
      toast.error("City and State must contain alphabets.");
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(addressForm.pincode)) {
      toast.error("Please enter a valid 6-digit Indian Pincode.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(addressForm.phone)) {
      toast.error("Please enter a valid 10-digit Indian Mobile Number.");
      return;
    }
    const newAddr = {
      ...addressForm,
      id: "addr-" + Math.floor(1000 + Math.random() * 9000)
    };
    const updatedList = [...addresses, newAddr];
    setAddresses(updatedList);
    db.updateCustomerAddressBook(currentUser.id, updatedList);

    // Reset Form
    setAddressForm({ type: 'Home', name: '', street: '', city: '', state: 'Gujarat', pincode: '', phone: '' });
    setShowAddressForm(false);
  };

  const handleDeleteAddress = (id) => {
    if (confirm("Delete this address?")) {
      const updatedList = addresses.filter(a => a.id !== id);
      setAddresses(updatedList);
      db.updateCustomerAddressBook(currentUser.id, updatedList);
    }
  };

  const handleCancelOrder = (orderId) => {
    setCancelOrderData(orderId);
    setCancelReason('');
  };

  const confirmCancelOrder = () => {
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }
    const res = db.updateOrderStatus(cancelOrderData, 'cancelled', `Reason: ${cancelReason}`);
    if (res) {
      setOrders(orders.map(o => {
        if (o.id === cancelOrderData) {
          return { ...o, status: 'cancelled' };
        }
        return o;
      }));
      // Demo Shiprocket sync notification
      alert("Order cancelled. Feedback recorded. Shiprocket sync triggered: cancellation request sent.");
    } else {
      alert("Failed to cancel order.");
    }
    setCancelOrderData(null);
  };

  // Invoice Printer
  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Pop-up blocked. Please allow pop-ups for this site to download the invoice.");
      return;
    }

    const orderPrice = Number(order.price || 0);
    const orderTotal = Number(order.total || 0);
    const orderGst = order.gst !== undefined ? Number(order.gst) : Math.round(orderPrice * 0.12);

    const rowsHtml = order.cartItems && order.cartItems.length > 0
      ? order.cartItems.map(item => `
        <tr>
          <td><strong>${item.name}</strong><br/><span style="font-size: 11px; color: #777;">Weight: ${item.weight || 'N/A'} | Handle: ${item.handle || 'N/A'}</span></td>
          <td style="text-align:right">${item.quantity}</td>
          <td style="text-align:right">₹${Number(item.price || 0).toLocaleString('en-IN')}</td>
          <td style="text-align:right">₹${Math.round(Number(item.price || 0) * 0.12).toLocaleString('en-IN')}</td>
          <td style="text-align:right">₹${Math.round(Number(item.price || 0) * 1.12 * Number(item.quantity || 1)).toLocaleString('en-IN')}</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td><strong>${order.batName || 'Cricket Bat'}</strong> - Handcrafted Premium Cricket Bat</td>
          <td style="text-align:right">1</td>
          <td style="text-align:right">₹${orderPrice.toLocaleString('en-IN')}</td>
          <td style="text-align:right">₹${orderGst.toLocaleString('en-IN')}</td>
          <td style="text-align:right">₹${orderTotal.toLocaleString('en-IN')}</td>
        </tr>
      `;

    const invoiceHtml = `
      <html>
      <head>
        <title>Invoice - ${order.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #a30000; padding-bottom: 20px; margin-bottom: 30px; }
          .brand { font-size: 24px; font-weight: bold; color: #111; }
          .invoice-details { text-align: right; font-size: 14px; color: #555; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .bill-to { font-size: 14px; }
          .bill-to h4 { margin: 0 0 8px; font-size: 16px; color: #a30000; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f9f9f9; padding: 12px; font-weight: bold; border-bottom: 2px solid #ddd; text-align: left; }
          td { padding: 12px; border-bottom: 1px solid #eee; }
          .totals { text-align: right; font-size: 16px; font-weight: bold; }
          .totals-row { display: flex; justify-content: flex-end; gap: 20px; padding: 8px 0; }
          .grand-total { border-top: 2px solid #a30000; font-size: 18px; color: #a30000; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">VK BAT HOUSE</div>
            <div style="font-size:12px;color:#777">Uttarsanda Bhalej Road, Chaklasi 387315</div>
          </div>
          <div class="invoice-details">
            <h2 style="margin:0;color:#a30000">TAX INVOICE</h2>
            <div>Invoice No: <strong>${order.id}</strong></div>
            <div>Date: ${order.date || ''}</div>
          </div>
        </div>
        <div class="meta-grid">
          <div class="bill-to">
            <h4>Customer Details</h4>
            <strong>Name:</strong> ${order.customerName || ''}<br/>
            <strong>Phone:</strong> ${order.phone || ''}<br/>
            <strong>Email:</strong> ${order.email || ''}<br/>
            <strong>Specs Selected:</strong> ${order.specs || 'Standard'}<br/>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product / Description</th>
              <th style="text-align:right">Quantity</th>
              <th style="text-align:right">Unit Price</th>
              <th style="text-align:right">GST Amount (12%)</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="totals">
          <div class="totals-row"><span>Subtotal:</span><span>₹${orderPrice.toLocaleString('en-IN')}</span></div>
          <div class="totals-row"><span>GST Amount:</span><span>₹${orderGst.toLocaleString('en-IN')}</span></div>
          <div class="totals-row grand-total"><span>Grand Total:</span><span>₹${orderTotal.toLocaleString('en-IN')}</span></div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <section className="section-padding" style={{ background: 'var(--black)', flexGrow: 1 }}>
      <div className="container">
        
        {/* Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '30px', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="section-tag" style={{ margin: 0 }}>Customer Dashboard</span>
            <h1 className="section-title" style={{ fontSize: '2.4rem', margin: '4px 0 0', textTransform: 'none' }}>
              Welcome, {currentUser.name}!
            </h1>
          </div>
          
          <button
            onClick={() => {
              onLogout();
              if (onCloseStorefront) onCloseStorefront();
            }}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '10px 18px', border: '1px solid var(--border)' }}
          >
            <LogOut size={14} /> Sign Out Account
          </button>
        </div>

        {/* Dashboard Main Grid */}
        <div className="account-wrapper">
          
          {/* Sidebar Menu */}
          <div className="account-menu">
            <div
              className={`account-menu-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => { setActiveTab('orders'); setTrackingOrder(null); }}
            >
              <ClipboardList size={16} /> My Orders ({orders.length})
            </div>
            <div
              className={`account-menu-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={16} /> Personal Profile
            </div>
            <div
              className={`account-menu-item ${activeTab === 'address' ? 'active' : ''}`}
              onClick={() => setActiveTab('address')}
            >
              <MapPin size={16} /> Address Book ({addresses.length})
            </div>
          </div>

          {/* Main Panel Content */}
          <div className="account-content">
            
            {/* TAB: MY ORDERS */}
            {activeTab === 'orders' && !trackingOrder && (
              <div className="account-panel">
                <h3 style={{ fontSize: '1.2rem', color: 'var(--white)', marginBottom: '24px', fontFamily: 'Playfair Display' }}>
                  Purchase Order History
                </h3>
                
                {orders.length === 0 ? (
                  <div style={{ color: 'var(--muted)', padding: '40px 0', fontSize: '0.95rem' }}>
                    You have not placed any orders yet. Visit our Bat shop to choose your weapon!
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="order-list-card">
                      <div className="order-list-header">
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>ORDER ID</span>
                          <strong style={{ color: 'var(--white)' }}>{order.id}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>DATE PLACED</span>
                          <strong style={{ color: 'var(--white)' }}>{order.date}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>TOTAL PAID</span>
                          <strong style={{ color: 'var(--gold)' }}>₹{order.total.toLocaleString('en-IN')}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>FULFILLMENT STATUS</span>
                          <span
                            className="badge"
                            style={{
                              background: order.status === 'delivered' ? 'rgba(46,204,113,0.1)' : order.status === 'shipped' ? 'rgba(52,152,219,0.1)' : order.status === 'cancelled' ? 'rgba(231,76,60,0.1)' : 'rgba(230,126,34,0.1)',
                              color: order.status === 'delivered' ? '#2ecc71' : order.status === 'shipped' ? '#3498db' : order.status === 'cancelled' ? '#e74c3c' : '#e67e22'
                            }}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', color: 'var(--white)', marginBottom: '4px' }}>{order.batName}</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{order.specs}</p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => setTrackingOrder(order)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                          >
                            Track Delivery Status
                          </button>
                          <button
                            onClick={() => handlePrintInvoice(order)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Download Tax Invoice"
                          >
                            <Download size={12} /> Invoice
                          </button>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '6px 12px', color: '#e74c3c', borderColor: 'rgba(231,76,60,0.3)' }}
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* NESTED VIEW: ORDER TRACKING TIMELINE */}
            {activeTab === 'orders' && trackingOrder && (
              <div className="account-panel">
                <button
                  onClick={() => setTrackingOrder(null)}
                  className="btn btn-secondary"
                  style={{ marginBottom: '24px', fontSize: '0.75rem', padding: '6px 12px' }}
                >
                  ← Back to Orders
                </button>

                 <h3 style={{ fontSize: '1.2rem', color: 'var(--white)', marginBottom: '8px', fontFamily: 'Playfair Display' }}>
                  Track Order status: {trackingOrder.id}
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
                  Product: {trackingOrder.batName} · Custom Spec details: {trackingOrder.specs}
                </p>

                {/* Timeline Visual Nodes */}
                <div className="track-timeline">
                  {/* Node 1: Pending */}
                  <div className="track-node completed">
                    <div className="track-circle">✓</div>
                    <div className="track-label">Order Placed</div>
                    <div className="track-time">{trackingOrder.date}</div>
                  </div>

                  {/* Node 2: Shipped */}
                  <div className={`track-node ${['shipped', 'delivered'].includes(trackingOrder.status) ? 'completed' : 'current'}`}>
                    <div className="track-circle">
                      {['shipped', 'delivered'].includes(trackingOrder.status) ? '✓' : '2'}
                    </div>
                    <div className="track-label">Dispatched</div>
                    <div className="track-time">
                      {trackingOrder.timeline?.find(t => t.status === 'shipped')?.time || 'Awaiting'}
                    </div>
                  </div>

                  {/* Node 3: Delivered */}
                  <div className={`track-node ${trackingOrder.status === 'delivered' ? 'completed' : ''}`}>
                    <div className="track-circle">
                      {trackingOrder.status === 'delivered' ? '✓' : '3'}
                    </div>
                    <div className="track-label">Delivered</div>
                    <div className="track-time">
                      {trackingOrder.timeline?.find(t => t.status === 'delivered')?.time || 'Awaiting'}
                    </div>
                  </div>
                </div>

                {/* History Logs */}
                <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', padding: '20px', marginTop: '30px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--white)', marginBottom: '12px' }}>Fulfillment Milestones Log</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {trackingOrder.timeline?.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--gold)', minWidth: '120px' }}>{step.time}</span>
                        <span style={{ color: 'var(--white)', fontWeight: 600 }}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PERSONAL PROFILE */}
            {activeTab === 'profile' && (
              <div className="account-panel">
                <h3 style={{ fontSize: '1.2rem', color: 'var(--white)', marginBottom: '24px', fontFamily: 'Playfair Display' }}>
                  Edit Profile Details
                </h3>

                {profileMessage.text && (
                  <div style={{
                    padding: '12px',
                    fontSize: '0.85rem',
                    marginBottom: '20px',
                    border: '1px solid',
                    background: profileMessage.type === 'success' ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
                    color: profileMessage.type === 'success' ? '#2ecc71' : '#e74c3c',
                    borderColor: profileMessage.type === 'success' ? '#2ecc71' : '#e74c3c'
                  }}>
                    {profileMessage.text}
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password (leave blank to keep current)</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter new password"
                      value={profileForm.password}
                      onChange={(e) => setProfileForm(p => ({ ...p, password: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Retype password"
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
                    Save Profile Changes
                  </button>
                </form>
              </div>
            )}

            {/* TAB: ADDRESS BOOK */}
            {activeTab === 'address' && (
              <div className="account-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--white)', fontFamily: 'Playfair Display', margin: 0 }}>
                    My Address Book
                  </h3>
                  {!showAddressForm && (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', padding: '8px 14px' }}
                    >
                      <Plus size={14} /> Add Address
                    </button>
                  )}
                </div>

                {/* Address Form Drawer/Block */}
                {showAddressForm && (
                  <form onSubmit={handleAddAddress} style={{ background: 'var(--dark)', border: '1px solid var(--border)', padding: '20px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--white)', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>Add Shipping Destination</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Recipient Name *</label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          placeholder="e.g. Sumit Kumar"
                          value={addressForm.name}
                          onChange={(e) => setAddressForm(p => ({ ...p, name: e.target.value }))}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Address Label *</label>
                        <select
                          className="form-control"
                          value={addressForm.type}
                          onChange={(e) => setAddressForm(p => ({ ...p, type: e.target.value }))}
                        >
                          <option value="Home">Home</option>
                          <option value="Office">Office</option>
                          <option value="Academy">Academy / Club</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Street / Apartment *</label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        placeholder="e.g. Flat 301, Silver Heights"
                        value={addressForm.street}
                        onChange={(e) => setAddressForm(p => ({ ...p, street: e.target.value }))}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">City *</label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          placeholder="e.g. Ahmedabad"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm(p => ({ ...p, city: e.target.value }))}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Pincode *</label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          placeholder="380015"
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm(p => ({ ...p, pincode: e.target.value.replace(/[^0-9]/g, '') }))}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Contact Phone Number *</label>
                      <input
                        type="tel"
                        required
                        className="form-control"
                        placeholder="9876543210"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm(p => ({ ...p, phone: e.target.value.replace(/[^0-9]/g, '') }))}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button type="button" onClick={() => setShowAddressForm(false)} className="btn btn-secondary">Cancel</button>
                      <button type="submit" className="btn btn-primary">Save Destination</button>
                    </div>
                  </form>
                )}

                {/* Destination Grid */}
                {addresses.length === 0 ? (
                  <div style={{ color: 'var(--muted)', padding: '20px 0' }}>
                    No addresses registered. Save shipping targets to speed up custom bookings!
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    {addresses.map(addr => (
                      <div key={addr.id} className="address-card">
                        <span className="address-card-badge">{addr.type}</span>
                        <strong style={{ color: 'var(--white)', fontSize: '1rem', marginTop: '8px' }}>{addr.name}</strong>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          {addr.street}<br />
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>📞 {addr.phone}</span>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#e74c3c',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            marginTop: '12px',
                            padding: 0
                          }}
                        >
                          <Trash size={12} /> Remove Destination
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Cancellation Modal */}
      {cancelOrderData && (
        <div className="modal-overlay" onClick={() => setCancelOrderData(null)} style={{ zIndex: 3000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '30px', maxWidth: '400px', width: '95%' }}>
            <h3 style={{ color: 'var(--white)', marginBottom: '16px', fontSize: '1.2rem' }}>Cancel Order</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Please provide a reason for cancelling this order. This helps us improve our service.
            </p>
            <textarea 
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Ordered by mistake, found a better price elsewhere..."
              style={{ width: '100%', minHeight: '80px', padding: '12px', background: 'var(--black)', color: 'var(--white)', border: '1px solid var(--border)', borderRadius: '4px', marginBottom: '20px', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setCancelOrderData(null)}>Keep Order</button>
              <button className="btn btn-primary" onClick={confirmCancelOrder} style={{ background: '#e74c3c', borderColor: '#e74c3c' }}>Confirm Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
