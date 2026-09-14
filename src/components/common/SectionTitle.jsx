import React from 'react';
import { Box, Typography } from '@mui/material';

export default function SectionTitle({ title, subtitle, centered = false, sx = {} }) {
  return (
    <Box sx={{ mb: 4, textAlign: centered ? 'center' : 'left', ...sx }}>
      <Typography
        variant="h2"
        sx={{
          fontSize: { xs: '24px', md: '32px' },
          fontWeight: 700,
          color: 'text.primary',
          mb: 1,
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: { xs: '14px', md: '16px' },
            maxWidth: '640px',
            mx: centered ? 'auto' : 0,
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
