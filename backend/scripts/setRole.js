import 'dotenv/config';
import { firestore } from '../src/config/firebaseAdmin.js';
import { COLLECTIONS, ROLES } from '../src/config/constants.js';

const email = process.argv[2];
const role = process.argv[3] || ROLES.ADMIN;

if (!email) {
  console.error('Usage: node scripts/setRole.js <user-email> [ADMIN|MODERATOR|USER]');
  process.exit(1);
}

async function main() {
  const usersRef = firestore.collection(COLLECTIONS.USERS);
  const snapshot = await usersRef.where('email', '==', email).get();

  if (snapshot.empty) {
    console.error(`User with email ${email} not found. Ensure you have signed up in the frontend first.`);
    process.exit(1);
  }

  const userDoc = snapshot.docs[0];
  await userDoc.ref.update({ role });
  console.log(`Successfully updated ${email} to role: ${role}`);
  process.exit(0);
}

main().catch(console.error);
