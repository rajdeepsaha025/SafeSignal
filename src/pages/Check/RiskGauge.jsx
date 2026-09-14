import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

export default function RiskGauge({ score }) {
  const theme = useTheme();

  // Determine colors based on score
  const getRiskColors = (s) => {
    if (s > 75) return { stroke: '#ba1a1a', bg: '#ffdad6', label: 'HIGH RISK' };
    if (s > 35) return { stroke: '#6d4500', bg: '#ffe0bb', label: 'MEDIUM RISK' };
    return { stroke: '#1b6d24', bg: '#e8f5e9', label: 'LOW RISK' };
  };

  const riskColors = getRiskColors(score);

  // SVG parameters
  const radius = 45;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ position: 'relative', width: 128, height: 128, my: 2 }}>
        <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }} viewBox="0 0 100 100">
          {/* Background track circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={riskColors.bg}
            strokeWidth={strokeWidth}
          />
          {/* Active progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={riskColors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>
        {/* Centered Score Label */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, color: riskColors.stroke, lineHeight: 1 }}>
            {score}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            / 100
          </Typography>
        </Box>
      </Box>

      {/* Badge */}
      <Box
        sx={{
          bgcolor: riskColors.bg,
          color: riskColors.stroke,
          px: 2,
          py: 0.5,
          borderRadius: 9999,
          mb: 1
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '12px' }}>
          {riskColors.label}
        </Typography>
      </Box>
    </Box>
  );
}
