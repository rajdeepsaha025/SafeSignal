import { auth } from '../src/config/firebaseAdmin.js';

const createAdmin = async () => {
  const email = 'admin@safesignal.in';
  const password = 'AdminPassword123!';
  
  try {
    // Check if user exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('User already exists. Updating password and claims...');
      await auth.updateUser(userRecord.uid, { password });
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        console.log('Creating new admin user...');
        userRecord = await auth.createUser({
          email,
          password,
          displayName: 'System Admin',
        });
      } else {
        throw e;
      }
    }

    // Set admin custom claims
    await auth.setCustomUserClaims(userRecord.uid, { role: 'ADMIN' });
    console.log(`\n✅ Admin account ready!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
