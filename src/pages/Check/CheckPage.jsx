import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  useTheme
} from '@mui/material';
import PageContainer from '../../components/layout/PageContainer';
import { useApp } from '../../context/AppContext';
import RiskGauge from './RiskGauge';
import RiskResult from './RiskResult';
import RiskReasons from './RiskReasons';
import ThreatSources from './ThreatSources';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import InfoCard from '../../components/common/InfoCard';

export default function CheckPage() {
  const theme = useTheme();
  const location = useLocation();
  const { currentCheckResult, checkUpiRisk, reportFraud } = useApp();

  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  
  // Fraud Report Dialog State
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState('Phishing Solicitation');
  const [reportDetails, setReportDetails] = useState('');

  // Handle Initial Search Query passed from Home Page Hero
  useEffect(() => {
    if (location.state?.initialQuery) {
      const q = location.state.initialQuery;
      setInputVal(q);
      triggerCheck(q);
    }
  }, [location.state]);

  const triggerCheck = (queryStr) => {
    if (!queryStr.trim()) return;
    setLoading(true);
    setHasChecked(true);

    // Simulate 600ms latency for risk computation
    setTimeout(() => {
      checkUpiRisk(queryStr);
      setLoading(false);
    }, 600);
  };

  const handleSearchSubmit = () => {
    triggerCheck(inputVal);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputVal(text);
    } catch (err) {
      // Fallback if clipboard permission is denied
      setInputVal('fraudster@upi');
    }
  };

  const handleClear = () => {
    setInputVal('');
  };

  const handleOpenReport = () => {
    setReportOpen(true);
  };

  const handleCloseReport = () => {
    setReportOpen(false);
  };

  const handleConfirmReport = () => {
    reportFraud({
      targetId: currentCheckResult?.targetId || inputVal,
      type: reportType,
      details: reportDetails
    });
    setReportOpen(false);
    setReportDetails('');
    alert(`Fraud report logged for ${currentCheckResult?.targetId || inputVal}. Score will adjust after moderation.`);
  };

  return (
    <PageContainer withSidebar={false}>
      {/* Search Panel Header */}
      <Box sx={{ maxWidth: '720px', mx: 'auto', mb: 6, textAlign: 'center' }}>
        <Typography 
          variant="h1" 
          sx={{ 
            fontSize: { xs: '28px', md: '36px' }, 
            fontWeight: 800, 
            color: theme.palette.primary.main,
            mb: 1.5,
            fontFamily: 'Plus Jakarta Sans, sans-serif'
          }}
        >
          Check UPI Risk Profile
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '16px' }}>
          Instantly verify any UPI ID or phone number against our comprehensive fraud intelligence network.
        </Typography>

        {/* Input Panel Card */}
        <InfoCard sx={{ textAlign: 'left' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                Enter UPI ID or Phone Number
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="e.g., username@bank or 9876543210"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <span 
                      className="material-symbols-outlined" 
                      style={{ color: theme.palette.outline.main, marginRight: '8px' }}
                    >
                      search
                    </span>
                  )
                }}
              />
            </Box>

            {/* Input Action Controls */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handlePaste}
                startIcon={<span className="material-symbols-outlined" style={{ fontSize: '18px' }}>content_copy</span>}
                sx={{ 
                  color: 'text.primary', 
                  border: `1px solid ${theme.palette.outline.variant}`,
                  bgcolor: 'background.surfaceBright',
                  textTransform: 'none'
                }}
              >
                Paste
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleClear}
                sx={{ 
                  color: 'text.primary', 
                  border: `1px solid ${theme.palette.outline.variant}`,
                  textTransform: 'none'
                }}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={handleSearchSubmit}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: '#ffffff',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                    boxShadow: 'none'
                  }
                }}
              >
                Check Risk
              </Button>
            </Box>
          </Box>
        </InfoCard>
      </Box>

      {/* Results Section */}
      <Box sx={{ maxWidth: '960px', mx: 'auto', mt: 4 }}>
        {loading ? (
          <LoadingSpinner message="Querying National Fraud Registries & Neural Models..." />
        ) : hasChecked && currentCheckResult ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Top Summary Row */}
            <Grid container spacing={3}>
              {/* Risk Score Gauge */}
              <Grid item xs={12} md={4}>
                <InfoCard sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 1 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      pb: 1, 
                      borderBottom: `1px solid ${theme.palette.outline.variant}`, 
                      width: '100%', 
                      textAlign: 'center' 
                    }}
                  >
                    Risk Assessment
                  </Typography>
                  <Box sx={{ py: 2 }}>
                    <RiskGauge score={currentCheckResult.riskScore} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', px: 2 }}>
                    {currentCheckResult.riskScore > 75 
                      ? 'Multiple recent fraud flags detected.' 
                      : currentCheckResult.riskScore > 35 
                      ? 'Suspicious velocity patterns detected.' 
                      : 'No recent reports. Cleared transaction path.'}
                  </Typography>
                </InfoCard>
              </Grid>

              {/* Entity Profile details */}
              <Grid item xs={12} md={8}>
                <InfoCard title="Entity Profile">
                  <RiskResult
                    targetId={currentCheckResult.targetId}
                    name={currentCheckResult.name}
                    firstSeen={currentCheckResult.firstSeen}
                    lastActivity={currentCheckResult.lastActivity}
                    onReport={handleOpenReport}
                  />
                </InfoCard>
              </Grid>
            </Grid>

            {/* Evidence & Signals */}
            <Box>
              <Typography variant="h3" sx={{ fontSize: '20px', fontWeight: 700, mb: 2, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Evidence & Signals
              </Typography>
              <RiskReasons evidence={currentCheckResult.evidence} />
            </Box>

            {/* Timeline */}
            <ThreatSources timeline={currentCheckResult.timeline} />
          </Box>
        ) : hasChecked ? (
          <EmptyState />
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Enter details above and click Check Risk to start scanning.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Fraud Report Dialog */}
      <Dialog open={reportOpen} onClose={handleCloseReport} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Report UPI Fraud</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Your report will be cross-referenced with bank patterns and ML logs. Submitting false reports is punishable under NPCI regulations.
          </Typography>
          <TextField
            select
            fullWidth
            label="Report Category"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <MenuItem value="Phishing Solicitation">Phishing Solicitation (Fake Requests)</MenuItem>
            <MenuItem value="Impersonation Scam">Impersonation Scam (Identity Theft)</MenuItem>
            <MenuItem value="Advance Fee Scam">Advance Fee Scam (Fake Rewards)</MenuItem>
            <MenuItem value="Money Mule VPA">Money Mule / Unauthorized Account</MenuItem>
          </TextField>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Details & Proof (Trans. ID, description)"
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseReport} variant="outlined" color="inherit">Cancel</Button>
          <Button onClick={handleConfirmReport} variant="contained" color="error">Submit Report</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
