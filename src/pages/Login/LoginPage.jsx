import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography, TextField, Button, Link, useTheme, Alert } from '@mui/material';

export default function LoginPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('analyst@safesignal.in');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    // Simulate successful login
    navigate('/analytics');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2
      }}
    >
      <Card
        sx={{
          maxWidth: '400px',
          width: '100%',
          p: 4,
          borderRadius: '24px',
          boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${theme.palette.outline.variant}`
        }}
      >
        {/* Brand Logo */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: theme.palette.primary.light,
              color: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>security</span>
          </Box>
          <Typography variant="h2" sx={{ fontSize: '24px', fontWeight: 800, color: 'text.primary', fontFamily: 'Plus Jakarta Sans' }}>
            SafeSignal
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Vigilance & Risk Moderation Portal
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email Address"
            variant="outlined"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              bgcolor: theme.palette.primary.main,
              py: 1.5,
              mt: 1,
              fontWeight: 700,
              fontSize: '15px',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
                boxShadow: 'none'
              }
            }}
          >
            Sign In
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 0.5 }}>
            <Link
              onClick={() => navigate('/register')}
              sx={{
                fontSize: '13px',
                fontWeight: 600,
                color: theme.palette.primary.main,
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              Create Account
            </Link>
            <Link
              onClick={() => alert('Password recovery is managed by organizational identity providers.')}
              sx={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'text.secondary',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              Forgot Password?
            </Link>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
