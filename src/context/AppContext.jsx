import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

// Mock Initial Pending Reports for Admin Console
const initialPendingReports = [
  {
    id: '#REP-8992',
    user: 'User_77X9',
    type: 'Suspicious Login',
    riskScore: 92,
    flags: ['Geo-Anomaly', 'Velocity'],
    timestamp: 'Today, 10:45 AM',
    status: 'Pending',
  },
  {
    id: '#REP-8991',
    user: 'Merch_TechCorp',
    type: 'High Chargeback Rate',
    riskScore: 78,
    flags: ['Disputes'],
    timestamp: 'Yesterday, 14:20 PM',
    status: 'Pending',
  },
  {
    id: '#REP-8990',
    user: 'Txn_9921A',
    type: 'Value Mismatch',
    riskScore: 88,
    flags: ['Value Anomaly', 'New Device'],
    timestamp: '12 Oct 2023',
    status: 'Pending',
  },
  {
    id: '#REP-8989',
    user: 'User_44A2',
    type: 'Phishing Solicitation',
    riskScore: 95,
    flags: ['Phishing', 'Spam VPA'],
    timestamp: '11 Oct 2023',
    status: 'Pending',
  }
];

// Mock Activity Logs
const initialLogs = [
  {
    id: 1,
    title: 'Model Weights Updated to v4.2.1',
    category: 'System',
    time: '2 mins ago',
    type: 'system',
  },
  {
    id: 2,
    title: 'Analyst J.Doe approved Report #REP-8985',
    category: 'Manual Action',
    time: '15 mins ago',
    type: 'action',
  },
  {
    id: 3,
    title: 'API Rate Limit Exceeded on Node US-East-1',
    category: 'Infrastructure',
    time: '1 hour ago',
    type: 'warning',
  },
];

// Mock UPI Risk DB
const upiRiskDatabase = {
  'fraudster@upi': {
    targetId: 'fraudster@upi',
    name: 'R*** K****',
    riskScore: 92,
    status: 'HIGH RISK',
    firstSeen: '12 Oct 2023',
    lastActivity: '2 Hours Ago',
    evidence: {
      communityReports: 14,
      externalDatabases: [
        { name: 'I4C Registry', status: 'Flagged' },
        { name: 'Bank Blacklist', status: 'Unknown' },
      ],
      mlConfidence: 88,
    },
    timeline: [
      { time: 'Today, 10:45 AM', text: "Reported for 'Phishing Request' via SafeSignal App." },
      { time: 'Yesterday, 14:20 PM', text: 'I4C Database sync updated risk score.' },
      { time: '12 Oct 2023', text: 'Initial cluster of 5 community reports logged.' },
    ],
  },
  'safeuser@okaxis': {
    targetId: 'safeuser@okaxis',
    name: 'A**** S****',
    riskScore: 8,
    status: 'LOW RISK',
    firstSeen: '01 Jan 2024',
    lastActivity: '1 Day Ago',
    evidence: {
      communityReports: 0,
      externalDatabases: [
        { name: 'I4C Registry', status: 'Clean' },
        { name: 'Bank Blacklist', status: 'Clean' },
      ],
      mlConfidence: 3,
    },
    timeline: [
      { time: '01 Jan 2024', text: 'Account registered and first verified transaction.' },
    ],
  },
  'verify@paytm': {
    targetId: 'verify@paytm',
    name: 'T**** P****',
    riskScore: 48,
    status: 'MEDIUM RISK',
    firstSeen: '15 Mar 2024',
    lastActivity: '5 Hours Ago',
    evidence: {
      communityReports: 2,
      externalDatabases: [
        { name: 'I4C Registry', status: 'Clean' },
        { name: 'Bank Blacklist', status: 'Flagged' },
      ],
      mlConfidence: 54,
    },
    timeline: [
      { time: 'Yesterday, 18:30 PM', text: 'Flagged by bank partner for atypical velocity.' },
    ],
  }
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState({
    username: 'J. Doe',
    role: 'Senior Investigator',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBydVq8_G1JVz7nJ8gwSwgaG_nASZKztnzBvcScAzK_rAp6wWgm9EGgODziFmE9XwUmw_aaJv67mtKZXI46b22qMqG1PI-jFntnR17tbKxpei1heHWWJre2uJIcNz8nanDEW-pVfmYKGojJpP0_zZnqVy2V8iIkszMh2MAUGaI9n_Mst25MhuPcRvyetSZBowRyhe1ADlhxe_6yLDEG0IKyA1GoDSSE7stll-AA-QdkgOqaDNmUfuq-',
  });

  const [pendingReports, setPendingReports] = useState(initialPendingReports);
  const [logs, setLogs] = useState(initialLogs);
  const [checkHistory, setCheckHistory] = useState([
    { targetId: 'fraudster@upi', riskScore: 92, status: 'HIGH RISK', time: '5 mins ago' },
    { targetId: 'safeuser@okaxis', riskScore: 8, status: 'LOW RISK', time: '1 hour ago' },
  ]);

  const [currentCheckResult, setCurrentCheckResult] = useState(null);

  // Perform UPI Risk Check
  const checkUpiRisk = (id) => {
    // Clean string input
    const cleanId = id.trim().toLowerCase();
    
    // Check if we have records, otherwise generate mock data
    if (upiRiskDatabase[cleanId]) {
      const result = upiRiskDatabase[cleanId];
      setCurrentCheckResult(result);
      // Add to check history
      setCheckHistory((prev) => [
        { targetId: result.targetId, riskScore: result.riskScore, status: result.status, time: 'Just Now' },
        ...prev.filter(item => item.targetId !== result.targetId)
      ]);
      return result;
    } else {
      // Create dynamically generated mock data for demo
      const randomScore = Math.floor(Math.random() * 100);
      let status = 'LOW RISK';
      if (randomScore > 75) status = 'HIGH RISK';
      else if (randomScore > 35) status = 'MEDIUM RISK';

      const dynamicResult = {
        targetId: cleanId,
        name: cleanId.includes('@') ? cleanId.split('@')[0].charAt(0).toUpperCase() + '***' : 'U*** K****',
        riskScore: randomScore,
        status: status,
        firstSeen: 'Just Now',
        lastActivity: 'Just Now',
        evidence: {
          communityReports: status === 'HIGH RISK' ? 5 : status === 'MEDIUM RISK' ? 1 : 0,
          externalDatabases: [
            { name: 'I4C Registry', status: status === 'HIGH RISK' ? 'Flagged' : 'Clean' },
            { name: 'Bank Blacklist', status: 'Clean' },
          ],
          mlConfidence: randomScore,
        },
        timeline: [
          { time: 'Just Now', text: 'Checked on SafeSignal Platform.' }
        ]
      };

      setCurrentCheckResult(dynamicResult);
      setCheckHistory((prev) => [
        { targetId: dynamicResult.targetId, riskScore: dynamicResult.riskScore, status: dynamicResult.status, time: 'Just Now' },
        ...prev
      ]);
      return dynamicResult;
    }
  };

  // Submit Fraud Report
  const reportFraud = (reportData) => {
    // Generate pending report
    const newReport = {
      id: `#REP-${Math.floor(1000 + Math.random() * 9000)}`,
      user: reportData.targetId || 'Anonymous',
      type: reportData.type || 'User Reported Fraud',
      riskScore: 85,
      flags: ['Community Report'],
      timestamp: 'Just Now',
      status: 'Pending',
    };

    setPendingReports((prev) => [newReport, ...prev]);

    // Update log
    const newLog = {
      id: Date.now(),
      title: `New fraud report submitted for ${newReport.user}`,
      category: 'Community',
      time: 'Just Now',
      type: 'action',
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // Approve Report
  const approveReport = (reportId) => {
    setPendingReports((prev) => prev.filter((r) => r.id !== reportId));
    setLogs((prev) => [
      {
        id: Date.now(),
        title: `Analyst approved Report ${reportId}`,
        category: 'Moderation',
        time: 'Just Now',
        type: 'action',
      },
      ...prev,
    ]);
  };

  // Reject Report
  const rejectReport = (reportId) => {
    setPendingReports((prev) => prev.filter((r) => r.id !== reportId));
    setLogs((prev) => [
      {
        id: Date.now(),
        title: `Analyst rejected Report ${reportId}`,
        category: 'Moderation',
        time: 'Just Now',
        type: 'action',
      },
      ...prev,
    ]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        pendingReports,
        logs,
        checkHistory,
        currentCheckResult,
        checkUpiRisk,
        reportFraud,
        approveReport,
        rejectReport,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
