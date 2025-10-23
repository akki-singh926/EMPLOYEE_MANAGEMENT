const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middlewares/auth');
const User = require('../models/User');

// =====================================================
// 1️⃣  Get all employees (Admin view)
// =====================================================
router.get('/employees', protect, authorizeRoles('superAdmin'), async (req, res) => {
  try {
    const employees = await User.find().select('-password');
    res.json({ success: true, count: employees.length, employees });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =====================================================
// 2️⃣  Add a new employee
// =====================================================
router.post('/employees', protect, authorizeRoles('superAdmin'), async (req, res) => {
  try {
    const { employeeId, email, password, name, role } = req.body;

    if (!employeeId || !email || !password || !name) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Employee already exists' });

    const user = await User.create({ employeeId, email, password, name, role: role || 'employee' });

    res.status(201).json({ success: true, message: 'Employee added successfully', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =====================================================
// 3️⃣  Update an employee
// =====================================================
router.put('/employees/:id', protect, authorizeRoles('superAdmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    res.json({ success: true, message: 'Employee updated successfully', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =====================================================
// 4️⃣  Delete an employee
// =====================================================
router.delete('/employees/:id', protect, authorizeRoles('superAdmin'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/verified-documents', protect, authorizeRoles('superAdmin'), async (req, res) => {
  try {
    // Find all employees with at least one document approved by HR
    const users = await User.find({ 'documents.status': 'Approved' });

    // Extract only approved documents
    const approvedDocs = [];
    users.forEach(user => {
      user.documents.forEach(doc => {
        if (doc.status === 'Approved') {
          approvedDocs.push({
            employeeId: user.employeeId,
            name: doc.name,
            filename: doc.filename,
            mimetype: doc.mimetype,
            size: doc.size,
            status: doc.status,
            remarks: doc.remarks,
            _id: doc._id,
            uploadedAt: doc.uploadedAt
          });
        }
      });
    });

    res.json({ success: true, documents: approvedDocs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----------------------
// PATCH final verification of a document
// ----------------------
router.patch('/documents/:employeeId/:docId/verify', protect, authorizeRoles('superAdmin'), async (req, res) => {
  const { employeeId, docId } = req.params;
  const { finalStatus, remarks } = req.body; // finalStatus = 'Verified' or 'Rejected'

  if (!['Verified', 'Rejected'].includes(finalStatus)) {
    return res.status(400).json({ message: 'Invalid final status' });
  }

  try {
    const user = await User.findOne({ employeeId });
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    const doc = user.documents.id(docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    doc.status = finalStatus;
    doc.remarks = remarks || '';
    await user.save();

    res.json({ success: true, message: `Document ${finalStatus.toLowerCase()}`, document: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

;
