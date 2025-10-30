// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Container, Button, AppBar, Toolbar,
  Grid, Card, CardContent, CardHeader, Avatar, Chip, Divider,
  useTheme, Paper, CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Import Icons
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import DescriptionIcon from '@mui/icons-material/Description';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';

// Import Components
import { useAuth } from '../context/AuthContext';
import PersonalInformationForm from '../components/PersonalInformationForm';
import DocumentManager from '../components/DocumentManager';
import JobDetails from '../components/JobDetails';
import axios from 'axios';

// --- PEGORION BRANDING COLORS ---
const PRIMARY_COLOR = '#5A45FF'; // A deep, professional blue-purple
const SECONDARY_COLOR = '#8B5CF6'; // A lighter purple accent
const TEXT_COLOR = '#1F2937';
const LIGHT_BACKGROUND = '#F9FAFB';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useTheme();

  const [employeeData, setEmployeeData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const triggerDataRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchEmployeeData();
  };

  // Updated function to use professional blue/purple gradients
  const getRoleColor = (role) => {
    switch (role) {
      case 'superadmin': return 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)'; // Deep Blue
      case 'admin': return 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)';    // Purple
      case 'hr': return 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';       // Red/Alert (distinguish from tech roles)
      default: return 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)';        // Standard Blue
    }
  };

  const userName = employeeData?.name || user?.employeeId || 'Employee';

  // Fetch employee info
  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("No auth token found.");

      const response = await axios.get('http://localhost:8080/api/employee/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data.data || response.data;
      setEmployeeData(data);

    } catch (error) {
      console.error('Failed to fetch employee data:', error);
      setEmployeeData(user);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchEmployeeData();
  }, [user]);

  if (loading || !employeeData) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '100vh',
          background: LIGHT_BACKGROUND,
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ color: PRIMARY_COLOR }} />
        <Typography variant="h6" sx={{ mt: 3, color: TEXT_COLOR, fontWeight: 600 }}>
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: LIGHT_BACKGROUND, // Clean background
    }}>
      
      {/* Navbar - Clean White with Border */}
      <AppBar 
        position="static" 
        elevation={0} 
        sx={{ 
          background: 'white',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <Toolbar sx={{ py: 1.5, px: { xs: 2, sm: 4 } }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            // Use Primary Color for logo background
            background: PRIMARY_COLOR, 
            borderRadius: '8px', 
            p: 0.8,
            mr: 2,
            boxShadow: '0 4px 15px rgba(90, 69, 255, 0.3)'
          }}>
            <BusinessCenterIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_COLOR }}>
            Pegorion Employee Portal
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Admin Panel Button */}
          {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'hr') && (
            <Button 
              onClick={() => navigate('/admin')} 
              startIcon={<AdminPanelSettingsIcon />}
              sx={{ 
                mr: 2, 
                textTransform: 'none', 
                fontWeight: 600, 
                color: 'white',
                background: PRIMARY_COLOR,
                '&:hover': {
                    background: SECONDARY_COLOR,
                },
                px: 3, py: 1,
                borderRadius: '8px',
              }}
            >
              Admin Panel
            </Button>
          )}

          {/* Logout Button - Outlined/Subtle */}
          <Button 
            onClick={handleLogout} 
            startIcon={<LogoutIcon />} 
            variant="outlined"
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600, 
              borderColor: '#D1D5DB', 
              color: TEXT_COLOR,
              px: 3, py: 1,
              borderRadius: '8px',
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        
        {/* Welcome Section - Clean Card Design */}
        <Paper
          elevation={4} // Use a standard elevation for a clean shadow
          sx={{
            p: 4,
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            background: 'white',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar 
                sx={{
                  width: 80, height: 80,
                  background: getRoleColor(employeeData?.role), // Role-based avatar color
                  fontSize: '2.3rem', fontWeight: 700,
                }}
              >
                {employeeData?.name?.charAt(0)?.toUpperCase() || 'E'}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WavingHandIcon sx={{ color: PRIMARY_COLOR }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_COLOR }}>
                  Welcome Back, {userName}!
                </Typography>
              </Box>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>Employee ID</Typography>
                  <Typography variant="body1" sx={{ color: TEXT_COLOR, fontWeight: 600 }}>
                    {employeeData?.employeeId || employeeData?.id || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>Email</Typography>
                  <Typography variant="body1" sx={{ color: TEXT_COLOR, fontWeight: 600 }}>
                    {employeeData?.email || 'email@pegorion.com'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>Today</Typography>
                  <Typography variant="body1" sx={{ color: TEXT_COLOR, fontWeight: 600 }}>
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            <Grid item>
              {employeeData?.role && (
                <Chip 
                  label={employeeData.role.toUpperCase()} 
                  sx={{ 
                    background: getRoleColor(employeeData.role), 
                    color: 'white', 
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    px: 1,
                  }}
                />
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Personal Info + Job Details */}
        <Grid container spacing={4} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
            {/* The components themselves will need to be styled to match the new look */}
            <PersonalInformationForm onUpdateSuccess={triggerDataRefresh} /> 
          </Grid>
          <Grid item xs={12} md={6}>
            <JobDetails key={refreshTrigger} employee={employeeData} />
          </Grid>
        </Grid>

        {/* Document Manager */}
        <Box sx={{ mt: 6 }}>
          <DocumentManager key={`docs-${refreshTrigger}`} onUploadSuccess={triggerDataRefresh} />
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 5, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            © {new Date().getFullYear()} Pegorion Software Solutions Pvt. Ltd.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default DashboardPage;