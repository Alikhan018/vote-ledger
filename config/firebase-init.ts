// Firebase initialization helper
import app, { auth, db, storage } from './firebase';

// Export types for better TypeScript support
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin?: boolean;
  cnic?: string;
}

export interface VoteLedgerUser {
  uid: string;
  name: string;
  cnic: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  symbol: string;
  color: string;
  imageUrl?: string;
  description?: string;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'ended';
  candidates: string[]; // Array of candidate IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface Vote {
  id: string;
  voterId: string;
  candidateId: string;
  electionId: string;
  timestamp: Date;
  transactionHash?: string; // For blockchain integration
}

export interface VoteCount {
  electionId: string;
  candidateId: string;
  count: number;
  lastUpdated: Date;
}

// Firebase collections
export const COLLECTIONS = {
  USERS: 'users',
  CANDIDATES: 'candidates',
  ELECTIONS: 'elections',
  VOTES: 'votes',
  VOTE_COUNTS: 'voteCounts',
} as const;

// Initialize Firebase and return services
export const initializeFirebase = () => {
  return {
    app,
    auth,
    db,
    storage,
  };
};

export { app, auth, db, storage };
