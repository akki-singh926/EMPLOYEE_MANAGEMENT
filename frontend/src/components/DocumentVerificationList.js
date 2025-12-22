// src/components/DocumentVerificationList.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Chip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const API_URL = 'http://localhost:8080/api/hr/employees';

const DocumentVerificationList = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('authToken');

    if (!token) {
      showNotification('Session expired. Please log in again.', 'error');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allEmployees = response.data.data || [];

      const filtered = allEmployees.filter(emp =>
        emp.documents?.some(
          doc => doc.status === 'Pending' || doc.status === 'Rejected'
        )
      );

      setEmployees(filtered);
    } catch (error) {
      console.error('Error fetching employees:', error);
      showNotification('Failed to load employee list.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleViewDocuments = (employeeId) => {
    if (!employeeId) {
      showNotification('Employee ID missing.', 'error');
      return;
    }
    navigate(`/admin/verify/${employeeId}`);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (employees.length === 0) {
    return (
      <Typography variant="body1" sx={{ p: 3, textAlign: 'center' }}>
        ✅ All documents are verified! No pending approvals.
      </Typography>
    );
  }

  return (
    <Card sx={{ mt: 2, borderRadius: 2, boxShadow: 2 }}>
      <CardContent sx={{ p: 0 }}>
        <Typography variant="h6" sx={{ p: 2, fontWeight: 600 }}>
          Employees with Pending / Rejected Documents
        </Typography>

        <List>
          {employees.map(emp => {
            const pendingCount = emp.documents.filter(
              d => d.status === 'Pending' || d.status === 'Rejected'
            ).length;

            return (
              <ListItem
                key={emp._id}
                divider
                secondaryAction={
                  <Button
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewDocuments(emp.employeeId)}
                  >
                    View Docs
                  </Button>
                }
              >
                <ListItemText
                  primary={`${emp.name || 'Unnamed Employee'} (${emp.employeeId})`}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        Docs needing review:
                      </Typography>
                      <Chip
                        label={pendingCount}
                        color="warning"
                        size="small"
                      />
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
};

export default DocumentVerificationList;
