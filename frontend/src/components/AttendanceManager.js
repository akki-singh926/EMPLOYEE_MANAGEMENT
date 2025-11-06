import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Select, MenuItem, FormControl, InputLabel, Chip, Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddTaskIcon from '@mui/icons-material/AddTask';

// Helper to format date to YYYY-MM-DD
const toISODateString = (date) => {
  if (!date) return '';
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
    .toISOString()
    .split('T')[0];
};

const AttendanceManager = () => {
  // --- States for History ---
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [fromDate, setFromDate] = useState(new Date(new Date().setDate(1)));
  const [toDate, setToDate] = useState(new Date());
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // --- NEW: States for Manual Entry ---
  const [manualEmployeeId, setManualEmployeeId] = useState('');
  const [manualDate, setManualDate] = useState(new Date());
  const [manualStatus, setManualStatus] = useState('present');
  const [manualCheckIn, setManualCheckIn] = useState(null);
  const [manualCheckOut, setManualCheckOut] = useState(null);
  const [manualNote, setManualNote] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  // ---

  const { showNotification } = useNotification();
  const token = localStorage.getItem('authToken');

  const API_URL = 'http://localhost:8080/api/attendance';
  
  // --- THIS IS THE FIX ---
  const ADMIN_API_URL = 'http://localhost:8080/api/admin'; // Changed from superadmin
  // --- END OF FIX ---

  // Fetch all employees for the dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(`${ADMIN_API_URL}/employees`, { // This will now call /api/admin/employees
          headers: { Authorization: `Bearer ${token}` }
        });
        // Use response.data.data from your admin route
        setEmployees(res.data.data || []); 
      } catch (err) {
        showNotification('Failed to load employee list', 'error');
      }
    };
    if (token) {
      fetchEmployees();
    }
  }, [token, showNotification, ADMIN_API_URL]); // Added ADMIN_API_URL to dependencies

  // Handle fetching attendance history
  const handleFetchHistory = async () => {
    if (!selectedEmployeeId) {
      showNotification('Please select an employee.', 'warning');
      return;
    }
    setIsLoading(true);
    setHistory([]);
    try {
      const res = await axios.get(`${API_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          userId: selectedEmployeeId,
          from: toISODateString(fromDate),
          to: toISODateString(toDate)
        }
      });
      setHistory(res.data.attendance || []);
    } catch (err) {
      showNotification('Failed to fetch attendance history.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle exporting the payroll report
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get(`${API_URL}/export/payroll`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          from: toISODateString(fromDate),
          to: toISODateString(toDate)
        },
        responseType: 'blob'
      });

      const filename = `payroll_attendance_${toISODateString(fromDate)}_to_${toISODateString(toDate)}.xlsx`;
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      showNotification('Export generated successfully!', 'success');
    } catch (err) {
      showNotification('Failed to generate export.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // --- NEW: Handle Manual Attendance Submit ---
  const handleManualSubmit = async () => {
    if (!manualEmployeeId || !manualDate || !manualStatus) {
      showNotification('Employee, Date, and Status are required.', 'error');
      return;
    }
    
    setIsSubmittingManual(true);
    try {
      await axios.post(`${API_URL}/mark-for`, {
        userId: manualEmployeeId,
        date: toISODateString(manualDate),
        status: manualStatus,
        checkIn: manualCheckIn,
        checkOut: manualCheckOut,
        note: manualNote
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showNotification('Attendance marked successfully!', 'success');
      // Reset form
      setManualEmployeeId('');
      setManualDate(new Date());
      setManualStatus('present');
      setManualCheckIn(null);
      setManualCheckOut(null);
      setManualNote('');
      
      // If the manually marked user is the one being viewed, refresh the history
      if (manualEmployeeId === selectedEmployeeId) {
        handleFetchHistory();
      }

    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to mark attendance.', 'error');
    } finally {
      setIsSubmittingManual(false);
    }
  };
  // ---

  // Helper to get chip color
  const getStatusColor = (status) => {
    if (status === 'present') return 'success';
    if (status === 'absent') return 'error';
    if (status === 'leave' || status === 'halfday') return 'warning';
    return 'default';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* --- NEW: Manual Entry Form --- */}
      <Paper sx={{ p: 3, mt: 4, borderRadius: '12px' }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Manual Attendance Entry
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="manual-emp-label">Employee</InputLabel>
              <Select
                labelId="manual-emp-label"
                value={manualEmployeeId}
                label="Employee"
                onChange={(e) => setManualEmployeeId(e.target.value)}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeId})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="Date"
              value={manualDate}
              onChange={setManualDate}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="manual-status-label">Status</InputLabel>
              <Select
                labelId="manual-status-label"
                value={manualStatus}
                label="Status"
                onChange={(e) => setManualStatus(e.target.value)}
              >
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
                <MenuItem value="leave">Leave</MenuItem>
                <MenuItem value="halfday">Half-day</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleManualSubmit}
              disabled={isSubmittingManual}
              startIcon={<AddTaskIcon />}
              sx={{ height: '56px' }}
            >
              {isSubmittingManual ? <CircularProgress size={24} /> : 'Submit'}
            </Button>
          </Grid>
          
          {/* Optional Time Pickers */}
          {manualStatus !== 'absent' && manualStatus !== 'leave' && (
            <>
              <Grid item xs={6} md={3}>
                <TimePicker
                  label="Check In Time (Optional)"
                  value={manualCheckIn}
                  onChange={setManualCheckIn}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TimePicker
                  label="Check Out Time (Optional)"
                  value={manualCheckOut}
                  onChange={setManualCheckOut}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Note (Optional)"
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>
      {/* --- END: Manual Entry Form --- */}

      <Paper sx={{ p: 3, mt: 4, borderRadius: '12px' }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Attendance History & Export
        </Typography>

        {/* --- Search and Export --- */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="emp-select-label">Select Employee</InputLabel>
              <Select
                labelId="emp-select-label"
                value={selectedEmployeeId}
                label="Select Employee"
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeId})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <DatePicker
              label="From Date"
              value={fromDate}
              onChange={setFromDate}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <DatePicker
              label="To Date"
              value={toDate}
              onChange={setToDate}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={12} md={3} container spacing={1}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleFetchHistory}
                disabled={isLoading}
                sx={{ height: '56px' }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Search'}
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                color="success"
                onClick={handleExport}
                disabled={isExporting}
                startIcon={<FileDownloadIcon />}
                sx={{ height: '56px' }}
              >
                {isExporting ? <CircularProgress size={24} /> : 'Export'}
              </Button>
            </Grid>
          </Grid>
        </Grid>

        {/* --- History Table --- */}
        <Divider sx={{ mb: 3 }} />
        {history.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Work Hours</TableCell>
                  <TableCell>Note</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>
                      <Chip label={record.status} color={getStatusColor(record.status)} size="small" />
                    </TableCell>
                    <TableCell>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : 'N/A'}</TableCell>
                    <TableCell>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'N/A'}</TableCell>
                    <TableCell>{record.workHours ? record.workHours.toFixed(2) : 'N/A'}</TableCell>
                    <TableCell>{record.note || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          !isLoading && <Alert severity="info">No attendance records found for this employee in this date range.</Alert>
        )}
      </Paper>
    </LocalizationProvider>
  );
};

export default AttendanceManager;