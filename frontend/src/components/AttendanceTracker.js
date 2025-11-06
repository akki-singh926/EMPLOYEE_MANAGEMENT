// src/components/AttendanceTracker.js

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, Grid } from '@mui/material';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LogoutIcon from '@mui/icons-material/Logout';

// Helper to get today's date in YYYY-MM-DD format
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

const AttendanceTracker = () => {
  const [todaysRecord, setTodaysRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const token = localStorage.getItem('authToken');

  const API_URL = 'http://localhost:8080/api/attendance';

  // Fetch today's attendance record
  const fetchTodaysAttendance = useCallback(async () => {
    setIsLoading(true);
    const today = getTodayString();
    
    try {
      const response = await axios.get(`${API_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          from: today, // Get records for today
          to: today
        }
      });
      
      if (response.data.attendance && response.data.attendance.length > 0) {
        setTodaysRecord(response.data.attendance[0]);
      } else {
        setTodaysRecord(null); // No record found for today
      }
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      setError("Could not load attendance data.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchTodaysAttendance();
    }
  }, [token, fetchTodaysAttendance]);

  // Handle Check-In
  const handleCheckIn = async () => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/mark`, 
        {
          checkIn: new Date().toISOString(), // Mark check-in as "now"
          status: 'present'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTodaysRecord(response.data.attendance);
      showNotification('Checked in successfully!', 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Check-in failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Check-Out
  const handleCheckOut = async () => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/mark`, 
        {
          checkOut: new Date().toISOString(), // Mark check-out as "now"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTodaysRecord(response.data.attendance);
      showNotification('Checked out successfully!', 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Check-out failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format time
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
    }
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    const hasCheckedIn = todaysRecord && todaysRecord.checkIn;
    const hasCheckedOut = todaysRecord && todaysRecord.checkOut;

    // Case 1: Already checked out
    if (hasCheckedIn && hasCheckedOut) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h6" gutterBottom>Attendance Complete</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">CHECK IN</Typography>
              <Typography variant="h5">{formatTime(todaysRecord.checkIn)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">CHECK OUT</Typography>
              <Typography variant="h5">{formatTime(todaysRecord.checkOut)}</Typography>
            </Grid>
          </Grid>
        </Box>
      );
    }

    // Case 2: Checked in, but not out
    if (hasCheckedIn && !hasCheckedOut) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>You are Checked In</Typography>
          <Typography variant="body1">Checked in at: <strong>{formatTime(todaysRecord.checkIn)}</strong></Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<LogoutIcon />}
            onClick={handleCheckOut}
            disabled={isSubmitting}
            sx={{ mt: 2, px: 5, py: 1.5 }}
          >
            {isSubmitting ? 'Submitting...' : 'Check Out'}
          </Button>
        </Box>
      );
    }

    // Case 3: Not checked in
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>Mark Your Attendance</Typography>
        <Typography variant="body1">You have not checked in for today.</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CheckCircleIcon />}
          onClick={handleCheckIn}
          disabled={isSubmitting}
          sx={{ mt: 2, px: 5, py: 1.5 }}
        >
          {isSubmitting ? 'Submitting...' : 'Check In'}
        </Button>
      </Box>
    );
  };

  return (
    <Paper elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden', mt: 4 }}>
      {renderContent()}
    </Paper>
  );
};

export default AttendanceTracker;