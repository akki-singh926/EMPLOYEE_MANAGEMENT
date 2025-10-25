// src/pages/AdminPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Container, Button, AppBar, Toolbar, 
  Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TextField, InputAdornment, Grid, 
  Chip, Alert, Card, CardContent,
  Tooltip, IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailSendIcon from '@mui/icons-material/Send';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import UserFormModal from '../components/UserFormModal';
import { useAuth } from '../context/AuthContext';

const AdminPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const hasSuperAdminRights = user?.role === 'superadmin';

  // --- CORRECTED STATISTICS LOGIC ---
  const getStatistics = () => {
    const total = employees.length;
    
    // Count verified: all documents verified
    const verified = employees.filter(emp => 
      emp.documents?.length > 0 && 
      emp.documents.every(d => d.status === 'Verified')
    ).length;
    
    // Count pending: no documents OR has documents but not all verified
    const pending = employees.filter(emp => 
      !emp.documents || 
      emp.documents.length === 0 || 
      emp.documents.some(d => d.status !== 'Verified')
    ).length;
    
    // Count admins and superadmins separately
     const admins = employees.filter(emp => 
      emp.role === 'admin' || emp.role === 'hr'
    ).length;
    
    const superAdmins = employees.filter(emp => 
      emp.role === 'superadmin' || emp.role === 'superAdmin'
    ).length;
    
    return { total, verified, pending, admins, superAdmins };
  };
  const stats = getStatistics();


  // --- Send OTP ---
  const handleSendOTP = async (employeeEmail, employeeName) => {
    if (!window.confirm(`Send OTP to ${employeeName} (${employeeEmail})?`)) return;
    const token = localStorage.getItem('authToken');
    try {
      await axios.post('http://localhost:8080/api/hr/send-otp', 
        { employeeEmail }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showNotification(`OTP sent to ${employeeName}.`, 'success');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP.';
      showNotification(message, 'error');
    }
  };

  // --- Fetch Employees ---
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("Auth failed.");
      const response = await axios.get('http://localhost:8080/api/admin/employees', { 
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data.data || []);
    } catch (error) {
      const errorMessage = error.response?.status === 403 
        ? 'Access Denied: Admin/HR only.' 
        : 'Cannot fetch employee list.';
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // --- Delete User ---
  const handleDeleteUser = async (userId, userName, userRole) => {
    if (userRole === 'superadmin' && !hasSuperAdminRights) {
      return showNotification("Only Superadmin can delete other Superadmins.", 'error');
    }
    if (!window.confirm(`Delete ${userName}? This cannot be undone.`)) return;
    const token = localStorage.getItem('authToken');
    try {
      await axios.delete(`http://localhost:8080/api/admin/employees/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification(`${userName} deleted successfully.`, 'success');
      fetchEmployees();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to delete user.', 'error');
    }
  };

  // --- Export ---
  const handleExport = () => {
    showNotification("Export initiated.", 'info');
  };

  const getDisplayStatus = (documents) => {
    if (!documents || documents.length === 0) return 'Not Uploaded';
    if (documents.every(d => d.status === 'Verified')) return 'Final Verification Completed';
    if (documents.some(d => d.status === 'Rejected')) return 'Rejected';
    if (documents.some(d => d.status === 'Pending')) return 'Pending';
    if (documents.some(d => d.status === 'Approved')) return 'Approved';
    return 'Pending';
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #dbeafe 100%)',
      pb: 4
    }}>
      {/* AppBar */}
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
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            borderRadius: '12px',
            p: 1,
            mr: 2,
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
          }}>
            <AdminPanelSettingsIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', letterSpacing: '-0.025em' }}>
              Admin Control Center
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
              Manage Your Workforce
            </Typography>
          </Box>
          <Chip 
            label={user?.role?.toUpperCase() || 'ADMIN'} 
            sx={{ 
              mr: 2, 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              letterSpacing: '1px',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
            }} 
          />
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="outlined"
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#d1d5db',
              borderWidth: '2px',
              color: '#374151',
              px: 3,
              py: 1,
              borderRadius: '10px',
              '&:hover': {
                borderWidth: '2px',
                borderColor: '#9ca3af',
                bgcolor: '#f9fafb'
              }
            }}
          >
            Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ 
            fontWeight: 900, 
            color: '#111827',
            letterSpacing: '-0.5px',
            mb: 1
          }}>
            Employee Management
          </Typography>
          <Typography variant="h6" sx={{ color: '#6b7280', fontWeight: 600 }}>
            Streamline your workforce operations
          </Typography>
          
          <Alert 
            severity="info" 
            icon={<InfoOutlinedIcon />} 
            sx={{ 
              mt: 3,
              borderRadius: '16px',
              border: '2px solid #bfdbfe',
              bgcolor: '#eff6ff',
              fontWeight: 600
            }}
          >
            Send OTP credentials, verify documents, and manage permissions. Superadmin required for admin deletions.
          </Alert>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ 
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 30px rgba(102, 126, 234, 0.3)' }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: '12px', 
                    p: 1.5
                  }}>
                    <PeopleIcon sx={{ fontSize: 40 }} />
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Total Employees
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ 
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 30px rgba(17, 153, 142, 0.3)' }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: '12px', 
                    p: 1.5
                  }}>
                    <VerifiedUserIcon sx={{ fontSize: 40 }} />
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {stats.verified}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Verified Documents
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ 
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 30px rgba(240, 147, 251, 0.3)' }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: '12px', 
                    p: 1.5
                  }}>
                    <HourglassEmptyIcon sx={{ fontSize: 40 }} />
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {stats.pending}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Pending / Not Uploaded
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ 
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 30px rgba(250, 112, 154, 0.3)' }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: '12px', 
                    p: 1.5
                  }}>
                    <SupervisorAccountIcon sx={{ fontSize: 40 }} />
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {stats.admins + stats.superAdmins}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Admins ({stats.admins}) + Super ({stats.superAdmins})
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search Bar */}
        <Paper 
          elevation={0}
          sx={{ 
            mb: 4, 
            p: 3, 
            borderRadius: '20px',
            border: '2px solid #e5e7eb',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth
                label="Search Employees"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ 
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#8b5cf6', fontSize: 24 }} />
                    </InputAdornment>
                  ) 
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: '14px',
                    bgcolor: '#f9fafb',
                    fontWeight: 600,
                    '& fieldset': { borderColor: '#e5e7eb', borderWidth: '2px' },
                    '&:hover fieldset': { borderColor: '#8b5cf6', borderWidth: '2px' },
                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6', borderWidth: '2px' }
                  },
                  '& .MuiInputLabel-root': { fontWeight: 600, color: '#6b7280' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
              <Button 
                variant="contained" 
                startIcon={<PersonAddIcon />}
                onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                sx={{ 
                  borderRadius: '14px', 
                  px: 4, 
                  py: 1.5,
                  mr: 2,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  boxShadow: '0 6px 20px rgba(139, 92, 246, 0.3)',
                  textTransform: 'none',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(139, 92, 246, 0.5)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Add Employee
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<FileDownloadIcon />}
                onClick={handleExport}
                sx={{ 
                  borderRadius: '14px', 
                  px: 4, 
                  py: 1.5,
                  fontWeight: 700,
                  borderWidth: '2px',
                  borderColor: '#8b5cf6',
                  color: '#8b5cf6',
                  textTransform: 'none',
                  '&:hover': {
                    borderWidth: '2px',
                    bgcolor: 'rgba(139, 92, 246, 0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Export
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Table */}
        <TableContainer 
          component={Paper} 
          elevation={0}
          sx={{ 
            borderRadius: '20px',
            border: '2px solid #e5e7eb',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                {['Employee ID', 'Name', 'Email', 'DOB', 'Phone', 'Role', 'Document Status', 'Actions'].map((head) => (
                  <TableCell 
                    key={head} 
                    sx={{ 
                      fontWeight: 700, 
                      color: 'white', 
                      fontSize: '0.9rem', 
                      py: 2.5,
                      letterSpacing: '0.5px'
                    }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <PeopleIcon sx={{ fontSize: 64, mb: 2, color: '#8b5cf6' }} />
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                      No employees found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((emp) => (
                  <TableRow 
                    key={emp._id || emp.id} 
                    sx={{ 
                      '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.05)' }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700, color: '#8b5cf6' }}>{emp.employeeId || emp.id}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{emp.name}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{emp.email}</TableCell>
                    <TableCell>{emp.dob ? emp.dob.substring(0, 10) : 'N/A'}</TableCell>
                    <TableCell>{emp.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={emp.role?.toUpperCase() || 'N/A'}
                        size="small"
                        sx={{ 
                          fontWeight: 700, 
                          color: 'white',
                          background: emp.role === 'superadmin' ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                                   : emp.role === 'admin' ? 'linear-gradient(135deg, #c948b8ff 0%, #94135eff 100%)'
                                   : emp.role === 'employee' ? 'linear-gradient(135deg, #197b2dff 0%, #226daeff 100%)'
                                   : 'linear-gradient(135deg, #9755b1ff 0%, #241193ff 100%)' 
                        }}
                      />  
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getDisplayStatus(emp.documents)}
                        size="small"
                        sx={{ 
                          fontWeight: 700, 
                          color: 'white',
                          background: getDisplayStatus(emp.documents) === 'Final Verification Completed' ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' :
                                    getDisplayStatus(emp.documents) === 'Not Uploaded' ? 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)' :
                                    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Send OTP">
                          <IconButton 
                            size="small" 
                            onClick={() => handleSendOTP(emp.email, emp.name)} 
                            sx={{ 
                              border: '2px solid #4facfe',
                              color: '#4facfe',
                              borderRadius: '8px',
                              '&:hover': { bgcolor: 'rgba(79, 172, 254, 0.1)' }
                            }}
                          >
                            <EmailSendIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={() => { setEditingUser(emp); setIsModalOpen(true); }} 
                            sx={{ 
                              border: '2px solid #8b5cf6',
                              color: '#8b5cf6',
                              borderRadius: '8px',
                              '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.1)' }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteUser(emp._id || emp.id, emp.name, emp.role)} 
                            disabled={!hasSuperAdminRights && emp.role !== 'employee'} 
                            sx={{ 
                              border: '2px solid #f5576c',
                              color: '#f5576c',
                              borderRadius: '8px',
                              '&:hover': { bgcolor: 'rgba(245, 87, 108, 0.1)' },
                              '&:disabled': { opacity: 0.3 }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Button 
                          size="small" 
                          variant="contained" 
                          onClick={() => navigate(`/admin/verify/${emp.employeeId}`)} 
                          sx={{ 
                            borderRadius: '8px', 
                            fontWeight: 700,
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                            px: 2
                          }}
                        >
                          Verify
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      <UserFormModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={editingUser} 
        onSaveSuccess={fetchEmployees} 
      />
    </Box>
  );
};

export default AdminPage;