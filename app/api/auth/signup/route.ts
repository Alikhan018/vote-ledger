import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, admin } from '@/lib/firebaseAdmin';
import { COLLECTIONS, VoteLedgerUser } from '@/config/firebase-init';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, cnic, email, password } = body;

    if (!name || !cnic || !email || !password) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // Get consensus blockchain for new user
    const { BlockchainDatabaseService } = await import('@/lib/blockchain-database');
    const consensusChain = await BlockchainDatabaseService.getConsensusBlockchain();

    const userProfile: VoteLedgerUser = {
      uid: userRecord.uid,
      name,
      cnic,
      email,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      voteBlocks: consensusChain, // Initialize with current blockchain
    };

    await adminDb.collection(COLLECTIONS.USERS).doc(userRecord.uid).set({
      ...userProfile,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    } as any);

    return NextResponse.json({ success: true, user: userProfile });
  } catch (error: any) {
    console.error('API signup error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Signup failed' }, { status: 500 });
  }
}
