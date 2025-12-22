const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  name: String, // Aadhaar, PAN, Resume, custom docs

  // ✅ ADD THIS (CRITICAL FIX)
  filePath: {
    type: String
  },

  // ✅ KEEP THIS (do NOT remove)
  filename: String,

  mimetype: String,
  size: Number,

  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Verified'],
    default: 'Pending'
  },

  remarks: String,
  uploadedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },

  role: {
    type: String,
    enum: ['employee', 'hr', 'admin', 'superAdmin'],
    default: 'employee'
  },

  otp: String,
  otpExpires: Date,

  name: String,
  dob: Date,
  phone: String,
  address: String,
  emergencyContact: String,

  designation: String,
  department: String,
  reportingManager: String,

  documents: [DocumentSchema],

  resetPasswordToken: String,
  resetPasswordExpires: Date,

  createdAt: { type: Date, default: Date.now },

  pendingUpdates: {
    type: {
      data: mongoose.Schema.Types.Mixed,
      requestedAt: Date,
      status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
      },
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      remarks: String
    },
    default: null
  },

  notifications: [
    {
      type: { type: String },
      title: String,
      message: String,
      meta: mongoose.Schema.Types.Mixed,
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('User', UserSchema);
