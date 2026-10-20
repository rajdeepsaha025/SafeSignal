import { auth, firestore } from '../src/config/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS, ROLES, USER_STATUS } from '../src/config/constants.js';

const DEMO_USERS = [
  {
    email: 'admin@safesignal.in',
    password: 'AdminPassword123!',
    displayName: 'System Admin',
    role: ROLES.ADMIN,
  },
  {
    email: 'moderator@safesignal.in',
    password: 'ModeratorPassword123!',
    displayName: 'Senior Fraud Moderator',
    role: ROLES.MODERATOR,
  },
  {
    email: 'analyst@safesignal.in',
    password: 'ModeratorPassword123!',
    displayName: 'Risk Operations Analyst',
    role: ROLES.MODERATOR,
  },
  {
    email: 'user@safesignal.in',
    password: 'UserPassword123!',
    displayName: 'Citizen User',
    role: ROLES.USER,
  },
];

async function setupUser({ email, password, displayName, role }) {
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`[Auth] User ${email} already exists. Updating password & profile...`);
    await auth.updateUser(userRecord.uid, { password, displayName });
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      console.log(`[Auth] Creating new user ${email}...`);
      userRecord = await auth.createUser({
        email,
        password,
        displayName,
      });
    } else {
      throw e;
    }
  }

  // 1. Set Custom Claims in Firebase Auth (used by frontend tokenResult.claims.role)
  await auth.setCustomUserClaims(userRecord.uid, { role });

  // 2. Upsert profile in Cloud Firestore 'users' collection (used by backend authorizeRoles middleware)
  const userDocRef = firestore.collection(COLLECTIONS.USERS).doc(userRecord.uid);
  const existingDoc = await userDocRef.get();

  if (existingDoc.exists) {
    await userDocRef.set(
      {
        email,
        displayName,
        role,
        status: USER_STATUS.ACTIVE,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    await userDocRef.set({
      uid: userRecord.uid,
      email,
      displayName,
      role,
      status: USER_STATUS.ACTIVE,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastLogin: FieldValue.serverTimestamp(),
      totalChecks: 0,
      totalReports: 0,
      deviceCount: 1,
    });
  }

  console.log(`✅ [${role}] ${email} is ready in Firebase Auth & Firestore.`);
}

async function main() {
  console.log('--- Initializing SafeSignal Demo Accounts ---');
  for (const user of DEMO_USERS) {
    await setupUser(user);
  }
  console.log('\nAll demo accounts provisioned successfully!\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to setup demo users:', err);
  process.exit(1);
});
