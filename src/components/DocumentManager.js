// src/components/DocumentManager.js
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, List, CircularProgress, Button } from '@mui/material';
import DocumentUploadItem from './DocumentUploadItem';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';
import RefreshIcon from '@mui/icons-material/Refresh';

const requiredDocs = [
  { name: 'Aadhaar Card' },
  { name: 'PAN Card' },
  { name: 'Educational Certificates' },
  { name: 'ID Proof' },
];

const DocumentManager = () => {
  const [userDocuments, setUserDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- FIX 1: Only need useNotification for displaying errors ---
  const { showNotification } = useNotification();
  const { user } = useAuth(); // We'll use this to check if the user is logged in
  
  const token = localStorage.getItem('authToken'); // --- FIX 2: Get token directly from localStorage ---

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);

    // --- CRITICAL FIX 3: Check for token existence before proceeding ---
    if (!token) {
        setIsLoading(false);
        showNotification("Authentication token missing. Please log in.", "error");
        return; // Stop the function if token is not found
    }
    
    try {
      const response = await axios.get('http://localhost:8080/api/employee/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Assuming the backend sends an array of documents in response.data.documents
      setUserDocuments(response.data.documents); 
    } catch (error) {
      console.error("Failed to fetch documents", error);
      showNotification("Could not load your documents. API endpoint may be missing.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [token, showNotification]); // token must be in dependencies of useCallback

  // FIX 4: Only call fetchDocuments if the user object exists (to avoid early calls)
  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, fetchDocuments]); // user dependency ensures the fetch runs after login

  const documentsToDisplay = requiredDocs.map(reqDoc => {
    // Merge the required document with any document found in the userDocuments state
    const uploadedDoc = userDocuments.find(upDoc => upDoc.name === reqDoc.name);
    return uploadedDoc ? uploadedDoc : { ...reqDoc, status: 'Not Uploaded' };
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" color="textSecondary">
          Upload required documents and track their verification status.
        </Typography>
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={fetchDocuments}
          disabled={isLoading}
        >
          Refresh Status
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {documentsToDisplay.map((doc) => (
            // Pass the onUploadSuccess function down to refresh the list after a successful upload
            <DocumentUploadItem 
              key={doc.name} 
              doc={doc} 
              onUploadSuccess={fetchDocuments}
            />
          ))}
        </List>
      )}
    </Box>
  );
};

export default DocumentManager;