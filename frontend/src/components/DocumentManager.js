import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  List,
  CircularProgress,
  Button,
  Chip,
  Stack
} from '@mui/material';
import DocumentUploadItem from './DocumentUploadItem';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';
import RefreshIcon from '@mui/icons-material/Refresh';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import OTPVerificationForm from './OTPVerificationForm';

const requiredDocs = [
  { name: 'Aadhaar Card' },
  { name: 'PAN Card' },
  { name: 'Educational Certificates' },
  { name: 'ID Proof' },
  { name: 'Other Document', isManual: true },
];

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const DocumentManager = () => {
  const [userDocuments, setUserDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadAuthorized, setIsUploadAuthorized] = useState(false);

  const { showNotification } = useNotification();
  const { user } = useAuth();
  const token = localStorage.getItem('authToken');

  const handleVerificationSuccess = () => {
    setIsUploadAuthorized(true);
  };

  // ✅ Fetch uploaded documents
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

      const docs = (response.data.documents || []).map((d) => {
        if (d.status === 'Approved' || d.status === 'Verified') d.status = 'Accepted';
        else if (d.status === 'Pending') d.status = 'Pending Review';
        else if (d.status === 'Rejected') d.status = 'Rejected';
        else d.status = 'Not Uploaded';
        return d;
      });

      setUserDocuments(docs);
    } catch (error) {
      console.error('❌ Failed to fetch documents:', error);
      showNotification('Unable to load your documents. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, showNotification]);

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user, fetchDocuments]);

  // ✅ Merge required and extra uploaded docs
  const documentsToDisplay = [
    ...requiredDocs.map((reqDoc) => {
      const uploadedDoc = userDocuments.find(
        (u) => u.name?.toLowerCase().trim() === reqDoc.name.toLowerCase().trim()
      );
      return uploadedDoc || { ...reqDoc, status: 'Not Uploaded', filePath: null };
    }),
    ...userDocuments.filter(
      (doc) =>
        !requiredDocs.some(
          (reqDoc) => reqDoc.name.toLowerCase().trim() === doc.name?.toLowerCase().trim()
        )
    ),
  ];

  // ✅ Status color logic
  const getStatusChipColor = (status) => {
    switch (status) {
      case 'Accepted':
        return 'success';
      case 'Rejected':
        return 'error';
      case 'Pending Review':
        return 'warning';
      default:
        return 'default';
    }
  };

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

      {/* Document List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {documentsToDisplay.map((doc) => {
            // ✅ Build proper file URL
            let fileUrl = null;

            if (doc.filePath) {
              fileUrl = `${API_URL}${doc.filePath}`;
            } else if (user?._id && doc._id && doc.mimetype) {
              const ext =
                doc.mimetype === 'application/pdf'
                  ? '.pdf'
                  : doc.mimetype === 'image/png'
                  ? '.png'
                  : '.jpg';
              fileUrl = `${API_URL}/uploads/${user._id}/${doc._id}${ext}`;
            }

            return (
              <Stack
                key={doc._id || doc.name}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Box sx={{ flex: 1 }}>
                  <DocumentUploadItem
                    doc={doc}
                    onUploadSuccess={fetchDocuments}
                    isUploadAuthorized={isUploadAuthorized}
                  />
                </Box>

                {/* ✅ Only status chip now, removed duplicate download icon */}
                <Chip
                  label={doc.status}
                  color={getStatusChipColor(doc.status)}
                  size="small"
                  sx={{
                    minWidth: 110,
                    fontWeight: 500,
                    textTransform: 'capitalize',
                  }}
                />
              </Stack>
            );
          })}
        </List>
      )}
    </Box>
  );
};

export default DocumentManager;
