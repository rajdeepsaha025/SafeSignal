import { firestore, auth } from '../../config/firebaseAdmin.js';

class AdminSystemService {
  async getSystemHealth() {
    let firestoreConnectivity = false;
    let firebaseConnectivity = false;

    try {
      // Test firestore by just checking if we can count users or do a simple query
      await firestore.collection('system_config').limit(1).get();
      firestoreConnectivity = true;
    } catch (_) {
      firestoreConnectivity = false;
    }

    try {
      // Test firebase auth by trying to fetch user page
      await auth.listUsers(1);
      firebaseConnectivity = true;
    } catch (_) {
      firebaseConnectivity = false;
    }

    return {
      status: firestoreConnectivity && firebaseConnectivity ? 'healthy' : 'degraded',
      backendStatus: 'online',
      firebaseConnectivity,
      firestoreConnectivity,
      environment: process.env.NODE_ENV || 'development',
      applicationVersion: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }
}

export default new AdminSystemService();
