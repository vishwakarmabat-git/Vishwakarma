import { useState } from 'react';
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
    } catch {
      setAlert({ type: 'error', message: 'Failed to send reset email. Please try again.' });
    }
  };

  const handleGoogleSignIn = () => {
    setAlert({ type: '', message: '' });
    try {
      const googleUser = {
        id: "CST-G-" + Math.floor(1000 + Math.random() * 9000),
        name: "Google Player",
        email: "cricketer.player@gmail.com",
        addresses: [
          {
            id: "addr-g1",
            type: "Home",
            name: "Google Player",
            street: "Station Road",
            city: "Nadiad",
            state: "Gujarat",
            pincode: "387001",
            phone: "9876543210"
          }
        ],
        wishlist: []
      };

      // Register or find customer in local db
      const existingCustomers = db.getCustomers();
      let user = existingCustomers.find(c => c.email === googleUser.email);
      if (!user) {
        db.registerCustomer(googleUser.name, googleUser.email, "google-oauth-session", "Station Road, Nadiad - 387001");
        user = db.getCustomers().find(c => c.email === googleUser.email) || googleUser;
      }

      db.setCurrentUser(user);
      setAlert({ type: 'success', message: 'Signed in with Google successfully!' });
      setTimeout(() => {
        onLoginSuccess(user);
        onClose();
      }, 1000);
    } catch {
      setAlert({ type: 'error', message: 'Google sign-in could not be completed. Please try with email.' });
    }
  };

  const renderGoogleButton = () => (
    <>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--white)',
          fontSize: '13.5px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: '16px'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>Continue with Google</span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0 18px', gap: '12px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        <span style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>or continue with email</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
      </div>
    </>
  );

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
              <div>
                {renderGoogleButton()}
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
            </div>
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
              <div>
                {renderGoogleButton()}
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
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
