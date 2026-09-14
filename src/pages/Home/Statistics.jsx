import React, { useEffect, useRef } from 'react';
import { Box, Grid, Typography, useTheme, Divider } from '@mui/material';

export default function Statistics() {
  const theme = useTheme();
  const sectionRef = useRef(null);
  const statRefs = useRef([]);

  const stats = [
    { value: '₹22,495 Cr', label: 'Total Digital Fraud Losses', color: theme.palette.primary.main },
    { value: '206%', label: 'YoY Growth in UPI Scams', color: theme.palette.error.main },
    { value: '805 Cr', label: 'UPI Fraud Transactions Flagged', color: theme.palette.text.primary }
  ];

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return undefined;
    }

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const easeOutCubic = (value) => 1 - (1 - value) ** 3;
    const frameState = { rafId: 0 };

    const applyStyles = () => {
      const scrollPosition = window.scrollY;
      const viewportHeight = window.innerHeight;
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const entryStart = viewportHeight * 0.68;
      const entryRange = sectionHeight * 0.42 + viewportHeight * 0.32;
      const progress = clamp((scrollPosition + entryStart - sectionTop) / entryRange, 0, 1);

      const sectionFade = easeOutCubic(clamp((progress - 0.02) / 0.18, 0, 1));
      section.style.opacity = `${sectionFade}`;
      section.style.transform = `translate3d(0, ${24 * (1 - sectionFade)}px, 0)`;

      statRefs.current.forEach((element, index) => {
        if (!element) {
          return;
        }

        const delay = index * 0.12;
        const reveal = easeOutCubic(clamp((progress - delay) / 0.22, 0, 1));
        const translateY = 24 * (1 - reveal);

        element.style.opacity = `${reveal}`;
        element.style.transform = `translate3d(0, ${translateY}px, 0)`;
      });
    };

    const raf = () => {
      applyStyles();
      frameState.rafId = window.requestAnimationFrame(raf);
    };

    frameState.rafId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(frameState.rafId);
    };
  }, []);

  return (
    <Box
      ref={sectionRef}
      sx={{
        bgcolor: 'transparent',
        borderTop: `1px solid ${theme.palette.outline.variant}`,
        borderBottom: `1px solid ${theme.palette.outline.variant}`,
        py: 6,
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
        <Grid container spacing={4} justifyContent="center" alignItems="center">
          {stats.map((stat, idx) => (
            <React.Fragment key={stat.label}>
              <Grid
                item
                xs={12}
                md={4}
                sx={{ textAlign: 'center', opacity: 0, transform: 'translate3d(0, 24px, 0)', willChange: 'transform, opacity' }}
                ref={(element) => {
                  statRefs.current[idx] = element;
                }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    color: stat.color,
                    fontWeight: 800,
                    fontSize: { xs: '36px', md: '54px' },
                    mb: 1,
                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {stat.label}
                </Typography>
              </Grid>
              {idx < stats.length - 1 && (
                <Grid item xs={12} sx={{ display: { xs: 'block', md: 'none' }, py: 0 }}>
                  <Divider sx={{ mx: '20%', borderColor: theme.palette.outline.variant }} />
                </Grid>
              )}
            </React.Fragment>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
