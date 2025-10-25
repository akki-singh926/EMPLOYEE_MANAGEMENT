// src/components/DocumentVerificationPanel.js
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Grid, Card, CardContent, CircularProgress,
  ListItem, ListItemText, Select, MenuItem, InputLabel, 
  FormControl, TextField, Divider, Container, List, useTheme
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useNotification } from '../context/NotificationContext';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BACKEND_HOST = 'http://localhost:8080';
const DOCS_ROUTE = '/api/hr/documents';
const UPLOADS_PATH = '/uploads';

const DocumentVerificationPanel = () => {
    const { employeeId } = useParams(); 
    const theme = useTheme();
    const { showNotification } = useNotification();
    
    const [employee, setEmployee] = useState(null); 
    const [documents, setDocuments] = useState([]); 
    const [verificationStatus, setVerificationStatus] = useState({});
    const [remark, setRemark] = useState('');
    const [currentDocUrl, setCurrentDocUrl] = useState(''); 
    const [currentDocId, setCurrentDocId] = useState(null);
    const [currentDocName, setCurrentDocName] = useState('Select a Document');
    const [isLoading, setIsLoading] = useState(true);
    
    // --- Fetch documents
    const fetchDocuments = async (id) => {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');

        if (!id || !token) { 
            setIsLoading(false);
            return; 
        }

        try {
            const response = await axios.get(`${DOCS_ROUTE}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const fetchedDocs = response.data.documents || [];
            setEmployee(response.data.user || response.data); 
            setDocuments(fetchedDocs);

            if (fetchedDocs.length > 0) {
                const firstDoc = fetchedDocs[0];
                setCurrentDocId(firstDoc._id);
                setCurrentDocName(firstDoc.name);
                setCurrentDocUrl(`${BACKEND_HOST}${UPLOADS_PATH}/${encodeURIComponent(firstDoc.filename)}`);
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

    useEffect(() => {
        if (employeeId) fetchDocuments(employeeId); 
    }, [employeeId]); 

    // --- Helpers
    const getIcon = (status) => {
        if (status === 'Approved') return <CheckCircleIcon color="success" />;
        if (status === 'Pending') return <PendingIcon color="warning" />;
        return <CancelIcon color="error" />;
    };

    const handleStatusChange = (docId, status) => {
        setVerificationStatus(prev => ({
            ...prev,
            [docId]: status,
        }));
    };

    const handleDocumentSelect = (doc) => {
        setCurrentDocId(doc._id);
        setCurrentDocName(doc.name);
        setCurrentDocUrl(`${BACKEND_HOST}${UPLOADS_PATH}/${encodeURIComponent(doc.filename)}`);
        setRemark(doc.remarks || '');

        const currentStatus = verificationStatus[doc._id] || doc.status;
        setVerificationStatus(prev => ({ ...prev, [doc._id]: currentStatus }));
    };

    const handleFinalSubmit = async () => {
        const docToUpdate = documents.find(d => d._id === currentDocId);
        if (!docToUpdate) return showNotification("Please select a valid uploaded document.", 'warning');
        
        const finalStatus = verificationStatus[currentDocId] || docToUpdate.status;

        try {
            await axios.patch(`${DOCS_ROUTE}/${employeeId}/${docToUpdate._id}`,
                { status: finalStatus, remarks: remark },
                { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
            );

            showNotification(`Document ${docToUpdate.name} status updated to ${finalStatus}.`, 'success');
            fetchDocuments(employeeId);
            
        } catch (error) {
            showNotification("Failed to save verification status.", 'error');
        }
    };
    
    if (!employeeId || isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Box>;
    }

    return (
        <Container component="main" sx={{ mt: 4, mb: 4 }} maxWidth="lg">
            <Typography variant="h4" gutterBottom>Document Verification: {employee?.name || employeeId}</Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                Review and approve/reject documents for <strong>{employeeId}</strong>.
            </Typography>

            <Grid container spacing={3}>
                {/* LEFT: Document List */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Document List</Typography>
                            {documents.length === 0 ? (
                                <Typography color={theme.palette.error.main}>No documents uploaded.</Typography>
                            ) : (
                                <>
                                    <List dense>
                                        {documents.map((doc) => (
                                            <ListItem 
                                                key={doc._id}
                                                secondaryAction={getIcon(verificationStatus[doc._id] || doc.status)}
                                                onClick={() => handleDocumentSelect(doc)}
                                                sx={{ 
                                                    cursor: 'pointer', 
                                                    backgroundColor: currentDocId === doc._id ? theme.palette.action.selected : 'transparent',
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
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={verificationStatus[currentDocId] || documents.find(d => d._id === currentDocId)?.status || 'Pending'}
                                            label="Set Status"
                                            onChange={(e) => handleStatusChange(currentDocId, e.target.value)}
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
                                        placeholder="Notes or reason for rejection"
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

                {/* RIGHT: Document Preview */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}> 
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Preview: {currentDocName}</Typography>
                            {currentDocUrl ? (
                                <Box sx={{ height: 600, border: '1px solid #ccc', mt: 2 }}>
                                    <iframe 
                                        src={currentDocUrl} 
                                        title={currentDocName}
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                    />
                                </Box>
                            ) : (
                                <Box sx={{ height: 600, border: '1px dashed #ccc', mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography color="textSecondary">Select a document to preview.</Typography>
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
