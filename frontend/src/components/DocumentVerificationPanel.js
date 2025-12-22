import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Grid, Card, CardContent, CircularProgress,
  ListItem, ListItemText, Select, MenuItem, InputLabel, 
  FormControl, TextField, Divider, Container, List, useTheme, IconButton
} from '@mui/material';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';  
import CancelIcon from '@mui/icons-material/Cancel';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';

import { useNotification } from '../context/NotificationContext';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:8080';
const DOCS_ROUTE = `${API_BASE}/api/hr/documents`;

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

  // ✅ Fetch documents for this employee
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
      setEmployee(response.data.user || { name: '', employeeId: id });
      setDocuments(fetchedDocs);

      // ✅ FIX 1: Auto-select first document that HAS a file
      if (fetchedDocs.length > 0) {
        const firstWithFile = fetchedDocs.find(d => d.filePath);
        handleDocumentSelect(firstWithFile || fetchedDocs[0]);
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

  // ✅ Status icon (safe fallback)
  const getIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircleIcon color="success" />;
      case 'Rejected':
        return <CancelIcon color="error" />;
      default:
        return <PendingIcon color="warning" />;
    }
  };

  const handleStatusChange = (docId, status) => {
    setVerificationStatus(prev => ({
      ...prev,
      [docId]: status,
    }));
  };

  // ✅ Clean + safe preview URL builder
  const handleDocumentSelect = (doc) => {
    setCurrentDocId(doc._id);
    setCurrentDocName(doc.name);

    let path = '';
    if (doc.filePath) {
      path = doc.filePath.startsWith('http')
        ? doc.filePath
        : `${API_BASE}${doc.filePath}`;
    }

    setCurrentDocUrl(path);
    setRemark(doc.remarks || '');

    const currentStatus = verificationStatus[doc._id] || doc.status;
    setVerificationStatus(prev => ({ ...prev, [doc._id]: currentStatus }));
  };

  const handleFinalSubmit = async () => {
    const docToUpdate = documents.find(d => d._id === currentDocId);
    if (!docToUpdate) {
      showNotification('Please select a valid uploaded document.', 'warning');
      return;
    }

    const finalStatus = verificationStatus[currentDocId] || docToUpdate.status;

    try {
      await axios.patch(
        `${DOCS_ROUTE}/${employeeId}/${docToUpdate._id}`,
        { status: finalStatus, remarks: remark },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );

      showNotification(`✅ ${docToUpdate.name} marked as ${finalStatus}.`, 'success');
      fetchDocuments(employeeId);

    } catch (error) {
      console.error('Verification update failed:', error);
      showNotification('Failed to save verification status.', 'error');
    }
  };

  if (!employeeId || isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" sx={{ mt: 4, mb: 4 }} maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Document Verification: {employee?.name || employeeId}
      </Typography>

      <Grid container spacing={3}>
        {/* LEFT: Document List */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Document List</Typography>

              {documents.length === 0 ? (
                <Typography color={theme.palette.error.main}>
                  No documents uploaded.
                </Typography>
              ) : (
                <>
                  <List dense>
                    {documents.map(doc => (
                      <ListItem
                        key={doc._id}
                        onClick={() => handleDocumentSelect(doc)}
                        secondaryAction={getIcon(verificationStatus[doc._id] || doc.status)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor:
                            currentDocId === doc._id
                              ? theme.palette.action.selected
                              : 'transparent'
                        }}
                      >
                        <AttachFileIcon sx={{ mr: 1 }} />
                        <ListItemText
                          primary={doc.name}
                          secondary={`Status: ${doc.status}`}
                        />
                        {doc.filePath && (
                          <IconButton
                            href={`${API_BASE}${doc.filePath}`}
                            target="_blank"
                            onClick={e => e.stopPropagation()}
                          >
                            <DownloadIcon />
                          </IconButton>
                        )}
                      </ListItem>
                    ))}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={verificationStatus[currentDocId] || 'Pending'}
                      label="Status"
                      onChange={(e) =>
                        handleStatusChange(currentDocId, e.target.value)
                      }
                      disabled={!currentDocId}
                    >
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Approved">Approve</MenuItem>
                      <MenuItem value="Rejected">Reject</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Admin Remarks"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    sx={{ mb: 2 }}
                    disabled={!currentDocId}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleFinalSubmit}
                    disabled={!currentDocId}
                  >
                    Save Verification
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT: Preview */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                Preview: {currentDocName}
              </Typography>

              {currentDocUrl ? (
                <Box sx={{ height: 600, mt: 2 }}>
                  {currentDocUrl.match(/\.(jpg|jpeg|png)$/i) ? (
                    <img
                      src={currentDocUrl}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                  ) : (
                    <iframe
                      src={currentDocUrl}
                      title="Document Preview"
                      style={{ width: '100%', height: '100%' }}
                    />
                  )}
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 600,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px dashed #ccc',
                    mt: 2
                  }}
                >
                  <Typography color="textSecondary">
                    {!currentDocId
                      ? 'Select a document to preview.'
                      : documents.find(d => d._id === currentDocId)?.filePath
                        ? 'File uploaded. Awaiting verification.'
                        : 'No file uploaded for this document yet.'}
                  </Typography>
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
