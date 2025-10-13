// src/components/EmployeeTable.js
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip
} from '@mui/material';

// --- Mock Data ---
// In a real app, this data would come from a backend API call.
const mockEmployees = [
  { id: 1, name: 'John Doe', employeeId: 'EMP101', email: 'john.d@example.com', department: 'Technology', status: 'Active' },
  { id: 2, name: 'Jane Smith', employeeId: 'EMP102', email: 'jane.s@example.com', department: 'HR', status: 'Active' },
  { id: 3, name: 'Peter Jones', employeeId: 'EMP103', email: 'peter.j@example.com', department: 'Finance', status: 'Inactive' },
  { id: 4, name: 'Mary Garcia', employeeId: 'EMP104', email: 'mary.g@example.com', department: 'Marketing', status: 'Active' },
];

const EmployeeTable = () => {
  const handleView = (id) => {
    console.log('View employee with ID:', id);
    alert(`Viewing details for employee ${id}`);
  };

  const handleEdit = (id) => {
    console.log('Edit employee with ID:', id);
    alert(`Editing details for employee ${id}`);
  };

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="employee table">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Employee ID</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {mockEmployees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell component="th" scope="row">{employee.name}</TableCell>
              <TableCell>{employee.employeeId}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{employee.department}</TableCell>
              <TableCell>
                <Chip 
                  label={employee.status} 
                  color={employee.status === 'Active' ? 'success' : 'default'} 
                  size="small" 
                />
              </TableCell>
              <TableCell align="right">
                <Button variant="outlined" size="small" onClick={() => handleView(employee.id)} sx={{ mr: 1 }}>
                  View
                </Button>
                <Button variant="contained" size="small" onClick={() => handleEdit(employee.id)}>
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