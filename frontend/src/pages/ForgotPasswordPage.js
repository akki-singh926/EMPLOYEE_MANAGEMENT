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

// --- PEGORION BRANDING COLORS ---
const PRIMARY_COLOR = '#5A45FF'; // Pegorion Primary Blue-Purple
const SECONDARY_COLOR = '#8B5CF6'; // Pegorion Lighter Purple Accent
const TEXT_COLOR = '#1F2937';
const LIGHT_BACKGROUND = '#F9FAFB';

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
      // Keep the generic error message for security reasons
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
      // Clean, light background
      background: LIGHT_BACKGROUND, 
      py: { xs: 3, sm: 4 },
      px: 2
    }}>
      <Container maxWidth="sm">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          {/* Icon Box: Primary color background, subtle styling */}
          <Box sx={{ 
            width: { xs: 70, sm: 80 }, 
            height: { xs: 70, sm: 80 }, 
            background: PRIMARY_COLOR,
            borderRadius: '50%', // Round icon
            display: 'flex',
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto', 
            mb: 3,
            boxShadow: '0 8px 30px rgba(90, 69, 255, 0.35)', // Shadow with primary color
          }}>
            <LockResetIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: 'white' }} />
          </Box>
          <Typography variant="h3" fontWeight={700} sx={{ 
            color: TEXT_COLOR,
            fontSize: { xs: '2rem', sm: '2.5rem' },
            mb: 1
          }}>
            Password Reset
          </Typography>
          <Typography variant="h6" sx={{ 
            color: '#6b7280', 
            fontWeight: 400, // Slightly lighter font weight
            fontSize: { xs: '1rem', sm: '1.1rem' },
            px: 2
          }}>
            Enter your email to receive a password reset link.
          </Typography>
        </Box>

        {/* Reset Form Card - Clean White Card */}
        <Paper 
          elevation={6} // Standard professional elevation
          sx={{ 
            p: { xs: 3, sm: 4, md: 5 },
            border: '1px solid #E5E7EB', // Subtle border
            bgcolor: 'white',
            borderRadius: '12px', // Standard corporate rounding
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
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
                    <EmailOutlinedIcon sx={{ color: PRIMARY_COLOR, fontSize: 24 }} /> {/* Primary color icon */}
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: LIGHT_BACKGROUND,
                  borderRadius: '8px', // Match card rounding
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: PRIMARY_COLOR },
                  '&.Mui-focused fieldset': { borderColor: PRIMARY_COLOR, borderWidth: '2px' },
                },
                '& .MuiInputLabel-root': { fontWeight: 600, color: '#6b7280' },
                '& .MuiInputLabel-root.Mui-focused': { color: PRIMARY_COLOR }
              }}
            />
            
            {error && (
              <Alert severity="error" sx={{ 
                mt: 3,
                borderRadius: '8px',
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
                // Primary color button with subtle hover/shadow
                background: PRIMARY_COLOR,
                py: 1.5,
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 700,
                borderRadius: '8px',
                boxShadow: '0 4px 15px rgba(90, 69, 255, 0.3)',
                '&:hover': {
                  background: SECONDARY_COLOR,
                  boxShadow: '0 6px 20px rgba(90, 69, 255, 0.4)',
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
                  color: PRIMARY_COLOR, // Primary color link
                  fontSize: '0.95rem',
                  fontWeight: 600,
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

        {/* Security Note - Clean and Professional Alert Style */}
        <Box 
          sx={{ 
            mt: 4, 
            p: 3, 
            background: '#E0F7FA', // Light blue/cyan background for a professional "info" feel
            border: '2px solid #00BCD4', // Cyan border
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0, 188, 212, 0.1)'
          }}
        >
          <Typography variant="body2" sx={{ 
            color: '#006064', // Darker text for readability
            fontWeight: 700,
            mb: 1,
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}>
            ℹ️ Information Security
          </Typography>
          <Typography variant="body2" sx={{ 
            color: '#00838F',
            fontWeight: 500,
            fontSize: { xs: '0.85rem', sm: '0.9rem' }
          }}>
            For system security, a password reset link will be sent to the provided email **only if** a corresponding account is found in our system.
          </Typography>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: TEXT_COLOR, fontWeight: 700 }}>
            © {new Date().getFullYear()} Pegorion Software Solutions
          </Typography>
          <Typography variant="body2" sx={{ 
            mt: 1,
            color: '#6b7280',
            fontWeight: 400
          }}>
            Secure Digital Identity Management
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;