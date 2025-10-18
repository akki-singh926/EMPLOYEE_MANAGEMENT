// src/components/DocumentUploadItem.js
import React, { useState, useRef } from 'react';
import { Button, ListItem, ListItemIcon, ListItemText, Chip, CircularProgress, Tooltip } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';

const DocumentUploadItem = ({ doc, onUploadSuccess, isUploadAuthorized }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    
    const { showNotification } = useNotification();

    const getStatusIcon = (status) => {
        if (status === 'Approved') return <CheckCircleIcon color="success" />;
        if (status === 'Pending') return <PendingIcon color="warning" />;
        if (status === 'Rejected') return <CancelIcon color="error" />;
        return <UploadFileIcon />;
    };

    const handleConfirmUpload = async () => {
        if (!selectedFile) return;
        
        if (!isUploadAuthorized) {
            showNotification("Upload is blocked. Please verify your identity (OTP) first.", 'error');
            return;
        }

        setIsUploading(true);
        const token = localStorage.getItem('authToken');
        
        // Error check: If token is missing (user logged out during process)
        if (!token) {
            showNotification("Session expired. Please log in again.", 'error');
            setIsUploading(false);
            return;
        }

        const formData = new FormData();
        formData.append('document', selectedFile); 
        formData.append('type', doc.name); 

        try {
            await axios.post('http://localhost:8080/api/employee/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
            });

            showNotification(`'${doc.name}' uploaded successfully!`, 'success');
            setSelectedFile(null); 
            
            if (onUploadSuccess) {
                onUploadSuccess(); 
            }
            
        } catch (error) {
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
        if (isUploadAuthorized) {
            fileInputRef.current.click();
        } else {
            showNotification("Document upload requires prior identity verification (OTP).", 'warning');
        }
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
                <Tooltip title={isUploadAuthorized ? "" : "Unlock uploads via OTP verification below"}>
                    <Button 
                        variant="contained" 
                        size="small" 
                        onClick={handleConfirmUpload}
                        disabled={isUploading || !isUploadAuthorized} 
                    >
                        {isUploading ? <CircularProgress size={20} color="inherit" /> : 'Confirm'}
                    </Button>
                </Tooltip>
            ) : (
                <Tooltip title={isUploadAuthorized ? "" : "Unlock uploads via OTP verification below"}>
                    <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<UploadFileIcon />}
                        onClick={handleUploadClick}
                        disabled={!isUploadAuthorized} 
                    >
                        Select File
                    </Button>
                </Tooltip>
            )}
        </ListItem>
    );
};

export default DocumentUploadItem;