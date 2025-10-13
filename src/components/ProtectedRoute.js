// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

// This component will protect our routes
const ProtectedRoute = ({ children }) => {
  // For now, we'll simulate the login check.
  // In the future, we will check for a valid auth token here.
  const isAuthenticated = true; // <-- CHANGE THIS to false to test the redirect

  if (!isAuthenticated) {
    // If not logged in, redirect to the login page
    return <Navigate to="/login" />;
  }

  // If logged in, show the page content
  return children;
};

export default ProtectedRoute;