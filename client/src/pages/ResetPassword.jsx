import { useState } from 'react';
import API from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const token = params.get('token');
  const email = params.get('email');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return setMessage('Enter password');
    if (password !== confirm) return setMessage('Passwords do not match');
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { email, token, password });
      setMessage('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{ width: 420, padding: 20, borderRadius: 10, boxShadow: '0 8px 24px rgba(2,6,23,0.08)', background: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>Reset password</h3>
        <p style={{ color: '#475569' }}>Set a new password for your account.</p>
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" type="password" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e6eef8' }} />
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" type="password" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e6eef8', marginTop: 8 }} />
        {message && <div style={{ marginTop: 8, color: '#2563eb' }}>{message}</div>}
        <button type="submit" disabled={loading} style={{ marginTop: 12, width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff' }}>{loading ? 'Resetting...' : 'Set new password'}</button>
      </form>
    </div>
  );
}
