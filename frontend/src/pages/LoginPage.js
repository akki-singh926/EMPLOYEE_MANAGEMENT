// src/pages/LoginPage.js
import React, { useState } from 'react';
import { 
  Box, Button, TextField, Typography, Container, 
  CircularProgress, Alert, Grid, Paper, InputAdornment, IconButton, useTheme,
  Divider, Chip
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import BusinessIcon from '@mui/icons-material/Business';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext'; 

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [loginType, setLoginType] = useState('employee'); 

  const theme = useTheme();

  const { login } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification(); 

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email: trimmedEmail,
        password: trimmedPassword,
      });

      const { token, data: userData } = response.data;
      
      localStorage.setItem('authToken', token);
      
      let finalUserData = userData;
      let userRoleFromDB = userData.role || 'employee'; 

      if (loginType === 'employee') {
          if (userRoleFromDB !== 'employee') {
              setError('Access Denied. Elevated accounts must use the Admin/HR Login path.');
              setIsLoading(false);
              return;
          }
      } 
      else if (loginType === 'admin') {
          if (trimmedEmail !== 'admin.test@portal.com' && trimmedEmail !== 'hr.test@portal.com') {
              setError('Access Denied. Only the designated Admin Test Account can use this path.');
              setIsLoading(false);
              return;
          }
          finalUserData = { ...userData, role: 'admin' };
          userRoleFromDB = 'admin'; 
      }
      
      showNotification('Login successful!', 'success'); 
      login(finalUserData); 
      
      if (userRoleFromDB === 'admin' || userRoleFromDB === 'superadmin' || userRoleFromDB === 'hr') {
          navigate('/admin');
      } else {
          navigate('/dashboard');
      }

    } catch (apiError) {
      console.error('Login failed:', apiError.response);
      
      const message = apiError.response?.data?.message || apiError.response?.data?.errors[0]?.msg || 'Login failed. Please check your credentials.';
      setError(message);
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
      bgcolor: '#f9fafb',
      py: 4,
      px: 2
    }}>
      <Container component="main" maxWidth="sm">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ 
            width: 80, 
            height: 80, 
            bgcolor: '#1e40af',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            mb: 3,
            boxShadow: '0 4px 12px rgba(30,64,175,0.2)'
          }}>
            <BusinessIcon sx={{ fontSize: 48, color: 'white' }} />
          </Box>
          
          <Typography variant="h4" fontWeight={700} color="#111827" gutterBottom>
            Employee Management Portal
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Sign in to access your account
          </Typography>
        </Box>

        {/* Login Card */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 4,
            border: '1px solid #e5e7eb',
            bgcolor: 'white',
            borderRadius: 2
          }}
        >
          {/* Role Toggle */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5,
            mb: 4,
            p: 1,
            bgcolor: '#f3f4f6',
            borderRadius: 1.5
          }}>
            <Button
              variant={loginType === 'employee' ? 'contained' : 'text'}
              onClick={() => setLoginType('employee')}
              fullWidth
              disableElevation
              sx={{ 
                textTransform: 'none',
                fontWeight: 600,
                py: 1.2,
                borderRadius: 1,
                color: loginType === 'employee' ? 'white' : '#6b7280',
                bgcolor: loginType === 'employee' ? '#059669' : 'transparent',
                '&:hover': {
                  bgcolor: loginType === 'employee' ? '#047857' : '#e5e7eb',
                }
              }}
            >
              Employee
            </Button>
            <Button
              variant={loginType === 'admin' ? 'contained' : 'text'}
              onClick={() => setLoginType('admin')}
              fullWidth
              disableElevation
              sx={{ 
                textTransform: 'none',
                fontWeight: 600,
                py: 1.2,
                borderRadius: 1,
                color: loginType === 'admin' ? 'white' : '#6b7280',
                bgcolor: loginType === 'admin' ? '#dc2626' : 'transparent',
                '&:hover': {
                  bgcolor: loginType === 'admin' ? '#b91c1c' : '#e5e7eb',
                }
              }}
            >
              Admin / HR
            </Button>
          </Box>

          <Box component="form" onSubmit={handleLogin}>
            <TextField 
              margin="normal" 
              required 
              fullWidth 
              id="email" 
              label="Email Address" 
              name="email" 
              autoComplete="email" 
              autoFocus 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: '#9ca3af' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f9fafb',
                  '& fieldset': {
                    borderColor: '#e5e7eb',
                  },
                  '&:hover fieldset': {
                    borderColor: '#d1d5db',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  }
                }
              }}
            />
            
            <TextField 
              margin="normal" 
              required 
              fullWidth 
              name="password" 
              label="Password" 
              type={showPassword ? 'text' : 'password'}
              id="password" 
              autoComplete="current-password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#9ca3af' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f9fafb',
                  '& fieldset': {
                    borderColor: '#e5e7eb',
                  },
                  '&:hover fieldset': {
                    borderColor: '#d1d5db',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  }
                }
              }}
            />
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2,
                  border: '1px solid #fecaca',
                  bgcolor: '#fef2f2',
                  borderRadius: 1
                }}
              >
                {error}
              </Alert>
            )}
            
            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              disableElevation
              sx={{ 
                mt: 3, 
                mb: 2,
                bgcolor: loginType === 'admin' ? '#dc2626' : '#059669',
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: loginType === 'admin' ? '#b91c1c' : '#047857',
                }
              }} 
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `Sign In as ${loginType === 'admin' ? 'Admin' : 'Employee'}`
              )}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Chip label="OR" size="small" sx={{ bgcolor: '#f3f4f6', color: '#6b7280' }} />
            </Divider>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <RouterLink 
                  to="/forgot-password"
                  style={{
                    textDecoration: 'none',
                    color: '#3b82f6',
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}
                >
                  Forgot password?
                </RouterLink>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <RouterLink 
                  to="/register"
                  style={{
                    textDecoration: 'none',
                    color: '#3b82f6',
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}
                >
                  Create Account
                </RouterLink>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © 2025 Employee Management System
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Secure • Reliable • Professional
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;