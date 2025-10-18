import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, List, CircularProgress, Button, Chip } from '@mui/material';
import DocumentUploadItem from './DocumentUploadItem';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';
import RefreshIcon from '@mui/icons-material/Refresh';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import OTPVerificationForm from './OTPVerificationForm'; // ✅ Imported external form

const requiredDocs = [
  { name: 'Aadhaar Card' },
  { name: 'PAN Card' },
  { name: 'Educational Certificates' },
  { name: 'ID Proof' },
];

const DocumentManager = () => {
  const [userDocuments, setUserDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadAuthorized, setIsUploadAuthorized] = useState(false); // default false

  const { showNotification } = useNotification();
  const { user } = useAuth();
  const token = localStorage.getItem('authToken');

  // ✅ Step 1: When OTP is verified, unlock uploads
  const handleVerificationSuccess = () => {
    setIsUploadAuthorized(true);
  };

  // ✅ Step 2: Fetch uploaded documents
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);

    if (!token) {
      setIsLoading(false);
      showNotification("Authentication token missing.", "error");
      return;
    }

    try {
      const response = await axios.get('http://localhost:8080/api/employee/documents', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserDocuments(response.data.documents || []);
    } catch (error) {
      console.error("Failed to fetch documents", error);
      showNotification("Could not load your documents. API endpoint may be missing.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [token, showNotification]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, fetchDocuments]);

  // ✅ Step 3: Map required documents to uploaded list
  const documentsToDisplay = requiredDocs.map(reqDoc => {
    const uploadedDoc = userDocuments.find(upDoc => upDoc.name === reqDoc.name);
    return uploadedDoc ? uploadedDoc : { ...reqDoc, status: 'Not Uploaded' };
  });

  return (
    <Box>
      {/* Header */}
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

      {/* OTP Section */}
      {isUploadAuthorized ? (
        <Chip
          label="Uploads Authorized"
          color="success"
          icon={<VerifiedUserIcon />}
          sx={{ mb: 2 }}
        />
      ) : (
        <OTPVerificationForm
          onVerificationSuccess={handleVerificationSuccess}
          employeeEmail={user?.email}
        />
      )}

      {/* Document Upload List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {documentsToDisplay.map((doc) => (
            <DocumentUploadItem
              key={doc.name}
              doc={doc}
              onUploadSuccess={fetchDocuments}
              isUploadAuthorized={isUploadAuthorized}
            />
          ))}
        </List>
      )}
    </Box>
  );
};

export default DocumentManager;

