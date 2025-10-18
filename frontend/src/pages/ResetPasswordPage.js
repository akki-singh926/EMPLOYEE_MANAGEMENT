// src/pages/ResetPasswordPage.js
import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Container, CircularProgress, Alert } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import LockResetIcon from '@mui/icons-material/LockReset';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';

const ResetPasswordPage = () => {
  // Captures the token from the URL (e.g., /reset-password/a1b2c3d4)
  const { token } = useParams(); 
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    
    // 1. Frontend validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      // 2. API call to the backend to reset the password
      const response = await axios.post('http://localhost:8080/api/auth/reset-password', {
        token, // The token captured from the URL
        password, // The new password
      });

      console.log('Reset Password response:', response.data);

      showNotification('Password reset successfully! Please log in with your new password.', 'success');
      
      // 3. Redirect to login page after success
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (apiError) {
      console.error('Reset Password error:', apiError.response);
      
      // Handle the specific backend error (Invalid or expired token)
      const message = apiError.response?.data?.message || 'Invalid or expired token. Please restart the forgot password process.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <LockResetIcon sx={{ m: 1, bgcolor: 'primary.main', p: 1, borderRadius: '50%', color: 'white' }} />
        <Typography component="h1" variant="h5">
          Reset Password
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1, mb: 3 }}>
          Token received. Enter your new password below.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!error}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!error}
          />
          
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ResetPasswordPage;