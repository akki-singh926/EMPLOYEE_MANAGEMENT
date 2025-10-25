// src/components/SuperAdminRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // CRITICAL: Check for the exact 'superAdmin' (camelCase) role
  if (user?.role !== 'superAdmin') { 
    // Redirect Admin/HR to their unified management panel
    const defaultPath = (user?.role === 'admin' || user?.role === 'hr') ? '/admin' : '/dashboard';
    return <Navigate to={defaultPath} />;
  }

  return children;
};

export default SuperAdminRoute;