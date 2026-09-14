import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography, TextField, Button, Link, MenuItem, useTheme, Alert } from '@mui/material';

export default function RegisterPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dept, setDept] = useState('Investigations');
  const [error, setError] = useState('');

  const handleRegister = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    // Simulate successful registration
    navigate('/login');
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
            Register Portal
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Create investigator and analyst access credentials
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Corporate Email Address"
            variant="outlined"
            type="email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Department"
            select
            fullWidth
            value={dept}
            onChange={(e) => setDept(e.target.value)}
          >
            <MenuItem value="Investigations">Investigations & Fraud Management</MenuItem>
            <MenuItem value="Risk">Risk Operations</MenuItem>
            <MenuItem value="Compliance">Regulatory & Compliance Audit</MenuItem>
          </TextField>
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            fullWidth
            required
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
            Create Account
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link
                onClick={() => navigate('/login')}
                sx={{
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
