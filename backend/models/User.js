const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  name: String, // Document type like Aadhaar, PAN, Resume
  filename: String,
  mimetype: String,
  size: Number,
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected','Verified'],
    default: 'Pending'
  },
  remarks: String, // Optional HR/SuperAdmin remarks
  uploadedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true }, // unique employee ID
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },

  // Roles: employee / hr / admin / superadmin
  role: { type: String, enum: ['employee', 'hr', 'admin', 'superAdmin'], default: 'employee' },

  // OTP for email verification or HR flow
  otp: String,
  otpExpires: Date,

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

  createdAt: { type: Date, default: Date.now },
  // inside UserSchema
pendingUpdates: {
  type: {
    data: mongoose.Schema.Types.Mixed, // holds proposed changes (only changed fields recommended)
    requestedAt: Date,
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // usually same user
    remarks: String
  },
  default: null
},

notifications: [
  {
    type: { type: String }, // e.g. 'DOCUMENT_STATUS', 'PROFILE_UPDATE', 'SYSTEM'
    title: String,
    message: String,
    meta: mongoose.Schema.Types.Mixed, // optional extra data (doc id, route, etc.)
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }
],



});

// add this after your UserSchema declaration (before module.exports)
 // helps document status queries


module.exports = mongoose.model('User', UserSchema);
