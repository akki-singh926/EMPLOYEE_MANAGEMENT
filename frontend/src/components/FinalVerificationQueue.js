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
import { sendNotification } from '../api/Notification'; // ensure path/name is lowercase and matches file

const FinalVerificationQueue = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [finalStatus, setFinalStatus] = useState('Verified');
  const [remarks, setRemarks] = useState('');

  // Employee lookup map: { employeeId: { email, name, ... } }
  const [employeeMap, setEmployeeMap] = useState({});

  const { showNotification } = useNotification();
  const API_BASE_URL = 'http://localhost:8080/api/superAdmin';
  const UPLOADS_PATH = 'http://localhost:8080/uploads';

  // --- Fetch employee list (to get emails) ---
  const fetchEmployees = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = res.data.employees || [];
      const map = {};
      list.forEach(emp => {
        if (emp.employeeId) {
          map[emp.employeeId] = {
            email: emp.email,
            name: emp.name
          };
        }
      });
      setEmployeeMap(map);
    } catch (err) {
      console.error('Failed to fetch employees for email lookup:', err);
      // Not fatal — we can still proceed (but notifications will warn)
    }
  }, []);

  // --- Fetch verified docs ---
  const fetchVerificationQueue = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/verified-documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showNotification('Failed to load documents for final review.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchEmployees();         // build email lookup
    fetchVerificationQueue(); // load docs
  }, [fetchEmployees, fetchVerificationQueue]);

  // --- Helper: find real email by employeeId ---
  const lookupEmail = (employeeId) => {
    if (!employeeId) return null;
    if (employeeMap[employeeId] && employeeMap[employeeId].email) return employeeMap[employeeId].email;
    return null;
  };

  // --- Handle Final Verification ---
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
      // 1️⃣ Update verification status in DB
      await axios.patch(
        `${API_BASE_URL}/documents/${selectedDoc.employeeId}/${selectedDoc._id}/verify`,
        { finalStatus, remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2️⃣ Resolve correct email from employees endpoint (frontend lookup)
      const realEmail = lookupEmail(selectedDoc.employeeId);

      const subject = `Document ${finalStatus}`;
      // Get the employee's real name from the employeeMap
const empName = employeeMap[selectedDoc.employeeId]?.name || 'Employee';
const docName = selectedDoc.name || 'document';

const message =
  finalStatus === 'Verified'
    ? `Hi ${empName}, your document "${docName}" has been verified by the Super Admin.`
    : `Hi ${empName}, your document "${docName}" has been rejected. Remarks: ${remarks}`;

      if (realEmail && realEmail.includes('@')) {
        // sendNotification expects (to, subject, text, token)
        await sendNotification(realEmail, subject, message, token);
        console.log('📧 Email sent to:', realEmail);
      } else {
        // if we couldn't find the email, warn instead of using fake fallback
        console.warn('⚠️ No valid email found for this employee:', selectedDoc.employeeId);
        showNotification('No valid email found for this employee; notification not sent.', 'warning');
      }

      showNotification(`Document ${finalStatus.toLowerCase()} completed.`, 'success');
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

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
                    {['Employee ID', 'Name', 'HR Status', 'Date Uploaded', 'Actions'].map((head) => (
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
                        <Chip label={doc.status} color="success" size="small" />
                      </TableCell>
                      <TableCell>{new Date(doc.uploadedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Tooltip title="Final Review">
                          {/* wrap in span to avoid MUI disabled-child tooltip issues */}
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
              {selectedDoc?.filename ? (
                <Box sx={{ height: 400, border: '1px solid #ccc', mt: 1 }}>
                  <iframe
                    src={`${UPLOADS_PATH}/${encodeURIComponent(selectedDoc.filename)}`}
                    title={selectedDoc.name}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </Box>
              ) : (
                <Alert severity="warning" sx={{ mt: 2 }}>No file available.</Alert>
              )}
              <Link
                href={`${UPLOADS_PATH}/${encodeURIComponent(selectedDoc?.filename)}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ mt: 2, display: 'block' }}
              >
                Open / Download File
              </Link>
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
          <span>
            <Button
              onClick={handleFinalVerification}
              variant="contained"
              color={finalStatus === 'Rejected' ? 'error' : 'success'}
              disabled={isSubmitting || (finalStatus === 'Rejected' && remarks.length < 5)}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : `Confirm ${finalStatus}`}
            </Button>
          </span>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FinalVerificationQueue;
