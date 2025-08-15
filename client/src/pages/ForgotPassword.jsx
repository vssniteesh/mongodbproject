import { useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setMessage('Enter your email');
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      setMessage('If that email exists, a reset link was sent. Check your inbox.');
    } catch (err) {
      setMessage('Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{ width: 420, padding: 20, borderRadius: 10, boxShadow: '0 8px 24px rgba(2,6,23,0.08)', background: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>Forgot password</h3>
        <p style={{ color: '#475569' }}>Enter your email and we'll send a link to reset your password.</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e6eef8' }} />
        {message && <div style={{ marginTop: 8, color: '#2563eb' }}>{message}</div>}
        <button type="submit" disabled={loading} style={{ marginTop: 12, width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#06b6d4', color: '#fff' }}>{loading ? 'Sending...' : 'Send reset link'}</button>
        <div style={{ marginTop: 12, fontSize: 13 }}>Remembered? <button type="button" onClick={() => navigate('/login')} style={{ color: '#2563eb', background: 'none', border: 'none' }}>Sign in</button></div>
      </form>
    </div>
  );
}
