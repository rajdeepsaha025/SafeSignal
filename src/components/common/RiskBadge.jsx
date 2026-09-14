import React from 'react';
import { Box, Typography } from '@mui/material';

export default function RiskBadge({ status }) {
  const isHigh = status?.toLowerCase().includes('high');
  const isMedium = status?.toLowerCase().includes('medium');

  const bgcolor = isHigh ? '#ffdad6' : isMedium ? '#ffe0bb' : '#e8f5e9';
  const color = isHigh ? '#93000a' : isMedium ? '#8e5b00' : '#1b5e20';

  return (
    <Box
      sx={{
        bgcolor: bgcolor,
        color: color,
        px: 2,
        py: 0.5,
        borderRadius: 9999,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 'fit-content'
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.5px', fontSize: '11px' }}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </Typography>
    </Box>
  );
}
