// src/api/notification.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/superAdmin'; // ✅ matches backend route

export const sendNotification = async (to, subject, text, token) => {
  try {
    await axios.post(
      `${API_BASE_URL}/notify`, // ✅ backend route
      {
        employeeEmail: to, // ✅ backend expects 'employeeEmail'
        subject,
        message: text, // ✅ backend expects 'message' key
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log('✅ Email notification sent successfully');
  } catch (error) {
    console.error('❌ Failed to send notification:', error.response?.data || error.message);
  }
};
