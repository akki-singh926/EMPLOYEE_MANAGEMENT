const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  name: String,
  filename: String,
  mimetype: String,
  size: Number,
  status: {
    type: String,
    enum: ['Pending','Approved','Rejected'],
    default: 'Pending'
  },
  remarks: String,
  uploadedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true }, // unique employee ID
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['employee','hr','admin'], default: 'employee' },

  // basic personal info
  name: String,
  dob: Date,
  phone: String,
  address: String,
  emergencyContact: String,

  // job info
  designation: String,
  department: String,
  reportingManager: String,

  documents: [DocumentSchema],

  // password reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
