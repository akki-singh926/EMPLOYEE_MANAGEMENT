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

// --- PEGORION BRANDING COLORS (FLAT, CRISP) ---
const PRIMARY_COLOR = '#5A45FF';      // Pegorion Primary Blue-Purple
const SECONDARY_COLOR = '#8B5CF6';    // Pegorion Lighter Purple Accent
const TEXT_COLOR_DARK = '#1F2937';    
const LIGHT_BACKGROUND = '#F9FAFB';   // Very light gray background
const WHITE = '#FFFFFF';


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
  // Using flat colors for cleaner design
  const getButtonColor = () => {
    if (loginType === 'admin') return '#F59E0B'; // Amber
    if (loginType === 'superAdmin') return SECONDARY_COLOR;
    return PRIMARY_COLOR; // Primary Pegorion Blue-Purple
  };
  
  // Helper function to get the main accent color for icons/inputs
  const getAccentColor = () => {
    if (loginType === 'admin') return '#F59E0B'; 
    if (loginType === 'superAdmin') return SECONDARY_COLOR;
    return PRIMARY_COLOR;
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: LIGHT_BACKGROUND, // Clean light gray background
      py: { xs: 3, sm: 4 },
      px: 2,
    }}>
      <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          {/* Icon Box: Use primary color, standard circle, removed border/heavy shadow */}
          <Box sx={{ 
            width: { xs: 60, sm: 70 }, 
            height: { xs: 60, sm: 70 }, 
            background: PRIMARY_COLOR,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto', 
            mb: 3,
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          }}>
            <BusinessIcon sx={{ fontSize: { xs: 36, sm: 42 }, color: WHITE }} />
          </Box>
          <Typography variant="h3" fontWeight={700} sx={{ // Reduced font weight
            color: TEXT_COLOR_DARK,
            fontSize: { xs: '2rem', sm: '2.5rem' },
            mb: 1
          }}>
            Pegorion Employee Portal
          </Typography>
          <Typography variant="h6" sx={{ 
            color: '#6B7280', 
            fontWeight: 400, // Reduced font weight
            fontSize: { xs: '1rem', sm: '1.1rem' }
          }}>
            Welcome back! Please sign in to continue
          </Typography>
        </Box>

        {/* Login Card - Clean White, Subtle Elevation */}
        <Paper 
          elevation={6}
          sx={{ 
            p: { xs: 3, sm: 4, md: 5 },
            border: '1px solid #E5E7EB',
            bgcolor: WHITE,
            borderRadius: '12px', // Standard corporate rounding
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)', // Subtle shadow
          }}
        >
          {/* Role Toggle Buttons - Flat/Crisp Design */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            mb: 4,
            p: 1,
            background: LIGHT_BACKGROUND,
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}>
            {/* Employee Button */}
            <Button
              variant={loginType === 'employee' ? 'contained' : 'text'}
              onClick={() => setLoginType('employee')}
              fullWidth
              disableElevation
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600, 
                py: 1.2,
                borderRadius: '6px',
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                color: loginType === 'employee' ? WHITE : TEXT_COLOR_DARK,
                background: loginType === 'employee' ? PRIMARY_COLOR : 'transparent',
                boxShadow: 'none',
                '&:hover': { 
                  background: loginType === 'employee' ? SECONDARY_COLOR : '#E5E7EB',
                }
              }}
            >
              Employee
            </Button>
            {/* Admin/HR Button */}
            <Button
              variant={loginType === 'admin' ? 'contained' : 'text'}
              onClick={() => setLoginType('admin')}
              fullWidth
              disableElevation
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600, 
                py: 1.2,
                borderRadius: '6px',
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                color: loginType === 'admin' ? WHITE : TEXT_COLOR_DARK,
                background: loginType === 'admin' ? getButtonColor() : 'transparent', // Amber flat color
                boxShadow: 'none',
                '&:hover': { 
                  background: loginType === 'admin' ? '#D97706' : '#E5E7EB',
                }
              }}
            >
              Admin/HR
            </Button>
            {/* Super Admin Button */}
            <Button
              variant={loginType === 'superAdmin' ? 'contained' : 'text'}
              onClick={() => setLoginType('superAdmin')}
              fullWidth
              disableElevation
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600, 
                py: 1.2,
                borderRadius: '6px',
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                color: loginType === 'superAdmin' ? WHITE : TEXT_COLOR_DARK,
                background: loginType === 'superAdmin' ? getButtonColor() : 'transparent', // Secondary Purple flat color
                boxShadow: 'none',
                '&:hover': { 
                  background: loginType === 'superAdmin' ? PRIMARY_COLOR : '#E5E7EB',
                }
              }}
            >
              Super Admin
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
                    <EmailOutlinedIcon sx={{ color: getAccentColor(), fontSize: 24 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: LIGHT_BACKGROUND,
                  borderRadius: '8px',
                  fontWeight: 500,
                  '& fieldset': { borderColor: '#E5E7EB' },
                  '&:hover fieldset': { borderColor: getAccentColor(), borderWidth: '1px' },
                  '&.Mui-focused fieldset': { borderColor: getAccentColor(), borderWidth: '2px' },
                },
                '& .MuiInputLabel-root': { fontWeight: 500, color: '#6B7280' },
                '& .MuiInputLabel-root.Mui-focused': { color: getAccentColor() }
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
                    <LockOutlinedIcon sx={{ color: getAccentColor(), fontSize: 24 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="medium"
                      sx={{ color: '#6B7280' }}
                    >
                      {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: LIGHT_BACKGROUND,
                  borderRadius: '8px',
                  fontWeight: 500,
                  '& fieldset': { borderColor: '#E5E7EB' },
                  '&:hover fieldset': { borderColor: getAccentColor(), borderWidth: '1px' },
                  '&.Mui-focused fieldset': { borderColor: getAccentColor(), borderWidth: '2px' },
                },
                '& .MuiInputLabel-root': { fontWeight: 500, color: '#6B7280' },
                '& .MuiInputLabel-root.Mui-focused': { color: getAccentColor() }
              }}
            />
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 3,
                  border: '1px solid #FCA5A5',
                  bgcolor: '#FEF2F2',
                  borderRadius: '8px',
                  fontWeight: 500,
                  color: '#DC2626',
                  '& .MuiAlert-icon': { color: '#DC2626' }
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
                py: 1.5, // Reduced padding
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: '8px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                '&:hover': {
                  background: loginType === 'admin' ? '#D97706' : (loginType === 'superAdmin' ? PRIMARY_COLOR : SECONDARY_COLOR),
                  boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                },
                '&:disabled': {
                  background: '#E5E7EB',
                  color: '#9CA3AF'
                }
              }} 
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={28} sx={{ color: WHITE }} />
              ) : (
                getButtonText()
              )}
            </Button>
            
            <Divider sx={{ my: 3 }}>
              <Chip 
                label="OR" 
                size="small" 
                sx={{ 
                  bgcolor: LIGHT_BACKGROUND,
                  color: '#6B7280',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  border: '1px solid #E5E7EB'
                }} 
              />
            </Divider>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <RouterLink 
                  to="/forgot-password"
                  style={{ 
                    textDecoration: 'none',
                    color: PRIMARY_COLOR, // Primary Pegorion color
                    fontSize: '0.95rem',
                    fontWeight: 600,
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
                    color: SECONDARY_COLOR, // Secondary Pegorion color
                    fontSize: '0.95rem',
                    fontWeight: 600,
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
          <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>
            © {new Date().getFullYear()} Pegorion Software Solutions
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;