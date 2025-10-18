// src/pages/ForgotPasswordPage.js
import React, { useState } from 'react';
import { 
  Box, Button, TextField, Typography, Container, 
  CircularProgress, Alert, Paper, InputAdornment 
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import LockResetIcon from '@mui/icons-material/LockReset';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/auth/forgot-password', {
        email: email.trim(),
      });

      console.log('Forgot Password response:', response.data);

      showNotification(
        'If an account with that email exists, a password reset link has been sent.',
        'success'
      );
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (apiError) {
      console.error('Forgot Password error:', apiError.response);
      setError('Could not process request. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#f5f7fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4
    }}>
      <Container component="main" maxWidth="xs">
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ 
            width: 64, 
            height: 64, 
            bgcolor: '#3b82f6',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            mb: 2
          }}>
            <LockResetIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          
          <Typography variant="h4" fontWeight={700} color="#1e293b" gutterBottom>
            Reset Password
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
            Enter your email address and we'll send you a link to reset your password
          </Typography>
        </Box>

        {/* Forgot Password Form Card */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 4,
            border: '1px solid #e2e8f0',
            bgcolor: 'white'
          }}
        >
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: '#64748b' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#3b82f6',
                  },
                }
              }}
            />
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2,
                  border: '1px solid #fecaca',
                  bgcolor: '#fef2f2'
                }}
              >
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2,
                bgcolor: '#3b82f6',
                py: 1.2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#2563eb',
                  boxShadow: 'none'
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
            </Button>

            <Box textAlign='center'>
              <RouterLink 
                to="/login"
                style={{
                  textDecoration: 'none',
                  color: '#3b82f6',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ArrowBackIcon sx={{ fontSize: 16 }} />
                Back to Sign In
              </RouterLink>
            </Box>
          </Box>
        </Paper>

        {/* Footer Info */}
        <Box 
          sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 1
          }}
        >
          <Typography variant="caption" color="#1e40af" display="block" sx={{ mb: 0.5, fontWeight: 600 }}>
            Security Note
          </Typography>
          <Typography variant="caption" color="#1e40af" display="block">
            For security reasons, we'll send a reset link regardless of whether the email exists in our system.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;