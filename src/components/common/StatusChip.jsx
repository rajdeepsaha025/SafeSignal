import React from 'react';
import { Chip, useTheme } from '@mui/material';

export default function StatusChip({ status }) {
  const theme = useTheme();

  const getStatusStyles = (statusVal) => {
    const val = statusVal.trim().toLowerCase();
    
    switch (val) {
      case 'critical':
      case 'high':
      case 'high risk':
      case 'flagged':
        return {
          bgcolor: '#ffdad6', // error-container
          color: '#93000a', // on-error-container
          borderColor: '#ffb4ab',
        };
      case 'warning':
      case 'medium':
      case 'medium risk':
      case 'disputes':
        return {
          bgcolor: '#ffe0bb', // tertiary-container
          color: '#8e5b00', // on-tertiary-container
          borderColor: '#ffddb5',
        };
      case 'healthy':
      case 'active':
      case 'low':
      case 'low risk':
      case 'clean':
        return {
          bgcolor: '#e8f5e9', // secondary-container-like (soft green)
          color: '#1b5e20',
          borderColor: '#c8e6c9',
        };
      default:
        return {
          bgcolor: '#e9edff', // surface-container
          color: '#424752', // on-surface-variant
          borderColor: '#c2c6d4',
        };
    }
  };

  const styles = getStatusStyles(status);

  return (
    <Chip
      label={status.toUpperCase()}
      size="small"
      sx={{
        bgcolor: styles.bgcolor,
        color: styles.color,
        border: `1px solid ${styles.borderColor}`,
        fontWeight: 700,
        fontSize: '10px',
        letterSpacing: '0.5px',
        height: '22px',
        borderRadius: '9999px',
        px: 0.5
      }}
    />
  );
}
