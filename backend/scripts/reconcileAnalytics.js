import { firestore } from '../src/config/firebaseAdmin.js';
import { COLLECTIONS } from '../src/config/constants.js';
import AnalyticsRepository from '../src/repositories/AnalyticsRepository.js';

async function reconcile() {
  console.log('Starting analytics reconciliation...');

  const usersSnap = await firestore.collection(COLLECTIONS.USERS).count().get();
  const actualUsers = usersSnap.data().count;

  const upiSnap = await firestore.collection(COLLECTIONS.UPI_PROFILES).count().get();
  const actualUpis = upiSnap.data().count;

  const reportsSnap = await firestore.collection(COLLECTIONS.REPORTS).count().get();
  const actualReports = reportsSnap.data().count;

  const checksSnap = await firestore.collection(COLLECTIONS.CHECK_HISTORY).count().get();
  const actualChecks = checksSnap.data().count;

  const summary = await AnalyticsRepository.getDashboardSummary();
  if (!summary) {
    console.log('No dashboard summary found to reconcile against.');
    process.exit(1);
  }

  console.log('--- RECONCILIATION REPORT ---');
  let hasMismatch = false;

  const checkMismatch = (name, actual, aggregated) => {
    if (actual !== aggregated) {
      console.log(`❌ MISMATCH: ${name} -> Actual: ${actual}, Aggregated: ${aggregated || 0}`);
      hasMismatch = true;
    } else {
      console.log(`✅ MATCH: ${name} -> ${actual}`);
    }
  };

  checkMismatch('Total Users', actualUsers, summary.totalUsers);
  checkMismatch('Total UPI Profiles', actualUpis, summary.totalUpiProfiles);
  checkMismatch('Total Reports', actualReports, summary.totalReports);
  checkMismatch('Total Checks', actualChecks, summary.totalChecks);

  if (hasMismatch) {
    console.log('\nReconciliation completed with MISMATCHES. Action may be required (e.g. running backfill).');
  } else {
    console.log('\nReconciliation completed successfully. All global counts match.');
  }

  process.exit(0);
}

reconcile().catch(err => {
  console.error('Reconciliation failed:', err);
  process.exit(1);
});
