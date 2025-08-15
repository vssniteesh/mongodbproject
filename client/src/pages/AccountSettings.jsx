import { useEffect, useState } from 'react';
import API from '../services/api';

export default function AccountSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    API.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => setMessage('Failed to load user'))
      .finally(() => setLoading(false));
  }, []);

  const toggle2FA = async () => {
    setMessage('');
    try {
      if (user.twoFactor && user.twoFactor.enabled) {
        await API.post('/auth/2fa/disable');
        setUser((u) => ({ ...u, twoFactor: { enabled: false, method: 'email' } }));
        setMessage('Two-factor disabled');
      } else {
        await API.post('/auth/2fa/enable');
        setUser((u) => ({ ...u, twoFactor: { enabled: true, method: 'email' } }));
        setMessage('Two-factor enabled');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Action failed');
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Account settings</h2>
      <div style={{ marginTop: 12 }}>
        <strong>Email:</strong> {user.email}
      </div>
      <div style={{ marginTop: 12 }}>
        <strong>Two-factor:</strong> {user.twoFactor && user.twoFactor.enabled ? 'Enabled (email)' : 'Disabled'}
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={toggle2FA} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff' }}>{user.twoFactor && user.twoFactor.enabled ? 'Disable 2FA' : 'Enable 2FA'}</button>
      </div>
      {message && <div style={{ marginTop: 12, color: '#2563eb' }}>{message}</div>}
    </div>
  );
}
