import React from 'react';
import { Button } from '@mui/material';

export default function SecondaryButton({ children, startIcon, onClick, type = 'button', disabled = false, fullWidth = false, sx = {} }) {
  return (
    <Button
      type={type}
      variant="outlined"
      onClick={onClick}
      disabled={disabled}
      fullWidth={fullWidth}
      startIcon={startIcon}
      sx={{
        color: '#141b2b',
        border: '1px solid #c2c6d4',
        textTransform: 'none',
        borderRadius: '8px',
        fontWeight: 600,
        px: 3,
        py: 1,
        '&:hover': {
          bgcolor: '#f1f3ff',
          border: '1px solid #727783',
        },
        ...sx
      }}
    >
      {children}
    </Button>
  );
}
