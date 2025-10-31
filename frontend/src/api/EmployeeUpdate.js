// frontend/src/api/EmployeeUpdate.js
import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api'; // change if backend runs elsewhere

// Employee sends update request
export const submitProfileUpdate = async (data, token) => {
  return await axios.post(`${BASE_URL}/employee/me/update-request`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// HR gets pending update requests
export const getPendingUpdates = async (token) => {
  return await axios.get(`${BASE_URL}/hr/pending-updates`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// HR approves/rejects
export const reviewUpdateRequest = async (userId, action, remarks, token) => {
  return await axios.patch(
    `${BASE_URL}/hr/pending-updates/${userId}`,
    { action, remarks },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
