import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { completeSignUpWithEmailLink } from '../services/auth';

function SignUpVerify() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const completeSignUp = async () => {
      try {
        const user = await completeSignUpWithEmailLink();
        if (user) {
          // Redirect to home page after successful verification
          window.location.href = '/';
        }
      } catch (err) {
        console.error('Verification error:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred. Please try signing up again.');
        }
        setVerifying(false);
      }
    };

    completeSignUp();
  }, [navigate]);

  if (verifying) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={40} sx={{ color: '#673ab7', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Verifying your email...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we complete your registration
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: '#673ab7' }}>
          Email Verification
        </Typography>

        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Please try{' '}
            <a href="/signup" style={{ color: '#673ab7', textDecoration: 'none' }}>
              signing up
            </a>
            {' '}again.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default SignUpVerify; 