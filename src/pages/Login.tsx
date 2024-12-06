import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Box,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { login, saveUserToStorage, sendLoginLink, completeLoginWithEmailLink } from '../services/auth';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'passwordless'>('password');

  useEffect(() => {
    // Check for account_disabled error in URL
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'account_disabled') {
      setError('Your account has been disabled. Please contact an administrator.');
    }

    // Handle email link sign-in completion
    const completeEmailSignIn = async () => {
      try {
        const user = await completeLoginWithEmailLink();
        if (user) {
          window.location.href = '/';
        }
      } catch (err) {
        console.error('Email link sign in error:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      }
    };

    completeEmailSignIn();
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email');
      setLoading(false);
      return;
    }

    if (loginMethod === 'password') {
      if (!password) {
        setError('Please enter your password');
        setLoading(false);
        return;
      }

      try {
        const user = await login(email, password);
        saveUserToStorage(user);
        window.location.href = '/';
      } catch (err) {
        console.error('Login error:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      }
    } else {
      try {
        await sendLoginLink(email);
        setSuccess('Check your email for the login link!');
      } catch (err) {
        console.error('Send login link error:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      }
    }

    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: '#673ab7' }}>
          Login to Chiply
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={loginMethod}
            exclusive
            onChange={(_, newValue) => newValue && setLoginMethod(newValue)}
            aria-label="login method"
          >
            <ToggleButton value="password" aria-label="password login">
              Password
            </ToggleButton>
            <ToggleButton value="passwordless" aria-label="passwordless login">
              Email Link
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            disabled={loading}
          />

          {loginMethod === 'password' && (
            <TextField
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ 
              mt: 3, 
              mb: 2,
              bgcolor: '#673ab7',
              '&:hover': {
                bgcolor: '#563098'
              }
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : loginMethod === 'password' ? (
              'Login'
            ) : (
              'Send Login Link'
            )}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: '#673ab7', textDecoration: 'none' }}>
                Sign up here
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

export default Login; 