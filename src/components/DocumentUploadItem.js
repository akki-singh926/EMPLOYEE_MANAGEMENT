// src/components/DocumentUploadItem.js
import React, { useState, useRef } from 'react';
import { Button, ListItem, ListItemIcon, ListItemText, Chip, CircularProgress } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';
// import { useAuth } from '../context/AuthContext'; // Not needed if token is from localStorage
import { useNotification } from '../context/NotificationContext';

// The component now accepts the onUploadSuccess prop
const DocumentUploadItem = ({ doc, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Define hooks once at the top
  // const { token } = useAuth(); // Not used, token comes from localStorage
  const { showNotification } = useNotification();

  const getStatusIcon = (status) => {
    if (status === 'Approved') return <CheckCircleIcon color="success" />;
    if (status === 'Pending') return <PendingIcon color="warning" />;
    if (status === 'Rejected') return <CancelIcon color="error" />;
    return <UploadFileIcon />;
  };


  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    // Retrieve the token for authorization
    const token = localStorage.getItem('authToken');
    if (!token) {
        showNotification("Session expired. Please log in again.", 'error');
        setIsUploading(false);
        return;
    }

    // 1. Create FormData object
    const formData = new FormData();
    // CRITICAL: Keys match backend's expectation (document and type)
    formData.append('document', selectedFile); 
    formData.append('type', doc.name); 

    try {
        // 2. Make the API call with the correct URL and headers
        const response = await axios.post('http://localhost:8080/api/employee/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // Required for file uploads
                'Authorization': `Bearer ${token}`,
            },
        });

        console.log('Upload successful:', response.data);
        showNotification(`'${doc.name}' uploaded successfully!`, 'success');
        setSelectedFile(null); // Clear the file selection
        
        // Refresh the list status after a successful upload
        if (onUploadSuccess) {
            onUploadSuccess(); 
        }
        
    } catch (error) {
        console.error('Error uploading file:', error);
        
        // Better error handling for 400 status codes
        const message = error.response?.data?.message || 'Upload failed due to network or server issue.';
        showNotification(message, 'error');
    } finally {
        setIsUploading(false);
    }
  };


  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };
  
  return (
    <ListItem>
      <input type="file" ref={fileInputRef} onChange={handleFileSelected} style={{ display: 'none' }} />
      <ListItemIcon>{getStatusIcon(doc.status)}</ListItemIcon>
      <ListItemText 
        primary={doc.name} 
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
            doc.status
          )
        } 
      />
      {selectedFile ? (
        <Button 
          variant="contained" 
          size="small" 
          onClick={handleConfirmUpload}
          disabled={isUploading}
        >
          {isUploading ? <CircularProgress size={20} color="inherit" /> : 'Confirm'}
        </Button>
      ) : (
        <Button 
          variant="outlined" 
          size="small" 
          startIcon={<UploadFileIcon />}
          onClick={handleUploadClick}
        >
          Select File
        </Button>
      )}
    </ListItem>
  );
};

export default DocumentUploadItem;