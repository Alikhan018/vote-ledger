const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const fetch = global.fetch || (() => { try { return require('node-fetch'); } catch (e) { return null; } })();

function extractServiceAccountFromEnvFile(envPath) {
  const txt = fs.readFileSync(envPath, 'utf8');
  const match = txt.match(/FIREBASE_SERVICE_ACCOUNT\s*=\s*(\{[\s\S]*?\})/m);
  return match ? match[1] : null;
}

async function run() {
  const root = path.resolve(__dirname, '..');
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('.env not found in project root; cannot read API key or service account');
    process.exit(1);
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || (() => {
    const content = fs.readFileSync(envPath, 'utf8');
    const m = content.match(/NEXT_PUBLIC_FIREBASE_API_KEY\s*=\s*(.+)/);
    return m ? m[1].trim() : null;
  })();

  if (!apiKey) {
    console.error('NEXT_PUBLIC_FIREBASE_API_KEY not found in .env or env');
    process.exit(1);
  }

  let serviceAccount = null;
  // Prefer direct service account JSON in env
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try { serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); } catch (e) { /* ignore */ }
  }

  // Fallback: try to extract from .env file
  if (!serviceAccount) {
    const jsonBlock = extractServiceAccountFromEnvFile(envPath);
    if (jsonBlock) {
      try { serviceAccount = JSON.parse(jsonBlock); } catch (err) { /* ignore */ }
    }
  }

  if (serviceAccount) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Only use GOOGLE_APPLICATION_CREDENTIALS if no inline service account is available
    admin.initializeApp();
  } else {
    console.error('No service account found in env or .env and GOOGLE_APPLICATION_CREDENTIALS not set. Aborting.');
    process.exit(1);
  }

  const auth = admin.auth();
  const db = admin.firestore();

  // Prepare test data
  const uniq = Date.now();
  const email = `itest+${uniq}@example.com`;
  const password = 'Test1234!';
  const cnic = `12345-${('' + Math.floor(Math.random() * 9000000 + 1000000)).padStart(7,'0')}-${Math.floor(Math.random() * 9) + 1}`;

  let uid = null;
  try {
    console.log('Creating test user via Admin SDK...');
    const userRecord = await auth.createUser({ email, password, displayName: 'Integration Test' });
    uid = userRecord.uid;
    console.log('User created, uid=', uid);

    console.log('Creating user profile in Firestore...');
    await db.collection('users').doc(uid).set({
      uid,
      name: 'Integration Test',
      cnic,
      email,
      isAdmin: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Signing in via REST API to get idToken...');
    const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error('signIn failed: ' + JSON.stringify(data));
    }
    console.log('REST signIn success, idToken length=', data.idToken ? data.idToken.length : 0);

    console.log('Verifying idToken with Admin SDK...');
    const decoded = await auth.verifyIdToken(data.idToken);
    console.log('Decoded token uid=', decoded.uid, 'claims=', decoded);

    console.log('Integration test succeeded. Cleaning up...');
  } catch (err) {
    console.error('Integration test failed:', err);
  } finally {
    try {
      if (uid) {
        await db.collection('users').doc(uid).delete();
        await auth.deleteUser(uid);
        console.log('Cleanup completed: user and profile removed');
      }
    } catch (e) {
      console.error('Cleanup error:', e);
    }
    process.exit(0);
  }
}

run();
