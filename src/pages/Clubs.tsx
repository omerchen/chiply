import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

function Clubs() {
  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Clubs
        </Typography>
      </Paper>
    </Container>
  );
}

export default Clubs; 