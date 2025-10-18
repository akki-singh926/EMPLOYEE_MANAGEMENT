// src/pages/HomePage.js
import React from 'react';
import { Box, Typography, Button, Container, Grid, Divider, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const HomePage = () => {
    const theme = useTheme();

    return (
        <Box sx={{ 
            minHeight: '100vh',
            bgcolor: theme.palette.background.default, 
            pt: 8, 
            pb: 10 
        }}>
            <Container maxWidth="lg">
                
                {/* --- 1. BRANDING & INTRODUCTION --- */}
                <Box sx={{ textAlign: 'center', mb: 8, pt: 4 }}>
                    <PeopleIcon sx={{ fontSize: 70, color: theme.palette.secondary.main, mb: 1 }} />
                    <Typography 
                        variant="h2" 
                        component="h1" 
                        fontWeight={700} 
                        color={theme.palette.primary.main} 
                        gutterBottom
                    >
                        Employee Portal by Pegorion
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                        The centralized platform for managing your personal data, document submission, and HR workflows securely.
                    </Typography>
                </Box>

                <Divider sx={{ mb: 6 }} />

                {/* --- 2. MISSION, VISION, VALUES --- */}
                <Grid container spacing={4} sx={{ mb: 6 }}>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h5" fontWeight={600} color={theme.palette.secondary.main} sx={{ mb: 1 }}>
                            Our Mission
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            To streamline HR processes using intuitive technology, ensuring data integrity and compliance for every team member.
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h5" fontWeight={600} color={theme.palette.secondary.main} sx={{ mb: 1 }}>
                            Our Vision
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            To create a paperless, friction-free administrative environment where employees can focus solely on their work.
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h5" fontWeight={600} color={theme.palette.secondary.main} sx={{ mb: 1 }}>
                            Core Values
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Security, Transparency, Efficiency, and Employee Focus.
                        </Typography>
                    </Grid>
                </Grid>

                {/* --- 3. LOGIN & SUPPORT SECTION --- */}
                <Box sx={{ textAlign: 'center', pt: 4 }}>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        Ready to get started?
                    </Typography>
                    
                    {/* Login/Sign-up Buttons */}
                    <Button
                        component={RouterLink}
                        to="/login"
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<LockOpenIcon />}
                        sx={{ mr: 2, py: 1.5, px: 4, textTransform: 'none', fontWeight: 600 }}
                    >
                        Employee Login / Sign-up
                    </Button>

                    {/* Support Contact */}
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                        <SupportAgentIcon color="action" />
                        <Typography variant="body1" color="text.secondary">
                            HR Support: **hr@pegorion.com** | Need help? Call: **+91 95238 07328**
                        </Typography>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default HomePage;