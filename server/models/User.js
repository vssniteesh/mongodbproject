const mongoose = require('mongoose');

const patientInfoSchema = new mongoose.Schema({
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other'] }
}, { _id: false });

const doctorInfoSchema = new mongoose.Schema({
  specialization: { type: String },
  yearsOfExperience: { type: Number },
  availableHours: { type: String },
  chargePerHour: { type: Number }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: String,
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  status: { type: String, enum: ['active', 'pending_approval', 'rejected'], default: 'active' },
  patientInfo: patientInfoSchema,
  doctorInfo: doctorInfoSchema,

  // 2FA and password reset fields
  twoFactor: {
    enabled: { type: Boolean, default: false },
    method: { type: String, enum: ['email'], default: 'email' }
  },
  otpHash: { type: String },
  otpExpires: { type: Date },
  resetPasswordTokenHash: { type: String },
  resetPasswordExpires: { type: Date }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
