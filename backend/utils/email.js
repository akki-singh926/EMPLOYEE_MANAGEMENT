const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_FROM,
      subject,
      text,
      html
    };
    await sgMail.send(msg);
    console.log('Email sent to', to);
  } catch (err) {
    console.error('SendGrid Error:', err);
    throw new Error('Email sending failed');
  }
};

module.exports = sendEmail;   