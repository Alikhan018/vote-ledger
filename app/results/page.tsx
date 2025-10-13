'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import ThreeBackground from '@/components/ThreeBackground';
import { gsap } from 'gsap';
import { Eye, BarChart3, Users, Clock, CheckCircle, AlertCircle, Trophy, Zap, Shield, Link2 } from 'lucide-react';

interface ElectionResult {
  candidateId: string;
  name: string;
  party: string;
  symbol: string;
  votes: number;
  percentage: number;
  color: string;
}

interface User {
  uid: string;
  name: string;
  cnic: string;
  isAdmin: boolean;
}

interface BlockchainStats {
  isIntegritySafe: boolean;
  matchPercentage: number;
  totalBlocks: number;
  totalVotes: number;
}

export default function Results() {
  const [user, setUser] = useState<User | null>(null);
  const [results, setResults] = useState<ElectionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [electionClosed, setElectionClosed] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [winner, setWinner] = useState<ElectionResult | null>(null);
  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats | null>(null);
  const [electionTitle, setElectionTitle] = useState('General Election 2024');
  const router = useRouter();
  const headerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const winnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          router.push('/signin');
          return;
        }
        
        const userParsed = JSON.parse(userData);
        setUser(userParsed);

        // Import services
        const { DatabaseService } = await import('@/lib/database');
        const { BlockchainDatabaseService } = await import('@/lib/blockchain-database');
        
        // Get all elections to find the most recent one
        const elections = await DatabaseService.getElections();
        
        if (elections.length === 0) {
          setIsLoading(false);
          return;
        }

        // Get the most recent election (active or ended)
        const recentElection = elections.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];

        setElectionTitle(recentElection.title);
        setElectionClosed(recentElection.status === 'ended');

        if (recentElection.status !== 'ended') {
          setIsLoading(false);
          return;
        }

        // Get candidates
        const allCandidates = await DatabaseService.getCandidates();
        
        // Get vote statistics using the improved method
        const voteStats = await DatabaseService.getVoteStatistics(recentElection.id!);
        
        // Calculate total votes
        const total = voteStats.totalVotes;
        setTotalVotes(total);

        // Build results from the vote statistics
        const electionResults: ElectionResult[] = voteStats.candidateResults.map(result => {
          const candidate = allCandidates.find(c => c.id === result.candidateId);
          const percentage = total > 0 ? (result.votes / total) * 100 : 0;
          
          return {
            candidateId: result.candidateId,
            name: result.candidateName,
            party: candidate?.party || 'Unknown',
            symbol: candidate?.symbol || '❓',
            votes: result.votes,
            percentage: Math.round(percentage * 100) / 100,
            color: candidate?.color || 'gray',
          };
        }).sort((a, b) => b.votes - a.votes);

        setResults(electionResults);
        
        if (electionResults.length > 0) {
          setWinner(electionResults[0]);
        }

        // Verify blockchain integrity
        const blockchainIntegrity = await BlockchainDatabaseService.verifyBlockchainIntegrity();
        
        setBlockchainStats({
          isIntegritySafe: blockchainIntegrity.isIntegritySafe,
          matchPercentage: blockchainIntegrity.matchPercentage,
          totalBlocks: blockchainIntegrity.consensusChain.length,
          totalVotes: blockchainIntegrity.consensusChain.length - 1, // Exclude genesis
        });

        setIsLoading(false);

        // Animate elements after data loads
        setTimeout(() => {
          const tl = gsap.timeline();
          
          if (headerRef.current) {
            tl.fromTo(headerRef.current,
              { y: -50, opacity: 0 },
              { y: 0, opacity: 1, duration: 1, ease: "power2.out" }
            );
          }

          if (winnerRef.current) {
            tl.fromTo(winnerRef.current,
              { scale: 0, rotation: -180 },
              { scale: 1, rotation: 0, duration: 1.2, ease: "back.out(1.7)" },
              "-=0.5"
            );
          }

          if (resultsRef.current && resultsRef.current.children.length > 0) {
            tl.fromTo(resultsRef.current.children,
              { x: -100, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power2.out" },
              "-=0.8"
            );
          }
        }, 100);
      } catch (error) {
        console.error('Error loading results:', error);
        setIsLoading(false);
      }
    };

    loadResults();
  }, [router]);

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'from-blue-400 to-blue-600',
      green: 'from-green-400 to-green-600',
      purple: 'from-purple-400 to-purple-600',
      orange: 'from-orange-400 to-orange-600',
    };
    return colorMap[color as keyof typeof colorMap] || 'from-gray-400 to-gray-600';
  };

  const getBorderClasses = (color: string) => {
    const colorMap = {
      blue: 'border-blue-400/50 bg-blue-500/10',
      green: 'border-green-400/50 bg-green-500/10',
      purple: 'border-purple-400/50 bg-purple-500/10',
      orange: 'border-orange-400/50 bg-orange-500/10',
    };
    return colorMap[color as keyof typeof colorMap] || 'border-gray-400/50 bg-gray-500/10';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <ThreeBackground variant="particles" />
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blockchain-primary mx-auto mb-4"></div>
            <p className="text-gray-400 text-lg">Loading election results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!electionClosed) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <ThreeBackground variant="minimal" />
        <Navigation />
        <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center glass-card border-yellow-500/30">
            <CardContent className="p-12">
              <div className="flex items-center justify-center mb-8">
                <div className="p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full neon-glow pulse-glow">
                  <Clock className="h-16 w-16 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Election Still Active
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                Results will be available once the election is closed by the administrator.
              </p>
              <Button 
                onClick={() => router.push('/vote')} 
                variant="outline"
                className="border-blockchain-primary/30 text-blockchain-accent hover:bg-blockchain-primary/10"
              >
                Cast Your Vote
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      <ThreeBackground variant="ledger" />
      <Navigation />
      
      <div className="relative min-h-[calc(100vh-4rem)]">
        <div className="cyber-grid absolute inset-0 opacity-10"></div>
        
        <div className="relative max-w-6xl mx-auto p-4 py-8 z-10">
          {/* Header */}
          <div ref={headerRef} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 purple-gradient rounded-full mb-6 neon-glow pulse-glow">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text neon-text mb-4">Election Results</h1>
            <p className="text-gray-400 text-lg">{electionTitle} - Final Results</p>
          </div>

          {/* Election Summary */}
          <Card className="mb-12 glass-card border-blockchain-primary/30">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-blockchain-primary mr-3" />
                    <span className="text-lg font-medium text-gray-400">Total Votes Cast</span>
                  </div>
                  <p className="text-3xl font-bold gradient-text">{totalVotes.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Shield className="h-6 w-6 text-green-400 mr-3" />
                    <span className="text-lg font-medium text-gray-400">Blockchain Blocks</span>
                  </div>
                  <p className="text-3xl font-bold text-green-400">{blockchainStats?.totalBlocks || 0}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <CheckCircle className="h-6 w-6 text-blue-400 mr-3" />
                    <span className="text-lg font-medium text-gray-400">Election Status</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-400">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Winner Announcement */}
          {winner && (
            <Card ref={winnerRef} className={`mb-12 glass-card border-2 ${getBorderClasses(winner.color)} cyber-border`}>
              <CardContent className="p-10">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-8">
                    <div className="p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full neon-glow pulse-glow">
                      <Trophy className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold gradient-text neon-text mb-6">Election Winner</h2>
                  <div className="flex items-center justify-center space-x-6 mb-6">
                    <span className="text-6xl">{winner.symbol}</span>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{winner.name}</h3>
                      <p className="text-gray-400 text-lg">{winner.party}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center space-x-8 text-lg text-gray-300">
                    <span><strong className="text-blockchain-accent">{winner.votes.toLocaleString()}</strong> votes</span>
                    <span><strong className="text-blockchain-accent">{winner.percentage}%</strong> of total votes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Results */}
          <Card className="mb-12 glass-card border-blockchain-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <BarChart3 className="h-6 w-6 text-blockchain-primary" />
                <span className="gradient-text">Detailed Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent ref={resultsRef} className="space-y-8">
              {results.map((result, index) => (
                <div key={result.candidateId} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                      <span className="text-3xl">{result.symbol}</span>
                      <div>
                        <h4 className="font-semibold text-white text-xl">{result.name}</h4>
                        <p className="text-gray-400">{result.party}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">{result.votes.toLocaleString()}</p>
                      <p className="text-gray-400">{result.percentage}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-dark-secondary/50 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`h-4 rounded-full transition-all duration-1000 bg-gradient-to-r ${getColorClasses(result.color)} neon-glow`}
                      style={{ width: `${result.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Blockchain Verification */}
          <Card className={`${
            blockchainStats?.isIntegritySafe 
              ? 'bg-green-500/10 border border-green-500/30' 
              : 'bg-yellow-500/10 border border-yellow-500/30'
          } cyber-border`}>
            <CardContent className="p-8">
              <div className="flex items-start space-x-4">
                {blockchainStats?.isIntegritySafe ? (
                  <CheckCircle className="h-8 w-8 text-green-400 mt-1 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-yellow-400 mt-1 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold mb-3 text-xl ${
                    blockchainStats?.isIntegritySafe ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    <Shield className="inline h-6 w-6 mr-2" />
                    Blockchain Integrity Verification
                  </h3>
                  <p className="text-gray-300 mb-6 text-lg">
                    {blockchainStats?.isIntegritySafe
                      ? 'All vote blocks are verified and synchronized across all users. The blockchain integrity is intact.'
                      : 'Blockchain verification detected some discrepancies. System administrators have been notified.'}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-dark-secondary/50 p-4 rounded-lg border border-blockchain-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Integrity Status</span>
                        <CheckCircle className={`h-5 w-5 ${
                          blockchainStats?.isIntegritySafe ? 'text-green-400' : 'text-yellow-400'
                        }`} />
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {blockchainStats?.matchPercentage?.toFixed(1) || 0}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Chain synchronization across users</p>
                    </div>
                    
                    <div className="bg-dark-secondary/50 p-4 rounded-lg border border-blockchain-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Total Blocks</span>
                        <Link2 className="h-5 w-5 text-blockchain-primary" />
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {blockchainStats?.totalBlocks || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Including genesis block</p>
                    </div>
                  </div>

                  <div className="bg-dark-secondary/70 p-5 rounded-lg border border-blockchain-primary/30">
                    <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Distributed Ledger Technology
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Every vote is stored as a block with a unique hash. Each user maintains a complete copy of the 
                      blockchain, making it virtually impossible to tamper with votes. Any attempt to modify a single 
                      vote would break the chain's integrity and be immediately detected by comparing it with other users' copies.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}