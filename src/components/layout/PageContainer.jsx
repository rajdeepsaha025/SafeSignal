import React from 'react';
import { Box, useTheme, useMediaQuery, Paper, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function PageContainer({ children, withSidebar = false, backgroundColor = 'background.default' }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const mobileNavItems = [
    { label: 'Overview', icon: 'dashboard', path: '/analytics' },
    { label: 'Reports', icon: 'report_problem', path: '/admin' },
    { label: 'Threats', icon: 'security', path: '/check' },
    { label: 'Admin', icon: 'admin_panel_settings', path: '/admin' }
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, bgcolor: backgroundColor }}>
      {/* Top Navbar */}
      <Navbar />

      <Box sx={{ display: 'flex', flexGrow: 1, position: 'relative' }}>
        {/* Conditional Sidebar for Desktop */}
        {withSidebar && <Sidebar />}

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            pb: withSidebar && isMobile ? '80px' : 0, // Extra padding for mobile bottom navigation
            minWidth: 0 // Prevent flex children from overflowing
          }}
        >
          <Box 
            sx={{ 
              flexGrow: 1,
              px: { xs: 2, md: 4 },
              py: { xs: 3, md: 4 },
              maxWidth: '1440px',
              width: '100%',
              mx: 'auto',
              boxSizing: 'border-box'
            }}
          >
            {children}
          </Box>

          {/* Footer */}
          <Footer backgroundColor={backgroundColor === 'transparent' ? 'transparent' : '#ffffff'} />
        </Box>
      </Box>

      {/* Bottom Nav for Mobile on Sidebar Pages */}
      {withSidebar && isMobile && (
        <Paper
          elevation={4}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 64,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: theme.zIndex.appBar,
            borderRadius: 0,
            borderTop: `1px solid ${theme.palette.outline.variant}`,
            bgcolor: '#ffffff'
          }}
        >
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Box
                key={item.label}
                onClick={() => navigate(item.path)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%',
                  color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                  transition: 'color 0.15s'
                }}
              >
                <Box
                  sx={{
                    bgcolor: isActive ? 'rgba(21, 101, 192, 0.08)' : 'transparent',
                    px: 2,
                    py: 0.5,
                    borderRadius: 99,
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                </Box>
                <Typography variant="caption" sx={{ fontWeight: isActive ? 700 : 500, fontSize: '10px' }}>
                  {item.label}
                </Typography>
              </Box>
            );
          })}
        </Paper>
      )}
    </Box>
  );
}
