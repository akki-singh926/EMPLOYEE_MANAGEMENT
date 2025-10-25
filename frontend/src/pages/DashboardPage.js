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

  const getRoleColor = (role) => {
    switch (role) {
      case 'superadmin': return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
      case 'admin': return 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)';
      case 'hr': return 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)';
      default: return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
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
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ color: '#10b981' }} />
        <Typography variant="h6" sx={{ mt: 3, color: '#059669', fontWeight: 600 }}>
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #dbeafe 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '300px',
        background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
        pointerEvents: 'none'
      }
    }}>
      
      {/* Navbar */}
      <AppBar 
        position="static" 
        elevation={0} 
        sx={{ 
          background: 'linear-gradient(90deg, #ffffff 0%, #f9fafb 100%)',
          borderBottom: '2px solid #e5e7eb',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        <Toolbar sx={{ py: 1.5, px: { xs: 2, sm: 4 } }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '12px',
            p: 1,
            mr: 2,
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
          }}>
            <BusinessCenterIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
            Employee Portal
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'hr') && (
            <Button 
              onClick={() => navigate('/admin')} 
              startIcon={<AdminPanelSettingsIcon />}
              sx={{ 
                mr: 2, 
                textTransform: 'none', 
                fontWeight: 600, 
                color: 'white',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                px: 3, py: 1,
                borderRadius: '10px',
              }}
            >
              Admin Panel
            </Button>
          )}

          <Button 
            onClick={handleLogout} 
            startIcon={<LogoutIcon />} 
            variant="outlined"
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600, 
              borderColor: '#d1d5db', 
              color: '#374151',
              px: 3, py: 1,
              borderRadius: '10px',
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        
        {/* Welcome Section */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: '24px',
            border: '2px solid #e5e7eb',
            background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar 
                sx={{
                  width: 80, height: 80,
                  background: getRoleColor(employeeData?.role),
                  fontSize: '2.3rem', fontWeight: 700,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                }}
              >
                {employeeData?.name?.charAt(0)?.toUpperCase() || 'E'}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WavingHandIcon sx={{ color: '#f59e0b' }} />
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827' }}>
                  Welcome Back, {userName}!
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Employee ID</Typography>
                  <Typography variant="body2" sx={{ color: '#111827', fontWeight: 600 }}>
                    {employeeData?.employeeId || employeeData?.id || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Email</Typography>
                  <Typography variant="body2" sx={{ color: '#111827', fontWeight: 600 }}>
                    {employeeData?.email || 'email@company.com'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Today</Typography>
                  <Typography variant="body2" sx={{ color: '#111827', fontWeight: 600 }}>
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            <Grid item>
              {employeeData?.role && (
                <Chip 
                  label={employeeData.role.toUpperCase()} 
                  sx={{ background: getRoleColor(employeeData.role), color: 'white', fontWeight: 700 }}
                />
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Personal Info + Job Details */}
        <Grid container spacing={4} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
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
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default DashboardPage;
