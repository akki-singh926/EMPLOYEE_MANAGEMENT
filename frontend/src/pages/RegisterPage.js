// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { 
  Box, Button, TextField, Typography, Container, 
  CircularProgress, Alert, Paper, InputAdornment, IconButton 
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import BusinessIcon from '@mui/icons-material/Business';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '', employeeId: '', email: '', password: '', confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const { fullName, employeeId, email, password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post('http://localhost:8080/api/auth/register', {
        employeeId: employeeId.trim(),
        email: email.trim(),
        password: password.trim(),
        name: fullName.trim() 
      });

      showNotification('Registration successful! Please log in.', 'success');
      navigate('/login');

    } catch (apiError) {
      const message = apiError.response?.data?.message || apiError.response?.data?.errors[0]?.msg || 'Registration failed.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      bgcolor: '#f9fafb',
      borderRadius: '14px',
      fontWeight: 600,
      '& fieldset': { borderColor: '#e5e7eb', borderWidth: '2px' },
      '&:hover fieldset': { borderColor: '#10b981', borderWidth: '2px' },
      '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: '2px' },
    },
    '& .MuiInputLabel-root': { fontWeight: 600, color: '#6b7280' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#10b981' }
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
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto', 
            mb: 3,
            boxShadow: '0 8px 30px rgba(139, 92, 246, 0.35)',
            border: '4px solid white'
          }}>
            <BusinessIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: 'white' }} />
          </Box>
          <Typography variant="h3" fontWeight={900} sx={{ 
            color: '#111827',
            letterSpacing: '-0.5px',
            fontSize: { xs: '1.8rem', sm: '2.5rem' },
            mb: 1
          }}>
            Create Account
          </Typography>
          <Typography variant="h6" sx={{ 
            color: '#6b7280', 
            fontWeight: 600,
            fontSize: { xs: '0.95rem', sm: '1.1rem' }
          }}>
            Join our employee management system
          </Typography>
        </Box>

        {/* Registration Card */}
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
          <Box component="form" onSubmit={handleRegister}>
            <TextField 
              name="fullName" 
              label="Full Name" 
              value={fullName} 
              onChange={handleChange} 
              required 
              fullWidth 
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon sx={{ color: '#8b5cf6', fontSize: 24 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyle}
            />

            <TextField 
              name="employeeId" 
              label="Employee ID" 
              value={employeeId} 
              onChange={handleChange} 
              required 
              fullWidth 
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeOutlinedIcon sx={{ color: '#8b5cf6', fontSize: 24 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyle}
            />

            <TextField 
              name="email" 
              label="Email Address" 
              type="email" 
              value={email} 
              onChange={handleChange} 
              required 
              fullWidth 
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: '#8b5cf6', fontSize: 24 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyle}
            />

            <TextField 
              name="password" 
              label="Password" 
              type={showPassword ? 'text' : 'password'}
              value={password} 
              onChange={handleChange} 
              required 
              fullWidth 
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#8b5cf6', fontSize: 24 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputStyle}
            />

            <TextField 
              name="confirmPassword" 
              label="Confirm Password" 
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword} 
              onChange={handleChange} 
              required 
              fullWidth 
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#8b5cf6', fontSize: 24 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                      {showConfirmPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputStyle}
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
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                py: 1.8,
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 800,
                borderRadius: '14px',
                boxShadow: '0 6px 20px rgba(139, 92, 246, 0.3)',
                border: '2px solid rgba(255,255,255,0.2)',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(139, 92, 246, 0.5)',
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
              {isLoading ? <CircularProgress size={28} sx={{ color: 'white' }} /> : 'Create Account'}
            </Button>
            
            <Box textAlign='center' sx={{ mt: 2 }}>
              <RouterLink 
                to="/login"
                style={{
                  textDecoration: 'none',
                  color: '#8b5cf6',
                  fontSize: '0.95rem',
                  fontWeight: 700
                }}
              >
                Already have an account? Sign In →
              </RouterLink>
            </Box>
          </Box>
        </Paper>

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
            🔒 Secure Registration • Protected Information
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default RegisterPage;