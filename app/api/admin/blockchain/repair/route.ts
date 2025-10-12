/**
 * Admin API Route: Repair Blockchain
 * POST /api/admin/blockchain/repair
 * Repairs the blockchain by reinitializing all users with a valid genesis block
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebaseAdmin';
import { createGenesisBlock } from '@/services/vote-blockchain-service';

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

    // Get all users and elections
    const usersSnapshot = await db.collection('users').get();
    const electionsSnapshot = await db.collection('elections').get();
    
    console.log(`Repairing blockchain for ${usersSnapshot.size} users across ${electionsSnapshot.size} elections`);

    // Update all users with valid election-specific genesis blocks
    const batch = db.batch();
    let repairedCount = 0;

    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const electionBlocks = userData.electionBlocks || {};
      let needsRepair = false;
      
      // Check each election
      electionsSnapshot.docs.forEach(electionDoc => {
        const electionId = electionDoc.id;
        const electionChain = electionBlocks[electionId];
        
        // If election doesn't have blockchain or it's empty, create genesis block
        if (!electionChain || !Array.isArray(electionChain) || electionChain.length === 0) {
          console.log(`Repairing blockchain for user ${doc.id} election ${electionId}`);
          electionBlocks[electionId] = [createGenesisBlock(electionId)];
          needsRepair = true;
        }
      });
      
      if (needsRepair) {
        batch.update(doc.ref, {
          electionBlocks: electionBlocks,
          blockchainRepairedAt: new Date(),
        });
        repairedCount++;
      }
    });

    if (repairedCount > 0) {
      await batch.commit();
      console.log(`Blockchain repaired for ${repairedCount} users across ${electionsSnapshot.size} elections`);
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
