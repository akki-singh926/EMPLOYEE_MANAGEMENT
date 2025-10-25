// src/components/JobDetails.js
import React from 'react';
import { List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import GroupIcon from '@mui/icons-material/Group';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';

const JobDetails = ({ employee }) => {
  if (!employee) return null; // avoid errors if no data

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
          <ListItemText
            primary="Designation"
            secondary={employee.designation || 'Pending HR assignment'}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <GroupIcon />
          </ListItemIcon>
          <ListItemText
            primary="Department"
            secondary={employee.department || 'Pending HR assignment'}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <SupervisorAccountIcon />
          </ListItemIcon>
          <ListItemText
            primary="Reporting Manager"
            secondary={employee.reportingManager || 'Pending HR assignment'}
          />
        </ListItem>
      </List>
    </>
  );
};

export default JobDetails;
