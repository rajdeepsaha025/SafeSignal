import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';

export default function InfoCard({ title, action, children, sx = {}, contentSx = {} }) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        borderRadius: '20px',
        bgcolor: '#ffffff',
        border: `1px solid ${theme.palette.outline.variant}`,
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        overflow: 'visible',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...sx
      }}
    >
      {(title || action) && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3,
            py: 2,
            borderBottom: `1px solid ${theme.palette.outline.variant}`,
          }}
        >
          {title && (
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '16px' }}>
              {title}
            </Typography>
          )}
          {action && <Box>{action}</Box>}
        </Box>
      )}
      <CardContent sx={{ p: 3, flexGrow: 1, '&:last-child': { pb: 3 }, ...contentSx }}>
        {children}
      </CardContent>
    </Card>
  );
}
