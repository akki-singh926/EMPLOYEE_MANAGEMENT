const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { signToken } = require('../utils/token');

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
 * (You should email the token link to user in production)
 */
router.post('/forgot-password', [
  body('email').isEmail()
], async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'If email exists, a reset token was sent' });

    // create reset token (plain) and store hashed version
    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + (parseInt(process.env.RESET_TOKEN_EXPIRES_MIN || '30') * 60 * 1000);
    await user.save();

    // TODO: send email with link containing plain resetToken
    // For dev, we return the token in response (REMOVE in prod)
    res.json({ message: 'Reset token generated (dev only)', resetToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/reset-password
 * body: token, password
 */
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

    const salt = await require('bcryptjs').genSalt(10);
    user.password = await require('bcryptjs').hash(password, salt);
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
