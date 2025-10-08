import admin from 'firebase-admin';

// Initialize Firebase Admin SDK using either a JSON string in env or
// GOOGLE_APPLICATION_CREDENTIALS pointing to a service account file.
// Provide one of the following in your environment:
// - FIREBASE_SERVICE_ACCOUNT (JSON string of the service account)
// - GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON file)

let app: admin.app.App;

function initAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson.trim());
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK initialized');
    } catch (error: any) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT configuration');
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Allow the SDK to pick up credentials from GOOGLE_APPLICATION_CREDENTIALS
    app = admin.initializeApp();
    console.log('✅ Firebase Admin initialized with GOOGLE_APPLICATION_CREDENTIALS');
  } else if (projectId) {
    // For development: initialize with just project ID (works with emulator)
    console.warn('⚠️  No Admin SDK credentials found. Initializing with project ID only.');
    console.warn('⚠️  This will only work with Firebase Emulator.');
    app = admin.initializeApp({
      projectId: projectId,
    });
  } else {
    throw new Error(
      'Firebase Admin SDK credentials not configured. Please set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS environment variable.'
    );
  }

  return app;
}

let adminApp: admin.app.App | undefined;
let adminAuth: admin.auth.Auth | undefined;
let adminDb: admin.firestore.Firestore | undefined;

try {
  adminApp = initAdmin();
  if (adminApp) {
    adminAuth = adminApp.auth();
    adminDb = adminApp.firestore();
  }
} catch (error: any) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message);
  // Don't throw - let API routes handle the error
}

export { adminAuth, adminDb };

// Export firebase-admin namespace for FieldValue and other helpers
export { admin };

export default adminApp as admin.app.App;
