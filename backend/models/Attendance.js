// backend/models/Attendance.js
const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // store date as yyyy-mm-dd midnight UTC to ease querying by day
  date: { type: String, required: true }, // format 'YYYY-MM-DD'
  status: { type: String, enum: ['present','absent','leave','halfday'], default: 'present' },
  checkIn: { type: Date },
  checkOut: { type: Date },
  workHours: { type: Number }, // decimal hours
  note: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// ensure unique attendance per user per date
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ userId: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
