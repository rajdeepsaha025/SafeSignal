import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme
} from '@mui/material';
import PageContainer from '../../components/layout/PageContainer';
import { useApp } from '../../context/AppContext';
import ModerationTable from './ModerationTable';
import InfoCard from '../../components/common/InfoCard';

export default function AdminPage() {
  const theme = useTheme();
  const { pendingReports, logs, approveReport, rejectReport } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  // Filtered reports by search query
  const filteredReports = pendingReports.filter((report) =>
    report.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLogIcon = (type) => {
    switch (type) {
      case 'system':
        return { name: 'update', color: theme.palette.text.secondary };
      case 'warning':
        return { name: 'warning', color: theme.palette.error.main };
      case 'action':
      default:
        return { name: 'admin_panel_settings', color: theme.palette.primary.main };
    }
  };

  return (
    <PageContainer withSidebar={true}>
      {/* Page Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' },
          mb: 4,
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h1" sx={{ fontSize: '28px', fontWeight: 700 }}>
            Moderation Console
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Review and action pending fraud reports.
          </Typography>
        </Box>

        {/* Search Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', md: 'auto' } }}>
          <TextField
            size="small"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <span className="material-symbols-outlined" style={{ color: theme.palette.outline.main, marginRight: '8px', fontSize: '20px' }}>
                  search
                </span>
              )
            }}
            sx={{ width: { xs: '100%', md: 240 } }}
          />
          <Button
            variant="outlined"
            sx={{
              minWidth: 40,
              width: 40,
              height: 40,
              p: 0,
              borderColor: theme.palette.outline.variant,
              color: theme.palette.text.secondary,
              bgcolor: '#ffffff'
            }}
          >
            <span className="material-symbols-outlined">filter_list</span>
          </Button>
        </Box>
      </Box>

      {/* System Health Bento Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* API Status */}
        <Grid item xs={12} md={4}>
          <InfoCard sx={{ height: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1b5e20' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>api</span>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>API Status</Typography>
              </Box>
              <Chip
                label="Active"
                size="small"
                sx={{
                  bgcolor: '#E8F5E9',
                  color: '#1B5E20',
                  fontWeight: 700,
                  fontSize: '11px',
                  height: '20px',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              99.9%
            </Typography>
            <Typography variant="caption" color="text.secondary">Uptime (Last 24h)</Typography>
          </InfoCard>
        </Grid>

        {/* Database Status */}
        <Grid item xs={12} md={4}>
          <InfoCard sx={{ height: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1b5e20' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>database</span>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Database</Typography>
              </Box>
              <Chip
                label="Healthy"
                size="small"
                sx={{
                  bgcolor: '#E8F5E9',
                  color: '#1B5E20',
                  fontWeight: 700,
                  fontSize: '11px',
                  height: '20px',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              12ms
            </Typography>
            <Typography variant="caption" color="text.secondary">Avg Latency</Typography>
          </InfoCard>
        </Grid>

        {/* ML Engine Status */}
        <Grid item xs={12} md={4}>
          <InfoCard sx={{ height: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: theme.palette.primary.light, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.palette.primary.dark }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>psychology</span>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>ML Engine</Typography>
              </Box>
              <Chip
                label="v4.2"
                size="small"
                sx={{
                  bgcolor: theme.palette.primary.light,
                  color: theme.palette.primary.dark,
                  fontWeight: 700,
                  fontSize: '11px',
                  height: '20px',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              94.2%
            </Typography>
            <Typography variant="caption" color="text.secondary">Confidence Score Avg</Typography>
          </InfoCard>
        </Grid>
      </Grid>

      {/* Moderation Pending List Card */}
      <Box sx={{ mb: 4 }}>
        <InfoCard
          title="Pending Fraud Reports"
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                label={`${pendingReports.length} Active`}
                size="small"
                color="error"
                sx={{ fontWeight: 700, fontSize: '11px', height: '22px' }}
              />
              <Button variant="text" size="small" sx={{ textTransform: 'none', fontWeight: 600 }}>
                View All
              </Button>
            </Box>
          }
          contentSx={{ p: 0 }}
        >
          <ModerationTable
            reports={filteredReports}
            onApprove={approveReport}
            onReject={rejectReport}
          />
        </InfoCard>
      </Box>

      {/* Activity Logs Preview */}
      <Box>
        <InfoCard 
          title="Recent System Activity"
          action={
            <Button variant="text" size="small" sx={{ textTransform: 'none', fontWeight: 600 }}>
              Full Log
            </Button>
          }
        >
          <List sx={{ p: 0 }}>
            {logs.slice(0, 5).map((log, idx) => {
              const iconDetail = getLogIcon(log.type);
              return (
                <ListItem 
                  key={log.id} 
                  sx={{ 
                    px: 0, 
                    py: 1.5, 
                    alignItems: 'flex-start',
                    borderBottom: idx < logs.length - 1 ? `1px solid ${theme.palette.outline.variant}` : 'none'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, mt: 0.5, color: iconDetail.color }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{iconDetail.name}</span>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {log.title}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {log.category} • {log.time}
                      </Typography>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </InfoCard>
      </Box>
    </PageContainer>
  );
}
