import React from 'react';
import { Grid, Box, Typography, List, ListItem, ListItemText, useTheme } from '@mui/material';
import InfoCard from '../../components/common/InfoCard';

export default function RiskReasons({ evidence }) {
  const theme = useTheme();
  const { communityReports, externalDatabases, mlConfidence } = evidence;

  return (
    <Grid container spacing={3}>
      {/* Community Reports Card */}
      <Grid item xs={12} md={4}>
        <InfoCard
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span className="material-symbols-outlined" style={{ color: theme.palette.secondary.main }}>groups</span>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Community Reports</Typography>
            </Box>
          }
        >
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {communityReports}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Users flagged this ID for suspicious behavior in the last 30 days.
          </Typography>
        </InfoCard>
      </Grid>

      {/* External Databases Card */}
      <Grid item xs={12} md={4}>
        <InfoCard
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span className="material-symbols-outlined" style={{ color: theme.palette.primary.main }}>database</span>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>External Databases</Typography>
            </Box>
          }
        >
          <List sx={{ p: 0 }}>
            {externalDatabases.map((db, idx) => {
              const isFlagged = db.status.toLowerCase() === 'flagged';
              return (
                <ListItem
                  key={db.name}
                  sx={{
                    p: 0,
                    mb: idx < externalDatabases.length - 1 ? 1 : 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {db.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: isFlagged ? theme.palette.error.main : theme.palette.text.secondary
                    }}
                  >
                    {db.status}
                  </Typography>
                </ListItem>
              );
            })}
          </List>
        </InfoCard>
      </Grid>

      {/* ML Prediction Card */}
      <Grid item xs={12} md={4}>
        <InfoCard
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span className="material-symbols-outlined" style={{ color: theme.palette.warning.main }}>memory</span>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>ML Prediction</Typography>
            </Box>
          }
        >
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {mlConfidence}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Confidence that this ID exhibits patterns of payment solicitation fraud.
          </Typography>
        </InfoCard>
      </Grid>
    </Grid>
  );
}
