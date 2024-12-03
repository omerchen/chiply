import React from 'react';
import { Container, Typography, Paper, Button, Box } from '@mui/material';
import { useNavigate, useRouteError } from 'react-router-dom';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import { getUserFromStorage } from '../services/auth';

interface ErrorResponse {
  status?: number;
  statusText?: string;
  message?: string;
}

function ErrorPage() {
  const error = useRouteError() as ErrorResponse;
  const navigate = useNavigate();
  const isAuthenticated = !!getUserFromStorage();

  const handleNavigate = () => {
    navigate(isAuthenticated ? '/' : '/login');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 3 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 6, 
          textAlign: 'center',
          borderRadius: 2,
          background: 'linear-gradient(to bottom right, #ffffff, #f5f5f5)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Box sx={{ mb: 4 }}>
          <SentimentDissatisfiedIcon 
            sx={{ 
              fontSize: 100, 
              color: 'primary.main',
              opacity: 0.8,
              mb: 2
            }} 
          />
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #673ab7, #9c27b0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {error.status === 404 ? "Page Not Found" : "Oops!"}
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'text.secondary',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6
            }}
          >
            {error.status === 404 
              ? "We couldn't find the page you're looking for. Let's get you back on track!"
              : "Something unexpected happened. Don't worry, we'll help you get back on track!"}
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleNavigate}
          size="large"
          sx={{ 
            px: 4, 
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1.1rem',
            background: 'linear-gradient(45deg, #673ab7, #9c27b0)',
            '&:hover': {
              background: 'linear-gradient(45deg, #5e35b1, #8e24aa)',
            }
          }}
        >
          {isAuthenticated ? 'Return Home' : 'Go to Login'}
        </Button>
      </Paper>
    </Container>
  );
}

export default ErrorPage; 