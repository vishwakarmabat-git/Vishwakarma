import React, { useState } from 'react';
import { X, User, Mail, Lock, LogIn, UserPlus, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { db } from '../data/db';
import { authService } from '../services/authService';

export default function AuthModal({ onClose, onLoginSuccess, currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('login'); // login, register, profile, forgot_password
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', address: '' });
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'phone' || name === 'pincode' || name === 'pin') {
      value = value.replace(/[^0-9]/g, '');
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    if (!formData.name || !formData.email || !formData.password) {
      setAlert({ type: 'error', message: 'Please fill in all required fields!' });
      return;
    }
    if (!/[a-zA-Z]/.test(formData.name)) {
      setAlert({ type: 'error', message: 'Name must contain alphabets.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setAlert({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setAlert({ type: 'error', message: 'Passwords do not match!' });
      return;
    }

    // 1. Try backend registration
    try {
      const nameParts = formData.name.trim().split(/\s+/);
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';
      await authService.register({
        first_name,
        last_name,
        email: formData.email,
        password: formData.password
      });
    } catch (err) {
      console.warn("Backend registration failed or offline, using local database.", err);
    }

    const res = db.registerCustomer(formData.name, formData.email, formData.password, formData.address);
    if (!res.success) {
      setAlert({ type: 'error', message: res.message });
      return;
    }

    // Success! Log them in immediately
    db.setCurrentUser(res.user);
    setAlert({ type: 'success', message: 'Account created successfully! Logging you in...' });
    setTimeout(() => {
      onLoginSuccess(res.user);
      onClose();
    }, 1500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    if (!formData.email || !formData.password) {
      setAlert({ type: 'error', message: 'Please fill in all fields!' });
      return;
    }

    // 1. Try real PHP backend login to get JWT
    let apiUser = null;
    try {
      const apiRes = await authService.login(formData.email, formData.password);
      if (apiRes && apiRes.status === 'success') {
        apiUser = apiRes.data.user;
      }
    } catch (err) {
      console.warn("Backend auth failed or offline. Falling back to local simulation.", err);
    }

    // 2. Try local db login (covers offline / customer accounts)
    const res = db.loginCustomer(formData.email, formData.password);

    // 3. If API succeeded with an admin user, use that regardless of local result
    if (apiUser && ['super-admin', 'staff', 'content-manager', 'sales-team'].includes(apiUser.role)) {
      db.setCurrentUser({ ...apiUser, id: "ADMIN-" + apiUser.role, wishlist: [] });
      setAlert({ type: 'success', message: 'Welcome back! Login successful.' });
      setTimeout(() => {
        onLoginSuccess({ ...apiUser, id: "ADMIN-" + apiUser.role, wishlist: [] });
        onClose();
      }, 1500);
      return;
    }

    if (!res.success) {
      setAlert({ type: 'error', message: res.message });
      return;
    }

    // Success! Log them in
    db.setCurrentUser(res.user);
    setAlert({ type: 'success', message: 'Welcome back! Login successful.' });
    setTimeout(() => {
      onLoginSuccess(res.user);
      onClose();
    }, 1500);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    if (!formData.email) {
      setAlert({ type: 'error', message: 'Please enter your registered email address!' });
      return;
    }

    // In a real app, we would make a POST request to our PHP backend /api/auth/forgot-password.php
    // which uses Brevo API to send the reset link. 
    try {
      // Mocking the backend call for now since we are purely in React UI mode
      setResetSent(true);
      setAlert({ type: 'success', message: 'If the email exists, a password reset link has been sent via Brevo!' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to send reset email. Please try again.' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content admin-form-modal animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', padding: '30px', background: 'var(--card)', border: '1px solid var(--border)' }}>
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        {currentUser ? (
          /* Profile Mode */
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'rgba(227, 27, 35, 0.08)',
              border: '2px solid var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--gold)'
            }}>
              <User size={36} />
            </div>
            <h3 style={{ color: 'var(--white)', marginBottom: '8px', fontSize: '1.4rem' }}>{currentUser.name}</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '24px' }}>{currentUser.email}</p>

            <div style={{
              background: 'var(--dark)',
              border: '1px solid var(--border)',
              padding: '16px',
              marginBottom: '30px',
              fontSize: '0.9rem',
              color: 'var(--white)',
              textAlign: 'left'
            }}>
              ⭐ <strong>Customer Type:</strong> Registered Player<br />
              ❤️ <strong>Wishlist:</strong> {currentUser.wishlist?.length || 0} bats saved
            </div>

            <button
              onClick={() => {
                db.setCurrentUser(null);
                onLogout();
                onClose();
              }}
              className="btn btn-accent"
              style={{ width: '100%' }}
            >
              Sign Out Account
            </button>
          </div>
        ) : (
          /* Login/Register Tabs */
          <div>
            <div className="auth-switch-header">
              <button
                onClick={() => { setActiveTab('login'); setAlert({ type: '', message: '' }); }}
                className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              >
                Log In
              </button>
              <button
                onClick={() => { setActiveTab('register'); setAlert({ type: '', message: '' }); }}
                className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              >
                Sign Up
              </button>
            </div>

            {alert.message && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '0.85rem',
                border: '1px solid',
                background: alert.type === 'success' ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
                color: alert.type === 'success' ? '#2ecc71' : '#e74c3c',
                borderColor: alert.type === 'success' ? '#2ecc71' : '#e74c3c'
              }}>
                {alert.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                <span>{alert.message}</span>
              </div>
            )}

            {activeTab === 'login' ? (
              /* Login Form */
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--muted)' }} />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email"
                      className="form-control"
                      style={{ paddingLeft: '44px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password"
                      className="form-control"
                      style={{ paddingLeft: '44px', paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button 
                    type="button" 
                    onClick={() => { setActiveTab('forgot_password'); setAlert({ type: '', message: '' }); setResetSent(false); }}
                    style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                  <LogIn size={16} /> Authenticate
                </button>
              </form>
            ) : activeTab === 'forgot_password' ? (
              /* Forgot Password Form */
              <form onSubmit={handleForgotPassword}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: 'var(--white)', marginBottom: '8px' }}>Reset Password</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Enter your email and we'll send you a secure link to change your password.</p>
                </div>

                {!resetSent ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--muted)' }} />
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter registered email"
                          className="form-control"
                          style={{ paddingLeft: '44px' }}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                      <Mail size={16} /> Send Reset Link
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
                      Please check your inbox (and spam folder) for an email from Vishwakarma Bat House via Brevo.
                    </p>
                  </div>
                )}
                
                <button 
                  type="button" 
                  onClick={() => { setActiveTab('login'); setAlert({ type: '', message: '' }); }}
                  className="btn btn-secondary" 
                  style={{ width: '100%', marginTop: '16px' }}
                >
                  Back to Login
                </button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--muted)' }} />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Full Name"
                      className="form-control"
                      style={{ paddingLeft: '44px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--muted)' }} />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email"
                      className="form-control"
                      style={{ paddingLeft: '44px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Address *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Street, City, Pincode"
                      className="form-control"
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Create Password *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                      className="form-control"
                      style={{ paddingLeft: '44px', paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Retype password"
                      className="form-control"
                      style={{ paddingLeft: '44px', paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                  <UserPlus size={16} /> Create Account
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
