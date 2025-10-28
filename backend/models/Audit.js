const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorEmail: { type: String },
  actorRole: { type: String },
  action: { type: String, required: true },       // e.g. "DOCUMENT_APPROVED", "USER_CREATED"
  targetType: { type: String },                   // e.g. "User", "Document"
  targetId: { type: mongoose.Schema.Types.Mixed },// can be ObjectId or string (employeeId)
  details: { type: mongoose.Schema.Types.Mixed }, // freeform object (before/after, remarks, etc.)
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
});
AuditSchema.index({ action: 1 });
AuditSchema.index({ actorEmail: 1 });
AuditSchema.index({ createdAt: -1 });


module.exports = mongoose.model('Audit', AuditSchema);
