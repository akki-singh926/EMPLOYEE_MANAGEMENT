// src/components/DocumentVerificationList.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, List, ListItem, ListItemText, Button, Card, CardContent,
  CircularProgress, IconButton, Tooltip
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';

// --- Backend Constants ---
const API_URL = 'http://localhost:8080/api/hr/documents'; 
const BACKEND_HOST = 'http://localhost:8080';
const UPLOADS_PATH = '/uploads';

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
      const response = await axios.get(`${API_URL}/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove duplicates based on _id
      const docs = response.data.documents || [];
      const uniqueDocuments = Array.from(new Map(docs.map(d => [d._id, d])).values());
      
      // Fix file URLs
      uniqueDocuments.forEach(doc => {
        doc.fileUrl = doc.filename ? `${BACKEND_HOST}${UPLOADS_PATH}/${doc.filename}` : '#';
      });

      setPendingDocuments(uniqueDocuments);

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

  // --- 2. UPDATE DOCUMENT STATUS ---
  const updateDocumentStatus = async (doc, newStatus) => {
    const remarks = newStatus === 'Rejected' ? prompt("Please provide a reason for rejection:") : '';
    if (newStatus === 'Rejected' && !remarks) return;

    const token = localStorage.getItem('authToken');
    
    try {
      await axios.patch(`${API_URL}/${doc.employeeId}/${doc._id}`, 
        { status: newStatus, remarks }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification(`Document for ${doc.userName} was ${newStatus.toLowerCase()}!`, 'success');

      // Remove document from list
      setPendingDocuments(prev => prev.filter(item => item._id !== doc._id));

    } catch (error) {
      console.error(`Failed to ${newStatus} document:`, error);
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
              key={doc._id} // Unique _id ensures no duplicates
              divider
              secondaryAction={
                <Box>
                  <Button 
                    variant="contained" 
                    color="success" 
                    size="small" 
                    sx={{ mr: 1 }} 
                    onClick={() => updateDocumentStatus(doc, 'Approved')}
                    startIcon={<CheckIcon />}
                  >
                    Approve
                  </Button>
                  <Button 
                    variant="contained" 
                    color="error" 
                    size="small" 
                    onClick={() => updateDocumentStatus(doc, 'Rejected')}
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
                        href={doc.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        sx={{ ml: 1 }}
                        disabled={doc.fileUrl === '#'}
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
