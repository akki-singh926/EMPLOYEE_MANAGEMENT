const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// ----------------------
// GET employee profile
// ----------------------
router.get('/me', protect, async (req, res) => {
  try {
    const user = req.user.toObject();
    delete user.password;
    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----------------------
// UPDATE employee profile
// ----------------------
router.put('/me', protect, [
  body('name').optional().notEmpty(),
  body('dob').optional().isISO8601(),
  body('phone').optional().custom(value => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
    if (!phoneRegex.test(value)) {
      throw new Error('Invalid phone number');
    }
    return true;
  }),
  body('address').optional().notEmpty(),
  body('emergencyContact').optional().notEmpty(),
  body('designation').optional().notEmpty(),
  body('department').optional().notEmpty(),
  body('reportingManager').optional().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const updated = await User.findByIdAndUpdate(req.user._id, req.body, { new: true, runValidators: true });
    delete updated.password;
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----------------------
// DOCUMENT UPLOAD
// ----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve('./uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/upload', protect, upload.single('document'), async (req, res) => {
  const { type } = req.body; // Aadhaar, PAN, etc.
  if (!type) return res.status(400).json({ message: 'Document type required' });

  try {
    req.user.documents.push({
      name: type,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      status: 'Pending'
    });
    await req.user.save();
    res.json({ success: true, message: 'Document uploaded', document: req.user.documents.slice(-1)[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----------------------
// GET employee documents
// ----------------------
router.get('/documents', protect, async (req, res) => {
  try {
    res.json({ success: true, documents: req.user.documents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
