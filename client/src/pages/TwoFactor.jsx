import { useState } from 'react';
import API from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

export default function TwoFactor() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailInfo, setShowEmailInfo] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // email may be passed via state or query
  const email = location.state?.email || new URLSearchParams(location.search).get('email');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return setError('Enter the code');
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/verify-otp', { email, otp });
      const { role } = res.data || {};
      if (role === 'admin') navigate('/admin-dashboard');
      else if (role === 'doctor') navigate('/doctor-dashboard');
      else navigate('/patient-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    try {
      // You would need to implement a resend endpoint
      await API.post('/auth/resend-otp', { email });
      setError('New code sent to your email');
    } catch (err) {
      setError('Failed to resend code. Please try logging in again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg,#f6f8ff,#fff7ed)',
      padding: '20px'
    }}>
      <div style={{ 
        width: 420, 
        maxWidth: '100%',
        padding: '32px', 
        borderRadius: '16px', 
        boxShadow: '0 10px 30px rgba(16,24,40,0.08)', 
        background: '#fff',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #7c3aed, #22d3ee)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            🔐
          </div>
          <h2 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#0f172a' 
          }}>
            Two-Factor Authentication
          </h2>
          <p style={{ 
            color: '#475569', 
            fontSize: '14px',
            margin: 0,
            lineHeight: '1.5'
          }}>
            We sent a 6-digit verification code to<br />
            <strong style={{ color: '#0f172a' }}>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              Verification Code
            </label>
            <input 
              value={otp} 
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              placeholder="123456" 
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                border: '1px solid #e6eef8',
                fontSize: '18px',
                textAlign: 'center',
                letterSpacing: '4px',
                fontWeight: '600',
                background: '#fbfdff',
                boxSizing: 'border-box'
              }}
              maxLength={6}
              autoComplete="one-time-code"
            />
          </div>

          {error && (
            <div style={{ 
              color: '#b91c1c', 
              marginBottom: '16px',
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || otp.length !== 6} 
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              border: 'none', 
              background: loading || otp.length !== 6 ? '#94a3b8' : 'linear-gradient(90deg, #7c3aed, #22d3ee)', 
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div style={{ 
          marginTop: '24px', 
          textAlign: 'center',
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <p style={{ 
            margin: '0 0 12px 0', 
            fontSize: '14px', 
            color: '#64748b' 
          }}>
            Didn't receive the code?
          </p>
          <button 
            onClick={handleResendCode}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: '#7c3aed',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'underline'
            }}
          >
            Resend Code
          </button>
        </div>

        <div style={{ 
          marginTop: '16px', 
          textAlign: 'center'
        }}>
          <button 
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline'
            }}
          >
            ← Back to Login
          </button>
        </div>

        {/* Development Info */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            marginTop: '24px', 
            padding: '12px',
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#92400e'
          }}>
            <strong>Development Mode:</strong> Check the server console for the email preview URL if using Ethereal.
          </div>
        )}
      </div>
    </div>
  );
}
