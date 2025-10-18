// src/components/DocumentVerificationList.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, List, ListItem, ListItemText, Button, Card, CardContent,
  CircularProgress, IconButton, Tooltip,Container, CardContent
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';

// Define the required API endpoint
const API_URL = 'http://localhost:8080/api/hr/documents'; 

const DocumentVerificationList = () => {
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showNotification } = useNotification();

  // --- 1. FETCH PENDING DOCUMENTS ---
  const fetchPendingDocuments = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      showNotification("Session expired. Please log in again.", 'error');
      setIsLoading(false);
      return;
    }

    try {
      // NOTE: This assumes an Admin/HR role check is done by the backend's route middleware
      const response = await axios.get(`${API_URL}/pending`, { // Assuming backend has a /pending endpoint
        headers: { Authorization: `Bearer ${token}` }
      });
      // The backend structure from hr.js returns an array of documents
      setPendingDocuments(response.data.documents || []); 
    } catch (error) {
      console.error('Error fetching pending documents:', error);
      showNotification("Failed to load documents for verification.", 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchPendingDocuments();
  }, [fetchPendingDocuments]);


  // --- 2. UPDATE DOCUMENT STATUS (APPROVE/REJECT) ---
  const updateDocumentStatus = async (doc) => {
    const status = doc.status === 'Approved' ? 'Approved' : 'Rejected';
    const remarks = status === 'Rejected' ? prompt("Please provide a reason for rejection:") : '';

    if (status === 'Rejected' && !remarks) return; // Stop if rejected without a reason

    const token = localStorage.getItem('authToken');
    
    try {
      // Endpoint: PATCH /api/hr/documents/:employeeId/:docId
      const response = await axios.patch(`${API_URL}/${doc.employeeId}/${doc._id}`, { status, remarks }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showNotification(`Document for ${doc.userName} was ${status.toLowerCase()}!`, 'success');
      
      // Remove the verified document from the list and refresh
      setPendingDocuments(prev => prev.filter(item => item._id !== doc._id));

    } catch (error) {
      console.error(`Failed to ${status} document:`, error);
      showNotification(`Failed to process verification.`, 'error');
    }
  };


  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (pendingDocuments.length === 0) {
    return (
      <Typography variant="body1" sx={{ p: 3, textAlign: 'center' }}>
        ✅ All documents are up to date! Nothing pending verification.
      </Typography>
    );
  }

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent sx={{ p: 0 }}>
        <List>
          {pendingDocuments.map((doc) => (
            <ListItem
              key={doc._id} // Using MongoDB _id for reliable key
              divider
              secondaryAction={
                <Box>
                  <Button 
                    variant="contained" 
                    color="success" 
                    size="small" 
                    sx={{ mr: 1 }} 
                    onClick={() => updateDocumentStatus({ ...doc, status: 'Approved' })}
                    startIcon={<CheckIcon />}
                  >
                    Approve
                  </Button>
                  <Button 
                    variant="contained" 
                    color="error" 
                    size="small" 
                    onClick={() => updateDocumentStatus({ ...doc, status: 'Rejected' })}
                    startIcon={<CloseIcon />}
                  >
                    Reject
                  </Button>
                </Box>
              }
            >
              <ListItemText
                primary={`${doc.userName || doc.employeeId} - ${doc.name}`}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Status: {doc.status}
                    <Tooltip title="View Document">
                      <IconButton 
                        size="small" 
                        href={doc.fileUrl || '#'} // Use actual file URL from backend
                        target="_blank" 
                        rel="noopener noreferrer" 
                        sx={{ ml: 1 }}
                      >
                        <VisibilityIcon fontSize="small" color="primary" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default DocumentVerificationList;