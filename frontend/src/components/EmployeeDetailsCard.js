// src/components/EmployeeDetailsCard.js
import React from 'react';
import { Box, Typography, Grid, Paper, Divider } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import JobDetails from './JobDetails'; // <-- Import JobDetails component

const EmployeeDetailsCard = () => {
  // Get the logged-in user object from context
  const { user } = useAuth(); 

  if (!user) return null; // Avoid rendering if user is not loaded yet

  // Personal/Account details
  const personalDetails = {
    'Employee ID': user.employeeId || 'N/A',
    'Full Name': user.name || 'N/A',
    'Company Email': user.email || 'N/A',
    'User Role': user.role || 'Employee',
  };

  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      {/* --- PERSONAL DETAILS --- */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Personal Information
      </Typography>
      <Grid container spacing={2}>
        {Object.entries(personalDetails).map(([key, value]) => (
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

      <Divider sx={{ my: 3 }} />

      {/* --- JOB DETAILS --- */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Job Information
      </Typography>
      <JobDetails employee={user} />
    </Paper>
  );
};

export default EmployeeDetailsCard;
