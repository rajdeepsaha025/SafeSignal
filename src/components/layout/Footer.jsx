import React from 'react';
import { Box, Typography, Link, useTheme } from '@mui/material';

export default function Footer({ backgroundColor = '#ffffff' }) {
  const theme = useTheme();

  const links = [
    { label: 'NPCI Guidelines', href: '#' },
    { label: 'RBI Cyber Policy', href: '#' },
    { label: 'Report Cybercrime', href: '#' },
    { label: 'Privacy Protocol', href: '#' },
    { label: 'API Docs', href: '#' }
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: backgroundColor,
        borderTop: `1px solid ${theme.palette.outline.variant}`,
        py: 4,
        px: { xs: 2, md: 4 },
        mt: 'auto',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          maxWidth: '1440px',
          mx: 'auto',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span className="material-symbols-outlined" style={{ color: theme.palette.primary.main, fontSize: '20px' }}>security</span>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
              SafeSignal
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            © 2024 SafeSignal. Empowering Indian Digital Payments Security.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              underline="none"
              sx={{
                fontSize: '12px',
                fontWeight: 500,
                color: theme.palette.text.secondary,
                '&:hover': { color: theme.palette.primary.main },
                transition: 'color 0.15s'
              }}
            >
              {link.label}
            </Link>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
