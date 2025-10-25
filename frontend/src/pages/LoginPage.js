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
  
  // State now tracks three types: 'employee', 'admin', 'superAdmin'
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
      // Get the role from the database
      let userRoleFromDB = userData.role || 'employee'; 

      // --- FINAL SECURITY/REDIRECTION LOGIC ---
      
      // 1. User clicked 'Employee' button
      if (loginType === 'employee') {
          if (userRoleFromDB !== 'employee') {
              setError('Access Denied. Elevated accounts must use the Admin or Super Admin path.');
              setIsLoading(false);
              return; 
          }
      } 
      // 2. User clicked 'Admin / HR' button
      else if (loginType === 'admin') {
          if (userRoleFromDB !== 'admin' && userRoleFromDB !== 'hr') {
              setError('Access Denied. This path is only for Admin or HR roles.');
              setIsLoading(false);
              return;
          }
          finalUserData = { ...userData, role: userRoleFromDB };
      }
      // 3. User clicked 'Super Admin' button
      else if (loginType === 'superAdmin') {
          if (userRoleFromDB !== 'superAdmin') { 
              setError('Access Denied. This account does not have Super Admin privileges.');
              setIsLoading(false);
              return;
          }
          finalUserData = { ...userData, role: 'superAdmin' };
      }
      
      showNotification('Login successful!', 'success'); 
      login(finalUserData); 
      
      // 4. REDIRECT BASED ON FINAL, VERIFIED ROLE
      if (userRoleFromDB === 'superAdmin') {
          navigate('/superadmin');
      } else if (userRoleFromDB === 'admin' || userRoleFromDB === 'hr') {
          navigate('/admin');
      } else {
          navigate('/dashboard');
      }

    } catch (apiError) {
      console.error('Login failed:', apiError.response);
      const message = apiError.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get the text for the main sign-in button
  const getButtonText = () => {
    if (loginType === 'admin') return 'Sign In as Admin / HR';
    if (loginType === 'superAdmin') return 'Sign In as Super Admin';
    return 'Sign In as Employee';
  };
  
  // Helper function to get the color for the main sign-in button
  const getButtonColor = () => {
    if (loginType === 'admin') return 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)';
    if (loginType === 'superAdmin') return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
    return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dbeafe 50%, #fce4ec 100%)',
      position: 'relative',
      py: { xs: 3, sm: 4 },
      px: 2,
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.1) 0%, transparent 50%), radial-gradient(circle at bottom left, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }
    }}>
      <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ 
            width: { xs: 70, sm: 80 }, 
            height: { xs: 70, sm: 80 }, 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto', 
            mb: 3,
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.35)',
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
            Employee Portal
          </Typography>
          <Typography variant="h6" sx={{ 
            color: '#6b7280', 
            fontWeight: 600,
            fontSize: { xs: '0.95rem', sm: '1.1rem' }
          }}>
            Welcome back! Please sign in to continue
          </Typography>
        </Box>

        {/* Login Card */}
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 3, sm: 4, md: 5 },
            border: '3px solid #e5e7eb',
            bgcolor: 'white',
            borderRadius: '28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -50,
              right: -50,
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
              borderRadius: '50%'
            }
          }}
        >
          {/* Role Toggle Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5,
            mb: 4,
            p: 1.5,
            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
            borderRadius: '16px',
            border: '2px solid #e5e7eb',
            position: 'relative',
            zIndex: 1
          }}>
            <Button
              variant={loginType === 'employee' ? 'contained' : 'text'}
              onClick={() => setLoginType('employee')}
              fullWidth
              disableElevation
              sx={{ 
                textTransform: 'none', 
                fontWeight: 700, 
                py: 1.5,
                borderRadius: '12px',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                color: loginType === 'employee' ? 'white' : '#6b7280',
                background: loginType === 'employee' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                boxShadow: loginType === 'employee' ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none',
                '&:hover': { 
                  background: loginType === 'employee' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : '#e5e7eb',
                  transform: loginType === 'employee' ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.3s ease'
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
                fontWeight: 700, 
                py: 1.5,
                borderRadius: '12px',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                color: loginType === 'admin' ? 'white' : '#6b7280',
                background: loginType === 'admin' ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' : 'transparent',
                boxShadow: loginType === 'admin' ? '0 4px 15px rgba(245, 158, 11, 0.3)' : 'none',
                '&:hover': { 
                  background: loginType === 'admin' ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : '#e5e7eb',
                  transform: loginType === 'admin' ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              Admin/HR
            </Button>
            <Button
              variant={loginType === 'superAdmin' ? 'contained' : 'text'}
              onClick={() => setLoginType('superAdmin')}
              fullWidth
              disableElevation
              sx={{ 
                textTransform: 'none', 
                fontWeight: 700, 
                py: 1.5,
                borderRadius: '12px',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                color: loginType === 'superAdmin' ? 'white' : '#6b7280',
                background: loginType === 'superAdmin' ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'transparent',
                boxShadow: loginType === 'superAdmin' ? '0 4px 15px rgba(139, 92, 246, 0.3)' : 'none',
                '&:hover': { 
                  background: loginType === 'superAdmin' ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : '#e5e7eb',
                  transform: loginType === 'superAdmin' ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              Super Admin
            </Button>
          </Box>

          <Box component="form" onSubmit={handleLogin} sx={{ position: 'relative', zIndex: 1 }}>
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
                    <EmailOutlinedIcon sx={{ color: '#10b981', fontSize: 24 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f9fafb',
                  borderRadius: '14px',
                  fontWeight: 600,
                  '& fieldset': { borderColor: '#e5e7eb', borderWidth: '2px' },
                  '&:hover fieldset': { borderColor: '#10b981', borderWidth: '2px' },
                  '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: '2px' },
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 600,
                  color: '#6b7280'
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#10b981'
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
                    <LockOutlinedIcon sx={{ color: '#10b981', fontSize: 24 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="medium"
                      sx={{ 
                        color: '#6b7280',
                        '&:hover': { 
                          bgcolor: '#f3f4f6',
                          color: '#10b981'
                        }
                      }}
                    >
                      {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f9fafb',
                  borderRadius: '14px',
                  fontWeight: 600,
                  '& fieldset': { borderColor: '#e5e7eb', borderWidth: '2px' },
                  '&:hover fieldset': { borderColor: '#10b981', borderWidth: '2px' },
                  '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: '2px' },
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 600,
                  color: '#6b7280'
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#10b981'
                }
              }}
            />
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 3,
                  border: '2px solid #fecaca',
                  bgcolor: '#fef2f2',
                  borderRadius: '14px',
                  fontWeight: 600,
                  '& .MuiAlert-icon': {
                    color: '#dc2626'
                  }
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
                mt: 4, 
                mb: 2,
                background: getButtonColor(),
                py: 1.8,
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 800,
                borderRadius: '14px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                border: '2px solid rgba(255,255,255,0.2)',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
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
              {isLoading ? (
                <CircularProgress size={28} sx={{ color: 'white' }} />
              ) : (
                getButtonText()
              )}
            </Button>
            
            <Divider sx={{ my: 3 }}>
              <Chip 
                label="OR" 
                size="small" 
                sx={{ 
                  bgcolor: '#f3f4f6',
                  color: '#6b7280',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  px: 2,
                  border: '2px solid #e5e7eb'
                }} 
              />
            </Divider>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <RouterLink 
                  to="/forgot-password"
                  style={{ 
                    textDecoration: 'none',
                    color: '#10b981',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🔒 Forgot password?
                </RouterLink>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <RouterLink 
                  to="/register"
                  style={{ 
                    textDecoration: 'none',
                    color: '#8b5cf6',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                    gap: '4px'
                  }}
                >
                  ✨ Create Account
                </RouterLink>
              </Grid>
            </Grid>
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
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}>
            
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;