import React from 'react';
import { Box, Grid, Typography, useTheme, Card, CardContent } from '@mui/material';
import SectionTitle from '../../components/common/SectionTitle';

export default function Features() {
  const theme = useTheme();

  const bentoFeatures = [
    {
      title: 'Instant Risk Score',
      description: 'Get a definitive 0-100 risk score within 200ms. We analyze behavioral patterns, historical velocity, and network associations to flag suspicious VPAs instantly.',
      icon: 'speed',
      colorClass: 'primary',
      gridSpan: { xs: 12, md: 8 }
    },
    {
      title: 'Machine Learning',
      description: 'Adaptive models trained on thousands of confirmed fraud vectors.',
      icon: 'psychology',
      colorClass: 'secondary',
      gridSpan: { xs: 12, md: 4 }
    },
    {
      title: 'Community Intel',
      description: 'Crowdsourced, verified reports from a network of security professionals.',
      icon: 'groups',
      colorClass: 'warning',
      gridSpan: { xs: 12, md: 4 }
    },
    {
      title: 'Government Database Sync',
      description: 'Direct API integration with national cybercrime reporting portals and banking blacklists ensures you are checking against the most authoritative data available.',
      icon: 'account_balance',
      colorClass: 'primary',
      gridSpan: { xs: 12, md: 8 }
    }
  ];

  const timelineSteps = [
    { step: 1, title: 'Enter UPI', desc: 'Input VPA or phone number', icon: 'search', color: theme.palette.text.secondary, bg: '#ffffff' },
    { step: 2, title: 'AI Analysis', desc: 'Pattern recognition algorithms', icon: 'memory', color: theme.palette.primary.main, bg: '#d6e3ff' },
    { step: 3, title: 'Threat Intel', desc: 'Cross-reference databases', icon: 'hub', color: theme.palette.text.secondary, bg: '#ffffff' },
    { step: 4, title: 'Risk Score', desc: 'Generate 0-100 severity metric', icon: 'speed', color: theme.palette.error.main, bg: '#ffdad6' },
    { step: 5, title: 'Decision', desc: 'Block, flag, or clear transaction', icon: 'gavel', color: theme.palette.secondary.main, bg: '#e8f5e9' }
  ];

  const getColorStyles = (colorClass) => {
    switch (colorClass) {
      case 'secondary':
        return { bg: '#e8f5e9', color: '#1b5e20' };
      case 'warning':
        return { bg: '#ffe0bb', color: '#8e5b00' };
      case 'primary':
      default:
        return { bg: '#d6e3ff', color: '#004d99' };
    }
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'transparent' }}>
      {/* Bento Grid Header */}
      <SectionTitle
        title="Comprehensive Threat Intelligence"
        subtitle="Our multi-layered detection engine analyzes thousands of data points in milliseconds to provide definitive risk assessments."
        centered
        sx={{ mb: 6 }}
      />

      {/* Bento Grid */}
      <Grid container spacing={3} sx={{ mb: 10 }}>
        {bentoFeatures.map((feat) => {
          const colors = getColorStyles(feat.colorClass);
          return (
            <Grid item xs={feat.gridSpan.xs} md={feat.gridSpan.md} key={feat.title}>
              <Card
                sx={{
                  borderRadius: '20px',
                  border: `1px solid ${theme.palette.outline.variant}`,
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                  height: '250px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  p: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.08)'
                  }
                }}
              >
                <Box sx={{ zIndex: 1 }}>
                  {/* Icon */}
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: colors.bg,
                      color: colors.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{feat.icon}</span>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    {feat.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: feat.gridSpan.md > 4 ? '500px' : '100%', fontSize: '14px' }}>
                    {feat.description}
                  </Typography>
                </Box>
                {/* Abstract decorative graphic for large cards */}
                {feat.gridSpan.md > 4 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '40%',
                      height: '50%',
                      background: '#ffffff',
                      borderTopLeftRadius: '100%',
                      opacity: 0.5
                    }}
                  />
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* How it Works Section */}
      <Box
        sx={{
          bgcolor: 'transparent',
          borderTop: `1px solid ${theme.palette.outline.variant}`,
          py: 8,
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          boxSizing: 'border-box'
        }}
      >
        <Box sx={{ maxWidth: '1440px', mx: 'auto', px: { xs: 2, md: 4 } }}>
          <SectionTitle
            title="How SafeSignal Works"
            subtitle="A seamless 5-step pipeline that turns raw UPI IDs into actionable security intelligence."
            centered
            sx={{ mb: 6 }}
          />

          <Box sx={{ position: 'relative', maxWidth: '960px', mx: 'auto' }}>
            {/* Connecting Horizontal Line (desktop only) */}
            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
                position: 'absolute',
                top: '24px',
                left: 0,
                right: 0,
                height: '2px',
                bgcolor: theme.palette.outline.variant,
                zIndex: 0
              }}
            />

            <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
              {timelineSteps.map((step) => (
                <Grid item xs={12} md={2.4} key={step.step}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'row', md: 'column' },
                      alignItems: 'center',
                      textAlign: { xs: 'left', md: 'center' },
                      gap: 2,
                      bgcolor: { xs: '#ffffff', md: 'transparent' },
                      p: { xs: 2, md: 0 },
                      borderRadius: '8px',
                      border: { xs: `1px solid ${theme.palette.outline.variant}`, md: 'none' },
                      boxShadow: { xs: '0px 4px 20px rgba(0, 0, 0, 0.05)', md: 'none' }
                    }}
                  >
                    {/* Circle Node */}
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: step.bg,
                        color: step.color,
                        border: `2px solid ${step.color === theme.palette.text.secondary ? theme.palette.outline.variant : 'transparent'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '18px',
                        flexShrink: 0
                      }}
                    >
                      {step.step === 1 ? '1' : step.step === 3 ? '3' : <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{step.icon}</span>}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '16px', mb: 0.5, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        {step.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                        {step.desc}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
