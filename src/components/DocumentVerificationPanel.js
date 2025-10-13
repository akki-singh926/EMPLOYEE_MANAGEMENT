// src/components/DocumentVerificationPanel.js
import React, { useState } from 'react';
import { 
  Box, Typography, Button, Grid, Paper, List, 
  ListItem, ListItemText, Select, MenuItem, InputLabel, 
  FormControl, TextField, Divider 
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useNotification } from '../context/NotificationContext';

// Mock data for a single employee's documents
const mockEmployee = {
    id: 'EMP002',
    name: 'Jane Smith',
    documents: [
        { name: 'Aadhaar Card', status: 'Pending', fileUrl: '/mock/aadhaar.pdf' },
        { name: 'PAN Card', status: 'Rejected', fileUrl: '/mock/pan.pdf', remarks: 'Blurry image.' },
        { name: 'Certificates', status: 'Approved', fileUrl: '/mock/cert.pdf' },
        { name: 'ID Proof', status: 'Pending', fileUrl: '/mock/idproof.pdf' },
    ]
};

const DocumentVerificationPanel = () => {
    const { showNotification } = useNotification();
    const [verificationStatus, setVerificationStatus] = useState({});
    const [remark, setRemark] = useState('');
    const [currentDocUrl, setCurrentDocUrl] = useState(mockEmployee.documents[0].fileUrl);
    const [currentDocName, setCurrentDocName] = useState(mockEmployee.documents[0].name);

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

    const handleFinalSubmit = () => {
        const payload = mockEmployee.documents.map(doc => ({
            name: doc.name,
            status: verificationStatus[doc.name] || doc.status, // Use selected status or current status
            adminRemark: doc.name === currentDocName ? remark : undefined, // Only send remark for the currently viewed doc
        }));

        console.log('Verification Payload Ready:', payload);

        // --- API call would go here: POST /api/admin/verify-documents ---
        // This endpoint requires Admin role and the payload above.

        showNotification(`Verification for ${mockEmployee.name} submitted! (Check console for payload)`, 'success');
        
        // After successful API call, you would typically navigate back to the employee list
    };

    return (
        <Container component="main" sx={{ mt: 4, mb: 4 }} maxWidth="lg">
            <Typography variant="h4" gutterBottom>Document Verification: {mockEmployee.name}</Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                Review and approve/reject documents for **{mockEmployee.id}**.
            </Typography>

            <Grid container spacing={3}>
                {/* --- LEFT COLUMN: DOCUMENT LIST & ACTIONS --- */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Document List</Typography>
                        <List dense>
                            {mockEmployee.documents.map((doc) => (
                                <ListItem 
                                    key={doc.name} 
                                    secondaryAction={getIcon(verificationStatus[doc.name] || doc.status)}
                                    onClick={() => { setCurrentDocUrl(doc.fileUrl); setCurrentDocName(doc.name); }}
                                    sx={{ 
                                        cursor: 'pointer', 
                                        backgroundColor: currentDocName === doc.name ? '#f0f0f0' : 'transparent',
                                        borderRadius: 1
                                    }}
                                >
                                    <AttachFileIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <ListItemText primary={doc.name} secondary={doc.status} />
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
                                value={verificationStatus[currentDocName] || mockEmployee.documents.find(d => d.name === currentDocName).status || 'Pending'}
                                label="Set Status"
                                onChange={(e) => handleStatusChange(currentDocName, e.target.value)}
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
                        />

                        <Button 
                            fullWidth 
                            variant="contained" 
                            color="secondary" 
                            onClick={handleFinalSubmit}
                        >
                            Save Verification & Notify
                        </Button>
                    </Paper>
                </Grid>

                {/* --- RIGHT COLUMN: DOCUMENT PREVIEW --- */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Preview: {currentDocName}</Typography>
                        <Box sx={{ height: 600, border: '1px solid #ccc', mt: 2 }}>
                            {/* --- Mock Preview Area --- */}
                            <iframe 
                                src={currentDocUrl} 
                                title={currentDocName}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                            />
                            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f9f9f9' }}>
                                <Typography variant="caption">Viewing document from URL: {currentDocUrl}</Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default DocumentVerificationPanel;