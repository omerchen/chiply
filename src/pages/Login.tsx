import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { login, saveUserToStorage } from '../services/auth';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAutofilled, setIsAutofilled] = useState(false);

  useEffect(() => {
    // Check if fields are autofilled
    const checkAutofill = () => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      
      if (emailInput && passwordInput) {
        const isAnyAutofilled = 
          emailInput.value.length > 0 || 
          passwordInput.value.length > 0;
        
        setIsAutofilled(isAnyAutofilled);
        
        if (isAnyAutofilled) {
          setEmail(emailInput.value);
          setPassword(passwordInput.value);
        }
      }
    };

    // Check immediately and after a short delay to catch browser autofill
    checkAutofill();
    setTimeout(checkAutofill, 500);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      const user = await login(email, password);
      saveUserToStorage(user);
      
      // Force a page reload to update auth state across the app
      window.location.href = '/';
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Login to Chiply
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            fullWidth
            required
            margin="normal"
            autoComplete="email"
            disabled={loading}
            error={!!error}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{
              '& .MuiInputBase-input:-webkit-autofill': {
                '-webkit-box-shadow': '0 0 0 100px #fff inset',
                '-webkit-text-fill-color': 'inherit'
              },
            }}
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
            autoComplete="current-password"
            disabled={loading}
            error={!!error}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{
              '& .MuiInputBase-input:-webkit-autofill': {
                '-webkit-box-shadow': '0 0 0 100px #fff inset',
                '-webkit-text-fill-color': 'inherit'
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePassword}
                    edge="end"
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </Button>
        </form>
      </Paper>
    </Container>
  );
}

export default Login; 