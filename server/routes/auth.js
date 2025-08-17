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
    // Check if we have SMTP configuration
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log('📧 Using configured SMTP for emails');
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: String(process.env.SMTP_PORT) === '465',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
    }
    
    // fallback to ethereal test account for dev
    console.log('📧 No SMTP configured, using Ethereal test account');
    const account = await nodemailer.createTestAccount();
    console.log('📧 Ethereal test account created:', account.user);
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
  try {
    const transporter = await getTransporter();
    const from = process.env.EMAIL_FROM || 'CareConnect <noreply@careconnect.com>';
    const to = user.email;
    const subject = 'Your CareConnect verification code';
    const text = `Your verification code is ${otp}. It expires in 5 minutes.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">CareConnect Verification</h2>
        <p>Hello ${user.name},</p>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #7c3aed; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
        </div>
        <p>This code expires in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">CareConnect - Find trusted doctors and book appointments</p>
      </div>
    `;

    const info = await transporter.sendMail({ from, to, subject, text, html });
    console.log('✅ OTP email sent successfully to:', user.email);
    
    // if using ethereal, log preview url
    if (nodemailer.getTestMessageUrl) {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) {
        console.log('📧 Email Preview URL (Ethereal):', url);
        console.log('📧 Check this URL to see the email that was sent');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw error;
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
    console.log('🔐 2FA enabled for user:', user.email);
    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔐 Generated OTP:', otp);
    user.otpHash = hashValue(otp);
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();
    try {
      await sendOtpEmail(user, otp);
      console.log('✅ 2FA flow initiated successfully for:', user.email);
      return res.json({ 
        requires2FA: true, 
        method: 'email',
        message: 'Verification code sent to your email'
      });
    } catch (err) {
      console.error('❌ Error sending OTP:', err);
      // Clear the OTP fields if email sending failed
      user.otpHash = undefined;
      user.otpExpires = undefined;
      await user.save();
      return res.status(500).json({ 
        message: 'Failed to send verification code. Please try again or contact support.' 
      });
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

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid request' });

  if (!user.twoFactor || !user.twoFactor.enabled) {
    return res.status(400).json({ message: 'Two-factor authentication is not enabled' });
  }

  // generate new 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log('🔐 Resending OTP:', otp);
  user.otpHash = hashValue(otp);
  user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  await user.save();

  try {
    await sendOtpEmail(user, otp);
    console.log('✅ OTP resent successfully to:', user.email);
    res.json({ message: 'New verification code sent to your email' });
  } catch (err) {
    console.error('❌ Error resending OTP:', err);
    // Clear the OTP fields if email sending failed
    user.otpHash = undefined;
    user.otpExpires = undefined;
    await user.save();
    res.status(500).json({ message: 'Failed to send verification code. Please try again.' });
  }
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
  
  try {
    const transporter = await getTransporter();
    const from = process.env.EMAIL_FROM || 'CareConnect <noreply@careconnect.com>';
    const subject = 'Reset your CareConnect password';
    const text = `Click here to reset your password: ${resetUrl}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">CareConnect Password Reset</h2>
        <p>Hello ${user.name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="
            display: inline-block;
            background: linear-gradient(90deg, #7c3aed, #22d3ee);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
          ">Reset Password</a>
        </div>
        <p>This link expires in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">CareConnect - Find trusted doctors and book appointments</p>
      </div>
    `;

    const info = await transporter.sendMail({ from, to: user.email, subject, text, html });
    console.log('✅ Password reset email sent successfully to:', user.email);
    
    // if using ethereal, log preview url
    if (nodemailer.getTestMessageUrl) {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) {
        console.log('📧 Password Reset Email Preview URL (Ethereal):', url);
        console.log('📧 Check this URL to see the password reset email');
      }
    }
    
    res.json({ message: 'If that email exists, a reset link was sent' });
  } catch (err) {
    console.error('❌ Error sending password reset email:', err);
    // Clear the reset token if email sending failed
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(500).json({ message: 'Failed to send reset link. Please try again.' });
  }
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

// Enable/Disable 2FA
router.post('/toggle-2fa', authMiddleware(), async (req, res) => {
  try {
    const { enabled } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.twoFactor = {
      enabled: Boolean(enabled),
      method: 'email'
    };

    await user.save();
    
    console.log(`🔐 2FA ${enabled ? 'enabled' : 'disabled'} for user:`, user.email);
    
    res.json({ 
      message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`,
      twoFactor: user.twoFactor
    });
  } catch (error) {
    console.error('Error toggling 2FA:', error);
    res.status(500).json({ message: 'Failed to update 2FA settings' });
  }
});

// Test endpoint to enable 2FA for any user (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test-enable-2fa', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: 'Email is required' });

      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });

      user.twoFactor = {
        enabled: true,
        method: 'email'
      };

      await user.save();
      
      console.log(`🔐 2FA enabled for testing user:`, user.email);
      
      res.json({ 
        message: '2FA enabled for testing',
        user: { email: user.email, twoFactor: user.twoFactor }
      });
    } catch (error) {
      console.error('Error enabling 2FA for testing:', error);
      res.status(500).json({ message: 'Failed to enable 2FA' });
    }
  });
}

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

    await User.findByIdAndDelete(id);
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

// Logout - clear auth cookie
router.post('/logout', (req, res) => {
  try {
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
    return res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error', err);
    return res.status(500).json({ message: 'Logout failed' });
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

// Doctor: delete an appointment assigned to them
router.delete('/appointments/:id', authMiddleware('doctor'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.status !== 'active') return res.status(403).json({ message: 'Account not verified by admin' });

    const { id } = req.params;
    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (String(appt.doctor) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });

    await Appointment.findByIdAndDelete(id);
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
