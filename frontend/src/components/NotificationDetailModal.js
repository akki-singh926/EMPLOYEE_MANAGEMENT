// src/components/NotificationDetailModal.js
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, Typography, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, DialogActions, Button
} from '@mui/material';

// This helper function creates a nice table for the "meta" data
const RenderMetaDetails = ({ meta }) => {
  if (!meta) return null;

  // Case 1: For 'Approved' (has before/after)
  if (meta.before && meta.after) {
    const fields = Object.keys(meta.after);
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>Detailed Changes</Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Field</TableCell>
                <TableCell>Old Value</TableCell>
                <TableCell>New Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((field) => (
                <TableRow key={field}>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{field}</TableCell>
                  <TableCell>{meta.before[field] || 'N/A'}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{meta.after[field]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  // Case 2: For 'Rejected' or 'Requested' (has 'requested' or 'requestedFields')
  const requestedData = meta.requested || meta.requestedFields;
  if (requestedData) {
    const isSimpleArray = Array.isArray(requestedData);
    const fields = isSimpleArray ? requestedData : Object.keys(requestedData);

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>Requested Changes</Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Field</TableCell>
                {!isSimpleArray && <TableCell>Requested Value</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((field) => (
                <TableRow key={field}>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {isSimpleArray ? field : field}
                  </TableCell>
                  {!isSimpleArray && (
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {requestedData[field]}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  return null;
};

const NotificationDetailModal = ({ notification, open, onClose }) => {
  if (!notification) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {notification.title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          {notification.message}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {new Date(notification.createdAt).toLocaleString()}
        </Typography>
        
        {/* This is where the "elaboration" happens */}
        <RenderMetaDetails meta={notification.meta} />

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationDetailModal;