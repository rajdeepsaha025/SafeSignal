/**
 * scripts/seedFirestore.js
 * SafeSignal — Firestore Seed Script
 *
 * Generates realistic demo data:
 *   - 100 Users   (5 admins, 10 moderators, 85 users)
 *   - 5,000 UPI Profiles
 *   - 2,000 Reports
 *   - 10,000 Check History records
 *   - 90 days of Analytics
 *   - 300 Device Reputation records
 *   - System Config documents
 *   - ML Metadata document
 *
 * Usage:
 *   node scripts/seedFirestore.js
 *   node scripts/seedFirestore.js --clear   (clears existing data first)
 *
 * This script uses the Firebase Admin SDK directly via the backend config.
 */

import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Resolve dotenv before importing backend modules ──────────────────────────
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Import Firebase and constants ───────────────────────────────────────────
import { firestore } from '../src/config/firebaseAdmin.js';
import {
  COLLECTIONS,
  ROLES,
  USER_STATUS,
  RISK_LEVELS,
  REPORT_STATUS,
  FRAUD_TYPES,
  CHECK_SOURCES,
  UPI_HANDLES,
  BATCH,
} from '../src/config/constants.js';
import { chunkArray } from '../src/utils/firestoreHelpers.js';

// ─── CLI flags ────────────────────────────────────────────────────────────────
const CLEAR_FIRST = process.argv.includes('--clear');

// ─── Seed Counts ─────────────────────────────────────────────────────────────
const COUNTS = {
  ADMINS:         5,
  MODERATORS:    10,
  USERS:         85,
  UPI_PROFILES: 5000,
  REPORTS:      2000,
  HISTORY:     10000,
  ANALYTICS_DAYS: 90,
  DEVICES:       300,
};

// ─── Data Generation Helpers ─────────────────────────────────────────────────

/** Returns a random element from an array */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Returns a random integer between min and max (inclusive) */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Returns a random float between min and max */
const randFloat = (min, max) => Math.random() * (max - min) + min;

/** Returns a Date N days in the past from now */
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

/** Formats a Date as YYYY-MM-DD */
const toDateStr = (d) => d.toISOString().slice(0, 10);

/** Generates a realistic-looking display name */
const FIRST_NAMES = [
  'Aarav', 'Arjun', 'Priya', 'Ananya', 'Rahul', 'Deepak', 'Riya', 'Sneha',
  'Vikram', 'Kavya', 'Rohan', 'Nisha', 'Amit', 'Pooja', 'Raj', 'Sunita',
  'Karan', 'Meera', 'Sanjay', 'Divya', 'Nikhil', 'Anjali', 'Varun', 'Shruti',
  'Aditya', 'Neha', 'Mohit', 'Simran', 'Tarun', 'Swati', 'Sachin', 'Tanvi',
  'Manish', 'Pallavi', 'Gaurav', 'Lakshmi', 'Suresh', 'Geeta', 'Naveen', 'Reshma',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Singh', 'Gupta', 'Kumar', 'Patel', 'Joshi', 'Mehta',
  'Nair', 'Rao', 'Iyer', 'Reddy', 'Pillai', 'Bhat', 'Sinha', 'Mishra',
  'Agarwal', 'Saxena', 'Chaudhary', 'Kapoor', 'Malhotra', 'Banerjee', 'Das', 'Mukherjee',
];

const genName  = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
const genEmail = (name, idx) =>
  `${name.toLowerCase().replace(/\s+/g, '.')}${idx}@example.com`;

/** Generates a realistic-looking UPI ID */
const UPI_PREFIXES = [
  'merchant', 'seller', 'shop', 'trader', 'store', 'biz', 'pay', 'vendor',
  'service', 'deal', 'market', 'goods', 'lucky', 'fast', 'super', 'mega',
  'tech', 'smart', 'online', 'digital', 'india', 'bharat', 'delhi', 'mumbai',
  'pune', 'hyderabad', 'bangalore', 'chennai', 'kolkata', 'ahmedabad',
];
const NUM_PARTS = ['123', '456', '789', '007', '786', '999', '001', '1234', '5678'];

const genUpiId = (idx) => {
  const prefix = pick(UPI_PREFIXES);
  const num    = Math.random() > 0.5 ? pick(NUM_PARTS) : '';
  const handle = pick(UPI_HANDLES);
  return `${prefix}${num}${idx}@${handle}`;
};

/** Generates a realistic device hash (simulated SHA-256 prefix) */
const genDeviceHash = () =>
  Array.from({ length: 64 }, () => '0123456789abcdef'[randInt(0, 15)]).join('');

/** Maps a risk score to a risk level */
const scoreToLevel = (score) => {
  if (score >= 80) return RISK_LEVELS.CRITICAL;
  if (score >= 60) return RISK_LEVELS.HIGH;
  if (score >= 35) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.LOW;
};

const FRAUD_TYPE_LIST = Object.values(FRAUD_TYPES);
const SOURCE_LIST     = Object.values(CHECK_SOURCES);

const RISK_REASONS_POOL = [
  'Multiple fraud reports from verified users',
  'Suspicious transaction patterns detected',
  'Associated with known phishing campaigns',
  'Flagged by ML model with high confidence',
  'Reported in digital arrest scam networks',
  'QR code used in marketplace fraud',
  'Investment returns promised beyond realistic rates',
  'Refund scam pattern identified',
  'Fake job offer payments traced here',
  'Lottery scam receipts linked to this ID',
  'Impersonating government official',
  'Newly created account with high activity',
  'Device fingerprint matches known bad actor',
  'Community reports within 24 hours of creation',
];

// ─── Batch Write Helper ───────────────────────────────────────────────────────

/**
 * Writes an array of { ref, data } pairs to Firestore in safe chunks.
 * @param {Array<{ref: any, data: object}>} items
 * @param {string} label - Progress label
 */
async function batchSet(items, label) {
  const chunks = chunkArray(items, BATCH.SEED_CHUNK_SIZE);
  let written = 0;

  for (let i = 0; i < chunks.length; i++) {
    const batch = firestore.batch();
    chunks[i].forEach(({ ref, data }) => batch.set(ref, data));
    await batch.commit();
    written += chunks[i].length;
    process.stdout.write(`\r  [${label}] ${written}/${items.length} written...`);
  }

  console.log(`\r  ✅ [${label}] ${items.length} documents seeded.          `);
}

// ─── Clear Collections ────────────────────────────────────────────────────────

async function clearCollection(collectionName) {
  process.stdout.write(`  🗑  Clearing ${collectionName}...`);
  const snap = await firestore.collection(collectionName).limit(400).get();
  if (snap.empty) { console.log(' already empty.'); return; }

  let deleted = 0;
  while (!snap.empty) {
    const batch = firestore.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += snap.docs.length;

    const next = await firestore.collection(collectionName).limit(400).get();
    if (next.empty) break;
    snap.docs.length = 0;
    snap.docs.push(...next.docs);
  }
  console.log(` deleted ${deleted} docs.`);
}

// ─── Seed Functions ───────────────────────────────────────────────────────────

async function seedUsers(userIds) {
  console.log('\n📁 Seeding users...');
  const items = [];

  const makeUser = (uid, name, role, idx) => ({
    ref:  firestore.collection(COLLECTIONS.USERS).doc(uid),
    data: {
      displayName:  name,
      email:        genEmail(name, idx),
      photoURL:     `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`,
      role,
      status:       USER_STATUS.ACTIVE,
      createdAt:    daysAgo(randInt(1, 365)),
      updatedAt:    daysAgo(randInt(0, 30)),
      lastLogin:    daysAgo(randInt(0, 7)),
      totalChecks:  randInt(0, 500),
      totalReports: randInt(0, 50),
      deviceCount:  randInt(1, 3),
    },
  });

  let idx = 0;

  // Admins
  for (let i = 0; i < COUNTS.ADMINS; i++) {
    const uid  = `admin_${uuidv4().slice(0, 8)}`;
    const name = genName();
    userIds.admins.push(uid);
    items.push(makeUser(uid, name, ROLES.ADMIN, idx++));
  }

  // Moderators
  for (let i = 0; i < COUNTS.MODERATORS; i++) {
    const uid  = `mod_${uuidv4().slice(0, 8)}`;
    const name = genName();
    userIds.moderators.push(uid);
    items.push(makeUser(uid, name, ROLES.MODERATOR, idx++));
  }

  // Regular users
  for (let i = 0; i < COUNTS.USERS; i++) {
    const uid  = `user_${uuidv4().slice(0, 8)}`;
    const name = genName();
    userIds.users.push(uid);
    items.push(makeUser(uid, name, ROLES.USER, idx++));
  }

  await batchSet(items, 'users');
  return items.map((i) => i.ref.id);
}

async function seedUpiProfiles() {
  console.log('\n📁 Seeding UPI profiles...');
  const upiIds = [];
  const items  = [];

  for (let i = 0; i < COUNTS.UPI_PROFILES; i++) {
    const upiId      = genUpiId(i);
    const riskScore  = randInt(0, 100);
    const riskLevel  = scoreToLevel(riskScore);
    const isHigh     = riskScore >= 60;
    const numReasons = isHigh ? randInt(2, 5) : randInt(0, 2);
    const reasons    = RISK_REASONS_POOL.slice(0, numReasons)
      .sort(() => Math.random() - 0.5)
      .slice(0, numReasons);

    upiIds.push(upiId);

    items.push({
      ref: firestore.collection(COLLECTIONS.UPI_PROFILES).doc(upiId),
      data: {
        upiId,
        riskScore,
        riskLevel,
        communityScore:   randInt(0, 100),
        mlProbability:    parseFloat(randFloat(0, 1).toFixed(4)),
        verifiedReports:  isHigh ? randInt(1, 20) : 0,
        pendingReports:   randInt(0, 5),
        rejectedReports:  randInt(0, 3),
        totalChecks:      randInt(0, 10000),
        lastReported:     isHigh ? daysAgo(randInt(1, 60)) : null,
        lastChecked:      daysAgo(randInt(0, 7)),
        lastUpdated:      daysAgo(randInt(0, 2)),
        fraudCategories:  isHigh ? [pick(FRAUD_TYPE_LIST), pick(FRAUD_TYPE_LIST)].filter((v, i, a) => a.indexOf(v) === i) : [],
        riskReasons:      reasons,
        isBlacklisted:    riskScore >= 90 && Math.random() > 0.5,
      },
    });
  }

  await batchSet(items, 'upi_profiles');
  return upiIds;
}

async function seedReports(userIds, upiIds) {
  console.log('\n📁 Seeding reports...');
  const items     = [];
  const allUsers  = [...userIds.users, ...userIds.moderators];
  const allMods   = [...userIds.moderators, ...userIds.admins];

  for (let i = 0; i < COUNTS.REPORTS; i++) {
    const status      = pick(Object.values(REPORT_STATUS));
    const isModerated = status !== REPORT_STATUS.PENDING;
    const createdAt   = daysAgo(randInt(1, 90));

    items.push({
      ref:  firestore.collection(COLLECTIONS.REPORTS).doc(uuidv4()),
      data: {
        upiId:              pick(upiIds),
        reporterUid:        pick(allUsers),
        fraudType:          pick(FRAUD_TYPE_LIST),
        description:        generateDescription(),
        status,
        evidenceUrls:       Math.random() > 0.7 ? [`https://storage.googleapis.com/safesignal/evidence/${uuidv4()}.jpg`] : [],
        reporterReputation: randInt(10, 100),
        moderatedBy:        isModerated ? pick(allMods) : null,
        moderatedAt:        isModerated ? daysAgo(randInt(0, 5)) : null,
        createdAt,
        updatedAt:          createdAt,
      },
    });
  }

  await batchSet(items, 'reports');
}

function generateDescription() {
  const templates = [
    'This UPI ID was used to collect money for a fake investment scheme promising 30% monthly returns.',
    'I transferred ₹5,000 for a second-hand item on OLX and never received it. No response after payment.',
    'Received a call claiming to be from CBI for digital arrest. Was asked to pay ₹20,000 to this ID.',
    'Fake job offer required me to pay a ₹2,000 registration fee. Company does not exist.',
    'Lottery prize claim. Was asked to pay ₹3,500 as GST before receiving prize money.',
    'QR code sent via WhatsApp claiming to be from SBI for account verification.',
    'Refund scam — caller claimed to be from Amazon and asked me to scan QR to receive refund.',
    'Multiple friends were also scammed by this ID in the same week.',
    'This ID belongs to a fake online store selling electronics at 70% discount.',
    'Used in a KBC lottery scam. Requested ₹1,000 processing fee.',
  ];
  return pick(templates);
}

async function seedCheckHistory(userIds, upiIds) {
  console.log('\n📁 Seeding check history (10,000 records)...');
  const items    = [];
  const allUsers = [...userIds.users, ...userIds.moderators, ...userIds.admins, 'anonymous'];

  for (let i = 0; i < COUNTS.HISTORY; i++) {
    const riskScore = randInt(0, 100);
    const daysBack  = randInt(0, 29); // Spread over 30 days

    items.push({
      ref:  firestore.collection(COLLECTIONS.CHECK_HISTORY).doc(uuidv4()),
      data: {
        userId:    Math.random() > 0.1 ? pick(allUsers) : 'anonymous',
        upiId:     pick(upiIds),
        riskScore,
        riskLevel: scoreToLevel(riskScore),
        confidence: parseFloat(randFloat(0.6, 1).toFixed(3)),
        source:    pick(SOURCE_LIST),
        timestamp: daysAgo(daysBack),
      },
    });
  }

  await batchSet(items, 'check_history');
}

async function seedAnalytics() {
  console.log('\n📁 Seeding analytics (90 days)...');
  const items = [];

  for (let day = COUNTS.ANALYTICS_DAYS - 1; day >= 0; day--) {
    const date       = daysAgo(day);
    const dateStr    = toDateStr(date);
    const totalChecks = randInt(50, 2000);
    const highRisk   = Math.floor(totalChecks * randFloat(0.05, 0.2));
    const mediumRisk = Math.floor(totalChecks * randFloat(0.1, 0.3));
    const lowRisk    = totalChecks - highRisk - mediumRisk;

    items.push({
      ref:  firestore.collection(COLLECTIONS.ANALYTICS).doc(dateStr),
      data: {
        date:        dateStr,
        totalChecks,
        highRisk,
        mediumRisk,
        lowRisk:     Math.max(0, lowRisk),
        reports:     randInt(5, 100),
        newUsers:    randInt(0, 20),
        updatedAt:   date,
      },
    });
  }

  await batchSet(items, 'analytics');
}

async function seedDeviceReputation() {
  console.log('\n📁 Seeding device reputation (300 devices)...');
  const items = [];

  for (let i = 0; i < COUNTS.DEVICES; i++) {
    const hash       = genDeviceHash();
    const trustScore = randInt(0, 100);
    const submitted  = randInt(0, 50);
    const falseRep   = Math.floor(submitted * randFloat(0, 0.4));

    items.push({
      ref:  firestore.collection(COLLECTIONS.DEVICE_REPUTATION).doc(hash),
      data: {
        deviceHash:         hash,
        trustScore,
        reportsSubmitted:   submitted,
        falseReports:       falseRep,
        successfulReports:  submitted - falseRep,
        createdAt:          daysAgo(randInt(1, 180)),
        updatedAt:          daysAgo(randInt(0, 7)),
      },
    });
  }

  await batchSet(items, 'device_reputation');
}

async function seedSystemConfig() {
  console.log('\n📁 Seeding system configuration...');
  const configs = [
    {
      id:   'risk_weights',
      data: {
        communityReportWeight: 0.45,
        mlModelWeight:         0.35,
        historicalPatternWeight: 0.20,
        verifiedReportBonus:   15,
        blacklistPenalty:      50,
        updatedAt:             new Date(),
      },
    },
    {
      id:   'risk_thresholds',
      data: {
        LOW_MAX:      34,
        MEDIUM_MIN:   35,
        MEDIUM_MAX:   59,
        HIGH_MIN:     60,
        HIGH_MAX:     79,
        CRITICAL_MIN: 80,
        updatedAt:    new Date(),
      },
    },
    {
      id:   'feature_flags',
      data: {
        mlScoringEnabled:         true,
        communityReportsEnabled:  true,
        extensionApiEnabled:      true,
        analyticsEnabled:         true,
        batchScoringEnabled:      false,
        b2bApiEnabled:            false,
        updatedAt:                new Date(),
      },
    },
    {
      id:   'ml_settings',
      data: {
        serviceUrl:      'http://localhost:8000',
        timeoutMs:       5000,
        fallbackEnabled: true,
        minConfidence:   0.6,
        updatedAt:       new Date(),
      },
    },
    {
      id:   'rate_limits',
      data: {
        checkPerMinute:   10,
        reportPerHour:    5,
        apiPerDay:        1000,
        updatedAt:        new Date(),
      },
    },
  ];

  for (const config of configs) {
    await firestore
      .collection(COLLECTIONS.SYSTEM_CONFIG)
      .doc(config.id)
      .set(config.data, { merge: true });
  }

  console.log(`  ✅ [system_config] ${configs.length} documents seeded.`);
}

async function seedMLMetadata() {
  console.log('\n📁 Seeding ML metadata...');
  await firestore.collection(COLLECTIONS.ML_METADATA).doc('current').set({
    modelVersion:  'v1.0.0-baseline',
    algorithm:     'XGBoost + LightGBM Ensemble',
    accuracy:      0.9234,
    precision:     0.9102,
    recall:        0.8987,
    f1Score:       0.9044,
    auc:           0.9651,
    trainedOn:     '2026-06-01',
    datasetSize:   125000,
    features: [
      'report_count_30d', 'verified_report_ratio',
      'account_age_days', 'check_velocity',
      'device_trust_score', 'reporter_reputation_avg',
      'fraud_category_diversity', 'community_score',
    ],
    lastUpdated:   new Date(),
    status:        'ACTIVE',
  });

  console.log('  ✅ [ml_metadata] 1 document seeded.');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║   SafeSignal — Firestore Seed Script          ║');
  console.log('╚═══════════════════════════════════════════════╝');

  if (!firestore) {
    console.error('\n❌ Firestore is not initialised. Check your .env or serviceAccountKey.json.');
    process.exit(1);
  }

  const startTime = Date.now();

  // ── Clear existing data (optional) ──────────────────────────────────────────
  if (CLEAR_FIRST) {
    console.log('\n🗑  Clearing existing collections...');
    for (const col of Object.values(COLLECTIONS)) {
      await clearCollection(col);
    }
  }

  // ── Seed data ────────────────────────────────────────────────────────────────
  const userIds = { admins: [], moderators: [], users: [] };

  await seedUsers(userIds);
  const upiIds = await seedUpiProfiles();
  await seedReports(userIds, upiIds);
  await seedCheckHistory(userIds, upiIds);
  await seedAnalytics();
  await seedDeviceReputation();
  await seedSystemConfig();
  await seedMLMetadata();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('');
  console.log('╔═══════════════════════════════════════════════╗');
  console.log(`║   ✅ Seeding complete in ${elapsed}s`.padEnd(47) + '║');
  console.log('║                                               ║');
  console.log(`║   Users:          ${String(COUNTS.ADMINS + COUNTS.MODERATORS + COUNTS.USERS).padEnd(26)} ║`);
  console.log(`║   UPI Profiles:   ${String(COUNTS.UPI_PROFILES).padEnd(26)} ║`);
  console.log(`║   Reports:        ${String(COUNTS.REPORTS).padEnd(26)} ║`);
  console.log(`║   Check History:  ${String(COUNTS.HISTORY).padEnd(26)} ║`);
  console.log(`║   Analytics Days: ${String(COUNTS.ANALYTICS_DAYS).padEnd(26)} ║`);
  console.log(`║   Devices:        ${String(COUNTS.DEVICES).padEnd(26)} ║`);
  console.log('╚═══════════════════════════════════════════════╝');
  console.log('');

  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Seed script failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
