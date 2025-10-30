// src/pages/SuperAdminPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Container, Button, AppBar, Toolbar, 
  Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TextField, InputAdornment, Grid, 
  CircularProgress, Chip, Alert, Card, CardContent, Divider,
  Tooltip, IconButton, Badge,
  Menu, // <-- NEW IMPORT
  MenuItem, // <-- NEW IMPORT
  ListItemIcon, // <-- NEW IMPORT
  ListItemText // <-- NEW IMPORT
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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'; // <-- NEW IMPORT
import DescriptionIcon from '@mui/icons-material/Description'; // <-- NEW IMPORT
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import UserFormModal from '../components/UserFormModal';
import { useAuth } from '../context/AuthContext'; // CORRECTED PATH
import FinalVerificationQueue from '../components/FinalVerificationQueue';

// --- PEGORION BRANDING COLORS (FLAT, CRISP) ---
const PRIMARY_COLOR = '#5A45FF';      // Pegorion Primary Blue-Purple
const SECONDARY_COLOR = '#8B5CF6';    // Pegorion Lighter Purple Accent
const TEXT_COLOR_DARK = '#1F2937';    // Dark text
const LIGHT_BACKGROUND = '#F9FAFB';   // Very light gray background
const WHITE = '#FFFFFF';

// Helper function for Role Chip Styles (Flat colors)
const getRoleChipStyle = (role) => {
    switch (role) {
        case 'superAdmin': return { background: PRIMARY_COLOR, color: WHITE };
        case 'admin': return { background: SECONDARY_COLOR, color: WHITE };
        case 'hr': return { background: '#F59E0B', color: WHITE }; // Amber
        default: return { background: '#6B7280', color: WHITE }; // Gray
    }
};

// Helper function for Document Status Chip Styles (Flat colors)
const getStatusChipStyle = (status) => {
    switch (status) {
        case 'Verified': return { background: '#10B981', color: WHITE }; // Green for Success
        case 'Rejected': return { background: '#EF4444', color: WHITE }; // Red for Error
        case 'Pending for Final Verification': 
        case 'Pending': return { background: '#F59E0B', color: WHITE }; // Amber for Warning/Awaiting
        default: return { background: '#9CA3AF', color: WHITE }; // Light Gray for Not Uploaded
    }
};

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
            ['admin', 'superAdmin', 'hr'].includes(emp.role)
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

    // --- NEW EXPORT LOGIC ---
    const [isExporting, setIsExporting] = useState(false);
    const [exportAnchorEl, setExportAnchorEl] = useState(null);
    const isExportMenuOpen = Boolean(exportAnchorEl);

    const handleExportMenuOpen = (event) => {
      setExportAnchorEl(event.currentTarget);
    };

    const handleExportMenuClose = () => {
      setExportAnchorEl(null);
    };

    /**
     * Handles the file download from the API
     * @param {'excel' | 'pdf'} format The file format to export.
     */
    const handleExport = async (format) => {
      handleExportMenuClose();
      setIsExporting(true);
      showNotification(`Generating ${format.toUpperCase()} export...`, 'info');

      const token = localStorage.getItem('authToken');
      if (!token) {
        showNotification("Authentication token not found.", 'error');
        setIsExporting(false);
        return;
      }

      const filename = `employees.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      // Use the /api/superAdmin/ export route as it authorizes admin/hr roles
      const url = `http://localhost:8080/api/superAdmin/export/${format}`;

      try {
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob', // This is critical for file downloads
        });

        // Create a temporary link to trigger the browser download
        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        // Clean up the temporary link
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
          sx={{ background: LIGHT_BACKGROUND }}
        >
          <Box textAlign="center">
            <CircularProgress size={60} thickness={4} sx={{ color: PRIMARY_COLOR }} />
            <Typography variant="h6" sx={{ mt: 2, color: TEXT_COLOR_DARK, fontWeight: 600 }}>
              Loading Super Admin Console...
            </Typography>
          </Box>
        </Box>
      );
    }

    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: WHITE, // Clean White background
      }}>
        {/* AppBar - Clean White with Primary Text/Icon */}
        <AppBar 
          position="static" 
          elevation={0} 
          sx={{ 
            background: WHITE,
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <Toolbar sx={{ py: 1.5 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mr: 2,
            }}>
              <SecurityIcon sx={{ fontSize: 32, color: PRIMARY_COLOR }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, // Reduced font weight for cleaner look
                color: TEXT_COLOR_DARK,
              }}>
                SUPER ADMIN CONSOLE
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#6B7280',
                fontWeight: 500,
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                Executive Authority
              </Typography>
            </Box>
            {/* HR/Admin Panel Button (Outlined/Clean) */}
            <Button 
              onClick={() => navigate('/admin')}
              variant="outlined"
              sx={{
                color: PRIMARY_COLOR,
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: '8px',
                borderColor: PRIMARY_COLOR,
                mr: 1,
                '&:hover': {
                  bgcolor: `${PRIMARY_COLOR}1A`,
                }
              }}
            >
              Admin Panel
            </Button>
            {/* Dashboard Button (Contained/Brand Primary) */}
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="contained"
              sx={{
                background: PRIMARY_COLOR,
                color: WHITE,
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: '8px',
                boxShadow: 'none', // Remove heavy shadow
                '&:hover': {
                  background: SECONDARY_COLOR,
                  boxShadow: 'none', 
                }
              }}
            >
              Dashboard
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 5, mb: 6 }}>
          
          {/* Header Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" sx={{ 
              fontWeight: 800, 
              color: TEXT_COLOR_DARK,
              mb: 0.5,
              fontSize: '2.5rem'
            }}>
              Executive Management Console
            </Typography>
            <Typography variant="h6" sx={{ 
              color: '#6B7280',
              fontWeight: 400,
            }}>
              System Control Dashboard
            </Typography>
            
            <Alert 
              severity="info" 
              icon={<SecurityIcon />}
              sx={{ 
                mt: 3, 
                borderRadius: '8px',
                background: LIGHT_BACKGROUND, // Use clean light background
                border: `1px solid ${PRIMARY_COLOR}33`,
                boxShadow: 'none',
                '& .MuiAlert-icon': {
                  color: PRIMARY_COLOR
                },
                '& .MuiAlert-message': {
                  color: TEXT_COLOR_DARK
                }
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                <strong>⚡ Super Admin Access:</strong> You have unrestricted CRUD operations and final document verification authority. Documents approved by HR require your final verification.
              </Typography>
            </Alert>
          </Box>

          {/* Statistics Cards - Flat Design */}
          <Grid container spacing={3} sx={{ mb: 5 }}>
            {[
              { value: stats.total, label: 'Total System Users', icon: PeopleIcon, color: PRIMARY_COLOR, trend: '+12%' },
              { value: stats.approved, label: 'Fully Verified', icon: VerifiedUserIcon, color: '#10B981', trend: '+8%' },
              { value: stats.pending, label: 'Awaiting Final Verification', icon: SpeedIcon, color: '#F59E0B', trend: '-5%' },
              { value: stats.admins, label: 'Admin & SuperAdmin', icon: AdminPanelSettingsIcon, color: SECONDARY_COLOR, trend: '+3%' }
            ].map((stat, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card
                  elevation={2} // Subtle elevation
                  sx={{
                    borderRadius: '8px',
                    background: WHITE,
                    borderLeft: `5px solid ${stat.color}`,
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 15px rgba(0,0,0,0.1)' }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <stat.icon sx={{ fontSize: 32, color: stat.color }} />
                      <Chip 
                        label={stat.trend}
                        size="small"
                        sx={{ 
                          bgcolor: `${stat.color}1A`,
                          color: stat.color,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800, 
                      color: TEXT_COLOR_DARK,
                      mb: 0.5,
                      fontSize: '2rem'
                    }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#6B7280', 
                      fontWeight: 600, 
                      textTransform: 'uppercase',
                      fontSize: '0.7rem'
                    }}>
                      {stat.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Search Bar & Actions - Clean White Paper */}
          <Paper 
            elevation={1}
            sx={{ 
              mb: 4, 
              p: 3, 
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              background: WHITE,
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
                        <SearchIcon sx={{ color: PRIMARY_COLOR, fontSize: 24 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      bgcolor: LIGHT_BACKGROUND,
                      '& fieldset': { borderColor: '#E5E7EB' },
                      '&.Mui-focused fieldset': { borderColor: PRIMARY_COLOR, borderWidth: '2px' }
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: PRIMARY_COLOR }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={7} textAlign={{ md: 'right' }}>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                  sx={{
                    borderRadius: '8px',
                    px: 3,
                    py: 1.2,
                    fontWeight: 600,
                    background: PRIMARY_COLOR,
                    boxShadow: 'none',
                    mr: 2,
                    textTransform: 'none',
                    '&:hover': { background: SECONDARY_COLOR }
                  }}
                >
                  Add User
                </Button>
                
                {/* === UPDATED EXPORT BUTTON === */}
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExportMenuOpen} // <-- UPDATED
                  disabled={isExporting} // <-- NEW
                  sx={{
                    borderRadius: '8px',
                    px: 3,
                    py: 1.2,
                    fontWeight: 600,
                    borderColor: PRIMARY_COLOR,
                    color: PRIMARY_COLOR,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: `${PRIMARY_COLOR}1A`,
                    }
                  }}
                >
                  {isExporting ? 'Exporting...' : 'Export Data'}
                </Button>

                {/* === NEW EXPORT MENU === */}
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

          {/* Final Verification Queue */}
          <Box sx={{ mb: 4 }}>
            <FinalVerificationQueue />
          </Box>

          {/* User Data Table - Clean and Crisp */}
          <TableContainer 
            component={Paper} 
            elevation={1}
            sx={{ 
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              background: WHITE,
            }}
          >
            <Table>
              <TableHead>
                {/* Table Header with Flat Primary Color */}
                <TableRow sx={{ background: PRIMARY_COLOR }}>
                  {['Employee ID', 'Name', 'Email', 'Role', 'Document Status', 'Actions'].map((head) => (
                    <TableCell 
                      key={head} 
                      align={head === 'Actions' ? 'right' : 'left'}
                      sx={{ 
                        color: WHITE, 
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        py: 1.5,
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
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <PeopleIcon sx={{ fontSize: 48, mb: 2, color: '#B0B0B0' }} />
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                      No employees found
                    </Typography>
                  </TableCell></TableRow>
                ) : (
                  employeesToDisplay.map((emp, index) => {
                    const docStatus = getOverallDocStatus(emp.documents);
                    const statusStyle = getStatusChipStyle(docStatus);
                    const roleStyle = getRoleChipStyle(emp.role);
                    
                    return (
                      <TableRow 
                        key={emp._id} 
                        sx={{ 
                          bgcolor: index % 2 === 0 ? WHITE : LIGHT_BACKGROUND,
                          '&:hover': { bgcolor: '#F0F0FF' } // Very subtle hover
                        }}
                      >
                        <TableCell sx={{ color: PRIMARY_COLOR, fontWeight: 600 }}>{emp.employeeId}</TableCell>
                        <TableCell sx={{ color: TEXT_COLOR_DARK, fontWeight: 500 }}>{emp.name}</TableCell>
                        <TableCell sx={{ color: '#6B7280' }}>{emp.email}</TableCell>
                        <TableCell>
                          <Chip label={emp.role?.toUpperCase() || 'N/A'} size="small" sx={{ ...roleStyle, fontWeight: 600, boxShadow: 'none' }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={docStatus} size="small" sx={{ ...statusStyle, fontWeight: 600, boxShadow: 'none' }} />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <Tooltip title="Edit user">
                              <IconButton size="small" onClick={() => { setEditingUser(emp); setIsModalOpen(true); }} sx={{ color: PRIMARY_COLOR }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete user">
                              <IconButton size="small" onClick={() => handleDeleteUser(emp._id, emp.name, emp.role)} disabled={emp.role === 'superAdmin'} sx={{ color: '#EF4444' }}>
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

          {/* Minimal Footer */}
          <Box sx={{ mt: 5, pt: 3, textAlign: 'center' }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>
                © {new Date().getFullYear()} Pegorion Software Solutions Pvt. Ltd. | Secure System Control
            </Typography>
          </Box>
        </Container>

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