// src/components/FinalVerificationQueue.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
    Box, Typography, Card, CardContent, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, 
    Select, MenuItem, FormControl, Grid, Chip, Tooltip, Link
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';

const FinalVerificationQueue = () => {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [finalStatus, setFinalStatus] = useState('Verified');
    const [remarks, setRemarks] = useState('');

    const { showNotification } = useNotification();
    const API_BASE_URL = 'http://localhost:8080/api/superAdmin';
    const UPLOADS_PATH = 'http://localhost:8080/uploads'; // Use correct backend port

    // --- Fetch verification queue ---
    const fetchVerificationQueue = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) {
            setIsLoading(false);
            return;
        }
        try {
            const response = await axios.get(`${API_BASE_URL}/verified-documents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDocuments(response.data.documents || []);
        } catch (error) {
            console.error('Error fetching verification queue:', error);
            showNotification("Failed to load documents for final review.", 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchVerificationQueue();
    }, [fetchVerificationQueue]);

    // --- Handle final verification ---
    const handleFinalVerification = async () => {
        if (!selectedDoc) return;
        setIsSubmitting(true);

        const token = localStorage.getItem('authToken');

        if (finalStatus === 'Rejected' && (!remarks || remarks.length < 5)) {
            showNotification("Rejection requires detailed remarks (min 5 characters).", 'error');
            setIsSubmitting(false);
            return;
        }

        try {
            await axios.patch(
                `${API_BASE_URL}/documents/${selectedDoc.employeeId}/${selectedDoc._id}/verify`,
                { finalStatus, remarks },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showNotification(`Document ${finalStatus.toLowerCase()}.`, 'success');

            setDialogOpen(false);
            fetchVerificationQueue(); // Refresh the list
        } catch (error) {
            console.error('Final verification failed:', error);
            showNotification(error.response?.data?.message || "Failed to finalize document status.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenDialog = (doc) => {
        setSelectedDoc(doc);
        setFinalStatus('Verified');
        setRemarks(doc.remarks || '');
        setDialogOpen(true);
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }

    return (
        <>
            <Card sx={{ mt: 3, borderRadius: 2, boxShadow: 3 }}>
                <CardContent>
                    <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
                        Documents Awaiting Final Super Admin Review ({documents.length})
                    </Typography>

                    {documents.length === 0 ? (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            No documents are currently awaiting final verification.
                        </Alert>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'background.default' }}>
                                        {['Employee ID', 'Document Name', 'HR Status', 'Date Uploaded', 'Actions'].map((head) => (
                                            <TableCell key={head} sx={{ fontWeight: 'bold' }}>{head}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {documents.map((doc) => (
                                        <TableRow key={doc._id}>
                                            <TableCell sx={{ fontWeight: 500 }}>{doc.employeeId}</TableCell>
                                            <TableCell>{doc.name}</TableCell>
                                            <TableCell>
                                                <Chip label={doc.status} color="success" size="small" />
                                            </TableCell>
                                            <TableCell>{new Date(doc.uploadedAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Tooltip title="View & Verify">
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        color="secondary"
                                                        startIcon={<VerifiedUserIcon />}
                                                        onClick={() => handleOpenDialog(doc)}
                                                    >
                                                        Final Review
                                                    </Button>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* --- Verification Modal --- */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Final Verification: {selectedDoc?.name}</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        {/* File Preview */}
                        <Grid item xs={12} md={7}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>File Preview</Typography>
                            {selectedDoc?.filename ? (
                                <Box sx={{ height: 400, border: '1px solid #ccc' }}>
     <iframe 
  src={`${UPLOADS_PATH}/${encodeURIComponent(selectedDoc?.filename)}`}
  title={selectedDoc?.name}
  style={{ width: '100%', height: '100%', border: 'none' }}
/>

                                </Box>
                            ) : (
                                <Alert severity="warning">No file found for preview.</Alert>
                            )}
                            <Box sx={{ mt: 1 }}>
                                <Link
                                    href={`${UPLOADS_PATH}/${encodeURIComponent(selectedDoc?.filename)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open in New Tab / Download
                                </Link>
                            </Box>
                            <Alert severity="info" sx={{ mt: 2 }}>
                                This document was approved by HR and requires final Super Admin verification.
                            </Alert>
                        </Grid>

                        {/* Verification Form */}
                        <Grid item xs={12} md={5}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Super Admin Action</Typography>

                            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                <Select
                                    value={finalStatus}
                                    onChange={(e) => setFinalStatus(e.target.value)}
                                >
                                    <MenuItem value={'Verified'}>Verified (Complete)</MenuItem>
                                    <MenuItem value={'Rejected'}>Final Rejection</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Super Admin Remarks (Required for Rejection)"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                sx={{ mb: 2 }}
                                disabled={finalStatus === 'Verified'}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} variant="outlined">Cancel</Button>
                    <Button
                        onClick={handleFinalVerification}
                        variant="contained"
                        color={finalStatus === 'Rejected' ? 'error' : 'success'}
                        disabled={isSubmitting || (finalStatus === 'Rejected' && remarks.length < 5)}
                    >
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : `Confirm ${finalStatus}`}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default FinalVerificationQueue;
