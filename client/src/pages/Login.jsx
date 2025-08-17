import { useState, useRef, useEffect } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

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
      // Server will set httpOnly cookie or respond requires2FA
      const res = await API.post('/auth/login', { email: form.email, password: form.password });
      const { role, status, requires2FA } = res.data || {};

      if (requires2FA) {
        // navigate to two-factor page where user will enter OTP
        return navigate('/two-factor', { state: { email: form.email } });
      }

      // store only non-sensitive UI info
      if (role) localStorage.setItem('role', role);
      if (status) localStorage.setItem('status', status);

      // redirect based on role
      if (role === 'doctor') navigate('/doctor-dashboard');
      else if (role === 'admin') navigate('/admin-dashboard');
      else navigate('/patient-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#f6f8ff,#fff7ed)' },
    card: { width: 420, maxWidth: '95%', padding: 26, borderRadius: 12, boxShadow: '0 10px 30px rgba(16,24,40,0.08)', background: '#fff' },
    title: { margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' },
    subtitle: { marginTop: 6, marginBottom: 14, color: '#475569', fontSize: 13 },
    field: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 },
    input: { height: 44, padding: '0 12px', borderRadius: 8, border: '1px solid #e6eef8', fontSize: 14, background: '#fbfdff' },
    submit: (disabled) => ({ marginTop: 8, width: '100%', padding: '12px 14px', borderRadius: 10, border: 'none', color: '#fff', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? 'linear-gradient(90deg,#94a3b8,#cbd5e1)' : 'linear-gradient(90deg,#06b6d4,#0891b2)' }),
    error: { color: '#b91c1c', fontSize: 13 }
  };

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit} aria-labelledby="login-title">
        <div>
          <h2 id="login-title" style={styles.title}>Sign in</h2>
          <p style={styles.subtitle}>Sign in to access your dashboard and manage appointments.</p>
        </div>

        <div style={styles.field}>
          <label style={{ fontSize: 13, color: '#334155' }} htmlFor="email">Email</label>
          <input ref={emailRef} id="email" name="email" value={form.email} onChange={handleChange} style={styles.input} placeholder="you@example.com" />
        </div>

        <div style={styles.field}>
          <label style={{ fontSize: 13, color: '#334155' }} htmlFor="password">Password</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input id="password" name="password" value={form.password} onChange={handleChange} type={showPassword ? 'text' : 'password'} style={{ ...styles.input, flex: 1 }} placeholder="Your password" />
            <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((s) => !s)} style={{ padding: '0 12px', borderRadius: 8, border: '1px solid #e6eef8', background: '#fff', cursor: 'pointer' }}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" name="remember" checked={form.remember} onChange={handleChange} /> <span style={{ fontSize: 13, color: '#475569' }}>Remember me</span>
          </label>
          <button type="button" style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }} onClick={() => navigate('/forgot-password')}>Forgot?</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button type="submit" disabled={loading} style={styles.submit(loading)}>{loading ? 'Signing in...' : 'Sign in'}</button>

        <div style={{ marginTop: 12, fontSize: 13, color: '#475569' }}>
          Don't have an account? <button type="button" onClick={() => navigate('/register')} style={{ color: '#2563eb', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Register</button>
        </div>
        
        <div style={{ marginTop: 16, textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b' }}>
            Are you an administrator?
          </p>
          <button 
            type="button" 
            onClick={() => navigate('/admin-login')}
            style={{
              background: 'none',
              border: '1px solid #cbd5e1',
              color: '#475569',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f1f5f9';
              e.target.style.borderColor = '#94a3b8';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'none';
              e.target.style.borderColor = '#cbd5e1';
            }}
          >
            Admin Login
          </button>
        </div>
      </form>
    </div>
  );
}
