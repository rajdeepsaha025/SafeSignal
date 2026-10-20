import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            username: user.displayName || user.email.split('@')[0],
            role: tokenResult.claims.role || 'USER',
            avatar: user.photoURL || 'https://mui.com/static/images/avatar/1.jpg',
          });
        } catch (e) {
          console.error("Failed to fetch claims", e);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const [pendingReports, setPendingReports] = useState(initialPendingReports);
  const [logs, setLogs] = useState(initialLogs);
  const [checkHistory, setCheckHistory] = useState([
    { targetId: 'fraudster@upi', riskScore: 92, status: 'HIGH RISK', time: '5 mins ago' },
    { targetId: 'safeuser@okaxis', riskScore: 8, status: 'LOW RISK', time: '1 hour ago' },
  ]);

  const [currentCheckResult, setCurrentCheckResult] = useState(null);

  // Perform UPI Risk Check from Firebase Firestore upi_profiles
  const checkUpiRisk = async (id) => {
    // Clean string input
    const cleanId = id.trim().toLowerCase();

    // 1. Check Firebase Firestore `upi_profiles` collection
    try {
      const profileRef = doc(db, 'upi_profiles', cleanId);
      const snap = await getDoc(profileRef);

      if (snap.exists()) {
        const data = snap.data();
        const score = typeof data.riskScore === 'number' ? data.riskScore : 0;
        const rawLevel = data.riskLevel || (score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW');
        const status = `${rawLevel.toUpperCase()} RISK`;
        const verifiedCount = data.verifiedReports ?? 0;
        const isBlacklisted = Boolean(data.isBlacklisted);
        const reasons = data.riskReasons || [];
        const cats = data.fraudCategories || [];

        const result = {
          targetId: cleanId,
          name: cleanId.includes('@') ? cleanId.split('@')[0].charAt(0).toUpperCase() + '***' : cleanId,
          riskScore: score,
          status: status,
          firstSeen: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : (data.lastReported?.toDate ? data.lastReported.toDate().toLocaleDateString() : 'Recorded in SafeSignal'),
          lastActivity: data.lastChecked?.toDate ? data.lastChecked.toDate().toLocaleDateString() : (data.lastUpdated?.toDate ? data.lastUpdated.toDate().toLocaleDateString() : 'Recently'),
          evidence: {
            communityReports: verifiedCount,
            externalDatabases: [
              { name: 'I4C Registry', status: isBlacklisted ? 'Flagged' : (score >= 50 ? 'Flagged' : 'Clean') },
              { name: 'Bank Blacklist', status: isBlacklisted ? 'Flagged' : 'Clean' },
            ],
            mlConfidence: typeof data.mlProbability === 'number' ? Math.round(data.mlProbability * 100) : score,
          },
          timeline: [
            ...(isBlacklisted ? [{ time: 'Blacklist Alert', text: 'UPI ID is flagged on SafeSignal Internal Blacklist.' }] : []),
            ...(reasons.length > 0 ? reasons.map((r) => ({ time: 'Risk Factor', text: typeof r === 'string' ? r : r.title || r.message || 'Reported activity' })) : []),
            ...(cats.length > 0 ? [{ time: 'Categories', text: `Flagged under categories: ${cats.join(', ')}` }] : []),
            { time: 'Firebase Record', text: `Risk profile retrieved from Firebase Firestore (Score: ${score}/100, Level: ${rawLevel}).` },
          ],
        };

        setCurrentCheckResult(result);
        setCheckHistory((prev) => [
          { targetId: result.targetId, riskScore: result.riskScore, status: result.status, time: 'Just Now' },
          ...prev.filter((item) => item.targetId !== result.targetId),
        ]);
        return result;
      }
    } catch (err) {
      console.warn('[AppContext] Firestore profile lookup warning:', err.message);
    }

    // 2. Check local fallback database
    if (upiRiskDatabase[cleanId]) {
      const result = upiRiskDatabase[cleanId];
      setCurrentCheckResult(result);
      setCheckHistory((prev) => [
        { targetId: result.targetId, riskScore: result.riskScore, status: result.status, time: 'Just Now' },
        ...prev.filter((item) => item.targetId !== result.targetId),
      ]);
      return result;
    }

    // 3. For an unrecorded/clean UPI ID: clean score is 0, LOW RISK (never generate random numbers!)
    const cleanResult = {
      targetId: cleanId,
      name: cleanId.includes('@') ? cleanId.split('@')[0].charAt(0).toUpperCase() + '***' : 'Unknown',
      riskScore: 0,
      status: 'LOW RISK',
      firstSeen: 'First Time Checked',
      lastActivity: 'None',
      evidence: {
        communityReports: 0,
        externalDatabases: [
          { name: 'I4C Registry', status: 'Clean' },
          { name: 'Bank Blacklist', status: 'Clean' },
        ],
        mlConfidence: 0,
      },
      timeline: [
        { time: 'Just Now', text: 'No prior fraud reports or risk indicators found in SafeSignal.' },
      ],
    };

    setCurrentCheckResult(cleanResult);
    setCheckHistory((prev) => [
      { targetId: cleanResult.targetId, riskScore: cleanResult.riskScore, status: cleanResult.status, time: 'Just Now' },
      ...prev.filter((item) => item.targetId !== cleanResult.targetId),
    ]);
    return cleanResult;
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
        authLoading,
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
