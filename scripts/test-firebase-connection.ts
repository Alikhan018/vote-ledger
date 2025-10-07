import adminApp, { adminAuth, adminDb } from '@/lib/firebaseAdmin';

async function run() {
  try {
    console.log('Checking Firebase Admin initialization...');
    const info = adminApp.name;
    console.log('Admin app name:', info);

    console.log('Listing first 1 user...');
    const list = await adminAuth.listUsers(1);
    console.log('Users retrieved:', list.users.length);

    console.log('Checking Firestore connection...');
    const collections = await adminDb.listCollections();
    console.log('Top-level collections count:', collections.length);

    console.log('Firebase Admin appears to be connected.');
  } catch (err) {
    console.error('Firebase connection test failed:', err);
    process.exit(1);
  }
}

run();
