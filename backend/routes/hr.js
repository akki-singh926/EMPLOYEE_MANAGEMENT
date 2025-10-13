const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middlewares/auth');
const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/email');

// ----------------------
// GET all employees
// ----------------------
router.get('/employees', protect, authorizeRoles('hr', 'admin'), async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password -otp -otpExpires');
    res.json({ success: true, data: employees });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----------------------
// SEND OTP to employee
// ----------------------
router.post('/send-otp', protect, authorizeRoles('hr', 'admin'), async (req, res) => {
  const { employeeEmail } = req.body;
  if (!employeeEmail) return res.status(400).json({ message: 'Employee email is required' });

  try {
    const user = await User.findOne({ email: employeeEmail });
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP and expiry in user record
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    // Send email via SendGrid
    const subject = 'Your OTP for Employee Verification';
    const text = `Hello ${user.name || ''},\n\nYour OTP is: ${otp}. It expires in 10 minutes.`;
    const html = `<p>Hello ${user.name || ''},</p><p>Your OTP is: <b>${otp}</b></p><p>It expires in 10 minutes.</p>`;

    await sendEmail({ to: employeeEmail, subject, text, html });

    res.json({ message: 'OTP sent to employee successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----------------------
// GET all documents of an employee
// ----------------------
router.get('/documents/:employeeId', protect, authorizeRoles('hr', 'admin'), async (req, res) => {
  const { employeeId } = req.params;
  try {
    const user = await User.findOne({ employeeId });
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    res.json({ success: true, documents: user.documents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----------------------
// UPDATE document status (Approve / Reject)
// ----------------------
router.patch('/documents/:employeeId/:docId', protect, authorizeRoles('hr', 'admin'), async (req, res) => {
  const { employeeId, docId } = req.params;
  const { status, remarks } = req.body; // status = 'Approved' or 'Rejected'

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const user = await User.findOne({ employeeId });
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    const doc = user.documents.id(docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    doc.status = status;
    doc.remarks = remarks || '';
    await user.save();

    res.json({ success: true, message: `Document ${status.toLowerCase()}`, document: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
