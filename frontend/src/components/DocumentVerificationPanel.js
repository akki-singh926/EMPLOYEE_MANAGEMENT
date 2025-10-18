// src/components/DocumentVerificationPanel.js
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Grid, Card, CardContent, CircularProgress,
  ListItem, ListItemText, Select, MenuItem, InputLabel, 
  FormControl, TextField, Divider, Container, List, useTheme, IconButton, Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useNotification } from '../context/NotificationContext'; // <-- Correct filenameimport { useParams } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// --- Base URL Constants (Hardcoded for stability since we cannot use .env in component) ---
const BACKEND_HOST = 'http://localhost:8080';
const DOCS_ROUTE = '/api/hr/documents';
const UPLOADS_PATH = '/uploads';
const API_BASE_URL = 'http://localhost:8080/api/hr'; 
// ----------------------------------------
const DocumentVerificationPanel = () => {
    const { employeeId } = useParams(); 
    const theme = useTheme();

    const { showNotification } = useNotification();
    
    const [employee, setEmployee] = useState(null); 
    const [documents, setDocuments] = useState([]); 
    const [verificationStatus, setVerificationStatus] = useState({});
    const [remark, setRemark] = useState('');
    const [currentDocUrl, setCurrentDocUrl] = useState(''); 
    const [currentDocName, setCurrentDocName] = useState('Select a Document');
    const [isLoading, setIsLoading] = useState(true);
    
    // --- 1. FETCH DOCUMENTS LOGIC ---
    const fetchDocuments = async (id) => {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');

        if (!id || !token) { 
            setIsLoading(false);
            return; 
        }

        try {
            // Fetch documents using the API proxy
            const response = await axios.get(`${DOCS_ROUTE}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const fetchedDocs = response.data.documents || [];
            
            setEmployee(response.data.user || response.data); 
            setDocuments(fetchedDocs);

            if (fetchedDocs.length > 0) {
                const firstDoc = fetchedDocs[0];
                setCurrentDocName(firstDoc.name);
                // FIX: Use the ABSOLUTE path for the iframe source
                setCurrentDocUrl(`${BACKEND_HOST}${UPLOADS_PATH}/${firstDoc.filename}`); 
                setRemark(firstDoc.remarks || '');
            } else {
                setCurrentDocName('No Documents Uploaded');
            }

        } catch (error) {
            console.error('Error fetching employee documents:', error);
            showNotification(`Could not load documents for ${id}.`, 'error');
        } finally {
            setIsLoading(false);
        }
    };


    // --- 2. useEffect Call (Triggers fetch only when ID is stable) ---
    useEffect(() => {
        if (employeeId) {
            fetchDocuments(employeeId); 
        }
    }, [employeeId]); 


    // --- Helper Functions ---
    const getIcon = (status) => {
        if (status === 'Approved') return <CheckCircleIcon color="success" />;
        if (status === 'Pending') return <PendingIcon color="warning" />;
        return <CancelIcon color="error" />;
    };

    const handleStatusChange = (docName, status) => {
        setVerificationStatus(prev => ({
            ...prev,
            [docName]: status,
        }));
    };

    const handleDocumentSelect = (doc) => {
        const fullDoc = documents.find(d => d.name === doc.name);

        if (fullDoc && fullDoc.filename) {
            // FIX: Use the ABSOLUTE path for the iframe source
            setCurrentDocUrl(`${BACKEND_HOST}${UPLOADS_PATH}/${fullDoc.filename}`);
        } else {
            setCurrentDocUrl(''); 
            showNotification("No file uploaded for this document yet.", 'warning');
        }
        
        setCurrentDocName(doc.name);
        setRemark(fullDoc?.remarks || '');
        
        const currentStatus = verificationStatus[doc.name] || doc.status;
        setVerificationStatus(prev => ({ ...prev, [doc.name]: currentStatus }));
    };

    const handleFinalSubmit = async () => {
        const docToUpdate = documents.find(d => d.name === currentDocName);
        if (!docToUpdate || !docToUpdate._id) return showNotification("Please select a valid uploaded document.", 'warning');
        
        const finalStatus = verificationStatus[currentDocName] || docToUpdate.status;

        try {
            // Endpoint: PATCH /api/hr/documents/:employeeId/:docId
            await axios.patch(`${DOCS_ROUTE}/${employeeId}/${docToUpdate._id}`, // Use the relative path for API calls
                { status: finalStatus, remarks: remark },
                { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
            );

            showNotification(`Document ${currentDocName} status updated to ${finalStatus}.`, 'success');
            fetchDocuments(employeeId); // Refresh list to show new status
            
        } catch (error) {
            showNotification("Failed to save verification status.", 'error');
        }
    };
    
    if (!employeeId) {
        return <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>;
    }
    
    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }


    return (
        <Container component="main" sx={{ mt: 4, mb: 4 }} maxWidth="lg">
            <Typography variant="h4" gutterBottom>Document Verification: {employee?.name || employeeId || 'Employee'}</Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                Review and approve/reject documents for **{employeeId || 'Loading...'}**. 
            </Typography>

            <Grid container spacing={3}>
                {/* --- LEFT COLUMN: DOCUMENT LIST & ACTIONS --- */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent> 
                            <Typography variant="h6" gutterBottom>Document List</Typography>
                            
                            {documents.length === 0 ? (
                                <Typography color={theme.palette.error.main}>This employee has no documents uploaded.</Typography>
                            ) : (
                                <>
                                    <List dense>
                                        {documents.map((doc) => (
                                            <ListItem 
                                                key={doc.name} 
                                                secondaryAction={getIcon(verificationStatus[doc.name] || doc.status)}
                                                onClick={() => handleDocumentSelect(doc)}
                                                sx={{ 
                                                    cursor: 'pointer', 
                                                    backgroundColor: currentDocName === doc.name ? theme.palette.action.selected : 'transparent',
                                                    borderRadius: 1
                                                }}
                                            >
                                                <AttachFileIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                                                <ListItemText primary={doc.name} secondary={`Status: ${doc.status}`} />
                                            </ListItem>
                                        ))}
                                    </List>

                                    <Divider sx={{ my: 2 }} />

                                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                                        Verification Action ({currentDocName})
                                    </Typography>
                                    
                                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                        <InputLabel id="status-select-label">Set Status</InputLabel>
                                        <Select
                                            labelId="status-select-label"
                                            value={verificationStatus[currentDocName] || documents.find(d => d.name === currentDocName)?.status || 'Pending'}
                                            label="Set Status"
                                            onChange={(e) => handleStatusChange(currentDocName, e.target.value)}
                                            disabled={!currentDocUrl}
                                        >
                                            <MenuItem value={'Pending'}>Pending</MenuItem>
                                            <MenuItem value={'Approved'}>Approve</MenuItem>
                                            <MenuItem value={'Rejected'}>Reject</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Admin Remarks"
                                        placeholder="Reason for rejection or approval notes..."
                                        value={remark}
                                        onChange={(e) => setRemark(e.target.value)}
                                        sx={{ mb: 2 }}
                                        disabled={!currentDocUrl}
                                    />

                                    <Button 
                                        fullWidth 
                                        variant="contained" 
                                        color="secondary" 
                                        onClick={handleFinalSubmit}
                                        disabled={!currentDocUrl}
                                    >
                                        Save Verification & Notify
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* --- RIGHT COLUMN: DOCUMENT PREVIEW --- */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}> 
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Preview: {currentDocName}</Typography>
                            {currentDocUrl ? (
                                <Box sx={{ height: 600, border: '1px solid #ccc', mt: 2 }}>
                                    {/* The iframe will attempt to load the file from the backend server */}
                                    <iframe 
                                        src={currentDocUrl} 
                                        title={currentDocName}
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                    />
                                </Box>
                            ) : (
                                <Box sx={{ height: 600, border: '1px dashed #ccc', mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography color="textSecondary">Select a document from the list to preview.</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default DocumentVerificationPanel;