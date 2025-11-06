import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  List,
  CircularProgress,
  Button,
  Chip
} from '@mui/material';
import DocumentUploadItem from './DocumentUploadItem';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';
import RefreshIcon from '@mui/icons-material/Refresh';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import OTPVerificationForm from './OTPVerificationForm';

// ✅ Required documents (with a manual entry option)
const requiredDocs = [
  { name: 'Aadhaar Card' },
  { name: 'PAN Card' },
  { name: 'Educational Certificates' },
  { name: 'ID Proof' },
  { name: 'Other Document', isManual: true }, // Enables manual text input
];

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const DocumentManager = () => {
  const [userDocuments, setUserDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadAuthorized, setIsUploadAuthorized] = useState(false);

  const { showNotification } = useNotification();
  const { user } = useAuth();
  const token = localStorage.getItem('authToken');

  // ✅ When OTP is verified, unlock uploads
  const handleVerificationSuccess = () => {
    setIsUploadAuthorized(true);
  };

  // ✅ Fetch uploaded documents from backend
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);

    if (!token) {
      showNotification('Authentication token missing. Please log in again.', 'error');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/employee/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      showNotification('Unable to load your documents. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, showNotification]);

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user, fetchDocuments]);

  // ✅ Match required docs to uploaded ones
  const documentsToDisplay = requiredDocs.map((reqDoc) => {
    if (reqDoc.isManual) {
      // Always keep one "Other Document" slot available
      const manualDoc = userDocuments.find(
        (u) => u.name?.toLowerCase().trim() === 'other document'
      );
      return manualDoc || { ...reqDoc, status: 'Not Uploaded', filePath: null };
    }

    // Normal matching for standard documents
    const uploadedDoc = userDocuments.find(
      (u) => u.name?.toLowerCase().trim() === reqDoc.name.toLowerCase().trim()
    );
    return uploadedDoc || { ...reqDoc, status: 'Not Uploaded', filePath: null };
  });

  return (
    <Box>
      {/* --- HEADER --- */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
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

      {/* --- OTP VERIFICATION SECTION --- */}
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

      {/* --- DOCUMENT LIST RENDER --- */}
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
