import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Avatar,
  Box,
  Badge,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useApp } from '../../context/AppContext';

export default function Navbar() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Check UPI', path: '/check' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'History', path: '/history' },
    { label: 'Admin', path: '/admin' }
  ];

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: `1px solid ${theme.palette.outline.variant}`,
        bgcolor: '#ffffff',
        zIndex: theme.zIndex.drawer + 1
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          px: { xs: 2, md: 4 },
          maxWidth: '1440px',
          width: '100%',
          mx: 'auto',
          boxSizing: 'border-box',
          height: 64
        }}
      >
        {/* Brand */}
        <Box
          onClick={() => navigate('/')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 },
            transition: 'opacity 0.15s'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span className="material-symbols-outlined" style={{ color: theme.palette.primary.main, fontSize: '20px' }}>security</span>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                fontFamily: 'Plus Jakarta Sans, sans-serif'
              }}
            >
              SafeSignal
            </Typography>
          </Box>
        </Box>

        {/* Desktop Links */}
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  sx={{
                    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '14px',
                    px: 2,
                    py: 0.5,
                    borderBottom: isActive ? `2px solid ${theme.palette.primary.main}` : 'none',
                    borderRadius: 0,
                    '&:hover': {
                      bgcolor: 'rgba(21, 101, 192, 0.04)',
                    }
                  }}
                >
                  {link.label}
                </Button>
              );
            })}
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton aria-label="notifications" color="default" size="small">
            <Badge badgeContent={3} color="error">
              <span className="material-symbols-outlined">notifications</span>
            </Badge>
          </IconButton>

          <IconButton aria-label="settings" color="default" size="small" onClick={() => navigate('/admin')}>
            <span className="material-symbols-outlined">settings</span>
          </IconButton>

          <Avatar
            alt={currentUser.username}
            src={currentUser.avatar}
            onClick={handleMenuOpen}
            sx={{
              width: 32,
              height: 32,
              cursor: 'pointer',
              border: `1px solid ${theme.palette.outline.variant}`,
              marginLeft: 1,
              '&:hover': { opacity: 0.8 },
              transition: 'opacity 0.15s'
            }}
          />

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{currentUser.username}</Typography>
              <Typography variant="caption" color="text.secondary">{currentUser.role}</Typography>
            </Box>
            <MenuItem onClick={() => { handleMenuClose(); navigate('/history'); }}>Activity History</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
