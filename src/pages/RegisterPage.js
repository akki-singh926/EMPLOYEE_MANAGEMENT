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
    fullName: '',
    employeeId: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const { fullName, employeeId, email, password, confirmPassword } = formData;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
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
      console.error('Registration failed:', apiError.response);

      const message = apiError.response?.data?.message || apiError.response?.data?.errors[0]?.msg || 'Registration failed. Please check details.';
      setError(message);
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
            <BusinessIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          
          <Typography variant="h4" fontWeight={700} color="#1e293b" gutterBottom>
            Create Account
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Join our employee management system
          </Typography>
        </Box>

        {/* Registration Form Card */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 4,
            border: '1px solid #e2e8f0',
            bgcolor: 'white'
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
                    <PersonOutlineIcon sx={{ color: '#64748b' }} />
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
                    <BadgeOutlinedIcon sx={{ color: '#64748b' }} />
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
                    <LockOutlinedIcon sx={{ color: '#64748b' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
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
                    <LockOutlinedIcon sx={{ color: '#64748b' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
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
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
            
            <Box textAlign='center'>
              <RouterLink 
                to="/login"
                style={{
                  textDecoration: 'none',
                  color: '#3b82f6',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                Already have an account? Sign In
              </RouterLink>
            </Box>
          </Box>
        </Paper>

        {/* Footer */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Secure Registration • Protected Information
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default RegisterPage;