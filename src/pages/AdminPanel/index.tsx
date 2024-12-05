import React from 'react';
import { Container, Typography, Paper, Grid, Box, Button } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import { useNavigate } from 'react-router-dom';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();

  const navigationButtons = [
    { 
      title: "Clubs", 
      icon: <BusinessIcon sx={{ fontSize: 48 }}/>, 
      onClick: () => navigate('/admin/clubs')
    },
    { 
      title: "Users", 
      icon: <GroupIcon sx={{ fontSize: 48 }}/>, 
      onClick: () => navigate('/admin/users')
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={3}>
              <AdminPanelSettingsIcon sx={{ fontSize: 40, mr: 2, color: '#673ab7' }} />
              <Typography variant="h4" component="h1">
                Admin Panel
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                System Overview
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Welcome to the admin panel. This area is restricted to administrators only.
                Here you can manage system-wide settings and monitor platform activity.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Grid container spacing={3}>
              {navigationButtons.map((button) => (
                <Grid item xs={12} md={6} key={button.title}>
                  <Paper
                    elevation={2}
                    sx={{
                      backgroundColor: '#ffffff',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 16px rgba(103, 58, 183, 0.2)',
                      }
                    }}
                  >
                    <Button
                      variant="text"
                      fullWidth
                      onClick={button.onClick}
                      sx={{
                        p: 4,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        backgroundColor: '#ffffff',
                        color: '#673ab7',
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: '#ffffff',
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: 48,
                          color: '#673ab7',
                          transition: 'transform 0.3s ease',
                        },
                        '&:hover .MuiSvgIcon-root': {
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      {button.icon}
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 500,
                          background: 'linear-gradient(45deg, #673ab7, #9c27b0)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        {button.title}
                      </Typography>
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AdminPanel; 