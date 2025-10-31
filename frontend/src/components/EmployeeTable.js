import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Chip, CircularProgress, Typography, Box
} from '@mui/material';
import axios from 'axios';

const EmployeeTable = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Fetch employee list from backend (HR route)
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("No auth token found.");

      const response = await axios.get('http://localhost:8080/api/hr/employees', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Match backend structure (response.data.data)
      setEmployees(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      setError("Failed to load employee data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleView = (id) => {
    alert(`Viewing details for employee ID: ${id}`);
  };

  const handleEdit = (id) => {
    alert(`Editing details for employee ID: ${id}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading employees...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Typography color="error">{error}</Typography>
        <Button onClick={fetchEmployees} variant="outlined" sx={{ mt: 1 }}>
          Retry
        </Button>
      </Box>
    );
  }

  if (employees.length === 0) {
    return (
      <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        No employees found.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} elevation={3}>
      <Table sx={{ minWidth: 650 }} aria-label="employee table">
        <TableHead>
          <TableRow>
            <TableCell><strong>Name</strong></TableCell>
            <TableCell><strong>Employee ID</strong></TableCell>
            <TableCell><strong>Email</strong></TableCell>
            <TableCell><strong>Department</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell align="right"><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee._id || employee.id}>
              <TableCell>{employee.name || 'N/A'}</TableCell>
              <TableCell>{employee.employeeId || 'N/A'}</TableCell>
              <TableCell>{employee.email || 'N/A'}</TableCell>
              <TableCell>{employee.department || 'N/A'}</TableCell>
              <TableCell>
                <Chip
                  label={employee.status || 'Not Uploaded'}
                  color={
                    employee.status === 'Approved'
                      ? 'success'
                      : employee.status === 'Pending'
                      ? 'warning'
                      : employee.status === 'Rejected'
                      ? 'error'
                      : 'default'
                  }
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleView(employee._id || employee.id)}
                  sx={{ mr: 1 }}
                >
                  View
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleEdit(employee._id || employee.id)}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default EmployeeTable;
