// Simple Node.js Firebase Admin connectivity test (no TypeScript required)
const admin = require('firebase-admin');

function initAdmin() {
  if (admin.apps && admin.apps.length) return admin.app();

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.initializeApp();
  }

  // Fallback - attempt to initialize without explicit creds
  return admin.initializeApp();
}

async function run() {
  try {
    const app = initAdmin();
    console.log('Admin app name:', app.name);

    const auth = admin.auth();
    const db = admin.firestore();

    const users = await auth.listUsers(1);
    console.log('Users retrieved:', users.users.length);

    const collections = await db.listCollections();
    console.log('Top-level collections count:', collections.length);

    console.log('Firebase Admin appears to be connected.');
    process.exit(0);
  } catch (err) {
    console.error('Firebase connection test failed:', err);
    process.exit(1);
  }
}

run();
