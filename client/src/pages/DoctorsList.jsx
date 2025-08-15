import { useEffect, useState } from 'react';
import API from '../services/api';

export default function DoctorsList() {
  const [view, setView] = useState('browse'); // 'browse' or 'appointments'
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);

  useEffect(() => {
    if (view === 'browse') fetchDoctors();
    else fetchAppointments();
  }, [view]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await API.get('/auth/doctors');
      setDoctors(res.data.doctors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    setApptLoading(true);
    try {
      const res = await API.get('/auth/appointments/patient');
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setApptLoading(false);
    }
  };

  const openBooking = (doc) => {
    setBookingDoctor(doc);
    setDate('');
    setTime('');
    setReason('');
    setMessage('');
  };

  const submitBooking = async () => {
    if (!date || !time) return setMessage('Please select date and time');
    const datetime = `${date}T${time}`;
    setSubmitting(true);
    setMessage('');
    try {
      await API.post('/auth/appointments', { doctorId: bookingDoctor._id, date: datetime, reason });
      setMessage('Appointment requested — check My Appointments for status');
      setBookingDoctor(null);
      // refresh appointments view
      if (view === 'appointments') fetchAppointments();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const avatarColor = (name) => {
    const colors = ['#6366f1','#7c3aed','#06b6d4','#fb7185','#f59e0b','#10b981'];
    let code = 0;
    for (let i = 0; i < name.length; i++) code = (code << 5) - code + name.charCodeAt(i);
    return colors[Math.abs(code) % colors.length];
  };

  if (loading && view === 'browse') return <div className="container">Loading doctors...</div>;
  if (apptLoading && view === 'appointments') return <div className="container">Loading appointments...</div>;

  return (
    <div className="container" style={{ minHeight: '80vh' }}>
      <div className="header">
        <div>
          <h1>Patient dashboard</h1>
          <p className="text-muted">Browse doctors or view your appointments.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setView('browse')} className={`btn ${view === 'browse' ? 'btn-primary' : 'btn-ghost'}`}>Browse doctors</button>
          <button onClick={() => setView('appointments')} className={`btn ${view === 'appointments' ? 'btn-accent' : 'btn-ghost'}`}>My appointments</button>
        </div>
      </div>

      {view === 'browse' && (
        <div className="grid cols-3 mt-12">
          {doctors.map((d) => (
            <div key={d._id} className="card">
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="avatar" style={{ background: avatarColor(d.name || d.email || 'D') }}>{(d.name || d.email || 'D').charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{d.name}</div>
                      <div className="text-muted" style={{ fontSize: 13 }}>{d.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700 }}>{d.doctorInfo?.specialization || 'General'}</div>
                      <div className="text-muted" style={{ fontSize: 13 }}>{d.doctorInfo?.yearsOfExperience ?? '—'} yrs</div>
                    </div>
                  </div>

                  <div className="mt-12 text-muted">
                    <div><strong>Charges:</strong> ₹{d.doctorInfo?.chargePerHour ?? '—'}</div>
                    <div style={{ marginTop: 6 }}><strong>Available hours:</strong> {d.doctorInfo?.availableHours || 'Not specified'}</div>
                    <div style={{ marginTop: 6 }}><strong>Status:</strong> <span className={`badge ${d.status}`}>{d.status}</span></div>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => openBooking(d)} className="btn btn-accent">Book</button>
                  </div>
                </div>
              </div>

              <div className="mt-12 text-muted">
                <div><strong>About / Bio:</strong></div>
                <div style={{ marginTop: 6 }}>{d.doctorInfo?.bio || 'No bio provided by doctor'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'appointments' && (
        <div className="mt-12">
          <h3 style={{ marginTop: 0 }}>My appointments</h3>
          {appointments.length === 0 && <div className="text-muted mt-12">No appointments yet.</div>}
          <div className="grid mt-12">
            {appointments.map((a) => (
              <div key={a._id} className="appt">
                <div className="left">
                  <div className="avatar" style={{ background: avatarColor(a.doctor?.name || a.doctor?.email || 'D') }}>{(a.doctor?.name || a.doctor?.email || 'D').charAt(0).toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 800 }}>{a.doctor?.name}</div>
                    <div className="text-muted">{a.doctor?.doctorInfo?.specialization || 'General'}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{new Date(a.date).toLocaleString()}</div>
                  <div style={{ color: a.status === 'accepted' ? 'var(--success)' : a.status === 'rejected' ? 'var(--danger)' : 'var(--muted)', marginTop: 6, fontWeight: 700 }}>{a.status}</div>
                </div>
                <div style={{ width: '100%', marginTop: 8 }}>
                  <div className="text-muted"><strong>Reason:</strong> {a.reason || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bookingDoctor && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Book with Dr. {bookingDoctor.name}</h3>
              <button onClick={() => setBookingDoctor(null)} className="btn btn-ghost">×</button>
            </div>

            <div className="grid cols-2 mt-12">
              <div>
                <label>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label>Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            <div className="mt-12">
              <label>Reason (optional)</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
            </div>

            {message && <div className={`mt-12`} style={{ color: message.startsWith('Appointment requested') ? 'var(--success)' : 'var(--danger)' }}>{message}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
              <button onClick={() => setBookingDoctor(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={submitBooking} disabled={submitting} className="btn btn-accent">{submitting ? 'Requesting...' : 'Request appointment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
