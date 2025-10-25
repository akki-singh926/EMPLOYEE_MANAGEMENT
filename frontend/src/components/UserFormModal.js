// src/components/UserFormModal.js
import React, { useState, useEffect } from 'react';
import { 
    Box, Button, TextField, Select, MenuItem, InputLabel, 
    FormControl, Typography, Modal, CircularProgress, Grid,
    useTheme
} from '@mui/material';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 1,
    maxHeight: '90vh',
    overflowY: 'auto'
};

const UserFormModal = ({ 
    open, 
    onClose, 
    user, 
    onSaveSuccess, 
    apiBaseUrl = 'http://localhost:8080/api/admin/employees', 
    roleList = ['employee', 'hr', 'admin', 'superAdmin'] 
}) => {
    
    const theme = useTheme();
    const isEditing = !!user;
    const { showNotification } = useNotification();

    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(false); 

    // Initialize formData when modal opens or user changes
    useEffect(() => {
        if (open) {
            setFormData({
                employeeId: user?.employeeId || '',
                name: user?.name || '',
                email: user?.email || '',
                role: user?.role || 'employee',
                password: '',
                designation: user?.designation || '',
                department: user?.department || '',
                reportingManager: user?.reportingManager || '',
                phone: user?.phone || '',
                address: user?.address || '',
                dob: user?.dob ? user.dob.substring(0, 10) : '',
                emergencyContact: user?.emergencyContact || ''
            });
        }
    }, [user, open]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        const token = localStorage.getItem('authToken');
        if (!token) {
            showNotification("Session expired. Please log in again.", "error");
            setIsLoading(false);
            return;
        }

        const url = isEditing 
            ? `${apiBaseUrl}/${user._id || user.employeeId}`  
            : apiBaseUrl;
        const method = isEditing ? "put" : "post";

        let payload = { ...formData };

        if (!isEditing) {
            // CREATE NEW USER
            if (!payload.password || payload.password.length < 6) {
                showNotification("Password (min 6 chars) is required for new employees.", "error");
                setIsLoading(false);
                return;
            }
            payload = {
                employeeId: payload.employeeId,
                name: payload.name,
                email: payload.email,
                password: payload.password,
                role: payload.role
            };
        } else {
            // EDIT EXISTING USER
            if (!user._id && !user.employeeId) {
                showNotification("Cannot edit: User ID missing.", "error");
                setIsLoading(false);
                return;
            }
            payload = {
                name: payload.name,
                email: payload.email,
                role: payload.role,
                designation: payload.designation || '',
                department: payload.department || '',
                reportingManager: payload.reportingManager || '',
                phone: payload.phone || '',
                address: payload.address || '',
                dob: payload.dob || null,
                emergencyContact: payload.emergencyContact || ''
            };
            if (payload.password) payload.password = payload.password;
        }

        try {
            console.log("Saving user:", method.toUpperCase(), url, payload);
            await axios({ method, url, data: payload, headers: { Authorization: `Bearer ${token}` } });

            showNotification(`User ${isEditing ? "updated" : "created"} successfully!`, "success");
            onSaveSuccess(); 
            onClose();

        } catch (error) {
            console.error("User save failed:", error);
            const errorMsg = error.response?.data?.message || "Failed to save user data.";
            showNotification(errorMsg, "error");
        } finally {
            setIsLoading(false);
        }
    };

    if (!formData) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={modalStyle}>
                <Typography variant="h5" sx={{ mb: 3 }}>
                    {isEditing ? `Edit User: ${user?.name || ''}` : 'Add New Employee'}
                </Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: theme.palette.primary.main }}>
                        <AccountCircleIcon sx={{ mr: 1 }} />
                        Core Account
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField label="Full Name" name="name" value={formData.name || ''} onChange={handleChange} fullWidth required size="small" />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Employee ID" name="employeeId" value={formData.employeeId || ''} onChange={handleChange} fullWidth required size="small" />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Email" name="email" type="email" value={formData.email || ''} onChange={handleChange} fullWidth required size="small" />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField 
                                label="Password" 
                                name="password" 
                                type="password" 
                                value={formData.password || ''} 
                                onChange={handleChange} 
                                fullWidth 
                                required={!isEditing}
                                size="small" 
                                helperText={isEditing ? "Leave blank to keep same password" : "Required (min 6 chars)"}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Role</InputLabel>
                                <Select value={formData.role || 'employee'} label="Role" name="role" onChange={handleChange}>
                                    {roleList.map(role => (
                                        <MenuItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    {isEditing && (
                        <>
                            <Typography variant="h6" sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', color: theme.palette.primary.main }}>
                                <BusinessCenterIcon sx={{ mr: 1 }} />
                                Job & Personal Details (Edit Mode)
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><TextField label="Designation" name="designation" value={formData.designation || ''} onChange={handleChange} fullWidth size="small" /></Grid>
                                <Grid item xs={12} sm={6}><TextField label="Department" name="department" value={formData.department || ''} onChange={handleChange} fullWidth size="small" /></Grid>
                                <Grid item xs={12}><TextField label="Reporting Manager" name="reportingManager" value={formData.reportingManager || ''} onChange={handleChange} fullWidth size="small" /></Grid>
                                <Grid item xs={12} sm={6}><TextField label="Phone" name="phone" value={formData.phone || ''} onChange={handleChange} fullWidth size="small" /></Grid>
                                <Grid item xs={12} sm={6}><TextField label="Date of Birth" name="dob" type="date" value={formData.dob || ''} onChange={handleChange} fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
                                <Grid item xs={12}><TextField label="Address" name="address" value={formData.address || ''} onChange={handleChange} fullWidth size="small" /></Grid>
                                <Grid item xs={12}><TextField label="Emergency Contact" name="emergencyContact" value={formData.emergencyContact || ''} onChange={handleChange} fullWidth size="small" /></Grid>
                            </Grid>
                        </>
                    )}

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
