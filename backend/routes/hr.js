const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middlewares/auth');
const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/email');


// GET all employees (FIXED TO INCLUDE DOCUMENTS)
// ----------------------
router.get('/employees', protect, authorizeRoles('hr', 'admin'), async (req, res) => {
    try {
     
        const employees = await User.find({})
            .select('-password -otp -otpExpires') 
            .lean(); // Use .lean() for faster query

        // --- NEW: CALCULATE OVERALL STATUS ---
        const employeesWithStatus = employees.map(employee => {
            const docs = employee.documents || [];
            let status = 'Not Uploaded';

            if (docs.length > 0) {
                const hasRejected = docs.some(doc => doc.status === 'Rejected');
                const hasPending = docs.some(doc => doc.status === 'Pending');
                const allApproved = docs.every(doc => doc.status === 'Approved');

                if (hasRejected) {
                    status = 'Rejected';
                } else if (hasPending) {
                    status = 'Pending';
                } else if (allApproved) {
                    status = 'Approved';
                }
            }
            
            return {
                ...employee,
                // Attach the calculated status field
                status: status, 
            };
        });
        // --- END CALCULATION ---

        // Send the complete list with calculated status to the frontend
        res.json({ success: true, data: employeesWithStatus });

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
// VERIFY OTP
// ----------------------
router.post('/verify-otp', protect, async (req, res) => {
  const { otp } = req.body;
  const userEmail = req.user?.email; // From JWT token
  if (!otp) return res.status(400).json({ message: 'OTP is required' });

  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ message: 'No OTP generated. Please request again.' });
    }

    // Check expiry
    if (user.otpExpires < Date.now()) {
      user.otp = null;
      user.otpExpires = null;
      await user.save();
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    // Check match
    if (user.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }

    // Success
    user.otp = null; // Clear OTP after verification
    user.otpExpires = null;
    await user.save();

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ message: 'Server error during OTP verification' });
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