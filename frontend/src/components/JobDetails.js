// src/components/JobDetails.js
import React from 'react';
import { List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import GroupIcon from '@mui/icons-material/Group';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';

// --- Mock Data ---
// This information would typically come from the backend.
const mockJobDetails = {
  designation: 'Software Engineer',
  department: 'Technology',
  reportingManager: 'Mr. John Smith',
};

const JobDetails = () => {
  return (
    <>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        This information is managed by HR and is read-only.
      </Typography>
      <List>
        <ListItem>
          <ListItemIcon>
            <BusinessCenterIcon />
          </ListItemIcon>
          <ListItemText primary="Designation" secondary={mockJobDetails.designation} />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <GroupIcon />
          </ListItemIcon>
          <ListItemText primary="Department" secondary={mockJobDetails.department} />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <SupervisorAccountIcon />
          </ListItemIcon>
          <ListItemText primary="Reporting Manager" secondary={mockJobDetails.reportingManager} />
        </ListItem>
      </List>
    </>
  );
};

export default JobDetails;