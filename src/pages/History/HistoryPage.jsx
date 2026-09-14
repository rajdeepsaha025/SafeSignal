import React from 'react';
import { Box, Typography, Button, IconButton, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import { useApp } from '../../context/AppContext';
import InfoCard from '../../components/common/InfoCard';
import DataTable, { TableRow, TableCell } from '../../components/common/DataTable';
import RiskBadge from '../../components/common/RiskBadge';

export default function HistoryPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { checkHistory, checkUpiRisk } = useApp();

  const handleRecheck = (targetId) => {
    checkUpiRisk(targetId);
    navigate('/check');
  };

  return (
    <PageContainer withSidebar={true}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" sx={{ fontSize: '28px', fontWeight: 700 }}>
          Investigation History
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          View history of searched VPAs, risk results, and audit trails.
        </Typography>
      </Box>

      {/* History Table Card */}
      <InfoCard title="Searched UPI Registry Logs" contentSx={{ p: 0 }}>
        <DataTable
          headers={['Target ID / VPA', 'Risk Score', 'Risk Level', 'Checked', 'Action']}
          rows={checkHistory}
          emptyMessage="No search logs recorded. Use the 'Check UPI' tool to investigate VPAs."
          renderRow={(row, idx) => (
            <TableRow
              key={idx}
              sx={{
                borderBottom: `1px solid ${theme.palette.outline.variant}`,
                '&:hover': { bgcolor: '#F1F5F9' },
                transition: 'background-color 0.15s'
              }}
            >
              {/* Target ID */}
              <TableCell sx={{ px: 3, py: 2, fontWeight: 700, color: 'text.primary', fontSize: '14px' }}>
                {row.targetId}
              </TableCell>

              {/* Risk Score */}
              <TableCell sx={{ px: 3, py: 2, fontWeight: 700, color: row.riskScore > 75 ? theme.palette.error.main : row.riskScore > 35 ? theme.palette.warning.main : theme.palette.secondary.main, fontSize: '14px' }}>
                {row.riskScore} / 100
              </TableCell>

              {/* Risk Level Badge */}
              <TableCell sx={{ px: 3, py: 2 }}>
                <RiskBadge status={row.status} />
              </TableCell>

              {/* Time Checked */}
              <TableCell sx={{ px: 3, py: 2, color: 'text.secondary', fontSize: '14px' }}>
                {row.time}
              </TableCell>

              {/* Action Button */}
              <TableCell sx={{ px: 3, py: 2, textAlign: 'right' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleRecheck(row.targetId)}
                  startIcon={<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>}
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'none',
                    py: 0.5,
                    border: `1px solid ${theme.palette.outline.variant}`,
                    color: 'text.primary',
                    '&:hover': {
                      bgcolor: 'rgba(21, 101, 192, 0.04)',
                      borderColor: theme.palette.primary.main
                    }
                  }}
                >
                  Recheck
                </Button>
              </TableCell>
            </TableRow>
          )}
        />
      </InfoCard>
    </PageContainer>
  );
}
