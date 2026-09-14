import React from 'react';
import PageContainer from '../../components/layout/PageContainer';
import Hero from './Hero';
import Statistics from './Statistics';
import Features from './Features';
import CTA from './CTA';

export default function HomePage() {
  return (
    <>
      <PageContainer withSidebar={false} backgroundColor="transparent">
        <Hero />
        <Statistics />
        <Features />
        <CTA />
      </PageContainer>
    </>
  );
}
