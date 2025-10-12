// src/pages/DashboardPage.js
import React, { useState } from 'react';
import {
  Box, Typography, Container, Button, AppBar, Toolbar,
  Grid, Card, CardContent, CardHeader, Avatar, Chip, Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Import Icons
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import DescriptionIcon from '@mui/icons-material/Description';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DashboardIcon from '@mui/icons-material/Dashboard';

// Import Components
import { useAuth } from '../context/AuthContext';
import PersonalInformationForm from '../components/PersonalInformationForm';
import DocumentManager from '../components/DocumentManager';
import JobDetails from '../components/JobDetails';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const triggerDataRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#f5f7fa'
    }}>
      {/* Professional AppBar */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: '#1e293b',
          borderBottom: '3px solid #3b82f6'
        }}
      >
        <Toolbar sx={{ py: 1.5 }}>
          <DashboardIcon sx={{ mr: 1.5, color: '#3b82f6' }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              color: 'white',
              letterSpacing: '0.3px'
            }}
          >
            Employee Management System
          </Typography>
          
          {user?.role === 'admin' && (
            <Button 
              color="inherit" 
              onClick={() => navigate('/admin')}
              startIcon={<AdminPanelSettingsIcon />}
              sx={{ 
                mr: 2,
                textTransform: 'none',
                fontWeight: 500,
                color: '#e2e8f0',
                '&:hover': {
                  bgcolor: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6'
                }
              }}
            >
              Admin Panel
            </Button>
          )}

          <Button 
            color="inherit" 
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{ 
              textTransform: 'none',
              fontWeight: 500,
              color: '#e2e8f0',
              '&:hover': {
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444'
              }
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ mt: 4, mb: 4 }}>
        {/* Professional Welcome Header */}
        <Box 
          sx={{ 
            mb: 4,
            p: 3,
            bgcolor: 'white',
            borderLeft: '4px solid #3b82f6',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 3
          }}
        >
          <Avatar 
            sx={{ 
              width: 56, 
              height: 56,
              bgcolor: '#3b82f6',
              fontSize: '1.5rem',
              fontWeight: 600
            }}
          >
            {user?.name?.charAt(0) || 'E'}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontWeight: 600,
                color: '#1e293b',
                mb: 0.5
              }}
            >
              Welcome, {user?.name || 'Employee'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Employee Dashboard • Manage your information and documents
            </Typography>
          </Box>
          {user?.role === 'admin' && (
            <Chip 
              label="Administrator" 
              sx={{ 
                bgcolor: '#dbeafe',
                color: '#1e40af',
                fontWeight: 600,
                height: 32,
                fontSize: '0.875rem'
              }}
            />
          )}
        </Box>

        {/* Main Dashboard Grid */}
        <Grid container spacing={3}>
          
          {/* Personal Information Card */}
          <Grid item xs={12} lg={6}>
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                border: '1px solid #e2e8f0',
                bgcolor: 'white'
              }}
            >
              <CardHeader 
                avatar={
                  <Box sx={{ 
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PersonIcon sx={{ color: '#3b82f6' }} />
                  </Box>
                }
                title={
                  <Typography variant="h6" fontWeight={600} color="#1e293b">
                    Personal Information
                  </Typography>
                }
                subheader="Update your profile details"
                sx={{ pb: 0 }}
              />
              <Divider sx={{ mt: 2 }} />
              <CardContent sx={{ pt: 3 }}>
                <PersonalInformationForm onUpdateSuccess={triggerDataRefresh} /> 
              </CardContent>
            </Card>
          </Grid>

          {/* Employee Summary Card */}
          <Grid item xs={12} lg={6}>
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                border: '1px solid #e2e8f0',
                bgcolor: 'white'
              }}
            >
              <CardHeader 
                avatar={
                  <Box sx={{ 
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <WorkIcon sx={{ color: '#16a34a' }} />
                  </Box>
                }
                title={
                  <Typography variant="h6" fontWeight={600} color="#1e293b">
                    Employment Details
                  </Typography>
                }
                subheader="View your job information and summary"
                sx={{ pb: 0 }}
              />
              <Divider sx={{ mt: 2 }} />
              <CardContent sx={{ pt: 3 }}>
                <JobDetails key={refreshTrigger} />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Document Management Card */}
          <Grid item xs={12}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid #e2e8f0',
                bgcolor: 'white'
              }}
            >
              <CardHeader 
                avatar={
                  <Box sx={{ 
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DescriptionIcon sx={{ color: '#d97706' }} />
                  </Box>
                }
                title={
                  <Typography variant="h6" fontWeight={600} color="#1e293b">
                    Document Management
                  </Typography>
                }
                subheader="Upload and manage your employment documents"
                sx={{ pb: 0 }}
              />
              <Divider sx={{ mt: 2 }} />
              <CardContent sx={{ pt: 3 }}>
                <DocumentManager key={`docs-${refreshTrigger}`} onUploadSuccess={triggerDataRefresh} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DashboardPage;