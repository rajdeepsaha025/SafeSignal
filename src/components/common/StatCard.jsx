import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';

export default function StatCard({ title, value, icon, trend, trendType = 'neutral', sx = {} }) {
  const theme = useTheme();

  // Determine trend color and icon
  const getTrendStyles = () => {
    switch (trendType) {
      case 'positive':
        return { color: theme.palette.secondary.main, icon: 'trending_up' };
      case 'negative':
        return { color: theme.palette.error.main, icon: 'trending_down' }; // in cyber context, "up" in threats is negative, but let's make it intuitive
      case 'neutral':
      default:
        return { color: theme.palette.outline.main, icon: 'trending_flat' };
    }
  };

  const trendStyles = getTrendStyles();

  return (
    <Card
      sx={{
        borderRadius: '20px',
        bgcolor: '#ffffff',
        border: `1px solid ${theme.palette.outline.variant}`,
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        height: '100%',
        ...sx
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '14px' }}>
            {title}
          </Typography>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: '#f1f3ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.palette.primary.main,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
          </Box>
        </Box>
        
        <Typography variant="h3" sx={{ fontSize: '28px', fontWeight: 700, color: 'text.primary', mb: 1, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {value}
        </Typography>

        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span 
              className="material-symbols-outlined" 
              style={{ fontSize: '14px', color: trendStyles.color }}
            >
              {trendStyles.icon}
            </span>
            <Typography variant="caption" sx={{ fontWeight: 600, color: trendStyles.color }}>
              {trend}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
