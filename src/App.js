// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import your page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DocumentVerificationPanel from './components/DocumentVerificationPanel'; // <-- Added here

// Import your route protectors
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Import contexts
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext'; 

// Import Material-UI components for theming
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';


// -------------------------------------------------------------------
// 1. AESTHETIC THEME DEFINITION (Custom Styles)
// -------------------------------------------------------------------
const theme = createTheme({
  palette: {
    // Primary: A deep, professional blue (associated with reliability)
    primary: {
      main: '#2C3E50', // Deep Navy Blue
    },
    // Secondary: A subtle, modern highlight color (e.g., teal)
    secondary: {
      main: '#16A085', // Professional Teal
    },
    background: {
      default: '#F8F9FA', // A soft, light-grey background for the entire app
      paper: '#FFFFFF', // Pure white for Cards and Tables
    },
  },
  typography: {
    fontFamily: [
      'Roboto', // Fallback
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 600, // Make section headers bolder
    },
  },
  // Apply subtle shadows and styles to Mui components globally
  components: {
    MuiPaper: { // Applies to Cards and Paper components
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', // Soft, light shadow for depth
          borderRadius: 8, // Slightly rounded corners
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Professional standard: don't auto-capitalize buttons
          borderRadius: 6,
        },
      },
    },
  }
});


// -------------------------------------------------------------------
// 2. THE MAIN APP FUNCTION (Uses the theme)
// -------------------------------------------------------------------
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* --- Public Routes --- */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

              {/* --- Protected Employee Dashboard --- */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* --- Protected Admin Panel Routes --- */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
              {/* --- Document Verification Route (Must be inside <Routes>) --- */}
              <Route
                path="/admin/verify/:employeeId"
                element={
                  <AdminRoute>
                    <DocumentVerificationPanel />
                  </AdminRoute>
                }
              />
              
              {/* Default route */}
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;