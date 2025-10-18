// src/components/UserFormModal.js
import React, { useState, useEffect } from 'react';
import { 
    Box, Button, TextField, Select, MenuItem, InputLabel, 
    FormControl, Typography, Modal, CircularProgress, Grid,
    useTheme // Imported useTheme for styling consistency
} from '@mui/material';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter'; // Import the new icon

const modalStyle = {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
    width: 600, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 1,
    // Ensure modal is scrollable for smaller screens
    maxHeight: '90vh',
    overflowY: 'auto'
};

const UserFormModal = ({ open, onClose, user, onSaveSuccess }) => {
    const theme = useTheme();
    // Determine if we are editing an existing user (if 'user' prop is passed)
    const isEditing = !!user;
    const { showNotification } = useNotification();
    
    // --- FINAL STATE DEFINITION with New Job Fields ---
    const [formData, setFormData] = useState({
        // Core User Data
        employeeId: user?.employeeId || '',
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || 'employee',
        password: '',
        
        // --- NEW JOB DETAIL FIELDS ---
        designation: user?.designation || '',
        department: user?.department || '',
        reportingManager: user?.reportingManager || '',
    });
    const [isLoading, setIsLoading] = useState(false);

    // CRITICAL: Update form state whenever the 'user' prop changes (for editing different users)
    useEffect(() => {
        if (user) {
            setFormData({
                employeeId: user.employeeId || '',
                name: user.name || '',
                email: user.email || '',
                role: user.role || 'employee',
                password: '',
                designation: user.designation || '',
                department: user.department || '',
                reportingManager: user.reportingManager || '',
            });
        } else {
            // Reset form for new user creation
            setFormData({
                employeeId: '', name: '', email: '', role: 'employee', password: '',
                designation: '', department: '', reportingManager: '',
            });
        }
    }, [user]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        
        // Determine URL and Method based on whether we are editing or creating
        const url = isEditing 
            ? `http://localhost:8080/api/admin/employees/${user._id || user.id}` // Use MongoDB _id or general id
            : 'http://localhost:8080/api/admin/employees';
        const method = isEditing ? 'put' : 'post';
        
        // Prepare data: filter out unnecessary fields and password if unchanged
        const payload = { ...formData };
        if (isEditing && !payload.password) delete payload.password;
        if (!isEditing && payload.password.length < 6) {
             showNotification("Password must be at least 6 characters.", 'error');
             setIsLoading(false);
             return;
        }
        if (!isEditing && !payload.password) {
             showNotification("Password is required for new employees.", 'error');
             setIsLoading(false);
             return;
        }

        try {
            await axios({ method, url, data: payload, headers: { Authorization: `Bearer ${token}` } });
            showNotification(`User ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
            onSaveSuccess(); // Trigger table refresh
            onClose();
        } catch (error) {
            console.error('User save failed:', error);
            showNotification(error.response?.data?.message || 'Failed to save user data.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={modalStyle}>
                <Typography variant="h5" sx={{ mb: 3 }}>
                    {isEditing ? `Edit User: ${user?.name || ''}` : 'Add New Employee'}
                </Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    
                    {/* --- CORE USER FIELDS --- */}
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField label="Full Name" name="name" value={formData.name} onChange={handleChange} fullWidth required size="small" />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Employee ID" name="employeeId" value={formData.employeeId} onChange={handleChange} fullWidth required size="small" />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Email" name="email" value={formData.email} onChange={handleChange} fullWidth required size="small" />
                        </Grid>
                        <Grid item xs={6}>
                             <TextField 
                                label="Password" 
                                name="password" 
                                type="password" 
                                value={formData.password} 
                                onChange={handleChange} 
                                fullWidth 
                                required={!isEditing}
                                size="small" 
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Role</InputLabel>
                                <Select 
                                    value={formData.role} 
                                    label="Role" 
                                    onChange={handleChange}
                                >
                                    <MenuItem value="employee">Employee</MenuItem>
                                    <MenuItem value="hr">HR</MenuItem>
                                    <MenuItem value="admin">Admin</MenuItem>
                                    <MenuItem value="superadmin">Superadmin</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    {/* --- NEW SECTION: JOB & REPORTING DETAILS --- */}
                    <Typography variant="h6" sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', color: theme.palette.primary.main }}>
                        <BusinessCenterIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
                        Job & Reporting Details
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                label="Designation" 
                                name="designation" 
                                value={formData.designation} 
                                onChange={handleChange} 
                                fullWidth 
                                size="small" 
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                label="Department" 
                                name="department" 
                                value={formData.department} 
                                onChange={handleChange} 
                                fullWidth 
                                size="small" 
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField 
                                label="Reporting Manager" 
                                name="reportingManager" 
                                value={formData.reportingManager} 
                                onChange={handleChange} 
                                fullWidth 
                                size="small" 
                            />
                        </Grid>
                    </Grid>

                    {/* --- SUBMIT ACTIONS --- */}
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={onClose} variant="outlined">Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isLoading}>
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : (isEditing ? 'Save Changes' : 'Create User')}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

export default UserFormModal;