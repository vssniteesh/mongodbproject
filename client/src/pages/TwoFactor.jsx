import { useState } from 'react';
import API from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

export default function TwoFactor() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // email may be passed via state or query
  const email = location.state?.email || new URLSearchParams(location.search).get('email');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return setError('Enter the code');
    setLoading(true);
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

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{ width: 420, padding: 20, borderRadius: 10, boxShadow: '0 8px 24px rgba(2,6,23,0.08)', background: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>Enter verification code</h3>
        <p style={{ color: '#475569' }}>We sent a 6-digit code to your email. Enter it here to complete sign in.</p>
        <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e6eef8' }} />
        {error && <div style={{ color: '#b91c1c', marginTop: 8 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ marginTop: 12, width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff' }}>{loading ? 'Verifying...' : 'Verify'}</button>
      </form>
    </div>
  );
}
