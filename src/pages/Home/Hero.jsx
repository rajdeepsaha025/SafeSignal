import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import SearchInput from '../../components/common/SearchInput';

export default function Hero() {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleSearch = (query) => {
    navigate('/check', { state: { initialQuery: query } });
  };

  return (
    <Box 
      sx={{ 
        width: '100%', 
        position: 'relative',
        bgcolor: 'transparent',
      }}
    >
      <Grid container spacing={4} alignItems="center">
        {/* Left Content Column */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Headline */}
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '32px', md: '54px' },
                lineHeight: 1.15,
                fontWeight: 800,
                color: 'text.primary',
                fontFamily: 'Plus Jakarta Sans, sans-serif'
              }}
            >
              Check Any UPI <br /> Before Sending <span style={{ color: theme.palette.primary.main }}>Money</span>.
            </Typography>

            {/* Subtext */}
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '90%', fontSize: '16px' }}>
              AI-powered fraud intelligence using machine learning, verified community reports, and trusted threat databases. Instantly verify the safety of any UPI ID, phone number, or VPA.
            </Typography>

            {/* Search Box */}
            <Box sx={{ mt: 1, maxWidth: '480px', width: '100%' }}>
              <SearchInput 
                placeholder="Enter UPI ID (e.g. name@bank)" 
                buttonText="Check UPI" 
                onSearch={handleSearch}
              />
            </Box>

            {/* Trust Badges */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', '& > *': { border: '2px solid #ffffff', borderRadius: '50%' } }}>
                <AvatarOverlay index={0} />
                <AvatarOverlay index={1} />
                <AvatarOverlay index={2} />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '13px' }}>
                Trusted by 50,000+ investigators
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Right Illustration Spacer - layout preserved */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: { xs: '92%', md: '100%' }, maxWidth: '540px', minHeight: { xs: '320px', md: '480px' } }} />
        </Grid>
      </Grid>
    </Box>
  );
}

// Simple internal helper for trust avatar stack
function AvatarOverlay({ index }) {
  const bgColors = ['#e9edff', '#dce2f7', '#d6e3ff'];
  return (
    <Box 
      sx={{ 
        width: 24, 
        height: 24, 
        bgcolor: bgColors[index],
        zIndex: 3 - index,
        marginLeft: index > 0 ? '-8px' : 0 
      }} 
    />
  );
}
