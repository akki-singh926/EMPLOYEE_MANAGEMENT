const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // ✅ MUST be false for Port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls:{
    rejectUnauthorized:false //fix for self-signed cert
  }
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: `"Pegorion Support" <${process.env.EMAIL_FROM}>`, 
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent to Real Gmail! Message ID:', info.messageId);
  } catch (err) {
    console.error('❌ Email Error:', err);
    throw new Error('Email sending failed: ' + err.message);
  }
};

module.exports = sendEmail;