import { useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Enter your email');
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      await API.post('/auth/forgot-password', { email });
      setSuccess(true);
      setMessage('If that email exists, a reset link was sent. Check your inbox and spam folder.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
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
            Forgot Password
          </h2>
          <p style={{ 
            color: '#475569', 
            fontSize: '14px',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Enter your email and we'll send a link to reset your password
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Email Address
              </label>
              <input 
                value={email} 
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="you@example.com" 
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  border: '1px solid #e6eef8',
                  fontSize: '14px',
                  background: '#fbfdff',
                  boxSizing: 'border-box'
                }}
                type="email"
                required
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
              disabled={loading} 
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                border: 'none', 
                background: loading ? '#94a3b8' : 'linear-gradient(90deg, #7c3aed, #22d3ee)', 
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: 'white',
              fontSize: '24px'
            }}>
              ✓
            </div>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#0f172a' 
            }}>
              Check Your Email
            </h3>
            <p style={{ 
              color: '#475569', 
              fontSize: '14px',
              margin: '0 0 20px 0',
              lineHeight: '1.5'
            }}>
              {message}
            </p>
            <button 
              onClick={() => navigate('/login')}
              style={{
                background: 'linear-gradient(90deg, #7c3aed, #22d3ee)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Back to Login
            </button>
          </div>
        )}

        {!success && (
          <div style={{ 
            marginTop: '20px', 
            textAlign: 'center',
            fontSize: '14px',
            color: '#64748b'
          }}>
            Remembered your password?{' '}
            <button 
              type="button" 
              onClick={() => navigate('/login')} 
              style={{ 
                color: '#7c3aed', 
                background: 'none', 
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Sign in
            </button>
          </div>
        )}

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
