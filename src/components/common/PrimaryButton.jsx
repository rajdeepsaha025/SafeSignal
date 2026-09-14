import React from 'react';
import { Button } from '@mui/material';

export default function PrimaryButton({ children, startIcon, onClick, type = 'button', disabled = false, fullWidth = false, sx = {} }) {
  return (
    <Button
      type={type}
      variant="contained"
      color="primary"
      onClick={onClick}
      disabled={disabled}
      fullWidth={fullWidth}
      startIcon={startIcon}
      sx={{
        bgcolor: '#004d99',
        color: '#ffffff',
        textTransform: 'none',
        borderRadius: '8px',
        fontWeight: 600,
        px: 3,
        py: 1,
        boxShadow: 'none',
        '&:hover': {
          bgcolor: '#003366',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
        '&:disabled': {
          bgcolor: '#dce2f7',
          color: '#727783',
        },
        ...sx
      }}
    >
      {children}
    </Button>
  );
}
