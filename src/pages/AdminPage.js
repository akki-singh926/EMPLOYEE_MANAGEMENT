// src/pages/AdminPage.js
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Container, Button, AppBar, Toolbar, 
  Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TextField, InputAdornment, Grid, CircularProgress 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';

const AdminPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. FETCH EMPLOYEE LIST ON LOAD ---
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error("Authentication failed.");

        // NOTE: This endpoint requires the 'admin' role
        const response = await axios.get('http://localhost:8080/api/admin/employees', {
          headers: {
            Authorization: `Bearer ${token}` // Send the token
          }
        });
        
        // Assuming the backend returns the list of employees in response.data.data
        setEmployees(response.data.data || []); 
      } catch (error) {
        console.error('Error fetching employee list:', error);
        
        // Handle common errors (e.g., 403 Forbidden if not admin, or 404 Not Found)
        const errorMessage = error.response?.status === 403 
          ? 'Access Denied: You must be an Admin/HR.' 
          : 'Could not fetch employee list. The backend API may be missing.';
        
        showNotification(errorMessage, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [showNotification]);


  const tableHeadings = [
    { label: 'ID', align: 'left' },
    { label: 'Name', align: 'left' },
    { label: 'Email', align: 'left' },
    { label: 'Document Status', align: 'center' },
    { label: 'Actions', align: 'right' },
  ];

  if (isLoading) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <CircularProgress />
          </Box>
      );
  }

  // --- Mock employees will be used if API fails or returns an empty array ---
  const employeesToDisplay = employees.length > 0 ? employees : [
    { id: 'EMP001', name: 'John Doe', email: 'john@example.com', status: 'Approved' },
    { id: 'EMP002', name: 'Jane Smith', email: 'jane@example.com', status: 'Pending' },
  ];


  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>
          <Button color="inherit" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>Manage Employees</Typography>

        <Paper sx={{ mb: 3, p: 2 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                    <TextField 
                        fullWidth
                        label="Search Employee"
                        variant="outlined"
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={8} sx={{ textAlign: { sm: 'right' } }}>
                    <Button variant="contained" color="primary">Add New Employee</Button>
                </Grid>
            </Grid>
        </Paper>

        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="employee management table">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.light' }}>
                {tableHeadings.map((head) => (
                    <TableCell key={head.label} align={head.align} sx={{ fontWeight: 'bold', color: 'white' }}>
                        {head.label}
                    </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {employeesToDisplay.map((employee) => (
                <TableRow key={employee.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">{employee.id}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell align="center">
                    <Typography 
                      variant="caption" 
                      sx={{ 
                          p: 0.5, 
                          borderRadius: 1, 
                          color: 'white',
                          backgroundColor: employee.status === 'Approved' ? 'secondary.main' : 
                                            employee.status === 'Pending' ? 'warning.main' : 'error.main'
                      }}>
                      {employee.status || 'N/A'}
                    </Typography>
                  </TableCell>
                  {/* --- ACTION BUTTONS (CORRECTLY PLACED) --- */}
                  <TableCell align="right">
                    <Button size="small" variant="outlined" sx={{ mr: 1 }}>View Profile</Button>
                    <Button 
                        size="small" 
                        variant="contained" 
                        color="secondary"
                        onClick={() => navigate(`/admin/verify/${employee.id}`)}
                    >
                        Verify Docs
                    </Button>
                  </TableCell>
                  {/* --- END ACTION BUTTONS --- */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
};

export default AdminPage;