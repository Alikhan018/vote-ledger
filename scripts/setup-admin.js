#!/usr/bin/env node

/**
 * Setup Admin User Script
 * 
 * This script creates an admin user using environment variables
 * Run with: npm run setup-admin
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
function initAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson.trim());
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT configuration');
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.initializeApp();
  } else if (projectId) {
    console.warn('⚠️  No Admin SDK credentials found. Initializing with project ID only.');
    return admin.initializeApp({
      projectId: projectId,
    });
  } else {
    throw new Error(
      'Firebase Admin SDK credentials not configured. Please set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS environment variable.'
    );
  }
}

// Get admin configuration from environment variables
function getAdminConfig() {
  const cnic = process.env.ADMIN_CNIC;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME;

  if (!cnic || !email || !password || !name) {
    console.log('⚠️  Admin credentials not found in environment variables');
    console.log('   Set ADMIN_CNIC, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME in .env.local');
    return null;
  }

  return { cnic, email, password, name };
}

// Check if admin user exists
async function checkAdminExists(cnic) {
  try {
    const db = admin.firestore();
    const querySnapshot = await db
      .collection('users')
      .where('cnic', '==', cnic)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { uid: doc.id, ...doc.data() };
    }

    return null;
  } catch (error) {
    console.error('Error checking admin existence:', error);
    return null;
  }
}

// Create admin user in Firebase Auth and Firestore
async function createAdminUser(config) {
  try {
    const auth = admin.auth();
    const db = admin.firestore();

    // Check if user already exists
    const existingUser = await checkAdminExists(config.cnic);
    if (existingUser) {
      console.log('✅ Admin user already exists:', existingUser.email);
      return { success: true, user: existingUser };
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: config.email,
      password: config.password,
      displayName: config.name,
    });

    console.log('✅ Created Firebase Auth user:', userRecord.uid);

    // Create user profile in Firestore
    const userProfile = {
      uid: userRecord.uid,
      name: config.name,
      cnic: config.cnic,
      email: config.email,
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').doc(userRecord.uid).set(userProfile);

    console.log('✅ Created admin user profile in Firestore');
    console.log('📧 Email:', config.email);
    console.log('🆔 CNIC:', config.cnic);
    console.log('👤 Name:', config.name);

    return { success: true, user: userProfile };
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    return { success: false, error: error.message };
  }
}

// Setup admin user from environment variables
async function setupAdminFromEnv() {
  const config = getAdminConfig();
  
  if (!config) {
    return { 
      success: false, 
      error: 'Admin configuration not found in environment variables' 
    };
  }

  console.log('🔧 Setting up admin user from environment variables...');
  return await createAdminUser(config);
}

// CLI function to setup admin
async function setupAdminCLI() {
  console.log('🚀 Vote Ledger Admin Setup');
  console.log('========================');
  
  try {
    // Initialize Firebase Admin
    initAdmin();
    console.log('✅ Firebase Admin SDK initialized');
    
    const result = await setupAdminFromEnv();
    
    if (result.success && result.user) {
      console.log('✅ Admin setup completed successfully!');
      console.log('📧 Login with:', result.user.email);
      console.log('🆔 CNIC:', result.user.cnic);
    } else {
      console.log('❌ Admin setup failed:', result.error);
      console.log('');
      console.log('💡 Make sure you have these environment variables set:');
      console.log('   ADMIN_CNIC=12345-1234567-1');
      console.log('   ADMIN_EMAIL=admin@voteledger.com');
      console.log('   ADMIN_PASSWORD=SecureAdmin123!');
      console.log('   ADMIN_NAME=System Administrator');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupAdminCLI().catch(console.error);