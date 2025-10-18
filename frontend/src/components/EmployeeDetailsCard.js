// src/components/EmployeeDetailsCard.js
import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';
// import InfoIcon from '@mui/icons-material/Info'; // <-- REMOVED: Icon is used by the parent CardHeader

const EmployeeDetailsCard = () => {
    // Correctly get the user object from context
    const { user } = useAuth(); 

    // Details pulled from the logged-in user object
    const detailsToDisplay = {
        // --- FIX APPLIED HERE: Using 'user' instead of 'employee' ---
        'Employee ID': user?.employeeId || 'N/A',
        'Full Name': user?.name || 'N/A',
        'Company Email': user?.email || 'N/A',
        'User Role': user?.role || 'Employee',
    };
    
    return (
        <Paper elevation={0} sx={{ p: 2, height: '100%' }}>
            <Grid container spacing={2}>
                {Object.entries(detailsToDisplay).map(([key, value]) => (
                    <Grid item xs={12} sm={6} key={key}>
                        <Box sx={{ borderBottom: '1px dotted #ccc', pb: 0.5 }}>
                            <Typography variant="caption" color="textSecondary" display="block">
                                {key}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {value}
                            </Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
};

export default EmployeeDetailsCard;