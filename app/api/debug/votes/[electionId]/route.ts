/**
 * Debug API Route: Check Vote Counts
 * GET /api/debug/votes/[electionId]
 * Debug endpoint to check vote counts from multiple sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: { electionId: string } }
) {
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
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const electionId = params.electionId;

    // Check votes from multiple sources
    const debugInfo = {
      electionId,
      timestamp: new Date().toISOString(),
      sources: {
        // 1. Votes collection
        votesCollection: {
          totalVotes: 0,
          votes: [],
        },
        // 2. VoteCounts collection
        voteCountsCollection: {
          totalVotes: 0,
          counts: [],
        },
        // 3. Blockchain
        blockchain: {
          totalVotes: 0,
          blocks: [],
          chainLength: 0,
        },
        // 4. Election document
        electionDocument: null,
      },
    };

    // Check votes collection
    const votesSnapshot = await db
      .collection('votes')
      .where('electionId', '==', electionId)
      .get();

    debugInfo.sources.votesCollection.totalVotes = votesSnapshot.size;
    debugInfo.sources.votesCollection.votes = votesSnapshot.docs.map(doc => ({
      id: doc.id,
      voterId: doc.data().voterId,
      candidateId: doc.data().candidateId,
      timestamp: doc.data().timestamp,
      transactionHash: doc.data().transactionHash,
    }));

    // Check voteCounts collection
    const voteCountsSnapshot = await db
      .collection('voteCounts')
      .where('electionId', '==', electionId)
      .get();

    debugInfo.sources.voteCountsCollection.totalVotes = voteCountsSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().count || 0),
      0
    );
    debugInfo.sources.voteCountsCollection.counts = voteCountsSnapshot.docs.map(doc => ({
      id: doc.id,
      electionId: doc.data().electionId,
      candidateId: doc.data().candidateId,
      count: doc.data().count,
      lastUpdated: doc.data().lastUpdated,
    }));

    // Check blockchain
    try {
      const { BlockchainDatabaseService } = await import('@/lib/blockchain-database');
      const consensusChain = await BlockchainDatabaseService.getConsensusBlockchain(electionId);
      
      const electionBlocks = consensusChain.filter(
        block => block.index > 0 && block.electionId === electionId
      );
      
      debugInfo.sources.blockchain.totalVotes = electionBlocks.length;
      debugInfo.sources.blockchain.chainLength = consensusChain.length;
      debugInfo.sources.blockchain.blocks = electionBlocks.map(block => ({
        index: block.index,
        timestamp: block.timestamp,
        candidateId: block.voteData.candidateId,
        voterHash: block.voteData.voterHash,
        hash: block.hash,
      }));
    } catch (error) {
      debugInfo.sources.blockchain.error = error.message;
    }

    // Check election document
    const electionDoc = await db.collection('elections').doc(electionId).get();
    if (electionDoc.exists) {
      debugInfo.sources.electionDocument = electionDoc.data();
    }

    return NextResponse.json({
      success: true,
      debugInfo,
    });
  } catch (error: any) {
    console.error('Debug votes API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to debug votes' 
      },
      { status: 500 }
    );
  }
}
