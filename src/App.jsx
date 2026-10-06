import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import Pages
import HomePage from './pages/Home/HomePage';
import CheckPage from './pages/Check/CheckPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import AdminPage from './pages/Admin/AdminPage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import HistoryPage from './pages/History/HistoryPage';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/check" element={<CheckPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Admin-Only Routes */}
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={['ADMIN']}><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute allowedRoles={['ADMIN']}><HistoryPage /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}
