const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const sendEmail = require('./email');
  // your SendGrid wrapper
  function toISODateString(d) {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// run everyday at 10:30 AM server time
cron.schedule('30 10 * * *', async () => {
  try {
    const today = new Date(); // derive date string
    const day = toISODateString(today);
    // find employees with no attendance record for today
    const allEmployees = await User.find({ role: 'employee' }).select('_id email');
    for (const emp of allEmployees) {
      const a = await Attendance.findOne({ userId: emp._id, date: day });
      if (!a) {
        // send reminder email
        await sendEmail({
          to: emp.email,
          subject: 'Reminder: Mark your attendance',
          text: `Hi, please mark your attendance for ${day}.`,
          html: `<p>Hi, please mark your attendance for <b>${day}</b>.</p>`
        });
      }
    }
  } catch (err) {
    console.error('cron attendance reminder error', err);
  }
});
