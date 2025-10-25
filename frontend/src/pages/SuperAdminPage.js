import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Container, Button, AppBar, Toolbar, 
  Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TextField, InputAdornment, Grid, 
  CircularProgress, Chip, Alert, Card, CardContent, Divider,
  Tooltip, IconButton, Badge
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import VerifiedIcon from '@mui/icons-material/Verified';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import UserFormModal from '../components/UserFormModal';
import { useAuth } from '../context/AuthContext';
import FinalVerificationQueue from '../components/FinalVerificationQueue';

const SuperAdminPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const SUPERADMIN_API_URL = 'http://localhost:8080/api/superAdmin';
  const ADMIN_API_URL = 'http://localhost:8080/api/admin';
  const hasSuperAdminRights = user?.role === 'superAdmin';

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("Auth failed.");

      const response = await axios.get(`${SUPERADMIN_API_URL}/employees`, { 
        headers: { Authorization: `Bearer ${token}` }
      });

      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error('Error fetching employee list:', error);
      const errorMessage = error.response?.status === 403 
        ? 'Access Denied: You must be a Super Admin.' 
        : 'Could not fetch employee list.';
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const getStatistics = () => {
    const total = employees.length;
    const approved = employees.filter(emp =>
      emp.documents?.length > 0 &&
      emp.documents.every(doc => doc.status === 'Verified')
    ).length;
    const pending = employees.filter(emp =>
      emp.documents?.some(doc => doc.status === 'Approved' || doc.status === 'Pending')
    ).length;
    const admins = employees.filter(emp =>
      ['admin', 'superAdmin'].includes(emp.role)
    ).length;

    return { total, approved, pending, admins };
  };

  const stats = getStatistics();

  const handleDeleteUser = async (userId, userName, userRole) => {
    if (userRole === 'superAdmin') {
      return showNotification("Super Admins cannot be deleted.", 'error');
    }
    if (!window.confirm(`Delete ${userName}? This cannot be undone.`)) return;

    const token = localStorage.getItem('authToken');
    try {
      await axios.delete(`${SUPERADMIN_API_URL}/employees/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification(`User ${userName} deleted successfully.`, 'success');
      fetchEmployees();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to delete user.', 'error');
    }
  };

  const handleExport = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return showNotification("Auth token not found.", 'error');
    
    try {
      const response = await axios.get(`${ADMIN_API_URL}/export/employees`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', 
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'EmployeeData.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showNotification('Report downloaded successfully!', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Failed to download report. Check API endpoint.', 'error');
    }
  };

  const getOverallDocStatus = (docs) => {
    if (!docs || docs.length === 0) return 'Not Uploaded';
    if (docs.some(d => d.status === 'Rejected')) return 'Rejected';
    if (docs.every(d => d.status === 'Verified')) return 'Verified';
    if (docs.some(d => d.status === 'Approved')) return 'Pending for Final Verification';
    if (docs.some(d => d.status === 'Pending')) return 'Pending';
    return 'Not Uploaded';
  };

  const employeesToDisplay = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh" 
        sx={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
        }}
      >
        <Box textAlign="center">
          <CircularProgress size={60} thickness={4} sx={{ color: '#2563eb' }} />
          <Typography variant="h6" sx={{ mt: 2, color: '#1e40af', fontWeight: 600 }}>
            Loading Super Admin Console...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0e7ff 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(37, 99, 235, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(79, 70, 229, 0.08) 0%, transparent 50%)',
        pointerEvents: 'none'
      }
    }}>
      {/* Premium Blue AppBar */}
      <AppBar 
        position="static" 
        elevation={0} 
        sx={{ 
          background: 'linear-gradient(90deg, #1e3a8a 0%, #1e40af 100%)',
          borderBottom: '3px solid #3b82f6',
          boxShadow: '0 4px 20px rgba(37, 99, 235, 0.3)'
        }}
      >
        <Toolbar sx={{ py: 1.5 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            bgcolor: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '12px',
            p: 1.2,
            mr: 2,
            border: '2px solid rgba(59, 130, 246, 0.5)',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
          }}>
            <SecurityIcon sx={{ fontSize: 32, color: '#60a5fa' }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 900, 
              color: '#ffffff',
              letterSpacing: '1.5px',
              textShadow: '0 2px 10px rgba(59, 130, 246, 0.5)'
            }}>
              SUPER ADMIN CONSOLE
            </Typography>
            <Typography variant="caption" sx={{ 
              color: '#bfdbfe',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}>
              Executive Authority • System Control
            </Typography>
          </Box>
          <Button 
            color="inherit" 
            onClick={() => navigate('/admin')}
            sx={{
              color: '#bfdbfe',
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: '10px',
              border: '1px solid rgba(191, 219, 254, 0.4)',
              mr: 1,
              '&:hover': {
                bgcolor: 'rgba(59, 130, 246, 0.2)',
                borderColor: '#60a5fa',
                color: '#60a5fa'
              }
            }}
          >
            HR/Admin Panel
          </Button>
          <Button 
            color="inherit" 
            onClick={() => navigate('/dashboard')}
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              fontWeight: 700,
              px: 3,
              py: 1,
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.5)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(59, 130, 246, 0.7)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 5, mb: 6, position: 'relative', zIndex: 1 }}>
        {/* Modern Header Section */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{
              width: '8px',
              height: '60px',
              background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '10px',
              mr: 2,
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)'
            }} />
            <Box>
              <Typography variant="h3" sx={{ 
                fontWeight: 900, 
                color: '#1e3a8a',
                textShadow: '2px 2px 4px rgba(37, 99, 235, 0.15)',
                mb: 0.5,
                letterSpacing: '0.5px'
              }}>
                Executive Management Console
              </Typography>
              <Typography variant="body1" sx={{ 
                color: '#1e40af',
                fontWeight: 600,
                letterSpacing: '0.3px'
              }}>
                Ultimate Authority Dashboard • Comprehensive System Control
              </Typography>
            </Box>
          </Box>
          
          <Alert 
            severity="info" 
            icon={<SecurityIcon />}
            sx={{ 
              mb: 3, 
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(30, 64, 175, 0.12) 100%)',
              border: '2px solid rgba(59, 130, 246, 0.4)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.15)',
              '& .MuiAlert-icon': {
                color: '#2563eb'
              },
              '& .MuiAlert-message': {
                color: '#1e40af'
              }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
              <strong>⚡ Super Admin Access:</strong> You have unrestricted CRUD operations and final document verification authority. Documents approved by HR require your final verification.
            </Typography>
          </Alert>
        </Box>

        {/* Premium Statistics Cards - Blue Corporate Theme */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {[
            {
              value: stats.total,
              label: 'Total System Users',
              gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              icon: <PeopleIcon sx={{ fontSize: 56 }} />,
              badge: stats.total,
              shadowColor: 'rgba(59, 130, 246, 0.4)',
              borderColor: '#3b82f6',
              trend: '+12%'
            },
            {
              value: stats.approved,
              label: 'Fully Verified',
              gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              icon: <VerifiedUserIcon sx={{ fontSize: 56 }} />,
              badge: stats.approved,
              shadowColor: 'rgba(16, 185, 129, 0.4)',
              borderColor: '#10b981',
              trend: '+8%'
            },
            {
              value: stats.pending,
              label: 'Awaiting Final Verification',
              gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              icon: <SpeedIcon sx={{ fontSize: 56 }} />,
              badge: stats.pending,
              shadowColor: 'rgba(245, 158, 11, 0.4)',
              borderColor: '#f59e0b',
              trend: '-5%'
            },
            {
              value: stats.admins,
              label: 'Admin & SuperAdmin',
              gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              icon: <AdminPanelSettingsIcon sx={{ fontSize: 56 }} />,
              badge: stats.admins,
              shadowColor: 'rgba(99, 102, 241, 0.4)',
              borderColor: '#6366f1',
              trend: '+3%'
            }
          ].map((stat, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: '20px',
                  background: stat.gradient,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: `0 8px 32px ${stat.shadowColor}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-10px) scale(1.02)',
                    boxShadow: `0 20px 50px ${stat.shadowColor}`
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-50%',
                    right: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                    transform: 'rotate(30deg)'
                  }
                }}
              >
                <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.25)',
                      borderRadius: '16px',
                      p: 1.5,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      {stat.icon}
                    </Box>
                    <Chip 
                      icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                      label={stat.trend}
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.25)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        height: '24px'
                      }}
                    />
                  </Box>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 900, 
                    mb: 0.5,
                    textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
                    fontSize: '2.5rem'
                  }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    opacity: 0.95, 
                    fontWeight: 700, 
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem'
                  }}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Clean Search Bar */}
        <Paper 
          elevation={0}
          sx={{ 
            mb: 4, 
            p: 3, 
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Search All Users"
                placeholder="Search by name, email, or ID..."
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#3b82f6', fontSize: 24 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: 'white',
                    '& fieldset': {
                      borderColor: '#e5e7eb',
                      borderWidth: '2px'
                    },
                    '&:hover fieldset': {
                      borderColor: '#3b82f6'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                      borderWidth: '2px'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#6b7280',
                    fontWeight: 600
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#3b82f6'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={7} textAlign={{ md: 'right' }}>
              <Tooltip title="Add a new user">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PersonAddIcon />}
                  onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                  sx={{
                    borderRadius: '12px',
                    px: 4,
                    py: 1.5,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                    mr: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': {
                      boxShadow: '0 12px 32px rgba(59, 130, 246, 0.6)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Add User
                </Button>
              </Tooltip>
              <Tooltip title="Export employee data">
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExport}
                  sx={{
                    borderRadius: '12px',
                    px: 4,
                    py: 1.5,
                    fontWeight: 700,
                    borderWidth: '2px',
                    borderColor: '#3b82f6',
                    color: '#3b82f6',
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': {
                      borderWidth: '2px',
                      bgcolor: 'rgba(59, 130, 246, 0.08)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Export Data
                </Button>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>

        {/* Final Verification Queue */}
        <Box sx={{ mb: 4 }}>
          <FinalVerificationQueue />
        </Box>

        {/* Premium Table */}
        <TableContainer 
          component={Paper} 
          elevation={0}
          sx={{ 
            borderRadius: '20px',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ 
                background: 'linear-gradient(90deg, #1e3a8a 0%, #1e40af 100%)',
                borderBottom: '3px solid #3b82f6'
              }}>
                {['Employee ID', 'Name', 'Email', 'Role', 'Document Status', 'Actions'].map((head) => (
                  <TableCell 
                    key={head} 
                    sx={{ 
                      color: '#ffffff', 
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      py: 2.5,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      borderBottom: 'none'
                    }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {employeesToDisplay.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      opacity: 0.6
                    }}>
                      <PeopleIcon sx={{ fontSize: 64, mb: 2, color: '#3b82f6' }} />
                      <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 600 }}>
                        No employees found
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        {searchTerm ? 'Try adjusting your search criteria' : 'Add your first user to get started'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                employeesToDisplay.map((emp, index) => {
                  const docStatus = getOverallDocStatus(emp.documents);
                  return (
                    <TableRow 
                      key={emp._id} 
                      sx={{ 
                        '&:hover': { 
                          bgcolor: 'rgba(59, 130, 246, 0.05)',
                          transition: 'all 0.3s ease'
                        },
                        bgcolor: index % 2 === 0 ? 'transparent' : 'rgba(59, 130, 246, 0.02)',
                        borderBottom: '1px solid #e5e7eb'
                      }}
                    >
                      <TableCell sx={{ color: '#3b82f6', fontWeight: 700, py: 2.5 }}>
                        {emp.employeeId}
                      </TableCell>
                      <TableCell sx={{ color: '#111827', fontWeight: 600, py: 2.5 }}>
                        {emp.name}
                      </TableCell>
                      <TableCell sx={{ color: '#6b7280', py: 2.5 }}>
                        {emp.email}
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        <Chip
                          label={emp.role?.toUpperCase() || 'N/A'}
                          size="small"
                          sx={{
                            color: 'white',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            borderRadius: '8px',
                            px: 1.5,
                            background:
                              emp.role === 'superAdmin' ? 'linear-gradient(135deg, #9755b1ff 0%, #241193ff 100%)' :
                              emp.role === 'admin' ? 'linear-gradient(135deg, #c948b8ff 0%, #94135eff 100%)' :
                              emp.role === 'hr' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 
                              'linear-gradient(135deg, #197b2dff 0%, #226daeff 100%)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        <Chip
                          label={docStatus}
                          size="small"
                          icon={docStatus === 'Verified' ? 
                            <VerifiedIcon sx={{ fontSize: 16, color: 'white !important' }} /> : undefined}
                          sx={{
                            color: 'white',
                            fontWeight: 700,
                            borderRadius: '8px',
                            px: 1.5,
                            background:
                              docStatus === 'Verified' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                              docStatus === 'Pending for Final Verification' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                              docStatus === 'Pending' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                              docStatus === 'Rejected' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 
                              'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2.5 }}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title="Edit user">
                            <IconButton 
                              size="small" 
                              onClick={() => { setEditingUser(emp); setIsModalOpen(true); }}
                              sx={{
                                border: '2px solid',
                                borderColor: '#3b82f6',
                                color: '#3b82f6',
                                borderRadius: '10px',
                                '&:hover': {
                                  bgcolor: 'rgba(59, 130, 246, 0.1)',
                                  transform: 'scale(1.1)',
                                  transition: 'all 0.2s ease'
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete user">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteUser(emp._id, emp.name, emp.role)}
                              sx={{
                                border: '2px solid',
                                borderColor: '#ef4444',
                                color: '#ef4444',
                                borderRadius: '10px',
                                '&:hover': {
                                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                                  transform: 'scale(1.1)',
                                  transition: 'all 0.2s ease'
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Premium Footer */}
        <Box sx={{ 
          mt: 6, 
          p: 4, 
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
        }}>
          <Divider sx={{ mb: 3, borderColor: '#e5e7eb' }} />
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 3,
            flexWrap: 'wrap'
          }}>
            <Box sx={{
              bgcolor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '16px',
              p: 2,
              border: '2px solid rgba(59, 130, 246, 0.2)',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.1)'
            }}>
              <SecurityIcon sx={{ color: '#3b82f6', fontSize: 40 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: '300px' }}>
              <Typography variant="body1" sx={{ 
                fontWeight: 800, 
                color: '#1e3a8a',
                mb: 0.5,
                fontSize: '1.1rem'
              }}>
                🔒 Super Admin Information
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600, lineHeight: 1.6 }}>
                You have unrestricted access to all system operations including user management, final document verification, and system configuration. All administrative actions are permanently logged and monitored for security compliance.
              </Typography>
            </Box>
          </Box>
          
          {/* Security Badges */}
          <Box sx={{ 
            mt: 4, 
            pt: 3, 
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            flexWrap: 'wrap'
          }}>
            <Chip 
              icon={<SecurityIcon sx={{ fontSize: 16, color: 'white !important' }} />}
              label="SECURITY LEVEL: MAXIMUM"
              sx={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.7rem',
                letterSpacing: '1px',
                px: 2,
                py: 2.5,
                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
              }}
            />
            <Chip 
              icon={<VerifiedIcon sx={{ fontSize: 16, color: 'white !important' }} />}
              label="FULL CRUD OPERATIONS"
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.7rem',
                letterSpacing: '1px',
                px: 2,
                py: 2.5,
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
            />
            <Chip 
              icon={<AdminPanelSettingsIcon sx={{ fontSize: 16, color: 'white !important' }} />}
              label="ROOT ACCESS ENABLED"
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.7rem',
                letterSpacing: '1px',
                px: 2,
                py: 2.5,
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
              }}
            />
          </Box>
        </Box>
      </Container>

      {/* User Form Modal */}
      <UserFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={editingUser}
        onSaveSuccess={fetchEmployees}
        apiBaseUrl={`${SUPERADMIN_API_URL}/employees`}
        roleList={['employee', 'hr', 'admin', 'superAdmin']}
      />
    </Box>
  );
};

export default SuperAdminPage;
            