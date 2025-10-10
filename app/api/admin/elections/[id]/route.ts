import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { DatabaseService } from '@/lib/database';

/**
 * GET /api/admin/elections/[id]
 * Get a single election by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Check if user is admin
    const userDoc = await adminAuth.getUser(decodedToken.uid);
    const isAdmin = userDoc.customClaims?.isAdmin === true;

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get all elections and find the one with matching ID
    const elections = await DatabaseService.getElections();
    const election = elections.find(e => e.id === id);

    if (!election) {
      return NextResponse.json(
        { success: false, error: 'Election not found' },
        { status: 404 }
      );
    }

    // Get statistics
    const stats = await DatabaseService.getVoteStatistics(election.id!);
    const allUsers = await DatabaseService.getAllUsers();

    const electionWithStats = {
      ...election,
      totalVotes: stats.totalVotes,
      totalVoters: allUsers.length,
      turnoutPercentage: allUsers.length > 0 
        ? Math.round((stats.totalVotes / allUsers.length) * 100 * 10) / 10
        : 0,
    };

    return NextResponse.json({
      success: true,
      election: electionWithStats,
    });
  } catch (error: any) {
    console.error('Get election error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch election',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/elections/[id]
 * Delete an election
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Check if user is admin
    const userDoc = await adminAuth.getUser(decodedToken.uid);
    const isAdmin = userDoc.customClaims?.isAdmin === true;

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Note: You might want to add a deleteElection method to DatabaseService
    // For now, we'll just return success as a placeholder
    return NextResponse.json({
      success: true,
      message: 'Election deletion not implemented yet',
    });
  } catch (error: any) {
    console.error('Delete election error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete election',
      },
      { status: 500 }
    );
  }
}

