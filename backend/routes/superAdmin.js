const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middlewares/auth');
const User = require('../models/User');
const sendEmail = require('../utils/email');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const logAction = require('../utils/logAction');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const {parse }= require('csv-parse/sync');
const bcrypt = require('bcryptjs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve('./uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });


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
     await logAction({
      req,
      actor: req.user, // The currently logged-in superAdmin
      action: 'USER_CREATED',
      targetType: 'User',
      targetId: user._id,
      details: {
        employeeId: user.employeeId,
        email: user.email,
        role: user.role
      }
    });

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
    const beforeUser = await User.findById(id).select('-password');
    if (!beforeUser) return res.status(404).json({ message: 'Employee not found' });

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Employee not found' });
     await logAction({
      req,
      actor: req.user, // the superAdmin performing the update
      action: 'USER_UPDATED',
      targetType: 'User',
      targetId: user._id,
      details: {
        before: beforeUser.toObject(),
        after: user.toObject()
      }
    });

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
    await logAction({
  req,
  actor: req.user,
  action: 'USER_DELETED',
  targetType: 'User',
  targetId: user._id,
  details: { employeeId: user.employeeId, email: user.email }
});


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
    // after await user.save();
await logAction({
  req,
  actor: req.user,
  action: `DOCUMENT_${finalStatus.toUpperCase()}`, // DOCUMENT_VERIFIED or DOCUMENT_REJECTED
  targetType: 'Document',
  targetId: doc._id,
  details: {
    employeeId: user.employeeId,
    employeeEmail: user.email,
    docName: doc.name,
    remarks
  }
});


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
// list audit logs (paginated)
router.get('/audit', protect, authorizeRoles('superAdmin', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, action, actorEmail } = req.query;
    const q = {};
    if (action) q.action = action;
    if (actorEmail) q.actorEmail = actorEmail;

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      require('../models/Audit').find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      require('../models/Audit').countDocuments(q)
    ]);

    res.json({ success: true, total, page: Number(page), limit: Number(limit), items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/superadmin/employees/bulk-upload
router.post('/employees/bulk-upload', protect, authorizeRoles('superAdmin','admin','hr'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File is required (CSV or XLSX)' });

    const ext = path.extname(req.file.filename).toLowerCase();
    let rows = [];

    // 1) CSV
    if (ext === '.csv') {
      const content = fs.readFileSync(req.file.path, 'utf8');
      // parse CSV synchronously (assumes header row)
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      rows = records;
    }
    // 2) XLSX/XLS
    else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(req.file.path);
      const worksheet = workbook.worksheets[0]; // first sheet
      const headerRow = worksheet.getRow(1).values; // array with first cell blank so be careful
      const headers = headerRow.slice(1).map(h => String(h).trim());
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
        const values = row.values.slice(1);
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx] !== undefined && values[idx] !== null ? String(values[idx]).trim() : '';
        });
        rows.push(obj);
      });
    } else {
      // cleanup file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Unsupported file format. Use CSV or XLSX.' });
    }

    // Process rows
    const results = {
      created: [],
      failed: [],
      errors: []
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // normalize keys to expected lowercase names
      // Accept columns like employeeId, email, name, password, role, department, designation, phone, address
      const employeeId = (row.employeeId || row.employee_id || row.EmployeeId || '').trim();
      const email = (row.email || row.Email || '').trim().toLowerCase();
      const name = (row.name || row.Name || '').trim();
      const passwordRaw = row.password || row.Password || '';
      const role = (row.role || 'employee').trim() || 'employee';
      const department = row.department || row.Department || '';
      const designation = row.designation || row.Designation || '';
      const phone = row.phone || row.Phone || '';
      const address = row.address || row.Address || '';

      const rowIdentifier = `row:${i+1} (employeeId:${employeeId || 'N/A'}, email:${email || 'N/A'})`;

      // Basic validation
      if (!employeeId) {
        results.failed.push(rowIdentifier);
        results.errors.push({ row: i+1, error: 'employeeId is required' });
        continue;
      }
      if (!email) {
        results.failed.push(rowIdentifier);
        results.errors.push({ row: i+1, error: 'email is required' });
        continue;
      }
      if (!name) {
        results.failed.push(rowIdentifier);
        results.errors.push({ row: i+1, error: 'name is required' });
        continue;
      }
      // email basic format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        results.failed.push(rowIdentifier);
        results.errors.push({ row: i+1, error: 'invalid email format' });
        continue;
      }

      // Check duplicates in DB
      const exists = await User.findOne({ $or: [{ email }, { employeeId }] }).lean();
      if (exists) {
        results.failed.push(rowIdentifier);
        results.errors.push({ row: i+1, error: 'email or employeeId already exists' });
        continue;
      }

      // prepare password
      const password = passwordRaw && passwordRaw.length >= 6 ? passwordRaw : (process.env.DEFAULT_bulk_PASSWORD || 'Password@123');

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);

      // create user
      try {
        const u = await User.create({
          employeeId,
          email,
          name,
          password: hashed,
          role,
          department,
          designation,
          phone,
          address
        });

        // optional: audit log
        await logAction({
          req,
          actor: req.user,
          action: 'USER_CREATED_BULK',
          targetType: 'User',
          targetId: u._id,
          details: { employeeId: u.employeeId, email: u.email }
        });

        results.created.push({ id: u._id.toString(), employeeId, email });
      } catch (e) {
        results.failed.push(rowIdentifier);
        results.errors.push({ row: i+1, error: e.message || 'create_failed' });
      }
    }

    // cleanup uploaded file after processing
    try { fs.unlinkSync(req.file.path); } catch(e) { /* ignore */ }

    return res.json({
      success: true,
      createdCount: results.created.length,
      failedCount: results.failed.length,
      created: results.created,
      errors: results.errors
    });
  } catch (err) {
    console.error('bulk-upload error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;



