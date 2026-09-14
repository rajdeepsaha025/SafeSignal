import React from 'react';
import { Grid, Typography, Box, Button, useTheme } from '@mui/material';

export default function RiskResult({ targetId, name, firstSeen, lastActivity, onReport }) {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <Box>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              Target ID
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {targetId}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              Associated Name (Masked)
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {name}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              First Seen
            </Typography>
            <Typography variant="body1" color="text.primary">
              {firstSeen}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              Last Activity
            </Typography>
            <Typography variant="body1" color="text.primary">
              {lastActivity}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mt: 4, pt: 2, borderTop: `1px solid ${theme.palette.outline.variant}`, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          color="error"
          onClick={onReport}
          startIcon={<span className="material-symbols-outlined" style={{ fontSize: '18px' }}>report</span>}
          sx={{
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '14px',
            '&:hover': {
              bgcolor: theme.palette.error.light,
            }
          }}
        >
          Report Fraud
        </Button>
      </Box>
    </Box>
  );
}
