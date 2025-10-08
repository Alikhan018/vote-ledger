import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { 
  VoteLedgerUser, 
  Candidate, 
  Election, 
  Vote, 
  VoteCount,
  COLLECTIONS 
} from '@/config/firebase-init';

// Database service for Vote Ledger
export class DatabaseService {
  // User operations
  static async updateUserProfile(uid: string, data: Partial<VoteLedgerUser>): Promise<boolean> {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Update user profile error:', error);
      return false;
    }
  }

  // Candidate operations
  static async createCandidate(candidate: Omit<Candidate, 'id'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.CANDIDATES), candidate);
      return docRef.id;
    } catch (error) {
      console.error('Create candidate error:', error);
      return null;
    }
  }

  static async getCandidates(): Promise<Candidate[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.CANDIDATES));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Candidate[];
    } catch (error) {
      console.error('Get candidates error:', error);
      return [];
    }
  }

  static async updateCandidate(id: string, data: Partial<Candidate>): Promise<boolean> {
    try {
      await updateDoc(doc(db, COLLECTIONS.CANDIDATES, id), data);
      return true;
    } catch (error) {
      console.error('Update candidate error:', error);
      return false;
    }
  }

  static async deleteCandidate(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.CANDIDATES, id));
      return true;
    } catch (error) {
      console.error('Delete candidate error:', error);
      return false;
    }
  }

  // Election operations
  static async createElection(election: Omit<Election, 'id'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.ELECTIONS), election);
      return docRef.id;
    } catch (error) {
      console.error('Create election error:', error);
      return null;
    }
  }

  static async getElections(): Promise<Election[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, COLLECTIONS.ELECTIONS), orderBy('createdAt', 'desc'))
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: (doc.data().startDate as Timestamp)?.toDate(),
        endDate: (doc.data().endDate as Timestamp)?.toDate(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
      })) as Election[];
    } catch (error) {
      console.error('Get elections error:', error);
      return [];
    }
  }

  static async getActiveElection(): Promise<Election | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ELECTIONS),
        where('status', '==', 'active'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: (data.startDate as Timestamp)?.toDate(),
          endDate: (data.endDate as Timestamp)?.toDate(),
          createdAt: (data.createdAt as Timestamp)?.toDate(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate(),
        } as Election;
      }
      return null;
    } catch (error) {
      console.error('Get active election error:', error);
      return null;
    }
  }

  static async updateElection(id: string, data: Partial<Election>): Promise<boolean> {
    try {
      await updateDoc(doc(db, COLLECTIONS.ELECTIONS, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Update election error:', error);
      return false;
    }
  }

  // Vote operations
  static async castVote(vote: Omit<Vote, 'id' | 'timestamp'>): Promise<{ success: boolean; voteId?: string; error?: string }> {
    try {
      // Check if user has already voted in this election
      const existingVote = await this.getUserVote(vote.voterId, vote.electionId);
      if (existingVote) {
        return { success: false, error: 'You have already voted in this election' };
      }

      // Create vote document
      const docRef = await addDoc(collection(db, COLLECTIONS.VOTES), {
        ...vote,
        timestamp: serverTimestamp(),
      });

      // Update vote count
      await this.updateVoteCount(vote.electionId, vote.candidateId, 1);

      return { success: true, voteId: docRef.id };
    } catch (error: any) {
      console.error('Cast vote error:', error);
      return { success: false, error: error.message || 'Failed to cast vote' };
    }
  }

  static async getUserVote(voterId: string, electionId: string): Promise<Vote | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.VOTES),
        where('voterId', '==', voterId),
        where('electionId', '==', electionId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate(),
        } as Vote;
      }
      return null;
    } catch (error) {
      console.error('Get user vote error:', error);
      return null;
    }
  }

  static async getVotesByElection(electionId: string): Promise<Vote[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.VOTES),
        where('electionId', '==', electionId),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate(),
        } as Vote;
      });
    } catch (error) {
      console.error('Get votes by election error:', error);
      return [];
    }
  }

  // Vote count operations
  static async updateVoteCount(electionId: string, candidateId: string, increment: number): Promise<boolean> {
    try {
      const voteCountRef = doc(db, COLLECTIONS.VOTE_COUNTS, `${electionId}_${candidateId}`);
      const voteCountDoc = await getDoc(voteCountRef);
      
      if (voteCountDoc.exists()) {
        const currentCount = voteCountDoc.data().count || 0;
        await updateDoc(voteCountRef, {
          count: currentCount + increment,
          lastUpdated: serverTimestamp(),
        });
      } else {
        await setDoc(voteCountRef, {
          electionId,
          candidateId,
          count: increment,
          lastUpdated: serverTimestamp(),
        });
      }
      return true;
    } catch (error) {
      console.error('Update vote count error:', error);
      return false;
    }
  }

  static async getVoteCounts(electionId: string): Promise<VoteCount[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.VOTE_COUNTS),
        where('electionId', '==', electionId),
        orderBy('count', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          lastUpdated: (data.lastUpdated as Timestamp)?.toDate(),
        } as VoteCount;
      });
    } catch (error) {
      console.error('Get vote counts error:', error);
      return [];
    }
  }

  // Admin operations
  static async getAllUsers(): Promise<VoteLedgerUser[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
      })) as VoteLedgerUser[];
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }

  static async getVoteStatistics(electionId: string): Promise<{
    totalVotes: number;
    candidateResults: { candidateId: string; candidateName: string; votes: number }[];
  }> {
    try {
      const voteCounts = await this.getVoteCounts(electionId);
      const candidates = await this.getCandidates();
      
      const totalVotes = voteCounts.reduce((sum, count) => sum + count.count, 0);
      
      const candidateResults = voteCounts.map(count => {
        const candidate = candidates.find(c => c.id === count.candidateId);
        return {
          candidateId: count.candidateId,
          candidateName: candidate?.name || 'Unknown',
          votes: count.count,
        };
      });

      return { totalVotes, candidateResults };
    } catch (error) {
      console.error('Get vote statistics error:', error);
      return { totalVotes: 0, candidateResults: [] };
    }
  }
}
