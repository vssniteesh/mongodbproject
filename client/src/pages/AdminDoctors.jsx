import { useEffect, useState } from 'react';
import API from '../services/api';

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await API.get('/auth/admin/doctors');
      setDoctors(res.data.doctors);
    } catch (err) {
      alert('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const startEdit = (doc) => setEditing({ ...doc });
  const saveEdit = async () => {
    try {
      await API.put(`/auth/admin/doctor/${editing._id}`, editing);
      setEditing(null);
      fetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this doctor?')) return;
    try {
      await API.delete(`/auth/admin/doctor/${id}`);
      fetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>All doctors</h2>
        <div>
          <input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e6eef8' }} />
          <button onClick={() => fetch()} style={{ marginLeft: 8, padding: '8px 10px', borderRadius: 8, background: '#06b6d4', color: '#fff' }}>Refresh</button>
        </div>
      </div>

      {loading && <div>Loading...</div>}

      <div style={{ marginTop: 12 }}>
        {doctors.map((d) => (
          <div key={d._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 8, background: '#fff', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700 }}>{d.name}</div>
              <div style={{ color: '#64748b' }}>{d.email}</div>
              <div style={{ fontSize: 13, color: '#475569' }}>Status: {d.status}</div>
            </div>
            <div>
              <button onClick={() => startEdit(d)} style={{ marginRight: 8 }}>Edit</button>
              <button onClick={() => del(d._id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 8 }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.5)' }}>
          <div style={{ width: 520, borderRadius: 12, background: '#fff', padding: 20 }}>
            <h3>Edit doctor</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              <input value={editing.name} onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} />
              <input value={editing.email} onChange={(e) => setEditing((s) => ({ ...s, email: e.target.value }))} />
              <select value={editing.status} onChange={(e) => setEditing((s) => ({ ...s, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="rejected">Rejected</option>
              </select>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setEditing(null)}>Cancel</button>
                <button onClick={saveEdit} style={{ background: '#06b6d4', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 8 }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
