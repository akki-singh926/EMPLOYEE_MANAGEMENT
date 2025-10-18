// src/pages/DashboardPage.js
import React, { useState } from 'react';
import {
  Box, Typography, Container, Button, AppBar, Toolbar,
  Grid, Card, CardContent, CardHeader, Avatar, Chip, Divider, 
  useTheme, Paper, IconButton, Tooltip, Badge
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Import Icons
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import DescriptionIcon from '@mui/icons-material/Description';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';

// Import Components
import { useAuth } from '../context/AuthContext';
import PersonalInformationForm from '../components/PersonalInformationForm';
import DocumentManager from '../components/DocumentManager';
import JobDetails from '../components/JobDetails';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useTheme(); 
  
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const triggerDataRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'superadmin': return '#1e40af';
      case 'admin': return '#7c3aed';
      case 'hr': return '#dc2626';
      default: return '#059669';
    }
  };

  // Determine the final name for the welcome header, prioritizing 'name' field
  const userName = user?.name || user?.employeeId || 'Employee';

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: theme.palette.background.default
    }}>
      {/* Professional AppBar */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: '#ffffff',
          borderBottom: '1px solid #e5e7eb'
        }}
      >
        <Toolbar sx={{ py: 1.5, px: { xs: 2, sm: 3 } }}>
          <BusinessCenterIcon sx={{ mr: 1.5, color: '#1e40af', fontSize: 30 }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 600,
              color: '#111827',
              letterSpacing: '-0.025em'
            }}
          >
            Employee Management Portal
          </Typography>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Admin Panel Button Visibility Check */}
          {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'hr') && (
            <Button 
              onClick={() => navigate('/admin')}
              startIcon={<AdminPanelSettingsIcon />}
              sx={{ 
                mr: 2,
                textTransform: 'none',
                fontWeight: 500,
                color: '#374151',
                bgcolor: '#f3f4f6',
                px: 2,
                '&:hover': {
                  bgcolor: '#e5e7eb'
                }
              }}
            >
              Admin Panel
            </Button>
          )}

          {/* Logout Button */}
          <Button 
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            variant="outlined"
            sx={{ 
              textTransform: 'none',
              fontWeight: 500,
              borderColor: '#d1d5db',
              color: '#374151',
              '&:hover': {
                borderColor: '#9ca3af',
                bgcolor: '#f9fafb'
              }
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        {/* Professional Header Card */}
        <Paper 
          elevation={0}
          sx={{ 
            mb: 4,
            p: 3,
            bgcolor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 3
          }}
        >
          <Avatar 
            sx={{ 
              width: 72, 
              height: 72,
              bgcolor: getRoleColor(user?.role),
              fontSize: '1.75rem',
              fontWeight: 600
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'E'}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            {/* FINAL WELCOME MESSAGE FIX: Prioritizes name, then Employee ID */}
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontWeight: 600,
                color: '#111827',
                mb: 0.5
              }}
            >
              Welcome, {userName}
            </Typography>
            
            <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 400, mb: 0.5 }}>
              Employee ID: {user?.employeeId || user?.id || 'N/A'} • {user?.email || 'email@company.com'}
            </Typography>
            
            <Typography variant="caption" sx={{ color: '#9ca3af' }}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>
          {/* Displaying Role Chip */}
          {user?.role && (
            <Chip 
              label={user.role.toUpperCase()} 
              sx={{ 
                bgcolor: getRoleColor(user?.role),
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 28
              }}
            />
          )}
        </Paper>

        {/* Main Content Sections */}
        <Grid container spacing={3}>
          
          {/* Personal Information Section */}
          <Grid item xs={12} lg={6}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid #e5e7eb', 
                bgcolor: '#ffffff',
                borderRadius: 1,
                height: '100%'
              }}
            >
              <CardHeader 
                avatar={
                  <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PersonIcon sx={{ color: '#1e40af', fontSize: 24 }} />
                  </Box>
                }
                title={
                  <Typography variant="h6" fontWeight={600} sx={{ color: '#111827' }}>
                    Personal Information
                  </Typography>
                }
                subheader={
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Manage your personal details
                  </Typography>
                }
                sx={{ pb: 1 }}
              />
              <Divider />
              <CardContent sx={{ pt: 3 }}>
                <PersonalInformationForm onUpdateSuccess={triggerDataRefresh} /> 
              </CardContent>
            </Card>
          </Grid>

          {/* Job Details Section */}
          <Grid item xs={12} lg={6}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid #e5e7eb', 
                bgcolor: '#ffffff', 
                borderRadius: 1,
                height: '100%'
              }}
            >
              <CardHeader 
                avatar={
                  <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <WorkIcon sx={{ color: '#059669', fontSize: 24 }} />
                  </Box>
                }
                title={
                  <Typography variant="h6" fontWeight={600} sx={{ color: '#111827' }}>
                    Employee Summary & Job Details
                  </Typography>
                }
                subheader={
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    View your job information
                  </Typography>
                }
                sx={{ pb: 1 }}
              />
              <Divider />
              <CardContent sx={{ pt: 3 }}>
                <JobDetails key={refreshTrigger} />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Document Management Section */}
          <Grid item xs={12}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid #e5e7eb', 
                bgcolor: '#ffffff',
                borderRadius: 1
              }}
            >
              <CardHeader 
                avatar={
                  <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DescriptionIcon sx={{ color: '#d97706', fontSize: 24 }} />
                  </Box>
                }
                title={
                  <Typography variant="h6" fontWeight={600} sx={{ color: '#111827' }}>
                    Document Management
                  </Typography>
                }
                subheader={
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Upload and manage your employment documents
                  </Typography>
                }
                sx={{ pb: 1 }}
              />
              <Divider />
              <CardContent sx={{ pt: 3 }}>
                <DocumentManager key={`docs-${refreshTrigger}`} onUploadSuccess={triggerDataRefresh} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid #e5e7eb' }}>
          <Typography variant="body2" align="center" sx={{ color: '#6b7280' }}>
            For assistance, contact HR at <strong>hr@company.com</strong> or <strong>+1 (555) 123-4567</strong>
          </Typography>
          <Typography variant="caption" display="block" align="center" sx={{ mt: 1, color: '#9ca3af' }}>
            © 2025 Employee Management System. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default DashboardPage;