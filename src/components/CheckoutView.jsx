import React, { useState, useCallback } from 'react';
import { CheckCircle, ArrowLeft, MapPin, CreditCard, Loader2, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'react-toastify';
import { db } from '../data/db';
import { orderService } from '../services/orderService';

// ---------------------------------------------------------------------------
// Razorpay Standard Checkout integration
// KEY_ID is public – loaded from Vite env (VITE_RAZORPAY_KEY_ID).
// KEY_SECRET NEVER leaves the PHP backend.
// ---------------------------------------------------------------------------

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

/**
 * Opens the Razorpay checkout modal.
 * Resolves with { razorpay_payment_id, razorpay_order_id, razorpay_signature }
 * Rejects when user dismisses or payment fails.
 */
function openRazorpayModal({ razorpayOrderId, amount, currency, keyId, prefill, description }) {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay SDK failed to load. Please refresh the page.'));
      return;
    }

    const options = {
      key: keyId,
      amount,            // in paise
      currency,
      name: 'VK Bat House',
      description,
      prefill: {
        name:    prefill.name,
        email:   prefill.email,
        contact: prefill.phone,
      },
      theme: { color: '#d4af37' },
      modal: {
        ondismiss: () => reject(new Error('DISMISSED')),
      },
      handler: (response) => {
        resolve({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id:   response.razorpay_order_id,
          razorpay_signature:  response.razorpay_signature,
        });
      },
    };

    // Only attach order_id when it's provided (omit in dev/test mode)
    if (razorpayOrderId) {
      options.order_id = razorpayOrderId;
    }

    // In TEST mode (rzp_test_ key), UPI / QR / Wallets are NOT functional.
    // Hide those methods so the user isn't confused; only Card & Net Banking work.
    if (keyId && keyId.startsWith('rzp_test_')) {
      options.config = {
        display: {
          hide: [
            { method: 'upi' },
            { method: 'wallet' },
            { method: 'paylater' },
            { method: 'emi' },
          ],
          preferences: { show_default_blocks: true },
        },
      };
      // Surface the test card details in the modal's description
      options.notes = {
        'Test Card': '4111 1111 1111 1111',
        'Expiry / CVV': 'Any future date / 123',
        'OTP': '1234',
      };
    }

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (response) => {
      reject(new Error(response.error?.description || 'Payment failed.'));
    });

    rzp.open();
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CheckoutView({ cart, onBackToShop, onClearCart, onRequestLogin }) {
  const currentUser = db.getCurrentUser();
  const hasSavedAddresses = currentUser?.addresses?.length > 0;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    phone:     '',
    address:   '',
    city:      '',
    state:     '',
    pincode:   '',
    notes:     '',
  });

  const [useSavedAddress,      setUseSavedAddress]      = useState(hasSavedAddresses);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  React.useEffect(() => {
    if (useSavedAddress && hasSavedAddresses) {
      const addr = currentUser.addresses[selectedAddressIndex];
      if (addr) {
        const nameParts = (addr.name || currentUser.name || '').split(' ');
        setFormData(prev => ({
          ...prev,
          firstName: nameParts[0] || '',
          lastName:  nameParts.slice(1).join(' ') || '',
          email:     currentUser.email || prev.email,
          phone:     addr.phone   || prev.phone,
          address:   addr.street  || '',
          city:      addr.city    || '',
          state:     addr.state   || '',
          pincode:   addr.pincode || '',
        }));
      }
    }
  }, [useSavedAddress, selectedAddressIndex]);

  // Payment state machine:  idle → creating-order → awaiting-payment → verifying → paid | error
  const [paymentState, setPaymentState]   = useState('idle');
  const [paymentError, setPaymentError]   = useState('');
  const [orderPlaced,  setOrderPlaced]    = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);

  const subtotal   = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const grandTotal = subtotal;

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (['phone', 'pincode', 'pin'].includes(name)) value = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ---------------------------------------------------------------------------
  // Form validation
  // ---------------------------------------------------------------------------
  const validateForm = () => {
    if (!/[a-zA-Z]/.test(formData.firstName) || !/[a-zA-Z]/.test(formData.lastName)) {
      toast.error('Name must contain alphabets.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address.');
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit Indian mobile number.');
      return false;
    }
    if (!/[a-zA-Z]/.test(formData.city) || !/[a-zA-Z]/.test(formData.state)) {
      toast.error('City and State must contain alphabets.');
      return false;
    }
    if (!/^[1-9][0-9]{5}$/.test(formData.pincode)) {
      toast.error('Please enter a valid 6-digit Indian pincode.');
      return false;
    }
    return true;
  };

  // ---------------------------------------------------------------------------
  // Main checkout handler
  // ---------------------------------------------------------------------------
  const handleCheckoutSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Validate Razorpay SDK is available
    if (!RAZORPAY_KEY_ID) {
      toast.error('Payment configuration is missing. Add VITE_RAZORPAY_KEY_ID to your .env file.');
      return;
    }
    if (!window.Razorpay) {
      toast.error('Razorpay SDK failed to load. Please refresh the page.');
      return;
    }

    setPaymentError('');
    setPaymentState('creating-order');

    const specsString = cart.map(
      item => `${item.quantity}x ${item.product.name} (Weight: ${item.weight}, Handle: ${item.handle})`
    ).join(' | ');

    // =========================================================================
    // DEV MODE – no local PHP server, bypass backend entirely.
    // Opens Razorpay modal directly with the public key + amount in paise.
    // Use test card 4111 1111 1111 1111, CVV 123, any future expiry, OTP 1234.
    // =========================================================================
    if (import.meta.env.DEV) {
      const amountInPaise = Math.round(grandTotal * 100);

      // Store a local order so the success screen has an ID
      const localOrder = db.createOrder({
        customerId:   currentUser ? currentUser.id : null,
        customerName: `${formData.firstName} ${formData.lastName}`,
        email:        formData.email,
        phone:        formData.phone,
        address:      `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        batName:      cart.length > 1 ? 'Multiple Items' : cart[0].product.name,
        price:        subtotal,
        total:        grandTotal,
        gst:          Math.round(subtotal * 0.12),
        status:       'pending',
        specs:        `${specsString}. Notes: ${formData.notes || 'None'}`,
        cartItems:    cart.map(item => ({
          id:       item.product.id,
          name:     item.product.name,
          quantity: item.quantity,
          price:    item.product.price,
          weight:   item.weight,
          handle:   item.handle
        }))
      });

      setPaymentState('awaiting-payment');

      try {
        // Open modal without order_id (valid in Razorpay test mode)
        const paymentResult = await openRazorpayModal({
          razorpayOrderId: null,   // omitted in dev; Razorpay allows this in test mode
          amount:          amountInPaise,
          currency:        'INR',
          keyId:           RAZORPAY_KEY_ID,
          prefill: {
            name:  `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
          },
          description: `[DEV] VK Bat House – ${specsString}`,
        });

        // Skip server-side signature verification in dev
        console.info('[DEV] Payment response (not verified server-side):', paymentResult);

        // Update payment status on local order
        db.updateOrderStatus(localOrder.id, 'processing', 'Payment verified (Dev Mode)');
        
        setPaymentState('paid');
        setConfirmedOrderId(localOrder.id);
        setOrderPlaced(true);
        onClearCart();

        confetti({
          particleCount: 120,
          spread:        70,
          origin:        { y: 0.6 },
          colors:        ['#d4af37', '#ffffff', '#e31b23'],
        });
      } catch (err) {
        if (err?.message === 'DISMISSED') {
          setPaymentState('idle');
          toast.info('Payment cancelled. Your items are still in the cart.');
          return;
        }
        const msg = err?.message || 'Payment failed.';
        setPaymentError(`[DEV] ${msg}`);
        setPaymentState('error');
        toast.error(msg);
      }
      return; // done with dev flow
    }

    // =========================================================================
    // PRODUCTION MODE – full secure server-side flow
    // =========================================================================
    try {
      // -----------------------------------------------------------------------
      // STEP 1: Create internal order in our database
      // -----------------------------------------------------------------------
      const cartPayload = cart.map(item => ({
        id:       item.product.id,
        quantity: item.quantity,
      }));

      const addressId = useSavedAddress && hasSavedAddresses
        ? currentUser.addresses[selectedAddressIndex]?.id ?? null
        : null;

      let internalOrderId, internalOrderNumber, backendGrandTotal;

      try {
        const orderResp = await orderService.createOrder(cartPayload, addressId);
        internalOrderId     = orderResp.data.order_id;
        internalOrderNumber = orderResp.data.order_number;
        backendGrandTotal   = orderResp.data.grand_total;
      } catch (orderErr) {
        const localOrder = db.createOrder({
          customerId:   currentUser ? currentUser.id : null,
          customerName: `${formData.firstName} ${formData.lastName}`,
          email:        formData.email,
          phone:        formData.phone,
          address:      `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
          batName:      cart.length > 1 ? 'Multiple Items' : cart[0].product.name,
          price:        subtotal,
          total:        grandTotal,
          gst:          Math.round(subtotal * 0.12),
          status:       'pending',
          specs:        `${specsString}. Notes: ${formData.notes || 'None'}`,
          cartItems:    cart.map(item => ({
            id:       item.product.id,
            name:     item.product.name,
            quantity: item.quantity,
            price:    item.product.price,
            weight:   item.weight,
            handle:   item.handle
          }))
        });
        internalOrderId     = localOrder.id;
        internalOrderNumber = `ORD-LOCAL-${localOrder.id}`;
        backendGrandTotal   = grandTotal;
      }

      // -----------------------------------------------------------------------
      // STEP 2: Create Razorpay order via PHP backend (KEY_SECRET stays server-side)
      // -----------------------------------------------------------------------
      setPaymentState('creating-order');

      const razorpayResp = await orderService.initiateRazorpay(
        backendGrandTotal,
        internalOrderNumber
      );

      const { razorpay_order_id, amount, currency, key_id } = razorpayResp.data;

      // -----------------------------------------------------------------------
      // STEP 3: Open Razorpay modal
      // -----------------------------------------------------------------------
      setPaymentState('awaiting-payment');

      const paymentResult = await openRazorpayModal({
        razorpayOrderId: razorpay_order_id,
        amount,
        currency,
        keyId: key_id || RAZORPAY_KEY_ID,
        prefill: {
          name:  `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
        },
        description: `VK Bat House – ${specsString}`,
      });

      // -----------------------------------------------------------------------
      // STEP 4: Verify payment signature on backend (HMAC-SHA256)
      // -----------------------------------------------------------------------
      setPaymentState('verifying');

      await orderService.verifyRazorpay({
        razorpay_order_id:   paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature:  paymentResult.razorpay_signature,
        internal_order_id:   internalOrderId,
        amount:              backendGrandTotal,
      });

      // -----------------------------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------------------------
      // Mirror the order to db.js so the dashboard and user profile display it
      let dbOrder;
      const orders = db.getOrders();
      const existingIdx = orders.findIndex(o => o.id === internalOrderId || o.orderNumber === internalOrderNumber);
      if (existingIdx !== -1) {
        // Update the existing order instead of creating a new one (prevents double stock decrement)
        orders[existingIdx].status = 'processing';
        orders[existingIdx].paymentStatus = 'paid';
        orders[existingIdx].paymentMethod = 'Razorpay';
        orders[existingIdx].razorpay_payment_id = paymentResult.razorpay_payment_id;
        orders[existingIdx].razorpay_order_id = paymentResult.razorpay_order_id;
        db.saveOrders(orders);
        dbOrder = orders[existingIdx];
      } else {
        dbOrder = db.createOrder({
          id:                 `ORD-${internalOrderId}`,
          orderNumber:        internalOrderNumber,
          customerId:         currentUser ? currentUser.id : null,
          customerName:       `${formData.firstName} ${formData.lastName}`,
          email:              formData.email,
          phone:              formData.phone,
          address:            `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
          batName:            cart.length > 1 ? 'Multiple Items' : cart[0].product.name,
          price:              subtotal,
          total:              grandTotal,
          gst:                Math.round(subtotal * 0.12),
          status:             'processing', // processing since paid
          paymentStatus:      'paid',
          paymentMethod:      'Razorpay',
          razorpay_payment_id: paymentResult.razorpay_payment_id,
          razorpay_order_id:   paymentResult.razorpay_order_id,
          specs:              `${specsString}. Notes: ${formData.notes || 'None'}`,
          cartItems:          cart.map(item => ({
            id:       item.product.id,
            name:     item.product.name,
            quantity: item.quantity,
            price:    item.product.price,
            weight:   item.weight,
            handle:   item.handle
          }))
        });
      }

      setPaymentState('paid');
      setConfirmedOrderId(dbOrder.id);
      setOrderPlaced(true);
      onClearCart();

      db.addLead({
        name:    `${formData.firstName} ${formData.lastName}`,
        email:   formData.email,
        phone:   formData.phone,
        message: `Razorpay Payment Confirmed. Total: ₹${backendGrandTotal}. Items: ${specsString}`,
        type:    'Razorpay Payment',
        status:  'New',
      });

      confetti({
        particleCount: 120,
        spread:        70,
        origin:        { y: 0.6 },
        colors:        ['#d4af37', '#ffffff', '#e31b23'],
      });

    } catch (err) {
      if (err?.message === 'DISMISSED') {
        setPaymentState('idle');
        toast.info('Payment cancelled. Your items are still in the cart.');
        return;
      }

      // Extract a human-readable message from the error.
      // err may be:
      //   (a) an AxiosError  → err.message = "Network Error" | "Request failed with status 500"
      //   (b) our server's response.data → { status, message } from the PHP ResponseHelper
      //   (c) a plain Error  → err.message
      const serverMsg = typeof err === 'object' && !Array.isArray(err)
        ? (err.message || err.error || JSON.stringify(err))
        : String(err);

      let userMsg;
      if (!navigator.onLine) {
        userMsg = 'No internet connection. Please check your network and try again.';
      } else if (serverMsg?.toLowerCase().includes('unauthorized') || serverMsg?.toLowerCase().includes('token')) {
        userMsg = 'Session expired. Please log in again and retry.';
      } else if (serverMsg?.toLowerCase().includes('credentials not configured')) {
        userMsg = 'Payment system is not configured on the server yet. Please contact support.';
      } else if (serverMsg?.toLowerCase().includes('network error') || serverMsg?.toLowerCase().includes('failed to fetch')) {
        userMsg = 'Could not reach the payment server. Check your internet connection or try again.';
      } else {
        userMsg = serverMsg || 'Payment failed. Please try again.';
      }

      console.error('[Checkout] Payment error details:', err);
      setPaymentError(userMsg);
      setPaymentState('error');
      toast.error(userMsg);
    }
  }, [cart, formData, useSavedAddress, selectedAddressIndex, subtotal, grandTotal]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const isProcessing = ['creating-order', 'awaiting-payment', 'verifying'].includes(paymentState);

  const statusLabel = {
    'creating-order':   'Creating your order…',
    'awaiting-payment': 'Waiting for payment…',
    'verifying':        'Verifying payment…',
  }[paymentState] || '';

  // ---------------------------------------------------------------------------
  // Order success screen
  // ---------------------------------------------------------------------------
  if (orderPlaced) {
    return (
      <section className="section-padding" style={{ background: 'var(--black)', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', background: 'var(--dark)', padding: '60px 40px', borderRadius: '12px', border: '1px solid var(--border)', maxWidth: '600px', width: '100%' }}>
          <CheckCircle size={64} style={{ color: '#2ecc71', margin: '0 auto 20px', display: 'block' }} />
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '2.5rem', marginBottom: '16px', color: 'var(--white)' }}>Payment Successful!</h1>
          <p style={{ color: 'var(--muted)', fontSize: '16px', marginBottom: '8px' }}>
            Thank you, {formData.firstName}. Your order has been confirmed and payment received.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '30px' }}>
            Order ID: <strong style={{ color: 'var(--gold)' }}>#{confirmedOrderId}</strong>
          </p>
          <div style={{ background: 'var(--black)', padding: '20px', borderRadius: '8px', marginBottom: '30px', textAlign: 'left', border: '1px solid var(--border)' }}>
            <h4 style={{ color: 'var(--white)', marginBottom: '12px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>What happens next?</h4>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
              Our workshop team will begin crafting your bat. You will receive a confirmation email shortly, and we will contact you on {formData.phone} for any clarifications.
            </p>
          </div>
          <button onClick={onBackToShop} className="btn-primary">Return to Shop</button>
        </div>
      </section>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty cart guard
  // ---------------------------------------------------------------------------
  if (cart.length === 0) {
    return (
      <section className="section-padding" style={{ background: 'var(--black)', flexGrow: 1, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--white)' }}>Your Cart is Empty</h2>
        <button onClick={onBackToShop} className="btn-secondary" style={{ marginTop: '20px' }}>Back to Shop</button>
      </section>
    );
  }

  // ---------------------------------------------------------------------------
  // Auth guard
  // ---------------------------------------------------------------------------
  if (!currentUser) {
    return (
      <section className="section-padding" style={{ background: 'var(--black)', flexGrow: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'var(--dark)', padding: '50px 30px', borderRadius: '12px', border: '1px solid var(--border)', maxWidth: '500px', width: '100%' }}>
          <h2 style={{ color: 'var(--white)', marginBottom: '16px', fontFamily: 'Playfair Display', fontSize: '2rem' }}>Authentication Required</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '32px', fontSize: '15px' }}>Please log in or create an account to securely place your order and track its status.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={onRequestLogin} className="btn-primary" style={{ minWidth: '150px' }}>Login / Sign Up</button>
            <button onClick={onBackToShop} className="btn-secondary" style={{ minWidth: '150px' }}>Back to Shop</button>
          </div>
        </div>
      </section>
    );
  }

  // ---------------------------------------------------------------------------
  // Main checkout form
  // ---------------------------------------------------------------------------
  return (
    <section className="section-padding" style={{ background: 'var(--black)', flexGrow: 1 }}>
      <div className="container">
        <button
          onClick={onBackToShop}
          disabled={isProcessing}
          style={{ background: 'transparent', border: 'none', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px', cursor: isProcessing ? 'not-allowed' : 'pointer', marginBottom: '30px', fontSize: '14px', opacity: isProcessing ? 0.5 : 1 }}
        >
          <ArrowLeft size={16} /> Back to Shop
        </button>

        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '2.5rem', marginBottom: '40px', color: 'var(--white)' }}>Checkout</h1>

        {/* Processing overlay banner */}
        {isProcessing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(212,175,55,0.1)', border: '1px solid var(--gold)', borderRadius: '8px', padding: '14px 20px', marginBottom: '24px', color: 'var(--gold)', fontSize: '14px' }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            {statusLabel}
          </div>
        )}

        {/* Error banner */}
        {paymentState === 'error' && paymentError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(231,76,60,0.1)', border: '1px solid #e74c3c', borderRadius: '8px', padding: '14px 20px', marginBottom: '24px', color: '#e74c3c', fontSize: '14px' }}>
            <AlertTriangle size={18} />
            {paymentError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px', alignItems: 'start' }} className="checkout-grid">

          {/* ----------------------------------------------------------------- */}
          {/* Form Side                                                          */}
          {/* ----------------------------------------------------------------- */}
          <div style={{ background: 'var(--dark)', padding: '30px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '24px', color: 'var(--white)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Shipping &amp; Billing Information</h3>

            {hasSavedAddresses && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--white)', fontSize: '14px', marginBottom: '16px' }}>
                  <input type="checkbox" checked={useSavedAddress} onChange={(e) => setUseSavedAddress(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
                  Use a saved address
                </label>

                {useSavedAddress && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {currentUser.addresses.map((addr, idx) => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressIndex(idx)}
                        style={{ padding: '12px 16px', border: `1px solid ${selectedAddressIndex === idx ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '6px', background: selectedAddressIndex === idx ? 'rgba(212,175,55,0.05)' : 'var(--black)', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px' }}
                      >
                        <MapPin size={18} color={selectedAddressIndex === idx ? 'var(--gold)' : 'var(--muted)'} style={{ marginTop: '2px' }} />
                        <div>
                          <div style={{ color: 'var(--white)', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>{addr.type} – {addr.name}</div>
                          <div style={{ color: 'var(--muted)', fontSize: '12px', lineHeight: 1.5 }}>
                            {addr.street}, {addr.city}, {addr.state} – {addr.pincode}<br />
                            Phone: {addr.phone}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form id="checkout-form" onSubmit={handleCheckoutSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required disabled={isProcessing} style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: '4px', outline: 'none' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Last Name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required disabled={isProcessing} style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: '4px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required disabled={isProcessing} style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: '4px', outline: 'none' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Phone Number *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required disabled={isProcessing} style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: '4px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Street Address *</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} required disabled={isProcessing} style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: '4px', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>City *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} required disabled={isProcessing} style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: '4px', outline: 'none' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>State *</label>
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange} required disabled={isProcessing} style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: '4px', outline: 'none' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>PIN Code *</label>
                  <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} required disabled={isProcessing} style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: '4px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Order Notes (Optional)</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} disabled={isProcessing} placeholder="Special instructions for delivery or custom requests…" style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: '4px', minHeight: '80px', outline: 'none' }} />
              </div>

              {/* Payment method badge */}
              <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid var(--gold)', padding: '16px', borderRadius: '6px', marginBottom: '24px' }}>
                <h4 style={{ color: 'var(--gold)', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={16} /> Secure Online Payment via Razorpay
                </h4>
                <p style={{ color: 'var(--white)', fontSize: '13px', margin: 0 }}>UPI · Cards · Net Banking · Wallets</p>
                <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '4px', margin: 0 }}>Your payment is protected by 256-bit SSL encryption.</p>
              </div>
            </form>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* Order Summary Side                                                 */}
          {/* ----------------------------------------------------------------- */}
          <div style={{ background: 'var(--card)', padding: '30px', borderRadius: '8px', border: '1px solid var(--border)', position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '24px', color: 'var(--white)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Order Summary</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto', paddingTop: '10px', paddingRight: '10px' }}>
              {cart.map(item => (
                <div key={item.cartId} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={item.product.images?.[0] || '/assets/bat_single.png'}
                      alt={item.product.name}
                      style={{ width: '60px', height: '60px', objectFit: 'contain', background: 'var(--black)', borderRadius: '4px', border: '1px solid var(--border)' }}
                      onError={(e) => { e.target.src = '/assets/bat_single.png'; }}
                    />
                    <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--gold)', color: '#000', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                      {item.quantity}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: 'var(--white)', fontSize: '13px', marginBottom: '2px' }}>{item.product.name}</h4>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Wt: {item.weight} | Hdl: {item.handle}</div>
                  </div>
                  <div style={{ color: 'var(--white)', fontSize: '13px', fontWeight: 'bold' }}>
                    ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: 'var(--muted)' }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: 'var(--muted)' }}>
                <span>Shipping</span>
                <span style={{ color: '#2ecc71' }}>Free</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', color: 'var(--white)', fontWeight: 'bold' }}>Total</span>
              <span style={{ fontSize: '22px', color: 'var(--gold)', fontWeight: '900' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>

            <button
              type="submit"
              form="checkout-form"
              id="razorpay-pay-btn"
              className="btn-primary"
              disabled={isProcessing}
              style={{ width: '100%', fontSize: '14px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: isProcessing ? 0.7 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
            >
            {isProcessing ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  {statusLabel}
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Pay ₹{grandTotal.toLocaleString('en-IN')}
                  {import.meta.env.DEV && (
                    <span style={{ fontSize: '10px', background: '#e67e22', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>
                      DEV
                    </span>
                  )}
                </>
              )}
            </button>

            <p style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginTop: '12px' }}>
              {import.meta.env.DEV
                ? '⚠️ DEV MODE — backend skipped. Use test card: 4111 1111 1111 1111'
                : '🔒 Payments are encrypted & secured by Razorpay'}
            </p>
          </div>
        </div>
      </div>

      {/* Keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
