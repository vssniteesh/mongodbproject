import { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/auth/appointments')
      .then((res) => setAppointments(res.data.appointments))
      .catch((err) => {
        if (err.response?.status === 403) {
          setMessage(err.response.data?.message || 'Account not verified by the admin');
        } else {
          setMessage('Failed to load appointments');
        }
      })
      .finally(() => setLoading(false));
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
    <div style={{ padding: 20 }}>
      <h2>Doctor dashboard</h2>
      {appointments.length === 0 && <div style={{ marginTop: 12 }}>No appointments</div>}
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {appointments.map((a) => (
          <div key={a._id} style={{ padding: 12, borderRadius: 8, border: '1px solid #e6eef8', background: '#fff' }}>
            <div style={{ fontWeight: 700 }}>{a.patient?.name} <span style={{ fontSize: 12, color: '#64748b' }}>({a.patient?.email})</span></div>
            <div style={{ color: '#475569', marginTop: 6 }}><strong>When:</strong> {new Date(a.date).toLocaleString()}</div>
            <div style={{ marginTop: 8 }}><strong>Reason:</strong> {a.reason || '—'}</div>
            <div style={{ marginTop: 8 }}><strong>Status:</strong> {a.status}</div>
            {a.status === 'pending' && (
              <div style={{ marginTop: 8 }}>
                <button onClick={() => decide(a._id, 'accept')} style={{ marginRight: 8, padding: '8px 12px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff' }}>Accept</button>
                <button onClick={() => decide(a._id, 'reject')} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff' }}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
