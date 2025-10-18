// src/pages/AdminPage.js
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
import EmailSendIcon from '@mui/icons-material/Send';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
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
  
  // States for Modal Management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Helper to check if the current user has super delete privileges
  const hasSuperAdminRights = user?.role === 'superadmin';

  // --- Statistics Calculation ---
  const getStatistics = () => {
    const total = employees.length;
    const approved = employees.filter(emp => emp.status === 'Approved').length;
    const pending = employees.filter(emp => emp.status === 'Pending').length;
    const admins = employees.filter(emp => ['admin', 'superadmin', 'hr'].includes(emp.role)).length;
    
    return { total, approved, pending, admins };
  };

  const stats = getStatistics();

  // --- SEND OTP LOGIC ---
  const handleSendOTP = async (employeeEmail, employeeName) => {
      if (!window.confirm(`Are you sure you want to send an OTP to ${employeeName} (${employeeEmail})?`)) return;
      
      const token = localStorage.getItem('authToken');
      
      try {
          await axios.post('http://localhost:8080/api/hr/send-otp', 
              { employeeEmail }, 
              { headers: { Authorization: `Bearer ${token}` } }
          );

          showNotification(`OTP successfully sent to ${employeeName}.`, 'success');
      } catch (error) {
          console.error('OTP send failed:', error.response);
          
          let message = 'Failed to send OTP due to server error.';
          if (error.response) {
              const status = error.response.status;
              message = error.response.data?.message || message;
              
              if (status === 404) {
                  message = `Employee with email ${employeeEmail} not found.`;
              } else if (status === 403) {
                  message = "Access Denied: You do not have HR/Admin privileges.";
              }
          }
          
          showNotification(message, 'error');
      }
  };

  // --- FETCH EMPLOYEE LIST ---
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("Authentication failed.");

      const response = await axios.get('http://localhost:8080/api/admin/employees', { 
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEmployees(response.data.data || []); 
    } catch (error) {
      console.error('Error fetching employee list:', error);
      
      const errorMessage = error.response?.status === 403 
        ? 'Access Denied: You must be an Admin/HR.' 
        : 'Could not fetch employee list. The backend API may be missing.';
      
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]); 

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // --- DELETE LOGIC ---
  const handleDeleteUser = async (userId, userName, userRole) => {
    if (userRole === 'superadmin' && !hasSuperAdminRights) {
        return showNotification("Unauthorized: Only a Superadmin can delete other Superadmins.", 'error');
    }
    
    if (!window.confirm(`Are you sure you want to delete user ${userName} (${userId})? This action cannot be undone.`)) return;

    const token = localStorage.getItem('authToken');
    try {
      await axios.delete(`http://localhost:8080/api/admin/employees/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      showNotification(`User ${userName} deleted successfully.`, 'success');
      fetchEmployees();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to delete user.', 'error');
    }
  };

  // --- SEARCH FILTER ---
  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tableHeadings = [
    { label: 'Employee ID', align: 'left' },
    { label: 'Name', align: 'left' },
    { label: 'Email Address', align: 'left' },
    { label: 'Role', align: 'center' },
    { label: 'Document Status', align: 'center' },
    { label: 'Actions', align: 'right' },
  ];

  if (isLoading) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f5f7fa' }}>
              <CircularProgress size={60} thickness={4} />
          </Box>
      );
  }

  const employeesToDisplay = filteredEmployees.length > 0 ? filteredEmployees : (
    employees.length === 0 ? [
      { id: 'EMP001', name: 'John Doe', email: 'john@example.com', role: 'employee', status: 'Approved', employeeId: 'EMP001', _id: 'mock1' },
      { id: 'EMP002', name: 'Jane Smith', email: 'jane@example.com', role: 'hr', status: 'Pending', employeeId: 'EMP002', _id: 'mock2' },
    ] : []
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#1e293b' }}>
        <Toolbar>
          <AdminPanelSettingsIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Admin Control Panel
          </Typography>
          <Chip 
            label={user?.role?.toUpperCase() || 'ADMIN'} 
            color="secondary" 
            size="small" 
            sx={{ mr: 2, fontWeight: 600 }} 
          />
          <Button 
            color="inherit" 
            onClick={() => navigate('/dashboard')}
            sx={{ 
              borderRadius: 2,
              px: 3,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Dashboard
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#1e293b' }}>
            Employee Management System
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Manage your organization's workforce efficiently. Add, edit, verify documents, and send OTP credentials to employees.
          </Typography>
          
          {/* Info Alert */}
          <Alert 
            severity="info" 
            icon={<InfoOutlinedIcon />}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            <Typography variant="body2">
              <strong>Quick Guide:</strong> Use the "Send OTP" button to email one-time passwords to employees. 
              Click "Verify Docs" to review and approve employee documentation. Only superadmins can delete admin-level users.
            </Typography>
          </Alert>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ borderRadius: 3, bgcolor: '#3b82f6', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Employees
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ borderRadius: 3, bgcolor: '#10b981', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.approved}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Approved Documents
                    </Typography>
                  </Box>
                  <VerifiedUserIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ borderRadius: 3, bgcolor: '#f59e0b', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.pending}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Pending Reviews
                    </Typography>
                  </Box>
                  <Badge badgeContent={stats.pending} color="error">
                    <InfoOutlinedIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                  </Badge>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ borderRadius: 3, bgcolor: '#8b5cf6', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.admins}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Admin Users
                    </Typography>
                  </Box>
                  <AdminPanelSettingsIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Action Bar */}
        <Paper elevation={3} sx={{ mb: 3, p: 3, borderRadius: 3 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5}>
                    <TextField 
                        fullWidth
                        label="Search Employees"
                        placeholder="Search by name, email, or ID..."
                        variant="outlined"
                        size="medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            borderRadius: 2 
                          } 
                        }}
                    />
                </Grid>
                <Grid item xs={12} md={7} sx={{ textAlign: { md: 'right' } }}>
                    <Tooltip title="Add a new employee to the system">
                      <Button 
                          variant="contained" 
                          color="primary" 
                          size="large"
                          startIcon={<PersonAddIcon />}
                          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                          sx={{ 
                            borderRadius: 2, 
                            px: 3,
                            fontWeight: 600,
                            boxShadow: 3
                          }}
                      >
                          Add New Employee
                      </Button>
                    </Tooltip>
                    <Tooltip title="Export employee data to Excel">
                      <Button 
                          variant="outlined" 
                          color="secondary" 
                          size="large"
                          startIcon={<FileDownloadIcon />}
                          sx={{ ml: 2, borderRadius: 2, px: 3, fontWeight: 600 }}
                      >
                          Export Data
                      </Button>
                    </Tooltip>
                </Grid>
            </Grid>
        </Paper>

        {/* Results Info */}
        {searchTerm && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Found {employeesToDisplay.length} employee(s) matching "{searchTerm}"
          </Typography>
        )}

        {/* Employee Table */}
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table sx={{ minWidth: 650 }} aria-label="employee management table">
            <TableHead>
              <TableRow sx={{ bgcolor: '#1e293b' }}>
                {tableHeadings.map((head) => (
                    <TableCell 
                      key={head.label} 
                      align={head.align} 
                      sx={{ 
                        fontWeight: 700, 
                        color: 'white',
                        fontSize: '0.95rem',
                        py: 2
                      }}
                    >
                        {head.label}
                    </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {employeesToDisplay.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography variant="h6" color="text.secondary">
                      No employees found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm ? 'Try adjusting your search criteria' : 'Add your first employee to get started'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                employeesToDisplay.map((employee) => (
                  <TableRow 
                    key={employee._id || employee.employeeId || employee.id} 
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      '&:hover': { bgcolor: '#f8fafc' },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                      {employee.employeeId || employee.id}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{employee.name}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{employee.email}</TableCell>
                    <TableCell align="center">
                      <Chip 
                          label={employee.role?.toUpperCase() || 'N/A'}
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            color: 'white',
                            bgcolor: employee.role === 'superadmin' ? '#5b21b6' : 
                                    employee.role === 'admin' ? '#9c27b0' : 
                                    employee.role === 'hr' ? '#f59e0b' : '#3b82f6'
                          }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={employee.status || 'N/A'}
                        size="small"
                        icon={employee.status === 'Approved' ? <VerifiedUserIcon sx={{ fontSize: 16 }} /> : undefined}
                        sx={{ 
                            fontWeight: 600,
                            color: 'white',
                            bgcolor: employee.status === 'Approved' ? '#10b981' : 
                                      employee.status === 'Pending' ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Tooltip title="Send OTP via email">
                          <span>
                            <IconButton 
                                size="small" 
                                color="info"
                                onClick={() => handleSendOTP(employee.email, employee.name)}
                                disabled={!employee.email}
                                sx={{ 
                                  border: '1px solid',
                                  borderColor: 'info.main',
                                  '&:hover': { bgcolor: 'info.light' }
                                }}
                            >
                                <EmailSendIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        
                        <Tooltip title="Edit employee details">
                          <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => { setEditingUser(employee); setIsModalOpen(true); }}
                              sx={{ 
                                border: '1px solid',
                                borderColor: 'primary.main',
                                '&:hover': { bgcolor: 'primary.light' }
                              }}
                          >
                              <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={!hasSuperAdminRights && employee.role !== 'employee' ? 'Insufficient permissions' : 'Delete employee'}>
                          <span>
                            <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteUser(employee._id || employee.id, employee.name, employee.role)}
                                disabled={!hasSuperAdminRights && employee.role !== 'employee'}
                                sx={{ 
                                  border: '1px solid',
                                  borderColor: 'error.main',
                                  '&:hover': { bgcolor: 'error.light' }
                                }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        
                        <Tooltip title="Verify employee documents">
                          <Button 
                              size="small" 
                              variant="contained" 
                              color="secondary"
                              onClick={() => navigate(`/admin/verify/${employee.employeeId}`)}
                              sx={{ borderRadius: 2, fontWeight: 600 }}
                          >
                              Verify
                          </Button>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer Info */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'white', borderRadius: 3, boxShadow: 1 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary" align="center">
            <strong>System Information:</strong> This panel allows authorized administrators to manage employee records, 
            verify documentation, and control access permissions. All actions are logged for security purposes.
          </Typography>
        </Box>
      </Container>
      
      {/* User Form Modal */}
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