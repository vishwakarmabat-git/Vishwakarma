import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0a0a0f',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '40px',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(163,0,0,0.1)',
            border: '1px solid rgba(163,0,0,0.4)',
            borderRadius: '8px',
            padding: '40px',
            maxWidth: '600px',
            width: '100%'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ color: '#e31b23', fontSize: '1.5rem', marginBottom: '12px' }}>
              VK Admin — Runtime Error
            </h2>
            <p style={{ color: '#aaa', marginBottom: '24px', fontSize: '0.9rem', lineHeight: 1.6 }}>
              A JavaScript error occurred. This is likely caused by LocalStorage data from an older version.
              <br /><br />
              <strong style={{ color: '#fff' }}>Fix:</strong> Clear your browser's LocalStorage for this site, then reload.
            </p>
            <details style={{ textAlign: 'left', marginBottom: '24px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '4px', fontSize: '0.8rem', color: '#aaa' }}>
              <summary style={{ cursor: 'pointer', color: '#fff', marginBottom: '8px' }}>
                Error Details
              </summary>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                {this.state.error?.toString()}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  // Clear VK-specific localStorage keys
                  Object.keys(localStorage).filter(k => k.startsWith('vk_bathouse_')).forEach(k => localStorage.removeItem(k));
                  window.location.reload();
                }}
                style={{
                  background: '#a30000',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  borderRadius: '4px'
                }}
              >
                Clear VK Data & Reload
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  borderRadius: '4px'
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                style={{
                  background: 'transparent',
                  color: '#ccc',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  borderRadius: '4px'
                }}
              >
                ← Back to Store
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
