const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const Appointment = require('../models/Appointment');

const router = express.Router();

function setTokenCookie(res, payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });
  return token;
}

// create transporter (Mailtrap / Ethereal based on env)
let transporterPromise = null;
async function getTransporter() {
  if (transporterPromise) return transporterPromise;
  transporterPromise = (async () => {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: String(process.env.SMTP_PORT) === '465',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
    }
    // fallback to ethereal test account for dev
    const account = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass }
    });
  })();
  return transporterPromise;
}

async function sendOtpEmail(user, otp) {
  const transporter = await getTransporter();
  const from = process.env.EMAIL_FROM || 'Book a Doctor <noreply@local.test>';
  const to = user.email;
  const subject = 'Your login verification code';
  const text = `Your verification code is ${otp}. It expires in 5 minutes.`;
  const html = `<p>Your verification code is <strong>${otp}</strong>. It expires in 5 minutes.</p>`;

  const info = await transporter.sendMail({ from, to, subject, text, html });
  // if using ethereal, log preview url
  if (nodemailer.getTestMessageUrl) {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) console.log('Preview URL:', url);
  }
}

function hashValue(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

// Admin login (no register)
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = setTokenCookie(res, { email, role: 'admin' });
    const body = { role: 'admin' };
    if (process.env.NODE_ENV !== 'production') body.token = token;
    return res.json(body);
  }
  res.status(401).json({ message: 'Invalid admin credentials' });
});

// Register patient or doctor
router.post('/register', async (req, res) => {
  const { name, email, password, role, patientInfo, doctorInfo } = req.body;
  if (!['patient', 'doctor'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already exists' });

  // Basic server-side validation for role-specific fields
  if (role === 'patient') {
    if (!patientInfo || typeof patientInfo.age !== 'number' || !patientInfo.gender) {
      return res.status(400).json({ message: 'Patient age and gender are required' });
    }
  }
  if (role === 'doctor') {
    if (!doctorInfo || !doctorInfo.specialization || typeof doctorInfo.yearsOfExperience !== 'number' || typeof doctorInfo.chargePerHour !== 'number') {
      return res.status(400).json({ message: 'Doctor specialization, yearsOfExperience and chargePerHour are required' });
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const status = role === 'doctor' ? 'pending_approval' : 'active';

  const toCreate = {
    name,
    email,
    password: hashedPassword,
    role,
    status
  };

  if (role === 'patient') toCreate.patientInfo = patientInfo;
  if (role === 'doctor') toCreate.doctorInfo = doctorInfo;

  const newUser = await User.create(toCreate);

  // set httpOnly cookie instead of sending token in json
  const token = setTokenCookie(res, { id: newUser._id, role: newUser.role });
  const responseBody = { message: 'User registered successfully', user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, status: newUser.status, patientInfo: newUser.patientInfo, doctorInfo: newUser.doctorInfo } };
  if (process.env.NODE_ENV !== 'production') responseBody.token = token;
  res.status(201).json(responseBody);
});

// Login patient or doctor
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  // If user has twoFactor enabled, generate OTP and send
  if (user.twoFactor && user.twoFactor.enabled) {
    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpHash = hashValue(otp);
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();
    try {
      await sendOtpEmail(user, otp);
      return res.json({ requires2FA: true, method: 'email' });
    } catch (err) {
      console.error('Error sending OTP', err);
      return res.status(500).json({ message: 'Failed to send OTP' });
    }
  }

  const token = setTokenCookie(res, { id: user._id, role: user.role });
  const resp = { role: user.role, status: user.status };
  if (process.env.NODE_ENV !== 'production') resp.token = token;
  res.json(resp);
});

// Verify OTP and complete login
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid request' });

  if (!user.otpHash || !user.otpExpires || user.otpExpires < new Date()) {
    return res.status(400).json({ message: 'OTP expired or not found' });
  }

  if (hashValue(otp) !== user.otpHash) return res.status(400).json({ message: 'Invalid OTP' });

  // clear otp fields
  user.otpHash = undefined;
  user.otpExpires = undefined;
  await user.save();

  // set login cookie
  const token = setTokenCookie(res, { id: user._id, role: user.role });
  const resp = { role: user.role, status: user.status };
  if (process.env.NODE_ENV !== 'production') resp.token = token;
  res.json(resp);
});

// Forgot password - send reset link
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(200).json({ message: 'If that email exists, a reset link was sent' }); // avoid revealing account existence

  // generate a token and save its hash
  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordTokenHash = hashValue(token);
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // send email with link
  const resetUrl = `${process.env.APP_BASE_URL || 'http://localhost:5173'}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
  const transporter = await getTransporter();
  const from = process.env.EMAIL_FROM || 'Book a Doctor <noreply@local.test>';
  const subject = 'Reset your password';
  const text = `Click here to reset your password: ${resetUrl}`;
  const html = `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`;

  try {
    const info = await transporter.sendMail({ from, to: user.email, subject, text, html });
    if (nodemailer.getTestMessageUrl) {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) console.log('Password reset preview URL:', url);
    }
  } catch (err) {
    console.error('Error sending reset email', err);
  }

  res.json({ message: 'If that email exists, a reset link was sent' });
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { email, token, password } = req.body;
  if (!email || !token || !password) return res.status(400).json({ message: 'Invalid request' });

  const user = await User.findOne({ email });
  if (!user || !user.resetPasswordTokenHash || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    return res.status(400).json({ message: 'Reset token invalid or expired' });
  }

  if (hashValue(token) !== user.resetPasswordTokenHash) return res.status(400).json({ message: 'Reset token invalid or expired' });

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Password reset successful' });
});

// Admin: list pending doctor registrations
router.get('/admin/pending-doctors', authMiddleware('admin'), async (req, res) => {
  try {
    const pending = await User.find({ role: 'doctor', status: 'pending_approval' }).select('-password');
    res.json({ pending });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: approve or reject a doctor
router.post('/admin/doctor/:id/decision', authMiddleware('admin'), async (req, res) => {
  const { id } = req.params;
  const { decision } = req.body; // 'approve' or 'reject'
  if (!['approve', 'reject'].includes(decision)) return res.status(400).json({ message: 'Invalid decision' });

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'doctor') return res.status(400).json({ message: 'Not a doctor' });

    user.status = decision === 'approve' ? 'active' : 'rejected';
    await user.save();
    res.json({ message: 'Decision applied', user: { id: user._id, status: user.status } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: list all doctors (with optional search)
router.get('/admin/doctors', authMiddleware('admin'), async (req, res) => {
  try {
    const q = req.query.q ? { $or: [{ name: new RegExp(req.query.q, 'i') }, { email: new RegExp(req.query.q, 'i') }] } : {};
    const doctors = await User.find({ role: 'doctor', ...q }).select('-password -otpHash -resetPasswordTokenHash');
    res.json({ doctors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: update doctor details
router.put('/admin/doctor/:id', authMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, status, doctorInfo } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'doctor') return res.status(400).json({ message: 'Not a doctor' });

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Email already in use' });
      user.email = email;
    }
    if (name) user.name = name;
    if (status) user.status = status; // 'active'|'pending_approval'|'rejected'
    if (doctorInfo) {
      user.doctorInfo = { ...user.doctorInfo?.toObject?.(), ...doctorInfo };
    }

    await user.save();
    res.json({ message: 'Doctor updated', doctor: { id: user._id, name: user.name, email: user.email, status: user.status, doctorInfo: user.doctorInfo } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: delete a doctor
router.delete('/admin/doctor/:id', authMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'doctor') return res.status(400).json({ message: 'Not a doctor' });

    await user.remove();
    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current authenticated user
router.get('/me', authMiddleware(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otpHash -resetPasswordTokenHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enable 2FA (email) for authenticated user
router.post('/2fa/enable', authMiddleware(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.twoFactor = { enabled: true, method: 'email' };
    await user.save();
    res.json({ message: 'Two-factor authentication enabled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Disable 2FA for authenticated user
router.post('/2fa/disable', authMiddleware(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.twoFactor = { enabled: false, method: 'email' };
    // clear any pending OTP
    user.otpHash = undefined;
    user.otpExpires = undefined;
    await user.save();
    res.json({ message: 'Two-factor authentication disabled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List all active doctors for patients
router.get('/doctors', authMiddleware(), async (req, res) => {
  try {
    // only allow patients to fetch doctor list (or allow all but mark role)
    const doctors = await User.find({ role: 'doctor', status: 'active' }).select('-password -otpHash -resetPasswordTokenHash');
    res.json({ doctors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Patient: create appointment with a doctor
router.post('/appointments', authMiddleware('patient'), async (req, res) => {
  try {
    const { doctorId, date, reason } = req.body;
    if (!doctorId || !date) return res.status(400).json({ message: 'doctorId and date are required' });

    // validate date
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return res.status(400).json({ message: 'Invalid date format. Use ISO format or datetime-local value.' });

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') return res.status(400).json({ message: 'Invalid doctor' });

    const appt = await Appointment.create({ patient: req.user.id, doctor: doctorId, date: parsed, reason });
    res.status(201).json({ appointment: appt });
  } catch (err) {
    console.error('Error creating appointment:', err && err.message ? err.message : err);
    res.status(500).json({ message: 'Server error while creating appointment' });
  }
});

// Doctor: view appointments assigned to them
router.get('/appointments', authMiddleware('doctor'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.status !== 'active') return res.status(403).json({ message: 'Account not verified by admin' });

    const appts = await Appointment.find({ doctor: req.user.id }).populate('patient', 'name email patientInfo');
    res.json({ appointments: appts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

async function sendAppointmentDecisionEmail(patient, doctor, appointment) {
  try {
    const transporter = await getTransporter();
    const from = process.env.EMAIL_FROM || 'Book a Doctor <noreply@local.test>';
    const to = patient.email;
    const subject = `Your appointment has been ${appointment.status}`;
    const text = `Hello ${patient.name},\n\nYour appointment with Dr. ${doctor.name} on ${new Date(appointment.date).toLocaleString()} has been ${appointment.status}.\n\nReason: ${appointment.reason || '—'}`;
    const html = `<p>Hello ${patient.name},</p><p>Your appointment with Dr. ${doctor.name} on <strong>${new Date(appointment.date).toLocaleString()}</strong> has been <strong>${appointment.status}</strong>.</p><p>Reason: ${appointment.reason || '—'}</p>`;
    const info = await transporter.sendMail({ from, to, subject, text, html });
    if (nodemailer.getTestMessageUrl) {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) console.log('Appointment decision preview URL:', url);
    }
  } catch (err) {
    console.error('Failed to send appointment decision email', err);
  }
}

// Patient: list their appointments
router.get('/appointments/patient', authMiddleware('patient'), async (req, res) => {
  try {
    const appts = await Appointment.find({ patient: req.user.id }).populate('doctor', 'name email doctorInfo');
    res.json({ appointments: appts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Doctor: accept or reject an appointment
router.post('/appointments/:id/decision', authMiddleware('doctor'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.status !== 'active') return res.status(403).json({ message: 'Account not verified by admin' });

    const { id } = req.params;
    const { decision } = req.body; // 'accept' or 'reject'
    if (!['accept', 'reject'].includes(decision)) return res.status(400).json({ message: 'Invalid decision' });

    const appt = await Appointment.findById(id).populate('patient').populate('doctor');
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (String(appt.doctor._id) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });

    appt.status = decision === 'accept' ? 'accepted' : 'rejected';
    await appt.save();

    // send email to patient informing decision
    sendAppointmentDecisionEmail(appt.patient, appt.doctor, appt).catch(err => console.error(err));

    res.json({ message: 'Decision applied', appointment: appt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
