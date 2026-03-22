import React from 'react';

const UserNotRegisteredError = () => {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#06020f', padding: '24px'
    }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <span style={{ fontSize: 28 }}>⚠️</span>
        </div>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>
          Access Restricted
        </h1>
        <p style={{ color: 'rgba(196,180,252,0.7)', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
          You're not registered to use this app. Please contact the administrator for access.
        </p>
        <button
          onClick={() => window.location.href = '/welcome'}
          style={{
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #7c3aed, #db2777)',
            border: 'none', borderRadius: 12, color: 'white',
            fontSize: 15, fontWeight: 600, cursor: 'pointer'
          }}
        >
          Back to Welcome
        </button>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
