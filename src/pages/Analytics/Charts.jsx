import React from 'react';
import { Grid, Typography, Box, useTheme } from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import InfoCard from '../../components/common/InfoCard';

// Mock Data for Line Chart
const lineData = [
  { name: 'Mon', 'Total Detections': 65, 'High Risk': 28 },
  { name: 'Tue', 'Total Detections': 59, 'High Risk': 48 },
  { name: 'Wed', 'Total Detections': 80, 'High Risk': 40 },
  { name: 'Thu', 'Total Detections': 81, 'High Risk': 19 },
  { name: 'Fri', 'Total Detections': 56, 'High Risk': 86 },
  { name: 'Sat', 'Total Detections': 55, 'High Risk': 27 },
  { name: 'Sun', 'Total Detections': 40, 'High Risk': 90 }
];

// Mock Data for Pie Chart
const pieData = [
  { name: 'Low Risk', value: 300, color: '#a0f399' },
  { name: 'Medium Risk', value: 50, color: '#ffb957' },
  { name: 'High Risk', value: 100, color: '#ba1a1a' }
];

export default function Charts() {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      {/* Line Chart: Recent Threat Trends */}
      <Grid item xs={12} lg={8}>
        <InfoCard title="Recent Threat Trends" contentSx={{ p: 2 }}>
          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" stroke="#727783" style={{ fontSize: '12px', fontFamily: 'Inter' }} />
                <YAxis stroke="#727783" style={{ fontSize: '12px', fontFamily: 'Inter' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="Total Detections"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="High Risk"
                  stroke={theme.palette.error.main}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </InfoCard>
      </Grid>

      {/* Doughnut Chart: Risk Distribution */}
      <Grid item xs={12} lg={4}>
        <InfoCard title="Risk Distribution" contentSx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ width: '100%', height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend */}
            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              {pieData.map((entry) => (
                <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '11px' }}>
                    {entry.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </InfoCard>
      </Grid>
    </Grid>
  );
}
