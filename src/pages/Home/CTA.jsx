import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, useTheme } from '@mui/material';

export default function CTA() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box sx={{ py: 6 }}>
      <Box
        sx={{
          bgcolor: theme.palette.primary.main,
          borderRadius: '24px',
          p: { xs: 4, md: 8 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '640px' }}>
          <span 
            className="material-symbols-outlined" 
            style={{ 
              fontSize: '48px', 
              color: '#ffffff', 
              marginBottom: '24px' 
            }}
          >
            shield_locked
          </span>
          <Typography
            variant="h2"
            sx={{
              color: '#ffffff',
              fontWeight: 700,
              fontSize: { xs: '28px', md: '36px' },
              mb: 2,
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}
          >
            Ready to secure your transactions?
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.85)', 
              fontSize: '16px', 
              mb: 4,
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Join enterprise investigators and everyday users in building a fraud-free digital payments ecosystem.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/check')}
            sx={{
              bgcolor: '#ffffff',
              color: theme.palette.primary.main,
              fontWeight: 700,
              fontSize: '16px',
              px: 4,
              py: 1.5,
              borderRadius: '8px',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#f1f3ff',
                boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s'
            }}
          >
            Start Checking UPI IDs
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
