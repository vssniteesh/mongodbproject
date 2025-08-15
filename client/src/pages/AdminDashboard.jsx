import { useEffect, useState, useMemo } from 'react';
import API from '../services/api';

export default function AdminDashboard() {
  const [view, setView] = useState('approvals'); // 'approvals' or 'doctors'
  const [pending, setPending] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // id of item acting on
  const [editing, setEditing] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/auth/admin/pending-doctors');
      setPending(res.data.pending || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/auth/admin/doctors');
      setDoctors(res.data.doctors || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // default load approvals
    fetchPending();
  }, []);

  useEffect(() => {
    if (view === 'approvals') fetchPending();
    else fetchDoctors();
  }, [view]);

  const filteredPending = useMemo(() => {
    if (!query.trim()) return pending;
    const q = query.toLowerCase();
    return pending.filter(p => (p.name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q));
  }, [pending, query]);

  const filteredDoctors = useMemo(() => {
    if (!query.trim()) return doctors;
    const q = query.toLowerCase();
    return doctors.filter(d => (d.name || '').toLowerCase().includes(q) || (d.email || '').toLowerCase().includes(q));
  }, [doctors, query]);

  const decision = async (id, action) => {
    const ok = window.confirm(`Are you sure you want to ${action} this doctor?`);
    if (!ok) return;
    setActionLoading(id);
    try {
      await API.post(`/auth/admin/doctor/${id}/decision`, { decision: action });
      setPending((p) => p.filter(d => d._id !== id));
      alert(`Doctor ${action}d`);
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (doc) => setEditing({ ...doc });
  const saveEdit = async () => {
    try {
      const { _id, name, email, status, doctorInfo } = editing;
      await API.put(`/auth/admin/doctor/${_id}`, { name, email, status, doctorInfo });
      setEditing(null);
      fetchDoctors();
      alert('Doctor updated');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this doctor?')) return;
    try {
      await API.delete(`/auth/admin/doctor/${id}`);
      fetchDoctors();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const styles = {
    page: { padding: 28, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial', background: 'linear-gradient(180deg,#f8fafc,#eef2ff)', minHeight: '100vh' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
    titleWrap: { display: 'flex', flexDirection: 'column' },
    title: { fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 },
    subtitle: { margin: 0, color: '#475569', fontSize: 13 },
    actions: { display: 'flex', gap: 8, alignItems: 'center' },
    search: { padding: '10px 12px', borderRadius: 10, border: '1px solid #e6eef8', width: 320, outline: 'none' },
    tabRow: { display: 'flex', gap: 8, marginTop: 12 },
    tab: (active) => ({ padding: '8px 12px', borderRadius: 10, border: active ? 'none' : '1px solid #e6eef8', background: active ? 'linear-gradient(90deg,#4338ca,#7c3aed)' : '#fff', color: active ? '#fff' : '#0f172a', cursor: 'pointer', fontWeight: 700 }),
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12, marginTop: 18 },
    card: { padding: 14, borderRadius: 12, boxShadow: '0 8px 30px rgba(2,6,23,0.06)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    info: { display: 'flex', gap: 12, alignItems: 'center' },
    avatar: (bg) => ({ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, background: bg }),
    meta: { display: 'flex', flexDirection: 'column' },
    name: { fontSize: 16, fontWeight: 700, color: '#0f172a' },
    email: { fontSize: 13, color: '#64748b' },
    actionsCard: { display: 'flex', gap: 8 },
    approve: { padding: '8px 12px', borderRadius: 8, border: 'none', background: 'linear-gradient(90deg,#10b981,#059669)', color: '#fff', cursor: 'pointer' },
    reject: { padding: '8px 12px', borderRadius: 8, border: 'none', background: 'linear-gradient(90deg,#ef4444,#dc2626)', color: '#fff', cursor: 'pointer' },
    pill: (c) => ({ padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#fff', background: c }),
    empty: { marginTop: 28, textAlign: 'center', color: '#64748b' }
  };

  const avatarColor = (name) => {
    const colors = ['#6366f1','#7c3aed','#06b6d4','#fb7185','#f59e0b','#10b981'];
    let code = 0;
    for (let i = 0; i < name.length; i++) code = (code << 5) - code + name.charCodeAt(i);
    return colors[Math.abs(code) % colors.length];
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.subtitle}>Manage doctors and review new doctor applications.</p>
          <div style={styles.tabRow}>
            <button style={styles.tab(view === 'approvals')} onClick={() => setView('approvals')}>Approvals</button>
            <button style={styles.tab(view === 'doctors')} onClick={() => setView('doctors')}>Available Doctors</button>
          </div>
        </div>

        <div style={styles.actions}>
          <input aria-label="Search" placeholder="Search name or email" value={query} onChange={e => setQuery(e.target.value)} style={styles.search} />
          <button onClick={() => { if (view === 'approvals') fetchPending(); else fetchDoctors(); }} style={{ padding: '10px 12px', borderRadius: 10, border: 'none', background: 'linear-gradient(90deg,#06b6d4,#0891b2)', color: '#fff', cursor: 'pointer' }}>Refresh</button>
        </div>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {view === 'approvals' && !loading && filteredPending.length === 0 && <div style={styles.empty}>No pending doctors found.</div>}
      {view === 'doctors' && !loading && filteredDoctors.length === 0 && <div style={styles.empty}>No doctors in database.</div>}

      <div style={styles.grid}>
        {view === 'approvals' && filteredPending.map(doc => (
          <div key={doc._id} style={styles.card}>
            <div style={styles.info}>
              <div style={styles.avatar(avatarColor(doc.name || doc.email || 'U'))}>{(doc.name || doc.email || 'U').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()}</div>
              <div style={styles.meta}>
                <div style={styles.name}>{doc.name || 'Unknown'}</div>
                <div style={styles.email}>{doc.email}</div>
                <div style={{ marginTop: 6 }}>
                  <span style={styles.pill('#f97316')}>Applied as doctor</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button disabled={actionLoading === doc._id} onClick={() => decision(doc._id, 'approve')} style={styles.approve}>{actionLoading === doc._id ? '...' : 'Approve'}</button>
                <button disabled={actionLoading === doc._id} onClick={() => decision(doc._id, 'reject')} style={styles.reject}>{actionLoading === doc._id ? '...' : 'Reject'}</button>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Registered: {new Date(doc.createdAt || doc._id.getTimestamp?.()).toLocaleDateString?.() || '-'}</div>
            </div>
          </div>
        ))}

        {view === 'doctors' && filteredDoctors.map(d => (
          <div key={d._id} style={styles.card}>
            <div style={styles.info}>
              <div style={styles.avatar(avatarColor(d.name || d.email || 'D'))}>{(d.name || d.email || 'D').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()}</div>
              <div style={styles.meta}>
                <div style={styles.name}>{d.name || 'Unknown'}</div>
                <div style={styles.email}>{d.email}</div>
                <div style={{ marginTop: 6 }}>
                  <span style={styles.pill('#0ea5a4')}>{d.status}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => startEdit(d)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff' }}>Edit</button>
                <button onClick={() => del(d._id)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff' }}>Delete</button>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Registered: {new Date(d.createdAt || d._id.getTimestamp?.()).toLocaleDateString?.() || '-'}</div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.5)' }}>
          <div style={{ width: 680, borderRadius: 12, background: '#fff', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Edit doctor</h3>
              <button onClick={() => setEditing(null)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: '#334155' }}>Name</label>
                <input value={editing.name} onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e6eef8' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#334155' }}>Email</label>
                <input value={editing.email} onChange={(e) => setEditing((s) => ({ ...s, email: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e6eef8' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#334155' }}>Status</label>
                <select value={editing.status} onChange={(e) => setEditing((s) => ({ ...s, status: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e6eef8' }}>
                  <option value="active">Active</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#334155' }}>Specialization</label>
                <input value={editing.doctorInfo?.specialization || ''} onChange={(e) => setEditing((s) => ({ ...s, doctorInfo: { ...s.doctorInfo, specialization: e.target.value } }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e6eef8' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#334155' }}>Years experience</label>
                <input type="number" value={editing.doctorInfo?.yearsOfExperience || ''} onChange={(e) => setEditing((s) => ({ ...s, doctorInfo: { ...s.doctorInfo, yearsOfExperience: Number(e.target.value) } }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e6eef8' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#334155' }}>Charge per hour</label>
                <input type="number" value={editing.doctorInfo?.chargePerHour || ''} onChange={(e) => setEditing((s) => ({ ...s, doctorInfo: { ...s.doctorInfo, chargePerHour: Number(e.target.value) } }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e6eef8' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => setEditing(null)} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e6eef8', background: '#fff' }}>Cancel</button>
              <button onClick={saveEdit} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#06b6d4', color: '#fff' }}>Save changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
