import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  useTheme
} from '@mui/material';
import PageContainer from '../../components/layout/PageContainer';
import OverviewCards from './OverviewCards';
import Charts from './Charts';
import InfoCard from '../../components/common/InfoCard';
import DataTable, { TableRow, TableCell } from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';

export default function AnalyticsPage() {
  const theme = useTheme();

  const threatSources = [
    { name: 'API Gateway A', percentage: 45, color: theme.palette.error.main },
    { name: 'Legacy Node 3', percentage: 28, color: theme.palette.warning.main },
    { name: 'External Webhook', percentage: 15, color: theme.palette.primary.main },
    { name: 'Mobile Auth Endpoint', percentage: 12, color: theme.palette.outline.main }
  ];

  const detections = [
    { id: 1, timestamp: 'Oct 24, 14:32:01', ip: '192.168.1.105', event: 'Multiple Failed Logins', status: 'Critical' },
    { id: 2, timestamp: 'Oct 24, 14:28:45', ip: '10.0.0.42', event: 'Unusual Data Transfer', status: 'Warning' },
    { id: 3, timestamp: 'Oct 24, 14:15:12', ip: '172.16.254.1', event: 'API Rate Limit Exceeded', status: 'Warning' },
    { id: 4, timestamp: 'Oct 24, 13:59:00', ip: '192.168.1.200', event: 'Privilege Escalation Attempt', status: 'Critical' }
  ];

  // Action Menu State
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeRow, setActiveRow] = useState(null);

  const handleOpenMenu = (event, id) => {
    setAnchorEl(event.currentTarget);
    setActiveRow(id);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setActiveRow(null);
  };

  const handleAction = (action) => {
    alert(`Triggered action "${action}" on detection ID ${activeRow}`);
    handleCloseMenu();
  };

  return (
    <PageContainer withSidebar={true}>
      {/* Page Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 4,
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h1" sx={{ fontSize: '28px', fontWeight: 700 }}>
            Analytics Overview
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time threat intelligence and network performance.
          </Typography>
        </Box>
        
        {/* Header CTA Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => alert('Exporting data as CSV...')}
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>}
            sx={{
              color: theme.palette.primary.main,
              border: `1px solid ${theme.palette.outline.variant}`,
              bgcolor: '#ffffff',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            Export Data
          </Button>
          <Button
            variant="contained"
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_today</span>}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: '#ffffff',
              boxShadow: 'none',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '14px',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
                boxShadow: 'none'
              }
            }}
          >
            Last 30 Days
          </Button>
        </Box>
      </Box>

      {/* Metrics Row */}
      <Box sx={{ mb: 4 }}>
        <OverviewCards />
      </Box>

      {/* Charts Bento grid */}
      <Box sx={{ mb: 4 }}>
        <Charts />
      </Box>

      {/* Bottom Row: Threat sources and recent detections table */}
      <Grid container spacing={3}>
        {/* Top Threat Sources Card */}
        <Grid item xs={12} lg={4}>
          <InfoCard title="Top Threat Sources">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {threatSources.map((source) => (
                <Box key={source.name}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {source.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {source.percentage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={source.percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'background.surfaceContainer',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: source.color,
                        borderRadius: 4
                      }
                    }}
                  />
                </Box>
              ))}
            </Box>
          </InfoCard>
        </Grid>

        {/* Recent High-Risk Detections Table Card */}
        <Grid item xs={12} lg={8}>
          <InfoCard 
            title="Recent High-Risk Detections"
            action={
              <Button 
                variant="text" 
                size="small" 
                onClick={() => alert('Navigating to full audit log...')} 
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                View All
              </Button>
            }
            contentSx={{ p: 0 }}
          >
            <DataTable
              headers={['Timestamp', 'Source IP', 'Event Type', 'Status', 'Action']}
              rows={detections}
              renderRow={(row) => (
                <TableRow 
                  key={row.id} 
                  sx={{ 
                    borderBottom: `1px solid ${theme.palette.outline.variant}`,
                    '&:hover': { bgcolor: '#F1F5F9' },
                    transition: 'background-color 0.15s'
                  }}
                >
                  <TableCell sx={{ px: 3, py: 2, color: 'text.secondary', fontSize: '14px' }}>
                    {row.timestamp}
                  </TableCell>
                  <TableCell sx={{ px: 3, py: 2, fontWeight: 500, color: 'text.primary', fontSize: '14px' }}>
                    {row.ip}
                  </TableCell>
                  <TableCell sx={{ px: 3, py: 2, color: 'text.primary', fontSize: '14px' }}>
                    {row.event}
                  </TableCell>
                  <TableCell sx={{ px: 3, py: 2 }}>
                    <StatusChip status={row.status} />
                  </TableCell>
                  <TableCell sx={{ px: 3, py: 2, textAlign: 'right' }}>
                    <IconButton 
                      size="small" 
                      color="default" 
                      onClick={(e) => handleOpenMenu(e, row.id)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>more_vert</span>
                    </IconButton>
                  </TableCell>
                </TableRow>
              )}
            />
          </InfoCard>
        </Grid>
      </Grid>

      {/* Row Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleAction('Block IP')}>Block IP Address</MenuItem>
        <MenuItem onClick={() => handleAction('Assign Analyst')}>Assign to Analyst</MenuItem>
        <MenuItem onClick={() => handleAction('Dismiss')}>Dismiss Alert</MenuItem>
      </Menu>
    </PageContainer>
  );
}
