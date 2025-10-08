import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, admin } from '@/lib/firebaseAdmin';
import { COLLECTIONS, VoteLedgerUser } from '@/config/firebase-init';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Check if Admin SDK is initialized
    if (!adminAuth || !adminDb) {
      console.error('Admin SDK not initialized');
      return NextResponse.json({ 
        success: false, 
        error: 'Firebase Admin SDK not configured. Please add FIREBASE_SERVICE_ACCOUNT to .env.local'
      }, { status: 500 });
    }

    const body = await req.json();
    const { name, cnic, email, password } = body;

    if (!name || !cnic || !email || !password) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Validate CNIC format
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicRegex.test(cnic)) {
      return NextResponse.json({ success: false, error: 'CNIC format should be XXXXX-XXXXXXX-X' }, { status: 400 });
    }

    // Check if CNIC already exists
    const existingCnic = await adminDb.collection(COLLECTIONS.USERS).where('cnic', '==', cnic).limit(1).get();
    if (!existingCnic.empty) {
      return NextResponse.json({ success: false, error: 'CNIC already registered' }, { status: 409 });
    }

    // Check if email already exists (via Firebase Auth)
    try {
      await adminAuth.getUserByEmail(email);
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 });
    } catch (error: any) {
      // User not found - this is what we want
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    const userProfile: VoteLedgerUser = {
      uid: userRecord.uid,
      name,
      cnic,
      email,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.collection(COLLECTIONS.USERS).doc(userRecord.uid).set({
      ...userProfile,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    } as any);

    return NextResponse.json({ success: true, user: userProfile });
  } catch (error: any) {
    console.error('API signup error:', error);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Provide more detailed error messages
    let errorMessage = error.message || 'Signup failed';
    
    if (error.code === 'app/invalid-credential') {
      errorMessage = 'Firebase Admin SDK not configured. Please set up service account credentials.';
    } else if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Email already registered';
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
