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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await axios.post('http://localhost:8080/api/auth/forgot-password', {
        email: email.trim(),
      });

      showNotification(
        'If an account with that email exists, a password reset link has been sent.',
        'success'
      );
      
      setTimeout(() => navigate('/login'), 3000);

    } catch (apiError) {
      setError('Could not process request. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dbeafe 50%, #fce4ec 100%)',
      py: { xs: 3, sm: 4 },
      px: 2
    }}>
      <Container maxWidth="sm">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ 
            width: { xs: 70, sm: 80 }, 
            height: { xs: 70, sm: 80 }, 
            background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto', 
            mb: 3,
            boxShadow: '0 8px 30px rgba(245, 158, 11, 0.35)',
            border: '4px solid white'
          }}>
            <LockResetIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: 'white' }} />
          </Box>
          <Typography variant="h3" fontWeight={900} sx={{ 
            color: '#111827',
            letterSpacing: '-0.5px',
            fontSize: { xs: '1.8rem', sm: '2.5rem' },
            mb: 1
          }}>
            Reset Password
          </Typography>
          <Typography variant="h6" sx={{ 
            color: '#6b7280', 
            fontWeight: 600,
            fontSize: { xs: '0.95rem', sm: '1.1rem' },
            px: 2
          }}>
            Enter your email to receive a reset link
          </Typography>
        </Box>

        {/* Reset Form Card */}
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 3, sm: 4, md: 5 },
            border: '3px solid #e5e7eb',
            bgcolor: 'white',
            borderRadius: '28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)'
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
                    <EmailOutlinedIcon sx={{ color: '#f59e0b', fontSize: 24 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f9fafb',
                  borderRadius: '14px',
                  fontWeight: 600,
                  '& fieldset': { borderColor: '#e5e7eb', borderWidth: '2px' },
                  '&:hover fieldset': { borderColor: '#f59e0b', borderWidth: '2px' },
                  '&.Mui-focused fieldset': { borderColor: '#f59e0b', borderWidth: '2px' },
                },
                '& .MuiInputLabel-root': { fontWeight: 600, color: '#6b7280' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#f59e0b' }
              }}
            />
            
            {error && (
              <Alert severity="error" sx={{ 
                mt: 3,
                border: '2px solid #fecaca',
                bgcolor: '#fef2f2',
                borderRadius: '14px',
                fontWeight: 600
              }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 4, 
                mb: 2,
                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                py: 1.8,
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 800,
                borderRadius: '14px',
                boxShadow: '0 6px 20px rgba(245, 158, 11, 0.3)',
                border: '2px solid rgba(255,255,255,0.2)',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(245, 158, 11, 0.5)',
                  transform: 'translateY(-3px)',
                  transition: 'all 0.3s ease'
                },
                '&:disabled': {
                  background: '#e5e7eb',
                  color: '#9ca3af'
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={28} sx={{ color: 'white' }} /> : 'Send Reset Link'}
            </Button>

            <Box textAlign='center' sx={{ mt: 2 }}>
              <RouterLink 
                to="/login"
                style={{
                  textDecoration: 'none',
                  color: '#f59e0b',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowBackIcon sx={{ fontSize: 18 }} />
                Back to Sign In
              </RouterLink>
            </Box>
          </Box>
        </Paper>

        {/* Security Note */}
        <Box 
          sx={{ 
            mt: 4, 
            p: 3, 
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '3px solid #fbbf24',
            borderRadius: '20px',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)'
          }}
        >
          <Typography variant="body2" sx={{ 
            color: '#92400e', 
            fontWeight: 700,
            mb: 1,
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}>
            🔒 Security Note
          </Typography>
          <Typography variant="body2" sx={{ 
            color: '#b45309',
            fontWeight: 600,
            fontSize: { xs: '0.85rem', sm: '0.9rem' }
          }}>
            For security reasons, we'll send a reset link regardless of whether the email exists in our system.
          </Typography>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: '#374151', fontWeight: 700 }}>
            © 2025 Employee Management System
          </Typography>
          <Typography variant="body2" sx={{ 
            mt: 1,
            color: '#6b7280',
            fontWeight: 600
          }}>
            🔐 Secure Password Recovery
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;