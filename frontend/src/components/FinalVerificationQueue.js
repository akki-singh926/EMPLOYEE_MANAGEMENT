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
import { sendNotification } from '../api/Notification';

const FinalVerificationQueue = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [finalStatus, setFinalStatus] = useState('Verified');
  const [remarks, setRemarks] = useState('');
  const [employeeMap, setEmployeeMap] = useState({});

  const { showNotification } = useNotification();
  const API_BASE_URL = 'http://localhost:8080/api/superAdmin';
  const SERVER_BASE = 'http://localhost:8080'; // ✅ Added for clean file path usage

  // ✅ Fetch Employees
  const fetchEmployees = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const map = {};
      (res.data.employees || []).forEach(emp => {
        if (emp.employeeId) {
          map[emp.employeeId] = { email: emp.email, name: emp.name };
        }
      });
      setEmployeeMap(map);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  }, []);

  // ✅ Fetch Verified Documents (HR approved docs waiting for final review)
  const fetchVerificationQueue = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) return setIsLoading(false);

    try {
      const response = await axios.get(`${API_BASE_URL}/verified-documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showNotification('Failed to load documents.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchEmployees();
    fetchVerificationQueue();
  }, [fetchEmployees, fetchVerificationQueue]);

  // Helpers
  const lookupEmail = (id) => employeeMap[id]?.email || null;
  const lookupName = (id) => employeeMap[id]?.name || 'Employee';

  // ✅ Handle Final Verification / Rejection
  const handleFinalVerification = async () => {
    if (!selectedDoc) return;
    setIsSubmitting(true);
    const token = localStorage.getItem('authToken');

    if (finalStatus === 'Rejected' && (!remarks || remarks.length < 5)) {
      showNotification('Rejection requires remarks (min 5 chars).', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      await axios.patch(
        `${API_BASE_URL}/documents/${selectedDoc.employeeId}/${selectedDoc._id}/verify`,
        { finalStatus, remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const email = lookupEmail(selectedDoc.employeeId);
      const name = lookupName(selectedDoc.employeeId);
      const docName = selectedDoc.name || 'document';

      // ✅ Smart email content based on status
      let subject, htmlMessage;
      if (finalStatus === 'Verified') {
        subject = `✅ Document Verified Successfully`;
        htmlMessage = `
          <p>Hello ${name},</p>
          <p>Your submitted document <b>${docName}</b> has been 
          <strong style="color:green;">verified</strong> by the Super Admin.</p>
          <p>You may now proceed with the next steps in your profile or HR process.</p>
          <br/><p>Regards,<br/>Super Admin Team</p>`;
      } else {
        subject = `❌ Document Verification Rejected`;
        htmlMessage = `
          <p>Hello ${name},</p>
          <p>Your document <b>${docName}</b> has been 
          <strong style="color:red;">rejected</strong> after final review.</p>
          <p><b>Reason:</b> ${remarks || 'No reason provided.'}</p>
          <br/><p>Please review your document and resubmit for verification.</p>
          <br/><p>Regards,<br/>Super Admin Team</p>`;
      }

      // ✅ Send email only if valid address
      if (email && email.includes('@')) {
        await sendNotification(email, subject, htmlMessage, token);
        console.log('📧 Email sent to:', email);
      } else {
        showNotification('No valid email found. Notification not sent.', 'warning');
      }

      showNotification(`Document marked as ${finalStatus}.`, 'success');
      setDialogOpen(false);
      fetchVerificationQueue();
    } catch (error) {
      console.error('Final verification failed:', error);
      showNotification(error.response?.data?.message || 'Failed to finalize verification.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDialog = (doc) => {
    setSelectedDoc(doc);
    setFinalStatus('Verified');
    setRemarks('');
    setDialogOpen(true);
  };

  // ✅ Fixed: Proper preview path (no /backend prefix)
  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith('/uploads')) return `${SERVER_BASE}${filePath}`;
    return `${SERVER_BASE}/uploads/${filePath}`;
  };

  if (isLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <>
      <Card sx={{ mt: 3, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
            Documents Awaiting Final Review ({documents.length})
          </Typography>

          {documents.length === 0 ? (
            <Alert severity="info">No documents awaiting verification.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    {['Employee ID', 'Document', 'HR Status', 'Date Uploaded', 'Actions'].map((head) => (
                      <TableCell key={head} sx={{ fontWeight: 'bold' }}>
                        {head}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc._id}>
                      <TableCell>{doc.employeeId}</TableCell>
                      <TableCell>{doc.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={doc.status} 
                          color={doc.status === 'Approved' ? 'success' : 'warning'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Final Review">
                          <span>
                            <Button
                              variant="contained"
                              color="secondary"
                              size="small"
                              startIcon={<VerifiedUserIcon />}
                              onClick={() => handleOpenDialog(doc)}
                            >
                              Review
                            </Button>
                          </span>
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

      {/* --- Final Verification Dialog --- */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Final Verification: {selectedDoc?.name}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Left: Preview */}
            <Grid item xs={12} md={7}>
              <Typography variant="subtitle1" fontWeight={600}>File Preview</Typography>
              {selectedDoc?.filePath ? (
                <Box sx={{ height: 400, border: '1px solid #ccc', mt: 1 }}>
                  <iframe
                    src={getFileUrl(selectedDoc.filePath)}
                    title={selectedDoc.name}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </Box>
              ) : (
                <Alert severity="warning" sx={{ mt: 2 }}>No file available.</Alert>
              )}

              {selectedDoc?.filePath && (
                <Link
                  href={getFileUrl(selectedDoc.filePath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ mt: 2, display: 'block' }}
                >
                  Open / Download File
                </Link>
              )}
            </Grid>

            {/* Right: Verification Form */}
            <Grid item xs={12} md={5}>
              <Typography variant="subtitle1" fontWeight={600}>Super Admin Action</Typography>
              <FormControl fullWidth size="small" sx={{ mt: 2, mb: 2 }}>
                <Select value={finalStatus} onChange={(e) => setFinalStatus(e.target.value)}>
                  <MenuItem value="Verified">Verified</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Remarks (Required if Rejected)"
                fullWidth
                multiline
                rows={4}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
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

