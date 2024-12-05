import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';

const AdminClubs: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <AdminBreadcrumbs currentPage="Clubs Management" />
        <Box display="flex" alignItems="center" mb={3}>
          <BusinessIcon sx={{ fontSize: 40, mr: 2, color: '#673ab7' }} />
          <Typography variant="h4" component="h1">
            Clubs Management
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default AdminClubs; 