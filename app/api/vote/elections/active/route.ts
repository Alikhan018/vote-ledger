/**
 * API Route: Get Active Elections
 * GET /api/vote/elections/active
 * Get all active elections for voting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
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

    // Verify token
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const db = getFirestore(adminApp);

    // Get all active elections
    const activeElectionsSnapshot = await db
      .collection('elections')
      .where('status', '==', 'active')
      .get();

    const activeElections = activeElectionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate(),
      endDate: doc.data().endDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));

    // For each election, check if user has voted
    const electionsWithVoteStatus = await Promise.all(
      activeElections.map(async (election) => {
        const voteQuery = await db
          .collection('votes')
          .where('voterId', '==', userId)
          .where('electionId', '==', election.id)
          .limit(1)
          .get();

        return {
          ...election,
          hasVoted: !voteQuery.empty,
          userVote: voteQuery.empty ? null : {
            id: voteQuery.docs[0].id,
            candidateId: voteQuery.docs[0].data().candidateId,
            timestamp: voteQuery.docs[0].data().timestamp,
            transactionHash: voteQuery.docs[0].data().transactionHash,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      elections: electionsWithVoteStatus,
    });
  } catch (error: any) {
    console.error('Get active elections API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get active elections' 
      },
      { status: 500 }
    );
  }
}
