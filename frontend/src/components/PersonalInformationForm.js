// src/components/PersonalInformationForm.js
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Grid, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';

// --- Temporary Mock Data for Display ---
const MOCK_DATA = {
    fullName: 'Test Employee Name',
    dob: '1990-01-01',
    phone: '9876543210',
    address: '456 Test Street, Mock City',
    emergencyContact: '0123456789',
};

// Component receives the refresh function from the DashboardPage
const PersonalInformationForm = ({ onUpdateSuccess }) => {
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState(null); 
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- 1. FETCH PROFILE DATA ON LOAD ---
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error("No auth token found.");

                // Attempt to fetch from the real backend endpoint
                const response = await axios.get('http://localhost:8080/api/employee/me', {
                    headers: {
                        Authorization: `Bearer ${token}` 
                    }
                });
                
                // --- If successful, use real data ---
                // Mapping the response data fields to the form state
                setFormData({
                    fullName: response.data.name || '',
                    dob: response.data.dob || '', // Use 'dob'
    phone: response.data.phone || '',
    address: response.data.address || '',
    emergencyContact: response.data.emergencyContact || '',
                });
            } catch (error) {
                // --- On API error (like 404), use mock data ---
                console.error('Error fetching profile (using mock data):', error.message);
                setFormData(MOCK_DATA);
                showNotification('Profile API not ready. Displaying test data.', 'warning');

            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [showNotification]);


    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value,
        }));
    };

    // --- 2. SUBMIT PROFILE UPDATE ---
    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("No auth token found.");
            
            // Send the updated data to the backend (PUT /api/employee/me)
            const response = await axios.put('http://localhost:8080/api/employee/me', formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // --- CRITICAL FIX: INSTANT UI UPDATE ---
            // Update the local state with the data returned from the server
            // This ensures the Job Details card refreshes with the new information.
            setFormData({
                fullName: response.data.name || formData.fullName,
                dateOfBirth: response.data.dateOfBirth || formData.dateOfBirth,
                phone: response.data.phone || formData.phone,
                address: response.data.address || formData.address,
                emergencyContactName: response.data.emergencyContactName || formData.emergencyContactName,
                emergencyContactPhone: response.data.emergencyContactPhone || formData.emergencyContactPhone,
            });

            console.log('Update successful:', response.data);
            showNotification('Information updated successfully!', 'success');
            
            // Trigger the parent component (Dashboard) to force Job Details refresh
            if (onUpdateSuccess) {
                onUpdateSuccess();
            }

        } catch (error) {
            console.error('Error updating profile:', error);
            // This path runs until the backend implements the PUT route.
            showNotification('Failed to update information. Try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Display Loading Spinner if data is not ready ---
    if (isLoading || !formData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    // --- The Form UI (displays once data is loaded) ---
    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Please keep your information up to date.
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField name="fullName" label="Full Name" value={formData.fullName} onChange={handleChange} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField name="dob" label="Date of Birth" type="date" value={formData.dob} onChange={handleChange} fullWidth required InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField name="phone" label="Phone Number" value={formData.phone} onChange={handleChange} fullWidth required />
                </Grid>
                <Grid item xs={12}>
                    <TextField name="address" label="Address" value={formData.address} onChange={handleChange} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField name="emergencyContact" label="Emergency Contact" value={formData.emergencyContact} onChange={handleChange} fullWidth required />
                </Grid>
            </Grid>
            <Button type="submit" variant="contained" sx={{ mt: 3 }} disabled={isSubmitting}>
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Update Information'}
            </Button>
        </Box>
    );
};

export default PersonalInformationForm;