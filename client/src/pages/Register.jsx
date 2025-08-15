import { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [patientInfo, setPatientInfo] = useState({ age: '', gender: 'male' });
  const [doctorInfo, setDoctorInfo] = useState({ specialization: '', yearsOfExperience: '', availableHours: '', chargePerHour: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleChange = (e) => setForm(s => ({ ...s, [e.target.name]: e.target.value }));
  const handlePatient = (e) => setPatientInfo(s => ({ ...s, [e.target.name]: e.target.value }));
  const handleDoctor = (e) => setDoctorInfo(s => ({ ...s, [e.target.name]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.match(/^\S+@\S+\.\S+$/)) e.email = 'Enter a valid email';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.role === 'patient') {
      if (!patientInfo.age || isNaN(Number(patientInfo.age))) e.age = 'Valid age is required';
      if (!patientInfo.gender) e.gender = 'Gender is required';
    }
    if (form.role === 'doctor') {
      if (!doctorInfo.specialization) e.specialization = 'Specialization is required';
      if (!doctorInfo.yearsOfExperience || isNaN(Number(doctorInfo.yearsOfExperience))) e.yearsOfExperience = 'Valid years of experience required';
      if (!doctorInfo.chargePerHour || isNaN(Number(doctorInfo.chargePerHour))) e.chargePerHour = 'Valid charge is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form };
      if (form.role === 'patient') payload.patientInfo = { age: Number(patientInfo.age), gender: patientInfo.gender };
      if (form.role === 'doctor') payload.doctorInfo = { specialization: doctorInfo.specialization, yearsOfExperience: Number(doctorInfo.yearsOfExperience), availableHours: doctorInfo.availableHours, chargePerHour: Number(doctorInfo.chargePerHour) };

      await API.post('/auth/register', payload);
      alert('Registered successfully — wait for approval if you registered as a doctor');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#f6f8ff,#e9f6ff)' },
    card: { width: 520, maxWidth: '95%', padding: 28, borderRadius: 12, boxShadow: '0 10px 30px rgba(16,24,40,0.12)', background: '#fff' },
    title: { margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' },
    subtitle: { margin: 0, fontSize: 13, color: '#475569', marginTop: 6 },
    field: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 },
    input: { height: 44, padding: '0 12px', borderRadius: 8, border: '1px solid #e6eef8', outline: 'none', fontSize: 14, background: '#fbfdff', color: '#0f172a' },
    roleRow: { display: 'flex', gap: 8, marginBottom: 18 },
    roleBtn: (active) => ({ flex: 1, padding: '10px 12px', borderRadius: 8, border: active ? '2px solid #2563eb' : '1px solid #e6eef8', background: active ? 'linear-gradient(90deg,#2563eb,#60a5fa)' : '#fff', color: active ? '#fff' : '#0f172a', fontWeight: 600, cursor: 'pointer' }),
    submit: (disabled) => ({ marginTop: 6, width: '100%', padding: '12px 14px', borderRadius: 10, border: 'none', color: '#fff', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? 'linear-gradient(90deg,#94a3b8,#cbd5e1)' : 'linear-gradient(90deg,#2563eb,#7dd3fc)' }),
    error: { color: '#b91c1c', fontSize: 13, marginTop: 6 }
  };

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit} aria-labelledby="register-title">
        <div style={{ marginBottom: 12 }}>
          <h1 id="register-title" style={styles.title}>Create your account</h1>
          <p style={styles.subtitle}>Register as a patient or doctor to start using the booking app.</p>
        </div>

        {/* Role selector placed at the top as requested */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: '#334155', marginBottom: 8 }}>I am a</div>
          <div style={styles.roleRow} role="tablist" aria-label="Select role">
            <button type="button" onClick={() => setForm(s => ({ ...s, role: 'patient' }))} style={styles.roleBtn(form.role === 'patient')} aria-pressed={form.role === 'patient'}>Patient</button>
            <button type="button" onClick={() => setForm(s => ({ ...s, role: 'doctor' }))} style={styles.roleBtn(form.role === 'doctor')} aria-pressed={form.role === 'doctor'}>Doctor</button>
          </div>
        </div>

        <div style={styles.field}>
          <label style={{ fontSize: 13, color: '#334155' }} htmlFor="name">Full name</label>
          <input ref={nameRef} id="name" name="name" value={form.name} onChange={handleChange} style={styles.input} placeholder="Jane Doe" />
          {errors.name && <div style={styles.error}>{errors.name}</div>}
        </div>

        <div style={styles.field}>
          <label style={{ fontSize: 13, color: '#334155' }} htmlFor="email">Email</label>
          <input id="email" name="email" value={form.email} onChange={handleChange} style={styles.input} placeholder="you@example.com" />
          {errors.email && <div style={styles.error}>{errors.email}</div>}
        </div>

        <div style={styles.field}>
          <label style={{ fontSize: 13, color: '#334155' }} htmlFor="password">Password</label>
          <input id="password" name="password" value={form.password} onChange={handleChange} type="password" style={styles.input} placeholder="Create a password" />
          {errors.password && <div style={styles.error}>{errors.password}</div>}
        </div>

        {form.role === 'patient' && (
          <div>
            <div style={styles.field}>
              <label style={{ fontSize: 13, color: '#334155' }} htmlFor="age">Age</label>
              <input id="age" name="age" value={patientInfo.age} onChange={handlePatient} style={styles.input} placeholder="e.g. 30" />
              {errors.age && <div style={styles.error}>{errors.age}</div>}
            </div>

            <div style={styles.field}>
              <label style={{ fontSize: 13, color: '#334155' }} htmlFor="gender">Gender</label>
              <select id="gender" name="gender" value={patientInfo.gender} onChange={handlePatient} style={{ ...styles.input, height: 44, color: '#0f172a' }}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <div style={styles.error}>{errors.gender}</div>}
            </div>
          </div>
        )}

        {form.role === 'doctor' && (
          <div>
            <div style={styles.field}>
              <label style={{ fontSize: 13, color: '#334155' }} htmlFor="specialization">Specialization</label>
              <input id="specialization" name="specialization" value={doctorInfo.specialization} onChange={handleDoctor} style={styles.input} placeholder="e.g. Cardiology" />
              {errors.specialization && <div style={styles.error}>{errors.specialization}</div>}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, color: '#334155' }} htmlFor="yearsOfExperience">Years of experience</label>
                <input id="yearsOfExperience" name="yearsOfExperience" value={doctorInfo.yearsOfExperience} onChange={handleDoctor} style={styles.input} placeholder="e.g. 5" />
                {errors.yearsOfExperience && <div style={styles.error}>{errors.yearsOfExperience}</div>}
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, color: '#334155' }} htmlFor="chargePerHour">Charge per hour</label>
                <input id="chargePerHour" name="chargePerHour" value={doctorInfo.chargePerHour} onChange={handleDoctor} style={styles.input} placeholder="e.g. 500" />
                {errors.chargePerHour && <div style={styles.error}>{errors.chargePerHour}</div>}
              </div>
            </div>

            <div style={styles.field}>
              <label style={{ fontSize: 13, color: '#334155' }} htmlFor="availableHours">Available hours</label>
              <input id="availableHours" name="availableHours" value={doctorInfo.availableHours} onChange={handleDoctor} style={styles.input} placeholder="e.g. Mon-Fri 9:00-17:00" />
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} style={styles.submit(loading)}>{loading ? 'Creating account...' : 'Create account'}</button>

        <div style={{ marginTop: 12, fontSize: 13, color: '#475569' }}>
          Already have an account? <button type="button" onClick={() => navigate('/login')} style={{ color: '#2563eb', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Sign in</button>
        </div>
      </form>
    </div>
  );
}
