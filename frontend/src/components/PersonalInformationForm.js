// src/components/PersonalInformationForm.js
import React, { useState, useEffect, useCallback } from 'react';
import { Box, TextField, Button, Grid, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext'; 

// --- Temporary Mock Data (for fallback when backend fails) ---
const MOCK_DATA = {
  name: 'Test Employee Name',
  dob: '1990-01-01', // YYYY-MM-DD
  phone: '9876543210',
  address: '456 Test Street, Mock City',
  emergencyContact: '0123456789', 
  designation: 'N/A',
  department: 'N/A',
  reportingManager: 'N/A',
};

const PersonalInformationForm = ({ onUpdateSuccess }) => {
  const { showNotification } = useNotification();
  const { user } = useAuth();

  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastApprovedData, setLastApprovedData] = useState(null);

  // --- Helper: Normalize phone number to E.164 format ---
  const normalizePhone = (num) => {
    if (!num) return '';
    const trimmed = num.trim();
    // If already starts with +, keep it
    if (trimmed.startsWith('+')) return trimmed;
    // Otherwise, add +91 (default for India)
    return `+91${trimmed}`;
  };

  // --- 1. FETCH PROFILE DATA ON LOAD ---
  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No auth token found.");

      const response = await axios.get('http://localhost:8080/api/employee/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const userData = response.data.data || response.data;

      const fetchedState = {
        name: userData.name || '',
        dob: userData.dob ? userData.dob.substring(0, 10) : '', // format: YYYY-MM-DD
        phone: userData.phone || '',
        address: userData.address || '',
        emergencyContact: userData.emergencyContact || '',
        designation: userData.designation || '',
        department: userData.department || '',
        reportingManager: userData.reportingManager || '',
      };

      setFormData(fetchedState);
      setLastApprovedData(fetchedState);

    } catch (error) {
      console.error('Error fetching profile (using mock data):', error.message);
      setFormData(MOCK_DATA);
      setLastApprovedData(MOCK_DATA);
      showNotification('Profile API data is currently mocked.', 'warning');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user, fetchProfile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- 2. SUBMIT PROFILE UPDATE ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No auth token found.");

      // --- Payload creation ---
      const payload = {
        name: formData.name?.trim() || '',
        dob: formData.dob ? formData.dob : '', // backend expects ISO8601 format
        phone: normalizePhone(formData.phone), // convert to +91 format if needed
        address: formData.address?.trim() || '',
        emergencyContact: formData.emergencyContact?.trim() || '',
        designation: formData.designation?.trim() || 'N/A',
        department: formData.department?.trim() || 'N/A',
        reportingManager: formData.reportingManager?.trim() || 'N/A',
      };

      console.log("Payload being sent:", payload); // Debugging helper

      await axios.put('http://localhost:8080/api/employee/me', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showNotification('Information submitted for HR review!', 'warning');
      setFormData(lastApprovedData); // revert to last approved after submission

      if (onUpdateSuccess) onUpdateSuccess();

    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMsg = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message;
      showNotification(`Failed to submit: ${errorMsg || 'Check required fields.'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 3. LOADING SPINNER ---
  if (isLoading || !formData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  // --- 4. FORM UI ---
  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Please keep your information up to date.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            name="name"
            label="Full Name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="dob"
            label="Date of Birth"
            type="date"
            value={formData.dob}
            onChange={handleChange}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="phone"
            label="Phone Number (with country code)"
            value={formData.phone}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            name="address"
            label="Address"
            value={formData.address}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="emergencyContact"
            label="Emergency Contact"
            value={formData.emergencyContact}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>
      </Grid>

      <Button
        type="submit"
        variant="contained"
        sx={{ mt: 3 }}
        disabled={isSubmitting}
      >
        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Update Information'}
      </Button>
    </Box>
  );
};

export default PersonalInformationForm;