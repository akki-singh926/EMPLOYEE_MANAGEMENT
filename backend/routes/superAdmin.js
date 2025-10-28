const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middlewares/auth');
const User = require('../models/User');
const sendEmail = require('../utils/email');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
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
//export employee details
router.get('/export/excel', protect, authorizeRoles('superAdmin', 'admin', 'hr'), async (req, res) => {
  try {
    const employees = await User.find().select('-password -otp -otpExpires');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Employees');

    sheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 10 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Designation', key: 'designation', width: 20 },
      { header: 'Documents Count', key: 'docsCount', width: 15 },
    ];

    employees.forEach(emp => {
      sheet.addRow({
        employeeId: emp.employeeId,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        phone: emp.phone || '',
        department: emp.department || '',
        designation: emp.designation || '',
        docsCount: emp.documents.length
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=employees.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export to PDF
router.get('/export/pdf', protect, authorizeRoles('superAdmin', 'admin', 'hr'), async (req, res) => {
  try {
    const employees = await User.find().select('-password -otp -otpExpires');
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=employees.pdf');

    doc.fontSize(16).text('Employee List', { align: 'center' });
    doc.moveDown();

    employees.forEach(emp => {
      doc.fontSize(12).text(`ID: ${emp.employeeId}`);
      doc.text(`Name: ${emp.name}`);
      doc.text(`Email: ${emp.email}`);
      doc.text(`Role: ${emp.role}`);
      doc.text(`Phone: ${emp.phone || ''}`);
      doc.text(`Department: ${emp.department || ''}`);
      doc.text(`Designation: ${emp.designation || ''}`);
      doc.text(`Documents Count: ${emp.documents.length}`);
      doc.moveDown();
    });

    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================
// 2️⃣ Send Notifications
// ============================

// Send to single employee
router.post('/notify', protect, authorizeRoles('superAdmin', 'admin', 'hr'), async (req, res) => {
  const { employeeEmail, subject, message } = req.body;

  if (!employeeEmail || !subject || !message) {
    return res.status(400).json({ message: 'Employee email, subject, and message are required' });
  }

  try {
    const user = await User.findOne({ email: employeeEmail });
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    await sendEmail({
      to: employeeEmail,
      subject,
      text: message,
      html: `<p>${message}</p>`
    });

    res.json({ success: true, message: `Notification sent to ${employeeEmail}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send to all employees
router.post('/notify/all', protect, authorizeRoles('superAdmin', 'admin', 'hr'), async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) return res.status(400).json({ message: 'Subject and message are required' });

  try {
    const employees = await User.find({ role: 'employee' });

    for (const emp of employees) {
      await sendEmail({
        to: emp.email,
        subject,
        text: message,
        html: `<p>${message}</p>`
      });
    }

    res.json({ success: true, message: `Notification sent to all employees (${employees.length})` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;




