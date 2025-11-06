import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Button, Paper, 
  CircularProgress, Alert, LinearProgress, Chip 
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

// Match the styling from SuperAdminPage
const PRIMARY_COLOR = '#5A45FF';
const SECONDARY_COLOR = '#8B5CF6';
const LIGHT_BACKGROUND = '#F9FAFB';
const TEXT_COLOR_DARK = '#1F2937';
const WHITE = '#FFFFFF';

const BulkEmployeeUpload = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setUploadResult(null); // Clear previous results
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      // This is the endpoint from your "Code 4"
      const res = await axios.post(
        'http://localhost:8080/api/superadmin/employees/bulk-upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`, // Send the token
          },
        }
      );

      setUploadResult(res.data); // Store the report
      setFile(null); // Clear file on success
      setFileName('');

    } catch (err) {
      // Handle server/network errors
      const message = err.response?.data?.message || err.message || 'Upload failed. Please try again.';
      setError(message);
      console.error('Bulk upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 3, 
        borderRadius: '8px', 
        border: '1px solid #E5E7EB', 
        background: WHITE // Use white background like other panels
      }}
    >
      <Typography variant="h6" sx={{ color: TEXT_COLOR_DARK, fontWeight: 700, mb: 2 }}>
        Bulk Employee Upload
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            variant="outlined"
            component="label"
            disabled={isLoading}
            sx={{
              borderColor: PRIMARY_COLOR,
              color: PRIMARY_COLOR,
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: `${PRIMARY_COLOR}1A` }
            }}
          >
            Choose File (.csv, .xlsx)
            <input 
              type="file" 
              hidden 
              onChange={handleFileChange}
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            />
          </Button>
          {fileName && (
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Selected: <strong>{fileName}</strong>
            </Typography>
          )}
        </Box>

        <Button
          type="submit"
          variant="contained"
          disabled={isLoading || !file}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <FileUploadIcon />}
          sx={{
            background: PRIMARY_COLOR,
            color: WHITE,
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '8px',
            px: 3,
            py: 1.2,
            '&:hover': { background: SECONDARY_COLOR },
            '&:disabled': { background: '#E0E0E0', color: '#9E9E9E' }
          }}
        >
          {isLoading ? 'Uploading...' : 'Upload & Create Users'}
        </Button>
      </Box>

      {/* --- Results Display --- */}
      {isLoading && <LinearProgress sx={{ mt: 2, color: PRIMARY_COLOR }} />}

      {error && (
        <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 2, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}

      {uploadResult && (
        <Box sx={{ mt: 2 }}>
          <Alert 
            severity={uploadResult.failedCount > 0 ? "warning" : "success"} 
            icon={uploadResult.failedCount > 0 ? <ErrorIcon /> : <CheckCircleIcon />} 
            sx={{ mb: 2, borderRadius: '8px' }}
          >
            Upload Complete!
            <Chip label={`${uploadResult.createdCount} Created`} size="small" color="success" sx={{ ml: 1, fontWeight: 600 }} />
            <Chip label={`${uploadResult.failedCount} Failed`} size="small" color={uploadResult.failedCount > 0 ? "error" : "default"} sx={{ ml: 1, fontWeight: 600 }} />
          </Alert>

          {uploadResult.errors && uploadResult.errors.length > 0 && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'red', mb: 1 }}>
                Error Details:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: '150px', overflowY: 'auto', bgcolor: LIGHT_BACKGROUND }}>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {uploadResult.errors.map((err, index) => (
                    <li key={index}>
                      <Typography variant="caption" sx={{ color: TEXT_COLOR_DARK }}>
                        <strong>Row {err.row}:</strong> {err.error}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Paper>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default BulkEmployeeUpload;