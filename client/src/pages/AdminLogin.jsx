import { useState, useRef, useEffect } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.email.trim()) return 'Email is required';
    if (!form.password) return 'Password is required';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) return setError(v);
    setLoading(true);
    try {
      // Server sets httpOnly cookie; response contains role
      const res = await API.post('/auth/admin/login', { email: form.email, password: form.password });
      const { role } = res.data || {};
      if (role) localStorage.setItem('role', role);
      navigate('/admin-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#eef2ff,#f8fafc)' },
    card: { width: 460, maxWidth: '95%', padding: 28, borderRadius: 12, boxShadow: '0 12px 40px rgba(2,6,23,0.08)', background: '#fff' },
    title: { margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' },
    subtitle: { marginTop: 6, marginBottom: 18, color: '#64748b', fontSize: 13 },
    field: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 },
    input: { height: 46, padding: '0 12px', borderRadius: 10, border: '1px solid #e6eef8', fontSize: 14, background: '#fbfdff' },
    submit: (d) => ({ marginTop: 10, width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none', color: '#fff', fontWeight: 800, cursor: d ? 'not-allowed' : 'pointer', background: d ? 'linear-gradient(90deg,#94a3b8,#cbd5e1)' : 'linear-gradient(90deg,#4338ca,#7c3aed)' }),
    error: { color: '#dc2626', fontSize: 13, marginTop: 8 }
  };

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit} aria-labelledby="admin-login-title">
        <div>
          <h1 id="admin-login-title" style={styles.title}>Admin sign in</h1>
          <p style={styles.subtitle}>Secure admin access — sign in to review and approve doctor registrations.</p>
        </div>

        <div style={styles.field}>
          <label style={{ fontSize: 13, color: '#334155' }} htmlFor="admin-email">Email</label>
          <input id="admin-email" name="email" ref={emailRef} value={form.email} onChange={handleChange} style={styles.input} placeholder="admin@example.com" />
        </div>

        <div style={styles.field}>
          <label style={{ fontSize: 13, color: '#334155' }} htmlFor="admin-password">Password</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input id="admin-password" name="password" value={form.password} onChange={handleChange} type={showPassword ? 'text' : 'password'} style={{ ...styles.input, flex: 1 }} placeholder="Your admin password" />
            <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((s) => !s)} style={{ padding: '0 12px', borderRadius: 10, border: '1px solid #e6eef8', background: '#fff', cursor: 'pointer' }}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button type="submit" disabled={loading} style={styles.submit(loading)}>{loading ? 'Signing in...' : 'Sign in as admin'}</button>

        <div style={{ marginTop: 12, fontSize: 13, color: '#475569' }}>
          After signing in, visit <span style={{ fontWeight: 700 }}>Admin Dashboard</span> to manage approvals.
        </div>
      </form>
    </div>
  );
}
