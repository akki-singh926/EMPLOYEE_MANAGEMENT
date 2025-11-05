// backend/routes/attendance.js
const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const ExcelJS = require('exceljs');
const { protect, authorizeRoles } = require('../middlewares/auth');
const logAction = require('../utils/logAction'); // optional - existing in your project

// helper: normalize date to YYYY-MM-DD in server timezone or passed timezone
function toISODateString(d) {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// --------------------
// POST /api/attendance/mark
// Employee marks their attendance (checkIn/checkOut)
// Body: { date?, checkIn?, checkOut?, status?, note? }
// --------------------
router.post('/mark', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { date, checkIn, checkOut, status, note } = req.body;
    const day = date ? toISODateString(date) : toISODateString(new Date());

    const checkInDate = checkIn ? new Date(checkIn) : undefined;
    const checkOutDate = checkOut ? new Date(checkOut) : undefined;
    const workHours = (checkInDate && checkOutDate) ? ((checkOutDate - checkInDate) / 3600000) : undefined;

    const update = {
      userId,
      date: day,
      status: status || (checkInDate ? 'present' : 'present'),
      checkIn: checkInDate,
      checkOut: checkOutDate,
      workHours,
      note
    };

    const doc = await Attendance.findOneAndUpdate(
      { userId, date: day },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // optional audit
    if (typeof logAction === 'function') {
      await logAction({
        req,
        actor: req.user,
        action: 'ATTENDANCE_MARKED',
        targetType: 'Attendance',
        targetId: doc._id,
        details: { date: day, status: doc.status }
      });
    }

    res.json({ success: true, attendance: doc });
  } catch (err) {
    console.error('attendance mark error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --------------------
// POST /api/attendance/mark-for
// HR/Admin marks attendance for given userId
// Body: { userId, date, checkIn, checkOut, status, note }
// --------------------
router.post('/mark-for', protect, authorizeRoles('hr','admin','superAdmin'), async (req, res) => {
  try {
    const { userId, date, checkIn, checkOut, status, note } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const day = date ? toISODateString(date) : toISODateString(new Date());
    const checkInDate = checkIn ? new Date(checkIn) : undefined;
    const checkOutDate = checkOut ? new Date(checkOut) : undefined;
    const workHours = (checkInDate && checkOutDate) ? ((checkOutDate - checkInDate) / 3600000) : undefined;

    const doc = await Attendance.findOneAndUpdate(
      { userId, date: day },
      { userId, date: day, status: status || 'present', checkIn: checkInDate, checkOut: checkOutDate, workHours, note },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // audit
    if (typeof logAction === 'function') {
      await logAction({
        req,
        actor: req.user,
        action: 'ATTENDANCE_MARKED_FOR',
        targetType: 'Attendance',
        targetId: doc._id,
        details: { userId, date: day }
      });
    }

    res.json({ success: true, attendance: doc });
  } catch (err) {
    console.error('attendance mark-for error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --------------------
// GET /api/attendance/history?userId=&from=&to=&page=&limit=
// - Employees call with no userId to see own history
// - HR/Admin can pass userId to view others
// --------------------
router.get('/history', protect, authorizeRoles('employee','hr','admin','superAdmin'), async (req, res) => {
  try {
    const { userId, from, to, page = 1, limit = 50 } = req.query;
    const requesterIsEmployee = req.user.role === 'employee';
    const targetUserId = requesterIsEmployee ? req.user._id : (userId || req.user._id);

    const match = { userId: targetUserId };
    if (from) match.date = { $gte: toISODateString(from) };
    if (to) match.date = match.date ? { ...match.date, $lte: toISODateString(to) } : { $lte: toISODateString(to) };

    const docs = await Attendance.find(match)
      .sort({ date: -1 })
      .skip((page-1)*limit)
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, count: docs.length, attendance: docs });
  } catch (err) {
    console.error('attendance history error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --------------------
// GET /api/attendance/export/payroll?from=YYYY-MM-DD&to=YYYY-MM-DD
// HR/Admin download Excel summary for payroll
// --------------------
router.get('/export/payroll', protect, authorizeRoles('hr','admin','superAdmin'), async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ message: 'from and to required (YYYY-MM-DD)' });

    const fromDate = toISODateString(from);
    const toDate = toISODateString(to);

    // aggregate by userId
    const rows = await Attendance.aggregate([
      { $match: { date: { $gte: fromDate, $lte: toDate } } },
      { $group: {
          _id: '$userId',
          daysPresent: { $sum: { $cond: [{ $eq: ['$status','present'] }, 1, 0] } },
          daysAbsent: { $sum: { $cond: [{ $eq: ['$status','absent'] }, 1, 0] } },
          totalHours: { $sum: { $ifNull: ['$workHours', 0] } }
      }}
    ]);

    // build excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('PayrollAttendance');
    sheet.columns = [
      { header:'EmployeeId', key:'employeeId', width: 15 },
      { header:'Name', key:'name', width: 25 },
      { header:'Days Present', key:'daysPresent', width: 15 },
      { header:'Days Absent', key:'daysAbsent', width: 15 },
      { header:'Total Hours', key:'totalHours', width: 15 }
    ];

    for (const r of rows) {
      const u = await User.findById(r._id).select('employeeId name').lean();
      if (!u) continue;
      sheet.addRow({
        employeeId: u.employeeId,
        name: u.name,
        daysPresent: r.daysPresent,
        daysAbsent: r.daysAbsent,
        totalHours: Math.round((r.totalHours || 0)*100)/100
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=payroll_attendance_${fromDate}_to_${toDate}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('export payroll error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
