// src/pages/AdminPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Container, Button, AppBar, Toolbar, 
  Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TextField, InputAdornment, Grid, 
  Chip, Alert, Card, CardContent,
  Tooltip, IconButton, CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import UserFormModal from '../components/UserFormModal';
import { useAuth } from '../context/AuthContext';

// --- PEGORION BRANDING COLORS ---
const PRIMARY_COLOR = '#5A45FF'; // Pegorion Primary Blue-Purple
const SECONDARY_COLOR = '#8B5CF6'; // Pegorion Lighter Purple Accent
const TEXT_COLOR = '#1F2937';
const LIGHT_BACKGROUND = '#F9FAFB';

// Role Color Mapping for Chips (using brand colors and standard alerts)
const getRoleChipStyle = (role) => {
  switch (role) {
    case 'superadmin': return { background: PRIMARY_COLOR, color: 'white' };
    case 'admin': return { background: SECONDARY_COLOR, color: 'white' };
    case 'hr': return { background: '#F59E0B', color: 'white' }; // Amber for HR
    default: return { background: '#6B7280', color: 'white' }; // Gray for Employee
  }
};

// Document Status Color Mapping
const getStatusChipStyle = (status) => {
    switch (status) {
        case 'Final Verification Completed': return { background: '#10B981', color: 'white' }; // Green
        case 'Not Uploaded': return { background: '#6B7280', color: 'white' }; // Gray
        case 'Rejected': return { background: '#EF4444', color: 'white' }; // Red
        case 'Pending': 
        case 'Approved':
        default: return { background: '#F59E0B', color: 'white' }; // Amber/Yellow
    }
};

const AdminPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // --- NEW STATE FOR PENDING UPDATES ---
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [isPendingLoading, setIsPendingLoading] = useState(true);
  // ----------------------------------------

  const hasSuperAdminRights = user?.role === 'superadmin';
  const token = localStorage.getItem('authToken');

  // --- STATISTICS LOGIC ---
  const getStatistics = useCallback(() => {
    const total = employees.length;
    
    // Count verified: all documents verified
    const verified = employees.filter(emp => 
      emp.documents?.length > 0 && 
      emp.documents.every(d => d.status === 'Verified')
    ).length;
    
    // Count pending: no documents OR has documents but not all verified
    const pendingDocs = employees.filter(emp => 
      !emp.documents || 
      emp.documents.length === 0 || 
      emp.documents.some(d => d.status !== 'Verified')
    ).length;
    
    const admins = employees.filter(emp => 
      emp.role === 'admin' || emp.role === 'hr'
    ).length;
    
    const superAdmins = employees.filter(emp => 
      emp.role === 'superadmin' || emp.role === 'superAdmin'
    ).length;
    
    return { total, verified, pendingDocs, admins, superAdmins };
  }, [employees]);
  
  const stats = getStatistics();


  // --- Send OTP ---
  const handleSendOTP = async (employeeEmail, employeeName) => {
    if (!window.confirm(`Send OTP to ${employeeName} (${employeeEmail})?`)) return;
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
  }, [showNotification, token]);

  // --- NEW: Fetch Pending Updates ---
  const fetchPendingUpdates = useCallback(async () => {
    setIsPendingLoading(true);
    try {
      if (!token) throw new Error("Auth failed.");
      const res = await axios.get('http://localhost:8080/api/hr/pending-updates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // ✅ --- THIS IS THE FIX ---
      // Backend sends { items: [...] }, not { pending: [...] }
      setPendingUpdates(res.data.items || []);
      // -------------------------

    } catch (err) {
      console.error('Failed to load pending updates:', err);
      showNotification('Failed to load pending updates.', 'error');
    } finally {
      setIsPendingLoading(false);
    }
  }, [showNotification, token]);
  // ----------------------------------

  useEffect(() => {
    fetchEmployees();
    fetchPendingUpdates(); // <-- Fetch both on load
  }, [fetchEmployees, fetchPendingUpdates]);

  // --- Delete User ---
  const handleDeleteUser = async (userId, userName, userRole) => {
    if (userRole === 'superadmin' && !hasSuperAdminRights) {
      return showNotification("Only Superadmin can delete other Superadmins.", 'error');
    }
    if (!window.confirm(`Delete ${userName}? This cannot be undone.`)) return;
    try {
      await axios.delete(`http://localhost:8080/api/superAdmin/employees/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification(`${userName} deleted successfully.`, 'success');
      fetchEmployees();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to delete user.', 'error');
    }
  };

  // --- NEW: Handle Approve/Reject Update ---
  const handleUpdateAction = async (userId, actionType) => {
    try {
      await axios.patch(
        `http://localhost:8080/api/hr/pending-updates/${userId}`,
        {
          action: actionType, // "approve" or "reject"
          remarks: remarks[userId] || '',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showNotification(`Profile ${actionType}ed successfully!`, 'success');
      fetchPendingUpdates(); // refresh pending list
      fetchEmployees(); // refresh main employee list (in case data changed)
      
      // Clear the remark for the processed user
      setRemarks(prev => {
        const newRemarks = { ...prev };
        delete newRemarks[userId];
        return newRemarks;
      });
    } catch (err) {
      console.error('Error approving/rejecting:', err);
      showNotification('Failed to update profile status.', 'error');
    }
  };
  // ----------------------------------------

  // --- EXPORT LOGIC ---
  const [isExporting, setIsExporting] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const isExportMenuOpen = Boolean(exportAnchorEl);

  const handleExportMenuOpen = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };

  const handleExport = async (format) => {
    handleExportMenuClose();
    setIsExporting(true);
    showNotification(`Generating ${format.toUpperCase()} export...`, 'info');

    if (!token) {
      showNotification("Authentication token not found.", 'error');
      setIsExporting(false);
      return;
    }
    const filename = `employees.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    const url = `http://localhost:8080/api/superAdmin/export/${format}`;

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      showNotification('Export successful!', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Failed to generate export.', 'error');
    } finally {
      setIsExporting(false);
    }
  };
  // --- END EXPORT LOGIC ---


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
      background: LIGHT_BACKGROUND,
      pb: 4
    }}>
      {/* AppBar */}
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
            background: PRIMARY_COLOR,
            borderRadius: '8px',
            p: 0.8,
            mr: 2,
            boxShadow: '0 4px 15px rgba(90, 69, 255, 0.3)'
          }}>
            <AdminPanelSettingsIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_COLOR }}>
              Admin Control Center
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
              Pegorion Workforce Management
            </Typography>
          </Box>
          <Chip 
            label={user?.role?.toUpperCase() || 'ADMIN'} 
            sx={{ 
              mr: 2, 
              fontWeight: 700,
              ...getRoleChipStyle(user?.role),
            }} 
          />
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="outlined"
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#D1D5DB',
              color: TEXT_COLOR,
              px: 3,
              py: 1,
              borderRadius: '8px',
              '&:hover': {
                borderColor: PRIMARY_COLOR,
                bgcolor: 'rgba(90, 69, 255, 0.05)'
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
            fontWeight: 800, 
            color: TEXT_COLOR,
            mb: 1
          }}>
            Employee Management
          </Typography>
          <Typography variant="h6" sx={{ color: '#6b7280', fontWeight: 400 }}>
            Streamline your workforce operations
          </Typography>
          
          <Alert 
            severity="info" 
            icon={<InfoOutlinedIcon />} 
            sx={{ 
              mt: 3,
              borderRadius: '12px',
              border: '1px solid #BFDBFE',
              bgcolor: '#EFF6FF',
              fontWeight: 500,
              color: '#1E40AF'
            }}
          >
            Send OTP credentials, verify documents, and manage permissions. **Superadmin** status is required to delete other administrators.
          </Alert>
        </Box>

        {/* --- UPDATED Statistics Cards --- */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { title: 'Total Employees', value: stats.total, icon: PeopleIcon, color: PRIMARY_COLOR },
            { title: 'Verified Documents', value: stats.verified, icon: VerifiedUserIcon, color: '#10B981' }, // Green
            { title: 'Pending Documents', value: stats.pendingDocs, icon: HourglassEmptyIcon, color: '#F59E0B' }, // Amber
            // --- NEW STAT CARD ---
            { title: 'Pending Profile Updates', value: pendingUpdates.length, icon: HistoryToggleOffIcon, color: '#F59E0B' }, // Amber
            { title: 'Admin & HR Roles', value: stats.admins + stats.superAdmins, icon: SupervisorAccountIcon, color: SECONDARY_COLOR }
          ].filter(item => item.value !== undefined) // Filter out any potential undefined values
           .map((item, index) => (
              <Grid item xs={12} sm={6} md={true} key={index} sx={{ flexGrow: 1 }}>
                <Card elevation={4} sx={{ 
                  borderRadius: '12px',
                  bgcolor: 'white',
                  borderLeft: `5px solid ${item.color}`,
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 20px rgba(0,0,0,0.08)' }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#6B7280' }}>
                        {item.title}
                      </Typography>
                      <item.icon sx={{ fontSize: 28, color: item.color }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: TEXT_COLOR }}>
                      {item.value}
                    </Typography>
                    {item.title === 'Admin & HR Roles' && (
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            ({stats.admins} Admin/HR + {stats.superAdmins} Super)
                        </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
          ))}
        </Grid>
        
        {/* --- NEW: PENDING UPDATES TABLE SECTION --- */}
        {(isPendingLoading || pendingUpdates.length > 0) && (
          <Paper
            elevation={1}
            sx={{
              mb: 4,
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              overflow: 'hidden' // To contain the table
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_COLOR, mb: 2 }}>
                📝 Pending Profile Update Requests
              </Typography>
              {isPendingLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress sx={{ color: PRIMARY_COLOR }} />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(90, 69, 255, 0.05)' }}>
                        <TableCell sx={{ fontWeight: 700, color: TEXT_COLOR }}>Employee Name</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: TEXT_COLOR }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: TEXT_COLOR }}>Requested Fields</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: TEXT_COLOR }}>Remarks</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: TEXT_COLOR }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingUpdates.map((item) => (
                        <TableRow key={item._id} sx={{ '&:hover': { bgcolor: LIGHT_BACKGROUND }}}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.email}</TableCell>
                          <TableCell>
                            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.875rem', fontFamily: 'monospace' }}>
                              {JSON.stringify(item.pendingUpdates?.data, null, 2)}
                            </pre>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              placeholder="Remarks"
                              variant="outlined"
                              value={remarks[item._id] || ''}
                              onChange={(e) =>
                                setRemarks({ ...remarks, [item._id]: e.target.value }) // <-- 🚨 FIX WAS HERE
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={() => handleUpdateAction(item._id, 'approve')}
                                >
                                Approve
                                </Button>
                                <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={() => handleUpdateAction(item._id, 'reject')}
                                >
                                Reject
                                </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>
        )}
        {/* ------------------------------------------- */}


        {/* Search Bar & Actions */}
        <Paper 
          elevation={1}
          sx={{ 
            mb: 4, 
            p: 3, 
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
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
                      <SearchIcon sx={{ color: PRIMARY_COLOR, fontSize: 24 }} />
                    </InputAdornment>
                  ) 
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: '8px',
                    bgcolor: 'white',
                    '& fieldset': { borderColor: '#e5e7eb' },
                    '&:hover fieldset': { borderColor: SECONDARY_COLOR },
                    '&.Mui-focused fieldset': { borderColor: PRIMARY_COLOR, borderWidth: '2px' }
                  },
                  '& .MuiInputLabel-root': { fontWeight: 600, color: '#6b7280' },
                  '& .MuiInputLabel-root.Mui-focused': { color: PRIMARY_COLOR }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
              <Button 
                variant="contained" 
                startIcon={<PersonAddIcon />}
                onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                sx={{ 
                  borderRadius: '8px', 
                  px: 3, 
                  py: 1,
                  mr: 2,
                  fontWeight: 700,
                  bgcolor: PRIMARY_COLOR,
                  textTransform: 'none',
                  boxShadow: '0 4px 15px rgba(90, 69, 255, 0.3)',
                  '&:hover': {
                    bgcolor: SECONDARY_COLOR,
                  }
                }}
              >
                Add Employee
              </Button>
              
              <Button 
                variant="outlined" 
                startIcon={<FileDownloadIcon />}
                onClick={handleExportMenuOpen}
                disabled={isExporting}
                sx={{ 
                  borderRadius: '8px', 
                  px: 3, 
                  py: 1,
                  fontWeight: 700,
                  borderColor: PRIMARY_COLOR,
                  color: PRIMARY_COLOR,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: PRIMARY_COLOR,
                    bgcolor: 'rgba(90, 69, 255, 0.05)',
                  }
                }}
              >
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>

              <Menu
                anchorEl={exportAnchorEl}
                open={isExportMenuOpen}
                onClose={handleExportMenuClose}
                MenuListProps={{
                  'aria-labelledby': 'export-button',
                }}
              >
                <MenuItem onClick={() => handleExport('excel')}>
                  <ListItemIcon>
                    <DescriptionIcon fontSize="small" sx={{ color: '#10B981' }} />
                  </ListItemIcon>
                  <ListItemText primary="Export as Excel (.xlsx)" />
                </MenuItem>
                <MenuItem onClick={() => handleExport('pdf')}>
                  <ListItemIcon>
                    <PictureAsPdfIcon fontSize="small" sx={{ color: '#EF4444' }} />
                  </ListItemIcon>
                  <ListItemText primary="Export as PDF (.pdf)" />
                </MenuItem>
              </Menu>

            </Grid>
          </Grid>
        </Paper>

        {/* --- Main Employee Table --- */}
        <TableContainer 
          component={Paper} 
          elevation={1}
          sx={{ 
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: PRIMARY_COLOR }}>
                {['ID', 'Name', 'Email', 'DOB', 'Role', 'Document Status', 'Actions'].map((head) => (
                  <TableCell 
                    key={head} 
                    sx={{ 
                      fontWeight: 700, 
                      color: 'white', 
                      fontSize: '0.85rem', 
                      py: 1.5,
                    }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={30} sx={{ py: 2, color: PRIMARY_COLOR }} /></TableCell></TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <PeopleIcon sx={{ fontSize: 48, mb: 2, color: PRIMARY_COLOR }} />
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
                      '&:nth-of-type(odd)': { bgcolor: LIGHT_BACKGROUND },
                      '&:hover': { bgcolor: 'rgba(90, 69, 255, 0.03)' }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: PRIMARY_COLOR }}>{emp.employeeId || emp.id}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{emp.name}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{emp.email}</TableCell>
                    <TableCell>{emp.dob ? emp.dob.substring(0, 10) : 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={emp.role?.toUpperCase() || 'N/A'}
                        size="small"
                        sx={{ fontWeight: 700, ...getRoleChipStyle(emp.role) }}
                      />  
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getDisplayStatus(emp.documents)}
                        size="small"
                        sx={{ fontWeight: 700, ...getStatusChipStyle(getDisplayStatus(emp.documents)) }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Verify Documents">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/admin/verify/${emp.employeeId}`)} 
                            sx={{ color: PRIMARY_COLOR }}
                          >
                            <VerifiedUserIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Send OTP">
                          <IconButton 
                            size="small" 
                            onClick={() => handleSendOTP(emp.email, emp.name)} 
                            sx={{ color: SECONDARY_COLOR }}
                          >
                            <EmailSendIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit User">
                          <IconButton 
                            size="small" 
                            onClick={() => { setEditingUser(emp); setIsModalOpen(true); }} 
                            sx={{ color: '#F59E0B' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteUser(emp._id || emp.id, emp.name, emp.role)} 
                            disabled={!hasSuperAdminRights && emp.role !== 'employee'} 
                            sx={{ 
                              color: '#EF4444', 
                              '&:disabled': { opacity: 0.3 }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
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