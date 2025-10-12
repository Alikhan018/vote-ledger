/**
 * Admin API Route: Repair Blockchain
 * POST /api/admin/blockchain/repair
 * Repairs the blockchain by reinitializing all users with a valid genesis block
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebaseAdmin';
import { GENESIS_BLOCK } from '@/services/vote-blockchain-service';

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    const adminApp = initializeFirebaseAdmin();
    if (!adminApp) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify token and check if user is admin
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(token);
    const userDoc = await auth.getUser(decodedToken.uid);
    const isAdmin = userDoc.customClaims?.isAdmin === true;

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const db = getFirestore(adminApp);

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`Repairing blockchain for ${usersSnapshot.size} users`);

    // Update all users with valid genesis block
    const batch = db.batch();
    let repairedCount = 0;

    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      
      // Check if user needs blockchain repair
      if (!userData.voteBlocks || !Array.isArray(userData.voteBlocks) || userData.voteBlocks.length === 0) {
        console.log(`Repairing blockchain for user: ${doc.id}`);
        
        batch.update(doc.ref, {
          voteBlocks: [GENESIS_BLOCK],
          blockchainRepairedAt: new Date(),
        });
        
        repairedCount++;
      }
    });

    if (repairedCount > 0) {
      await batch.commit();
      console.log(`Blockchain repaired for ${repairedCount} users`);
    }

    return NextResponse.json({
      success: true,
      message: `Blockchain repair completed. ${repairedCount} users were updated.`,
      repairedUsers: repairedCount,
      totalUsers: usersSnapshot.size,
    });
  } catch (error: any) {
    console.error('Repair blockchain API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to repair blockchain' 
      },
      { status: 500 }
    );
  }
}
