import React, { useState } from 'react';
import { Paper, InputBase, IconButton, Button, Box, useTheme } from '@mui/material';

export default function SearchInput({ 
  placeholder = 'Enter UPI ID (e.g. name@bank)', 
  buttonText = 'Check UPI', 
  onSearch, 
  defaultValue = '',
  sx = {} 
}) {
  const theme = useTheme();
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: '4px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        bgcolor: '#ffffff',
        border: `1px solid ${theme.palette.outline.variant}`,
        borderRadius: '8px',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        '&:focus-within': {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
        },
        transition: 'all 0.15s',
        ...sx
      }}
    >
      <Box sx={{ p: '10px', display: 'flex', alignItems: 'center', color: theme.palette.outline.main }}>
        <span className="material-symbols-outlined">search</span>
      </Box>
      <InputBase
        sx={{ ml: 1, flex: 1, fontSize: '16px', fontFamily: 'Inter, sans-serif' }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputProps={{ 'aria-label': placeholder }}
      />
      <Button
        type="submit"
        variant="contained"
        sx={{
          bgcolor: theme.palette.primary.main,
          color: '#ffffff',
          fontWeight: 600,
          px: 3,
          py: 1,
          borderRadius: '6px',
          boxShadow: 'none',
          '&:hover': {
            bgcolor: theme.palette.primary.dark,
            boxShadow: 'none',
          }
        }}
      >
        {buttonText}
      </Button>
    </Paper>
  );
}
