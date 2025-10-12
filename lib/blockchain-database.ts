/**
 * Blockchain Database Service
 * Handles distributed ledger operations - adding vote blocks to all users
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS, VoteBlock } from '@/config/firebase-init';
import {
  VoteBlockchainService,
  GENESIS_BLOCK,
  getLastBlock,
  createVoteBlock,
  isValidChain,
  compareChains,
} from '@/services/vote-blockchain-service';

export class BlockchainDatabaseService {
  /**
   * Initialize blockchain for a new user
   */
  static async initializeUserBlockchain(userId: string): Promise<boolean> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.error('User not found');
        return false;
      }

      const userData = userDoc.data();
      
      // If user already has blockchain, don't reinitialize
      if (userData.voteBlocks && userData.voteBlocks.length > 0) {
        return true;
      }

      // Get the current blockchain from any existing user
      const currentChain = await this.getConsensusBlockchain();

      // Update user with current blockchain
      await updateDoc(userRef, {
        voteBlocks: currentChain,
      });

      return true;
    } catch (error) {
      console.error('Initialize user blockchain error:', error);
      return false;
    }
  }

  /**
   * Get consensus blockchain (the most common chain among users)
   */
  static async getConsensusBlockchain(): Promise<VoteBlock[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      
      if (usersSnapshot.empty) {
        return [GENESIS_BLOCK];
      }

      const chains: VoteBlock[][] = [];
      
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.voteBlocks && Array.isArray(userData.voteBlocks)) {
          chains.push(userData.voteBlocks);
        }
      });

      if (chains.length === 0) {
        return [GENESIS_BLOCK];
      }

      // Find the most common chain (consensus)
      const chainMap = new Map<string, { chain: VoteBlock[]; count: number }>();

      chains.forEach(chain => {
        const chainHash = this.getChainHash(chain);
        const existing = chainMap.get(chainHash);
        
        if (existing) {
          existing.count++;
        } else {
          chainMap.set(chainHash, { chain, count: 1 });
        }
      });

      // Get the chain with highest count
      let consensusChain = [GENESIS_BLOCK];
      let maxCount = 0;

      chainMap.forEach(({ chain, count }) => {
        if (count > maxCount) {
          maxCount = count;
          consensusChain = chain;
        }
      });

      return consensusChain;
    } catch (error) {
      console.error('Get consensus blockchain error:', error);
      return [GENESIS_BLOCK];
    }
  }

  /**
   * Get chain hash (for comparing chains)
   */
  private static getChainHash(chain: VoteBlock[]): string {
    return chain.map(block => block.hash).join('|');
  }

  /**
   * Add a vote block to all users' blockchains
   * This is the key function that implements distributed ledger
   */
  static async addVoteBlockToAllUsers(
    electionId: string,
    candidateId: string,
    voterId: string
  ): Promise<{ success: boolean; block?: VoteBlock; error?: string }> {
    try {
      console.log('Adding vote block to all users...');

      // Get consensus blockchain
      const currentChain = await this.getConsensusBlockchain();
      
      // Validate current chain
      if (!isValidChain(currentChain)) {
        return { 
          success: false, 
          error: 'Current blockchain is invalid. System integrity compromised.' 
        };
      }

      // Create new block
      const lastBlock = getLastBlock(currentChain);
      const newBlock = createVoteBlock(lastBlock, electionId, candidateId, voterId);
      const updatedChain = [...currentChain, newBlock];

      console.log('New block created:', newBlock);

      // Get all users
      const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      
      if (usersSnapshot.empty) {
        return { success: false, error: 'No users found in system' };
      }

      // Use batch write to update all users atomically
      const batch = writeBatch(db);
      let updateCount = 0;

      usersSnapshot.docs.forEach(userDoc => {
        const userRef = doc(db, COLLECTIONS.USERS, userDoc.id);
        batch.update(userRef, {
          voteBlocks: updatedChain,
        });
        updateCount++;
      });

      // Commit batch
      await batch.commit();

      console.log(`Vote block added to ${updateCount} users`);

      return { success: true, block: newBlock };
    } catch (error: any) {
      console.error('Add vote block to all users error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to add vote block to blockchain' 
      };
    }
  }

  /**
   * Get user's blockchain
   */
  static async getUserBlockchain(userId: string): Promise<VoteBlock[]> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return [GENESIS_BLOCK];
      }

      const userData = userDoc.data();
      return userData.voteBlocks || [GENESIS_BLOCK];
    } catch (error) {
      console.error('Get user blockchain error:', error);
      return [GENESIS_BLOCK];
    }
  }

  /**
   * Verify blockchain integrity across all users
   * Returns percentage of users with matching blockchains
   */
  static async verifyBlockchainIntegrity(): Promise<{
    isIntegritySafe: boolean;
    matchPercentage: number;
    totalUsers: number;
    consensusChain: VoteBlock[];
    discrepancies: {
      userId: string;
      userName: string;
      chainLength: number;
      lastBlockHash: string;
    }[];
  }> {
    try {
      const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      
      if (usersSnapshot.empty) {
        return {
          isIntegritySafe: false,
          matchPercentage: 0,
          totalUsers: 0,
          consensusChain: [GENESIS_BLOCK],
          discrepancies: [],
        };
      }

      const consensusChain = await this.getConsensusBlockchain();
      const consensusHash = this.getChainHash(consensusChain);

      let matchCount = 0;
      const discrepancies: {
        userId: string;
        userName: string;
        chainLength: number;
        lastBlockHash: string;
      }[] = [];

      usersSnapshot.docs.forEach(userDoc => {
        const userData = userDoc.data();
        const userChain = userData.voteBlocks || [GENESIS_BLOCK];
        const userChainHash = this.getChainHash(userChain);

        if (userChainHash === consensusHash) {
          matchCount++;
        } else {
          discrepancies.push({
            userId: userDoc.id,
            userName: userData.name || 'Unknown',
            chainLength: userChain.length,
            lastBlockHash: getLastBlock(userChain).hash,
          });
        }
      });

      const totalUsers = usersSnapshot.size;
      const matchPercentage = (matchCount / totalUsers) * 100;

      return {
        isIntegritySafe: matchPercentage >= 95, // 95% consensus means safe
        matchPercentage,
        totalUsers,
        consensusChain,
        discrepancies,
      };
    } catch (error) {
      console.error('Verify blockchain integrity error:', error);
      return {
        isIntegritySafe: false,
        matchPercentage: 0,
        totalUsers: 0,
        consensusChain: [GENESIS_BLOCK],
        discrepancies: [],
      };
    }
  }

  /**
   * Repair user's blockchain (sync with consensus)
   */
  static async repairUserBlockchain(userId: string): Promise<boolean> {
    try {
      const consensusChain = await this.getConsensusBlockchain();
      const userRef = doc(db, COLLECTIONS.USERS, userId);

      await updateDoc(userRef, {
        voteBlocks: consensusChain,
      });

      return true;
    } catch (error) {
      console.error('Repair user blockchain error:', error);
      return false;
    }
  }

  /**
   * Get blockchain statistics
   */
  static async getBlockchainStatistics(): Promise<{
    totalBlocks: number;
    totalVotes: number;
    integrityStatus: 'safe' | 'warning' | 'critical';
    matchPercentage: number;
  }> {
    try {
      const consensusChain = await this.getConsensusBlockchain();
      const integrity = await this.verifyBlockchainIntegrity();

      let integrityStatus: 'safe' | 'warning' | 'critical' = 'safe';
      
      if (integrity.matchPercentage < 95) {
        integrityStatus = 'warning';
      }
      if (integrity.matchPercentage < 80) {
        integrityStatus = 'critical';
      }

      return {
        totalBlocks: consensusChain.length,
        totalVotes: consensusChain.length - 1, // Exclude genesis
        integrityStatus,
        matchPercentage: integrity.matchPercentage,
      };
    } catch (error) {
      console.error('Get blockchain statistics error:', error);
      return {
        totalBlocks: 1,
        totalVotes: 0,
        integrityStatus: 'critical',
        matchPercentage: 0,
      };
    }
  }
}

