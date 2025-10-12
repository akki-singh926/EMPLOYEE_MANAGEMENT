// src/components/DocumentVerification.js
import React from 'react';
import {
  Box, Typography, List, ListItem, ListItemText, Button, Paper
} from '@mui/material';

// --- Mock Data ---
// This would come from a backend API like GET /api/admin/documents/pending
const mockPendingDocuments = [
  { id: 1, userName: 'Jane Smith', docType: 'PAN Card', fileUrl: '#' },
  { id: 2, userName: 'Peter Jones', docType: 'Aadhaar Card', fileUrl: '#' },
  { id: 3, userName: 'Mary Garcia', docType: 'Educational Certificates', fileUrl: '#' },
];

const DocumentVerification = () => {
  const handleApprove = (docId) => {
    alert(`Approving document ${docId}... (API call would be made here)`);
  };

  const handleReject = (docId) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason) {
      alert(`Rejecting document ${docId} for: ${reason}`);
    }
  };

  if (mockPendingDocuments.length === 0) {
    return <Typography>No documents are currently pending verification.</Typography>;
  }

  return (
    <Paper>
      <List>
        {mockPendingDocuments.map((doc) => (
          <ListItem
            key={doc.id}
            divider
            secondaryAction={
              <Box>
                <Button variant="contained" color="success" size="small" sx={{ mr: 1 }} onClick={() => handleApprove(doc.id)}>
                  Approve
                </Button>
                <Button variant="contained" color="error" size="small" onClick={() => handleReject(doc.id)}>
                  Reject
                </Button>
              </Box>
            }
          >
            <ListItemText
              primary={`${doc.userName} - ${doc.docType}`}
              secondary={<a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">View Document</a>}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default DocumentVerification;