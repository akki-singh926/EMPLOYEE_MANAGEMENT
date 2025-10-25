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
import DocumentVerificationPanel from './components/DocumentVerificationPanel'; 
import HomePage from './pages/HomePage'; 

// NEW: Assume SuperAdminPage and its Route Guard exist
import SuperAdminPage from './pages/SuperAdminPage'; 
import SuperAdminRoute from './components/SuperAdminRoute'; 

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
    primary: {
      main: '#2C3E50', // Deep Navy Blue
    },
    secondary: {
      main: '#16A085', // Professional Teal
    },
    background: {
      default: '#F8F9FA', // A soft, light-grey background for the entire app
      paper: '#FFFFFF', 
    },
  },
  typography: {
    fontFamily: [
      'Roboto', 
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 600, 
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
          borderRadius: 8, 
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', 
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
              {/* --- NEW: LANDING PAGE (Root Path) --- */}
              <Route path="/" element={<HomePage />} /> 
              
              {/* Public Routes (For Forms) */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

              {/* Protected Employee Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin/HR Panel (Unified Management) */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/verify/:employeeId"
                element={
                  <AdminRoute>
                    <DocumentVerificationPanel />
                  </AdminRoute>
                }
              />
              
              {/* --- CRITICAL FIX: Protected Super Admin Panel --- */}
              {/* We use a dedicated SuperAdminRoute to enforce the highest security */}
              <Route
                path="/superadmin"
                element={
                  <SuperAdminRoute> 
                    <SuperAdminPage /> 
                  </SuperAdminRoute>
                }
              />
              
              {/* Default route: If an unknown path is hit, redirect to the landing page */}
              <Route path="*" element={<Navigate to="/" />} /> 
            </Routes>
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;