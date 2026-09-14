import React from 'react';
import { Grid } from '@mui/material';
import StatCard from '../../components/common/StatCard';

export default function OverviewCards() {
  const cardsData = [
    {
      title: 'Total Checks',
      value: '1.2M',
      icon: 'fact_check',
      trend: '+12.5% from last month',
      trendType: 'positive',
    },
    {
      title: 'Average Risk Score',
      value: '42/100',
      icon: 'speed',
      trend: 'Stable across network',
      trendType: 'neutral',
    },
    {
      title: 'High Risk Flags',
      value: '3.8%',
      icon: 'warning',
      trend: '+0.4% from last week',
      trendType: 'negative', // threat increase is negative
    },
    {
      title: 'Reports Submitted',
      value: '8,432',
      icon: 'description',
      trend: '+5.2% processing rate',
      trendType: 'positive',
    },
  ];

  return (
    <Grid container spacing={3}>
      {cardsData.map((card) => (
        <Grid item xs={12} sm={6} lg={3} key={card.title}>
          <StatCard
            title={card.title}
            value={card.value}
            icon={card.icon}
            trend={card.trend}
            trendType={card.trendType}
          />
        </Grid>
      ))}
    </Grid>
  );
}
