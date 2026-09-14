import React from 'react';
import { Box, Typography } from '@mui/material';

export default function EmptyState({ icon = 'search', title = 'No results found', description = 'Try checking a different VPA or phone number.' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
        border: '1px dashed #c2c6d4',
        borderRadius: '20px',
        bgcolor: '#ffffff'
      }}
    >
      <span 
        className="material-symbols-outlined" 
        style={{ 
          fontSize: '48px', 
          color: '#727783',
          marginBottom: '16px'
        }}
      >
        {icon}
      </span>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: '#141b2b' }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
        {description}
      </Typography>
    </Box>
  );
}
