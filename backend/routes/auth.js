// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { signToken } = require('../utils/token');

// ✅ CHANGE 1: Remove SendGrid and import your new email utility
// const sgMail = require('@sendgrid/mail');  <-- DELETE THIS
const sendEmail = require('../utils/email'); // <-- ADD THIS

const router = express.Router();

/**
 * POST /api/auth/register
 * register new employee (role default = employee)
 */
router.post('/register', [
  body('employeeId').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { employeeId, email, password, name } = req.body;
  try {
    // check existing
    const exists = await User.findOne({ $or:[{email},{employeeId}] });
    if (exists) return res.status(400).json({ message: 'Employee ID or email already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      employeeId,
      email,
      password: hashed,
      name
    });

    const token = signToken({ id: user._id, role: user.role }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);

    res.status(201).json({
      message: 'Registered',
      data: { id: user._id, employeeId: user.employeeId, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', [
  body('email').isEmail(),
  body('password').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken({ id: user._id, role: user.role }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);

    res.json({
      message: 'Login successful',
      data: { id: user._id, employeeId: user.employeeId, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/forgot-password
 * -> generate reset token and store hashed token and expiry on user
 */
// ✅ CHANGE 2: Remove the SendGrid API Key line
// sgMail.setApiKey(process.env.SENDGRID_API_KEY); <-- DELETE THIS

// ----------------------
// FORGOT PASSWORD
// ----------------------
router.post('/forgot-password', [
  body('email').isEmail()
], async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'If email exists, a reset link was sent' });

    // Create reset token (plain) and store hashed version
    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + (parseInt(process.env.RESET_TOKEN_EXPIRES_MIN || '30') * 60 * 1000);
    await user.save();

    // Use backend env variable for frontend URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // ✅ CHANGE 3: Use sendEmail instead of sgMail
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset.</p>
        <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
        <p>This link will expire in 30 minutes.</p>
      `,
    });

    res.json({ message: 'Reset email sent successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----------------------
// RESET PASSWORD
// ----------------------
router.post('/reset-password', [
  body('token').exists(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const { token, password } = req.body;
  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password reset successful' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;