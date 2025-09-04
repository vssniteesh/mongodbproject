import { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [apptsRes, userRes] = await Promise.all([
          API.get('/auth/appointments'),
          API.get('/auth/me'),
        ]);
        setAppointments(apptsRes.data.appointments || []);
        setUser(userRes.data.user || null);
      } catch (err) {
        if (err?.response?.status === 403) {
          setMessage(err.response?.data?.message || 'Account not verified by the admin');
        } else {
          console.error('Load error', err);
          setMessage('Failed to load appointments');
        }
      } finally {
        setLoading(false);
        setLoadingUser(false);
      }
    };
    load();
  }, []);

  const decide = (id, decision) => {
    if (!confirm(`Are you sure to ${decision} this appointment?`)) return;
    API.post(`/auth/appointments/${id}/decision`, { decision }).then(() => {
      setAppointments((s) => s.map((a) => (a._id === id ? { ...a, status: decision === 'accept' ? 'accepted' : 'rejected' } : a)));
    }).catch((e) => {
      if (e.response?.status === 403) setMessage(e.response.data?.message || 'Account not verified');
      else alert(e.response?.data?.message || 'Failed');
    });
  };

  const removeAppointment = async (id) => {
    if (!confirm('Delete this appointment? This action cannot be undone.')) return;
    try {
      await API.delete(`/auth/appointments/${id}`);
      setAppointments((s) => s.filter(a => a._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleLogout = async () => {
    try { await API.post('/auth/logout'); } catch (e) {}
    try { localStorage.clear(); } catch (e) {}
    navigate('/login');
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  if (message) return (
    <div style={{ padding: 20 }}>
      <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: 12, borderRadius: 8 }}>
        <strong>{message}</strong>
        <div style={{ marginTop: 8 }}>Please wait for admin approval or visit <button onClick={() => navigate('/account')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}>Account settings</button> to check status.</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
  <h2 style={{ margin: 0 }}>Healthcare Professional Dashboard</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {loadingUser ? <span style={{ color: '#64748b' }}>Loading...</span> : errorUser ? <span style={{ color: 'red' }}>{errorUser}</span> : user && <><div style={{ fontWeight: 700 }}>{user.name}</div><button onClick={handleLogout} style={{ padding: '8px 10px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer' }}>Logout</button></>}
        </div>
      </div>

      {appointments.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', marginTop: 48 }}>No appointments yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {appointments.map((a) => (
            <div key={a._id} style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 8px 28px rgba(2,6,23,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#6366f1', color: '#fff', fontWeight: 800, fontSize: 18 }}>
                    {a.patient?.name ? a.patient.name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase() : 'P'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{a.patient?.name || 'Unknown patient'}</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>{a.patient?.email}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800 }}>{new Date(a.date).toLocaleString()}</div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{ padding: '6px 10px', borderRadius: 999, fontWeight: 700, fontSize: 12, color: '#fff', background: a.status === 'accepted' ? '#10b981' : a.status === 'rejected' ? '#ef4444' : '#f59e0b' }}>{a.status}</span>
                  </div>
                </div>
              </div>

              <div style={{ color: '#475569', lineHeight: 1.4 }}>{a.reason || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No reason provided</span>}</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>Requested: {new Date(a.createdAt || a._id.getTimestamp?.()).toLocaleString?.() || ''}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {a.status === 'pending' && (
                    <>
                      <button onClick={() => decide(a._id, 'accept')} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(90deg,#10b981,#059669)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Accept</button>
                      <button onClick={() => decide(a._id, 'reject')} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(90deg,#ef4444,#dc2626)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Reject</button>
                    </>
                  )}
                  <button onClick={() => removeAppointment(a._id)} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
