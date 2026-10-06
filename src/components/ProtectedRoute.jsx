import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>Verifying authorization...</Typography>
      </Box>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // If authenticated but unauthorized, send to safe default route (e.g. check page)
    return <Navigate to="/check" replace />;
  }

  return children;
}
