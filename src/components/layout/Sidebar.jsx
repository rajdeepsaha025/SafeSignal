import React from 'react';
import { Box, Typography, Button, List, ListItem, ListItemButton, ListItemIcon, ListItemText, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'Overview', icon: 'dashboard', path: '/analytics' },
    { label: 'Pending Reports', icon: 'report_problem', path: '/admin', activeOverride: true },
    { label: 'Threat Intelligence', icon: 'security', path: '/check' },
    { label: 'Network Analytics', icon: 'analytics', path: '/analytics' },
    { label: 'Audit Logs', icon: 'history', path: '/history' },
    { label: 'System Admin', icon: 'admin_panel_settings', path: '/admin' }
  ];

  const bottomItems = [
    { label: 'Help Center', icon: 'help', path: '/' },
    { label: 'Logout', icon: 'logout', path: '/login' }
  ];

  return (
    <Box
      sx={{
        width: 256,
        bgcolor: '#ffffff',
        borderRight: `1px solid ${theme.palette.outline.variant}`,
        display: { xs: 'none', lg: 'flex' },
        flexDirection: 'column',
        height: 'calc(100vh - 64px)',
        position: 'sticky',
        top: 64,
        py: 2,
        flexShrink: 0
      }}
    >
      {/* User Info / Header */}
      <Box sx={{ px: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box 
          sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            bgcolor: theme.palette.primary.light, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: theme.palette.primary.dark
          }}
        >
          <span className="material-symbols-outlined">shield</span>
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
            SafeSignal Admin
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            Vigilance Portal
          </Typography>
        </Box>
      </Box>

      {/* Primary Action Button */}
      <Box sx={{ px: 3, mb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={() => navigate('/check')}
          startIcon={<span className="material-symbols-outlined">add</span>}
          sx={{ py: 1 }}
        >
          New Investigation
        </Button>
      </Box>

      {/* Nav List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5 }}>
        <List sx={{ p: 0, '& .MuiListItem-root': { p: 0 } }}>
          {menuItems.map((item) => {
            const isActive = item.activeOverride ? location.pathname === '/admin' : location.pathname === item.path;
            return (
              <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 99,
                    mx: 0.5,
                    py: 1,
                    px: 2,
                    bgcolor: isActive ? theme.palette.primary.light : 'transparent',
                    color: isActive ? theme.palette.primary.dark : theme.palette.text.secondary,
                    transform: isActive ? 'scale(0.95)' : 'none',
                    transition: 'all 0.15s',
                    '&:hover': {
                      bgcolor: isActive ? theme.palette.primary.light : 'rgba(21, 101, 192, 0.08)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ 
                      fontSize: '14px', 
                      fontWeight: isActive ? 700 : 500 
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Bottom Nav List */}
      <Box sx={{ px: 1.5, pt: 2, borderTop: `1px solid ${theme.palette.outline.variant}` }}>
        <List sx={{ p: 0 }}>
          {bottomItems.map((item) => (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 99,
                  mx: 0.5,
                  py: 1,
                  px: 2,
                  color: theme.palette.text.secondary,
                  '&:hover': { bgcolor: 'rgba(21, 101, 192, 0.08)' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '14px', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
}
