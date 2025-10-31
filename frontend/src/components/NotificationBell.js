// src/components/NotificationBell.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  IconButton, Badge, Menu, MenuItem, Typography, 
  Box, Tooltip, CircularProgress, Divider, Button 
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import axios from 'axios';
// --- 1. IMPORT THE NEW MODAL ---
import NotificationDetailModal from './NotificationDetailModal'; 

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // --- 2. ADD STATE FOR THE MODAL ---
  const [selectedNotification, setSelectedNotification] = useState(null);

  const open = Boolean(anchorEl);
  const token = localStorage.getItem('authToken');

  const fetchNotifications = useCallback(async () => {
    // ... (your existing fetchNotifications function... no changes needed)
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await axios.get('http://localhost:8080/api/employee/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sorted = (res.data.notifications || []).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setNotifications(sorted);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // --- 3. FUNCTION TO OPEN THE MODAL ---
  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    handleClose(); // Close the dropdown menu
    
    // If the notification is unread, mark it as read
    if (!notification.read) {
       markAsRead(notification);
    }
  };

  // Helper to mark a single notification as read
  const markAsRead = async (notificationToRead) => {
     // Find the original index
     const originalIndex = notifications.findIndex(n => n._id === notificationToRead._id);
     if (originalIndex === -1 || !token) return;

     try {
        await axios.patch(
          `http://localhost:8080/api/employee/notifications/${originalIndex}/read`, 
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Optimistically update the UI
        setNotifications(prev => 
          prev.map(n => n._id === notificationToRead._id ? { ...n, read: true } : n)
        );
     } catch (err) {
        console.error('Failed to mark notification as read:', err);
     }
  };

  const handleMarkAllAsRead = async () => {
    // ... (your existing handleMarkAllAsRead function... no changes needed)
    if (!token) return;
    
    const unreadNotifications = notifications
      .map((notif, index) => ({ ...notif, originalIndex: index }))
      .filter(notif => !notif.read);

    if (unreadNotifications.length === 0) return;

    try {
      await Promise.all(
        unreadNotifications.map(notif => 
          axios.patch(
            `http://localhost:8080/api/employee/notifications/${notif.originalIndex}/read`, 
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton color="inherit" onClick={handleClick}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ 'aria-labelledby': 'notification-button' }}
        PaperProps={{ style: { maxHeight: 400, width: '350px' } }}
      >
        {/* ... (Your existing Menu header) ... */}
         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </Box>
        <Divider sx={{ mb: 1 }} />
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">No new notifications</Typography>
          </MenuItem>
        ) : (
          notifications.map((notif) => (
            <MenuItem 
              key={notif._id} 
              // --- 4. UPDATE ONCLICK ---
              onClick={() => handleNotificationClick(notif)} 
              sx={{ 
                whiteSpace: 'normal', 
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: notif.read ? 'transparent' : 'rgba(90, 69, 255, 0.05)'
              }}
            >
               <Box sx={{ py: 1 }}>
                 <Typography variant="body1" sx={{ fontWeight: notif.read ? 400 : 'bold' }}>
                   {notif.title}
                 </Typography>
                 <Typography TwoLine>
                   {notif.message}
                 </Typography>
                 <Typography variant="caption" color="text.secondary">
                   {new Date(notif.createdAt).toLocaleString()}
                 </Typography>
               </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* --- 5. ADD THE MODAL TO THE COMPONENT --- */}
      <NotificationDetailModal
        notification={selectedNotification}
        open={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
      />
    </>
  );
};

export default NotificationBell;