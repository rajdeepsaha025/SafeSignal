import { firestore } from '../src/config/firebaseAdmin.js';
import { COLLECTIONS } from '../src/config/constants.js';
import AnalyticsRepository from '../src/repositories/AnalyticsRepository.js';
import { toDateString } from '../src/utils/firestoreHelpers.js';

async function backfill() {
  console.log('Starting analytics backfill...');
  
  // 1. Backfill dashboard summary from source collections
  console.log('Backfilling dashboard summary...');
  
  const usersSnap = await firestore.collection(COLLECTIONS.USERS).count().get();
  const upiSnap = await firestore.collection(COLLECTIONS.UPI_PROFILES).count().get();
  const upiBlacklistSnap = await firestore.collection(COLLECTIONS.UPI_PROFILES).where('isBlacklisted', '==', true).count().get();
  const upiHighRiskSnap = await firestore.collection(COLLECTIONS.UPI_PROFILES).where('riskLevel', '==', 'HIGH').count().get();
  
  const reportsSnap = await firestore.collection(COLLECTIONS.REPORTS).count().get();
  const pendingReportsSnap = await firestore.collection(COLLECTIONS.REPORTS).where('status', '==', 'PENDING').count().get();
  const approvedReportsSnap = await firestore.collection(COLLECTIONS.REPORTS).where('status', '==', 'APPROVED').count().get();
  const rejectedReportsSnap = await firestore.collection(COLLECTIONS.REPORTS).where('status', '==', 'REJECTED').count().get();
  
  const checksSnap = await firestore.collection(COLLECTIONS.CHECK_HISTORY).count().get();

  const summary = {
    totalUsers: usersSnap.data().count,
    totalUpiProfiles: upiSnap.data().count,
    totalReports: reportsSnap.data().count,
    pendingReports: pendingReportsSnap.data().count,
    approvedReports: approvedReportsSnap.data().count,
    rejectedReports: rejectedReportsSnap.data().count,
    totalChecks: checksSnap.data().count,
    highRiskProfiles: upiHighRiskSnap.data().count,
    blacklistedProfiles: upiBlacklistSnap.data().count
  };

  await AnalyticsRepository.doc('dashboard_summary').set(summary);
  console.log('Dashboard summary backfilled successfully:', summary);

  // Note: Backfilling daily events perfectly requires scanning all events and grouping by day.
  // For MVP, we will print a warning that full time-series backfill requires a dataflow job or full scan.
  console.log('For daily time-series (daily_checks, daily_reports), we would need to scan all historical data and group by day.');
  console.log('Since this is a simple script, we only aggregated the global summary. Time-series backfill requires more complex MapReduce logic not included in this script.');

  console.log('Backfill completed.');
  process.exit(0);
}

// Ensure explicit confirmation
if (process.argv[2] !== '--confirm') {
  console.log('WARNING: This script will backfill analytics from raw data.');
  console.log('Usage: node scripts/backfillAnalytics.js --confirm');
  process.exit(1);
}

backfill().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
