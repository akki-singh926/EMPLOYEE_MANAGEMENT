import React, { useState, useRef } from 'react';
import { 
  Button, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Chip, 
  CircularProgress, 
  Tooltip,
  IconButton,
  TextField
} from '@mui/material';

import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';

import axios from 'axios';
import { useNotification } from '../context/NotificationContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const DocumentUploadItem = ({ doc, onUploadSuccess, isUploadAuthorized }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [manualDocName, setManualDocName] = useState('');

  const isManualEntry = doc.isManual === true;
  const fileInputRef = useRef(null);
  const { showNotification } = useNotification();

  // ✅ Status icon mapping (MATCHES HR PANEL)
  const getStatusIcon = (status) => {
    if (status === 'Approved') return <CheckCircleIcon color="success" />;
    if (status === 'Pending') return <PendingIcon color="warning" />;
    if (status === 'Rejected') return <CancelIcon color="error" />;
    return <UploadFileIcon />;
  };

  // ✅ File selection validation
  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    const maxFileSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.type)) {
      showNotification(
        'Invalid file type. Only PDF, JPEG, or PNG are allowed.',
        'error'
      );
      return;
    }

    if (file.size > maxFileSize) {
      showNotification('File is too large. Maximum size is 2MB.', 'error');
      return;
    }

    setSelectedFile(file);
  };

  // ✅ Trigger hidden input
  const handleUploadClick = () => {
    if (!isUploadAuthorized) {
      showNotification('Please verify OTP before uploading.', 'warning');
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // ✅ Upload file to backend
  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    if (isManualEntry && manualDocName.trim().length < 3) {
      showNotification(
        'Document name must be at least 3 characters.',
        'warning'
      );
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      showNotification('Session expired. Please log in again.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append(
      'type',
      isManualEntry ? manualDocName.trim() : doc.name
    );

    try {
      setIsUploading(true);

      await axios.post(`${API_URL}/api/employee/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showNotification(
        `'${isManualEntry ? manualDocName : doc.name}' uploaded successfully!`,
        'success'
      );

      setSelectedFile(null);
      setManualDocName('');

      if (onUploadSuccess) {
        setTimeout(onUploadSuccess, 500);
      }
    } catch (error) {
      const msg =
        error.response?.data?.message || 'Document upload failed.';
      showNotification(msg, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ Upload button logic (NO status dependency)
  const requiresUploadButton = !doc.filePath || doc.status === 'Rejected';
  const isManualReady = !isManualEntry || manualDocName.trim().length >= 3;
  const fileUrl = doc.filePath ? `${API_URL}${doc.filePath}` : null;

  return (
    <ListItem>
      <ListItemIcon>{getStatusIcon(doc.status)}</ListItemIcon>

      <ListItemText
        primary={
          isManualEntry ? (
            <TextField
              size="small"
              placeholder="Enter Document Name"
              value={manualDocName}
              onChange={(e) => setManualDocName(e.target.value)}
              sx={{ width: '100%', maxWidth: 220 }}
              disabled={!!doc.filePath || !isUploadAuthorized}
            />
          ) : (
            doc.name
          )
        }
        secondary={
          selectedFile && (
            <Chip
              label={selectedFile.name}
              onDelete={() => setSelectedFile(null)}
              color="info"
              size="small"
              sx={{ mt: 1 }}
            />
          )
        }
      />

      {/* ✅ Download button */}
      {doc.filePath && (
        <Tooltip title="Download Document">
          <IconButton
            edge="end"
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      )}

      {/* ✅ Upload / Confirm buttons */}
      {requiresUploadButton && (
        selectedFile ? (
          <Button
            variant="contained"
            size="small"
            onClick={handleConfirmUpload}
            disabled={
              isUploading ||
              !isUploadAuthorized ||
              !isManualReady
            }
          >
            {isUploading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Confirm'
            )}
          </Button>
        ) : (
          <Button
            variant="outlined"
            size="small"
            startIcon={<UploadFileIcon />}
            onClick={handleUploadClick}
            disabled={!isUploadAuthorized}
          >
            Select File
          </Button>
        )
      )}

      {/* ✅ Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/png, image/jpeg, application/pdf"
        onChange={handleFileSelected}
      />
    </ListItem>
  );
};

export default DocumentUploadItem;
