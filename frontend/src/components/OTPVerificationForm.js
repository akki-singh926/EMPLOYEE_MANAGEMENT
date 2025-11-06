import React, { useState } from 'react';
import { Box, TextField, Button, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import LockOpenIcon from '@mui/icons-material/LockOpen';

const OTPVerificationForm = ({ onVerificationSuccess, employeeEmail }) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification } = useNotification();
  const isReady = otp.length === 6;

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!isReady) {
      showNotification('OTP must be 6 digits.', 'warning');
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      // ✅ Corrected: send only OTP (email not needed)
      await axios.post(
        'http://localhost:8080/api/hr/verify-otp',
        { otp: otp.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification('✅ OTP verified successfully! Uploads unlocked.', 'success');
      onVerificationSuccess();
    } catch (error) {
      console.error('OTP verification failed:', error);
      showNotification(
        error.response?.data?.message || 'Invalid or expired OTP. Please try again.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleVerify}
      sx={{
        p: 2,
        border: '1px solid #ccc',
        borderRadius: 1,
        mt: 3,
        bgcolor: '#f9f9f9',
      }}
    >
      <Typography variant="body2" sx={{ mb: 1 }}>
        Enter the OTP sent by HR to your registered email to enable uploads.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          label="6-Digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // only numbers
          inputProps={{ maxLength: 6 }}
          fullWidth
          required
          size="small"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isLoading || !isReady}
          startIcon={<LockOpenIcon />}
          sx={{ width: 150, textTransform: 'none' }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify'}
        </Button>
      </Box>
    </Box>
  );
};

export default OTPVerificationForm;
