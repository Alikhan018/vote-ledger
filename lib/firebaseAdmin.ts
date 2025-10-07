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

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Allow the SDK to pick up credentials from GOOGLE_APPLICATION_CREDENTIALS
    app = admin.initializeApp();
  } else {
    // Last resort: initialize without explicit credentials and rely on default
    // (useful for emulator or environment-provided credentials)
    app = admin.initializeApp();
  }

  return app;
}

const adminApp = initAdmin();

export const adminAuth = adminApp.auth();
export const adminDb = adminApp.firestore();

// Export firebase-admin namespace for FieldValue and other helpers
export { admin };

export default adminApp;
