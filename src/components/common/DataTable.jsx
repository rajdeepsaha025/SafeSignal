import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  useTheme
} from '@mui/material';

export default function DataTable({ headers, rows, renderRow, emptyMessage = 'No data available.' }) {
  const theme = useTheme();

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: 'none', bgcolor: 'transparent' }}>
      <Table sx={{ minWidth: 650 }} aria-label="data table">
        <TableHead>
          <TableRow sx={{ borderBottom: `1px solid ${theme.palette.outline.variant}`, bgcolor: '#ffffff' }}>
            {headers.map((header) => (
              <TableCell
                key={header}
                sx={{
                  py: 1.5,
                  px: 3,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontFamily: 'Inter, sans-serif',
                  borderBottom: 'none'
                }}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length} align="center" sx={{ py: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => renderRow(row, index))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
export { TableRow, TableCell };
