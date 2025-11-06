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

  // ✅ Status icon display
  const getStatusIcon = (status) => {
    if (status === 'Approved' || status === 'Verified') return <CheckCircleIcon color="success" />;
    if (status === 'Pending') return <PendingIcon color="warning" />;
    if (status === 'Rejected') return <CancelIcon color="error" />;
    return <UploadFileIcon />;
  };

  // ✅ File selection and validation
  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
      const maxFileSize = 2 * 1024 * 1024; // 2MB limit

      if (!allowedTypes.includes(file.type)) {
        showNotification("Invalid file type. Only PDF, JPEG, or PNG are allowed.", "error");
        return;
      }

      if (file.size > maxFileSize) {
        showNotification("File is too large. Maximum size is 2MB.", "error");
        return;
      }
      setSelectedFile(file);
    }
  };

  // ✅ Open file dialog
  const handleUploadClick = () => {
    if (isUploadAuthorized) {
      fileInputRef.current.click();
    } else {
      showNotification("Document upload requires OTP verification first.", 'warning');
    }
  };

  // ✅ Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
  };
  
  // ✅ Confirm upload (with manual name if needed)
  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    if (isManualEntry && !manualDocName.trim()) {
      showNotification("Please enter a name for this document (e.g., SSLC Certificate).", 'warning');
      return;
    }
    
    if (!isUploadAuthorized) {
      showNotification("Upload is blocked. Please verify your identity (OTP) first.", 'error');
      return;
    }

    setIsUploading(true);
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      showNotification("Session expired. Please log in again.", 'error');
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('type', isManualEntry ? manualDocName.trim() : doc.name);

    try {
      await axios.post(`${API_URL}/api/employee/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      const docLabel = isManualEntry ? manualDocName : doc.name;
      showNotification(`'${docLabel}' uploaded successfully and is Pending HR review!`, 'success');
      setSelectedFile(null);
      setManualDocName('');

      if (onUploadSuccess) onUploadSuccess();
      
    } catch (error) {
      const message = error.response?.data?.message || 'Upload failed.';
      if (message.includes('Invalid file type')) {
        showNotification('Upload failed: Only PDF, JPEG, or PNG files are allowed.', 'error');
      } else if (message.includes('File too large')) {
        showNotification('Upload failed: File must be less than 2MB.', 'error');
      } else {
        showNotification(message, 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ Allow re-upload if status is "Not Uploaded" or "Rejected"
  const requiresUploadButton = (doc.status === 'Not Uploaded' || doc.status === 'Rejected');
  const isManualReady = isManualEntry && manualDocName.trim().length > 0;

  // ✅ Fixed clean file preview/download path
  const fileUrl = doc.filePath ? `${API_URL}${doc.filePath}` : null;

  return (
    <ListItem
      secondaryAction={
        // Show download button if uploaded
        (doc.status !== 'Not Uploaded' && doc.filePath) ? (
          <Tooltip title="Download / View Document">
            <IconButton
              edge="end"
              aria-label="download"
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        ) : (
          // Else show upload buttons if re-upload allowed
          requiresUploadButton && (
            <>
              {selectedFile ? (
                <Tooltip title={isUploadAuthorized ? "Confirm upload" : "OTP verification required"}>
                  <span>
                    <Button 
                      variant="contained"
                      size="small"
                      onClick={handleConfirmUpload}
                      disabled={isUploading || !isUploadAuthorized || (isManualEntry && !isManualReady)}
                    >
                      {isUploading ? <CircularProgress size={20} color="inherit" /> : 'Confirm'}
                    </Button>
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title={isUploadAuthorized ? "Select file to upload" : "OTP verification required"}>
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<UploadFileIcon />}
                      onClick={handleUploadClick}
                      disabled={!isUploadAuthorized}
                    >
                      Select File
                    </Button>
                  </span>
                </Tooltip>
              )}
            </>
          )
        )
      }
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelected} 
        style={{ display: 'none' }} 
        accept="image/png, image/jpeg, application/pdf"
      />

      <ListItemIcon>{getStatusIcon(doc.status)}</ListItemIcon>
      
      <ListItemText 
        primary={
          isManualEntry ? (
            <TextField
              size="small"
              placeholder="Enter Document Name (e.g., SSLC Certificate)"
              value={manualDocName}
              onChange={(e) => setManualDocName(e.target.value)}
              sx={{ width: '100%', maxWidth: '220px' }}
              disabled={doc.filePath || !isUploadAuthorized}
            />
          ) : (
            doc.name
          )
        }
        secondary={
          selectedFile ? (
            <Chip 
              label={selectedFile.name} 
              onDelete={handleRemoveFile} 
              color="info" 
              size="small" 
              sx={{ mt: 1 }}
            />
          ) : (
            doc.filePath ? doc.status : 'Not Uploaded'
          )
        }
        sx={{ pr: requiresUploadButton ? 18 : 0 }}
      />
    </ListItem>
  );
};

export default DocumentUploadItem;
