import React from 'react';
import { Box, Typography, Button, LinearProgress, Avatar, Stack, Chip, useTheme } from '@mui/material';
import DataTable, { TableRow, TableCell } from '../../components/common/DataTable';

export default function ModerationTable({ reports, onApprove, onReject }) {
  const theme = useTheme();

  // Helper for flag chip colors
  const getFlagColors = (flag) => {
    const text = flag.toLowerCase();
    if (text.includes('geo') || text.includes('phish') || text.includes('value')) {
      return { border: '#ffb4ab', bg: '#ffdad6', color: '#93000a' }; // red
    }
    if (text.includes('dispute') || text.includes('spam')) {
      return { border: '#fcd34d', bg: '#fef3c7', color: '#92400e' }; // amber
    }
    return { border: '#c2c6d4', bg: '#f1f3ff', color: '#424752' }; // default grey
  };

  const getScoreColor = (score) => {
    if (score > 75) return theme.palette.error.main;
    if (score > 35) return theme.palette.warning.main;
    return theme.palette.secondary.main;
  };

  return (
    <DataTable
      headers={['Report ID', 'Entity', 'Risk Score', 'Flags', 'Actions']}
      rows={reports}
      emptyMessage="No pending reports to moderate."
      renderRow={(report) => (
        <TableRow
          key={report.id}
          sx={{
            borderBottom: `1px solid ${theme.palette.outline.variant}`,
            '&:hover': {
              '& .action-buttons': { opacity: 1 } // Show buttons on hover
            },
            transition: 'background-color 0.15s'
          }}
        >
          {/* Report ID */}
          <TableCell sx={{ px: 3, py: 2.5, fontWeight: 600, color: 'text.primary', fontSize: '14px' }}>
            {report.id}
          </TableCell>

          {/* Entity details */}
          <TableCell sx={{ px: 3, py: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: theme.palette.background.surfaceVariant,
                  color: theme.palette.text.secondary,
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                {report.user.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {report.user}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {report.type}
                </Typography>
              </Box>
            </Box>
          </TableCell>

          {/* Risk Score Progress */}
          <TableCell sx={{ px: 3, py: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LinearProgress
                variant="determinate"
                value={report.riskScore}
                sx={{
                  width: 64,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'background.surfaceContainer',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getScoreColor(report.riskScore),
                    borderRadius: 3
                  }
                }}
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 700, 
                  color: getScoreColor(report.riskScore) 
                }}
              >
                {report.riskScore}
              </Typography>
            </Box>
          </TableCell>

          {/* Flags */}
          <TableCell sx={{ px: 3, py: 2.5 }}>
            <Stack direction="row" spacing={0.5}>
              {report.flags.map((flag) => {
                const c = getFlagColors(flag);
                return (
                  <Chip
                    key={flag}
                    label={flag}
                    size="small"
                    sx={{
                      bgcolor: c.bg,
                      color: c.color,
                      border: `1px solid ${c.border}`,
                      fontSize: '10px',
                      fontWeight: 600,
                      height: '20px'
                    }}
                  />
                );
              })}
            </Stack>
          </TableCell>

          {/* Actions */}
          <TableCell sx={{ px: 3, py: 2.5, textAlign: 'right' }}>
            <Box
              className="action-buttons"
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1,
                opacity: { xs: 1, md: 0.8 }, // semi-visible by default on desktop, fully on hover
                transition: 'opacity 0.15s'
              }}
            >
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => onApprove(report.id)}
                startIcon={<span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check</span>}
                sx={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'none',
                  py: 0.5,
                  borderColor: theme.palette.secondary.main,
                  '&:hover': {
                    bgcolor: '#e8f5e9',
                    borderColor: theme.palette.secondary.main
                  }
                }}
              >
                Approve
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => onReject(report.id)}
                startIcon={<span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>}
                sx={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'none',
                  py: 0.5,
                  '&:hover': {
                    bgcolor: '#ffdad6',
                  }
                }}
              >
                Reject
              </Button>
            </Box>
          </TableCell>
        </TableRow>
      )}
    />
  );
}
