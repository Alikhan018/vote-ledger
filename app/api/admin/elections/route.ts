import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { DatabaseService } from '@/lib/database';

/**
 * GET /api/admin/elections
 * Get all elections
 */
export async function GET(request: NextRequest) {
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

    // Get all elections
    const elections = await DatabaseService.getElections();

    // Get statistics for each election
    const electionsWithStats = await Promise.all(
      elections.map(async (election) => {
        const stats = await DatabaseService.getVoteStatistics(election.id!);
        const allUsers = await DatabaseService.getAllUsers();
        
        return {
          ...election,
          totalVotes: stats.totalVotes,
          totalVoters: allUsers.length,
          turnoutPercentage: allUsers.length > 0 
            ? Math.round((stats.totalVotes / allUsers.length) * 100 * 10) / 10
            : 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      elections: electionsWithStats,
    });
  } catch (error: any) {
    console.error('Get elections error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch elections',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/elections
 * Create a new election
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { title, description, startDate, endDate, candidates } = body;

    // Validate required fields
    if (!title || !description || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (end <= start) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create election
    const electionId = await DatabaseService.createElection({
      title,
      description,
      startDate: start,
      endDate: end,
      status: 'upcoming',
      candidates: candidates || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (!electionId) {
      return NextResponse.json(
        { success: false, error: 'Failed to create election' },
        { status: 500 }
      );
    }

    // Get the created election
    const elections = await DatabaseService.getElections();
    const election = elections.find(e => e.id === electionId);

    return NextResponse.json({
      success: true,
      election,
    });
  } catch (error: any) {
    console.error('Create election error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create election',
      },
      { status: 500 }
    );
  }
}

