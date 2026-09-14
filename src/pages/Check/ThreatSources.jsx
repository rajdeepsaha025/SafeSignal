import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import InfoCard from '../../components/common/InfoCard';

export default function ThreatSources({ timeline }) {
  const theme = useTheme();

  return (
    <InfoCard title="Activity Timeline">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'relative' }}>
        {timeline.map((event, idx) => {
          const isLast = idx === timeline.length - 1;
          return (
            <Box key={idx} sx={{ display: 'flex', gap: 3, position: 'relative' }}>
              {/* Timeline Indicator Column */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                {/* Dot */}
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: idx === 0 || event.text.toLowerCase().includes('reported') ? theme.palette.error.main : theme.palette.outline.main,
                    mt: 1,
                    zIndex: 1
                  }}
                />
                {/* Vertical Line */}
                {!isLast && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      bottom: -24,
                      left: 3,
                      width: '1px',
                      bgcolor: theme.palette.outline.variant,
                      zIndex: 0
                    }}
                  />
                )}
              </Box>

              {/* Event Details */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  {event.time}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  {event.text}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </InfoCard>
  );
}
