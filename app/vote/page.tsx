'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import ThreeBackground from '@/components/ThreeBackground';
import { gsap } from 'gsap';
import { Vote, Check, AlertCircle, Clock, CheckCircle, Zap, Sparkles, Eye } from 'lucide-react';

interface Candidate {
  id?: string;
  name: string;
  party: string;
  symbol: string;
  color: string;
}

interface User {
  uid: string;
  name: string;
  cnic: string;
  isAdmin: boolean;
}

interface Election {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'ended';
  candidates: string[];
  hasVoted: boolean;
  userVote?: {
    id: string;
    candidateId: string;
    timestamp: Date;
    transactionHash: string;
  } | null;
}

export default function CastVote() {
  const [user, setUser] = useState<User | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [electionStatus, setElectionStatus] = useState<'active' | 'inactive' | 'closed'>('active');
  const [transactionHash, setTransactionHash] = useState('');
  const [activeElections, setActiveElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const router = useRouter();
  const candidatesRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadVotingData = async () => {
      try {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('idToken');
        
        if (!userData || !token) {
          router.push('/signin');
          return;
        }
        
        setUser(JSON.parse(userData));
        
        // Get all active elections from API
        console.log('Fetching active elections with token:', token ? 'Present' : 'Missing');
        const response = await fetch('/api/vote/elections/active', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('Active elections API response status:', response.status);
        
        if (response.status === 401) {
          console.error('Authentication failed');
          alert('Your session has expired. Please log in again.');
          localStorage.removeItem('idToken');
          localStorage.removeItem('user');
          router.push('/signin');
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        console.log('Active elections API response data:', data);
        
        if (data.success && data.elections) {
          console.log('Found elections:', data.elections.length);
          setActiveElections(data.elections);
          
          if (data.elections.length === 0) {
            console.log('No active elections found');
            setElectionStatus('inactive');
            setIsLoading(false);
            return;
          }
          
          // Select first election by default
          const firstElection = data.elections[0];
          console.log('Selected election:', firstElection);
          setSelectedElection(firstElection);
          setHasVoted(firstElection.hasVoted);
          
          // Load candidates for selected election
          await loadCandidatesForElection(firstElection.id);
          
          setIsLoading(false);
        } else {
          console.error('Failed to load elections:', data.error);
          alert(`Failed to load elections: ${data.error || 'Unknown error'}`);
          setElectionStatus('inactive');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading voting data:', error);
        setIsLoading(false);
      }
    };

    const loadCandidatesForElection = async (electionId: string) => {
      try {
        const { DatabaseService } = await import('@/lib/database');
        const allCandidates = await DatabaseService.getCandidates();
        const election = activeElections.find(e => e.id === electionId) || selectedElection;
        
        if (election) {
          const electionCandidates = allCandidates.filter(candidate => 
            candidate.id && election.candidates.includes(candidate.id)
          );
          setCandidates(electionCandidates);
        }
      } catch (error) {
        console.error('Error loading candidates:', error);
      }
    };
    
    loadVotingData();

    // Animate header
    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power2.out" }
      );
    }

    // Animate candidates
    if (candidatesRef.current && !hasVoted) {
      gsap.fromTo(candidatesRef.current.children,
        { y: 100, opacity: 0, scale: 0.8, rotationY: 45 },
        { 
          y: 0, 
          opacity: 1, 
          scale: 1, 
          rotationY: 0, 
          duration: 0.8, 
          stagger: 0.2, 
          ease: "back.out(1.7)",
          delay: 0.5
        }
      );
    }
  }, [router]);

  // Function to load candidates for a specific election
  const loadCandidatesForElection = async (electionId: string) => {
    try {
      const { DatabaseService } = await import('@/lib/database');
      const allCandidates = await DatabaseService.getCandidates();
      const election = activeElections.find(e => e.id === electionId) || selectedElection;
      
      if (election) {
        const electionCandidates = allCandidates.filter(candidate => 
          candidate.id && election.candidates.includes(candidate.id)
        );
        setCandidates(electionCandidates);
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate || !user || !selectedElection) return;
    
    setIsVoting(true);
    
    // Voting animation
    if (candidatesRef.current) {
      gsap.to(candidatesRef.current, { 
        scale: 1.05, 
        duration: 0.3, 
        yoyo: true, 
        repeat: -1 
      });
    }
    
    try {
      const token = localStorage.getItem('idToken');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        console.error('No authentication token or user data found');
        alert('Authentication required. Please log in again.');
        router.push('/signin');
        setIsVoting(false);
        return;
      }
      
      console.log('Casting vote for election:', selectedElection.id, 'candidate:', selectedCandidate);
      
      // Cast vote using API
      const response = await fetch('/api/vote/cast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          candidateId: selectedCandidate,
          electionId: selectedElection.id,
        }),
      });
      
      console.log('Vote API response status:', response.status);
      
      if (response.status === 401) {
        console.error('Authentication failed - token expired');
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('idToken');
        localStorage.removeItem('user');
        router.push('/signin');
        setIsVoting(false);
        return;
      }
      
      const data = await response.json();
      console.log('Vote API response:', data);
      
      if (data.success) {
        // Use actual blockchain hash from vote result
        const blockHash = data.blockHash || '';
        setTransactionHash(blockHash);
        setHasVoted(true);
        
        // Store vote info in localStorage for display
        localStorage.setItem('votedCandidate', selectedCandidate);
        localStorage.setItem('transactionHash', blockHash);
        
        // Update selected election to show user has voted
        setSelectedElection(prev => prev ? { ...prev, hasVoted: true } : null);
        
        // Success animation with confetti effect
        if (candidatesRef.current) {
          gsap.killTweensOf(candidatesRef.current);
          gsap.to(candidatesRef.current, { 
            scale: 1.2, 
            rotation: 360, 
            duration: 1.5,
            ease: "back.out(1.7)"
          });
        }
        
        alert('Vote cast successfully! Your vote has been recorded on the blockchain.');
      } else {
        console.error('Vote failed:', data.error);
        alert(`Vote failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      alert('Error casting vote. Please try again.');
    }
    
    setIsVoting(false);
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'border-blue-400/50 hover:border-blue-400 bg-blue-500/10',
      green: 'border-green-400/50 hover:border-green-400 bg-green-500/10',
      purple: 'border-purple-400/50 hover:border-purple-400 bg-purple-500/10',
      orange: 'border-orange-400/50 hover:border-orange-400 bg-orange-500/10',
    };
    return colorMap[color as keyof typeof colorMap] || 'border-gray-400/50 hover:border-gray-400 bg-gray-500/10';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <ThreeBackground variant="ledger" />
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blockchain-primary mx-auto mb-4"></div>
            <p className="text-gray-400">Loading voting interface...</p>
          </div>
        </div>
      </div>
    );
  }

  if (electionStatus === 'inactive') {
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
                No Active Election
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                There is currently no active election. Please check back later or contact the administrator.
              </p>
              <Button 
                onClick={() => router.push('/')} 
                variant="outline"
                className="border-blockchain-primary/30 text-blockchain-accent hover:bg-blockchain-primary/10"
              >
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (hasVoted) {
    const votedCandidateId = localStorage.getItem('votedCandidate');
    const votedCandidate = candidates.find(c => c.id === votedCandidateId);
    const storedHash = localStorage.getItem('transactionHash');
    
    return (
      <div className="min-h-screen bg-dark-primary">
        <ThreeBackground variant="particles" />
        <Navigation />
        <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
          <div className="particle-bg absolute inset-0 opacity-20"></div>
          
          <Card className="w-full max-w-2xl text-center glass-card border-green-500/30 cyber-border relative z-10">
            <CardContent className="p-12">
              <div className="flex items-center justify-center mb-8">
                <div className="p-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full neon-glow pulse-glow">
                  <CheckCircle className="h-16 w-16 text-white" />
                </div>
              </div>
              <h2 className="text-4xl font-bold gradient-text neon-text mb-6">
                Vote Cast Successfully!
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                Your vote has been securely recorded on the distributed blockchain ledger across all users. 
                The blockchain ensures your vote is tamper-proof and verifiable.
              </p>
              
              {votedCandidate && (
                <div className="bg-blockchain-primary/10 p-8 rounded-xl border border-blockchain-primary/30 mb-8">
                  <h3 className="text-xl font-semibold text-blockchain-accent mb-4">You voted for:</h3>
                  <div className="flex items-center justify-center space-x-6">
                    <span className="text-5xl">{votedCandidate.symbol}</span>
                    <div className="text-left">
                      <p className="font-bold text-white text-2xl">{votedCandidate.name}</p>
                      <p className="text-gray-400 text-lg">{votedCandidate.party}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-dark-secondary/50 p-6 rounded-xl mb-8 border border-blockchain-primary/20">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Blockchain Block Hash:</h4>
                <p className="text-xs text-blockchain-accent font-mono break-all bg-dark-primary/50 p-3 rounded">
                  {storedHash || transactionHash}
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  This hash is stored in all users' blockchain copies, ensuring vote integrity
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => router.push('/results')} 
                  variant="outline"
                  className="border-blockchain-primary/30 text-blockchain-accent hover:bg-blockchain-primary/10 hover:scale-105 transition-all duration-300"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Results
                </Button>
                <Button 
                  onClick={() => router.push('/profile')}
                  className="purple-gradient hover:scale-105 transition-all duration-300 neon-glow"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Back to Profile
                </Button>
              </div>
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
              <Vote className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text neon-text mb-4">Cast Your Vote</h1>
            <p className="text-gray-400 text-lg">Select your preferred candidate for the election</p>
          </div>

          {/* Election Selection */}
          {activeElections.length > 1 && (
            <Card className="mb-8 glass-card border-blockchain-primary/30">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Select Election to Vote In:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeElections.map((election) => (
                    <button
                      key={election.id}
                      onClick={() => {
                        setSelectedElection(election);
                        setHasVoted(election.hasVoted);
                        setSelectedCandidate('');
                        loadCandidatesForElection(election.id);
                      }}
                      className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                        selectedElection?.id === election.id
                          ? 'border-blockchain-primary bg-blockchain-primary/20'
                          : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                      }`}
                    >
                      <h4 className="font-semibold text-white mb-2">{election.title}</h4>
                      <p className="text-sm text-gray-400 mb-3">{election.description}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${election.hasVoted ? 'text-green-400' : 'text-yellow-400'}`}>
                          {election.hasVoted ? '✓ Voted' : 'Not Voted'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(election.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Election Info */}
          {selectedElection && (
            <Card className="mb-12 glass-card border-blockchain-primary/30">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-2">
                      {selectedElection.title}
                    </h3>
                    <p className="text-gray-400 text-lg">
                      {selectedElection.description}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Ends: {new Date(selectedElection.endDate).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 text-green-400">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-lg font-medium">Election Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Candidates */}
          {selectedElection && (
            <div ref={candidatesRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {candidates.map((candidate) => (
              <Card 
                key={candidate.id}
                className={`cursor-pointer transition-all duration-500 glass-card border-2 hover:scale-105 ${
                  selectedCandidate === candidate.id 
                    ? 'border-blockchain-primary bg-blockchain-primary/20 neon-glow scale-105' 
                    : `${getColorClasses(candidate.color)} hover:neon-glow`
                }`}
                onClick={() => setSelectedCandidate(candidate.id!)}
              >
                <CardContent className="p-8">
                  <div className="flex items-center space-x-6">
                    <div className="text-6xl">{candidate.symbol}</div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">{candidate.name}</h3>
                      <p className="text-gray-400 text-lg">{candidate.party}</p>
                    </div>
                    {selectedCandidate === candidate.id && (
                      <div className="flex items-center justify-center w-12 h-12 purple-gradient rounded-full neon-glow">
                        <Check className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}

          {/* Vote Button */}
          {selectedElection && (
            <div className="text-center mb-12">
              <Button
                onClick={handleVote}
                disabled={!selectedCandidate || isVoting || hasVoted}
                size="lg"
                className="px-16 py-6 text-xl purple-gradient hover:scale-110 transition-all duration-300 neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVoting ? (
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Processing Vote...</span>
                  </div>
                ) : hasVoted ? (
                  <div className="flex items-center space-x-3">
                    <Check className="h-6 w-6" />
                    <span>Already Voted</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Vote className="h-6 w-6" />
                    <span>Cast Vote</span>
                    <Zap className="h-6 w-6" />
                  </div>
                )}
              </Button>
              
              {!selectedCandidate && !hasVoted && (
                <p className="text-gray-500 mt-4 text-lg">
                  Please select a candidate to cast your vote
                </p>
              )}
            </div>
          )}

          {/* Debug Info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="bg-gray-800/50 border border-gray-600">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Debug Info:</h4>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Token: {localStorage.getItem('idToken') ? '✅ Present' : '❌ Missing'}</p>
                  <p>User: {localStorage.getItem('user') ? '✅ Present' : '❌ Missing'}</p>
                  <p>Active Elections: {activeElections.length}</p>
                  <p>Selected Election: {selectedElection?.id || 'None'}</p>
                  <p>Selected Candidate: {selectedCandidate || 'None'}</p>
                  <p>Has Voted: {hasVoted ? 'Yes' : 'No'}</p>
                </div>
                <div className="mt-3 flex space-x-2">
                  <Button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('idToken');
                        const response = await fetch('/api/debug/elections', {
                          headers: { 'Authorization': `Bearer ${token}` },
                        });
                        const data = await response.json();
                        console.log('Debug Elections:', data);
                        alert(`Found ${data.debugInfo?.elections?.active || 0} active elections. Check console for details.`);
                      } catch (error) {
                        console.error('Debug error:', error);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Debug Elections
                  </Button>
                  <Button
                    onClick={() => {
                      console.log('Active Elections State:', activeElections);
                      console.log('Selected Election State:', selectedElection);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Log State
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/test/elections');
                        const data = await response.json();
                        console.log('Test Elections (No Auth):', data);
                        alert(`Found ${data.data?.activeElections || 0} active elections out of ${data.data?.totalElections || 0} total. Check console for details.`);
                      } catch (error) {
                        console.error('Test error:', error);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Test Elections
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/health');
                        const data = await response.json();
                        console.log('Health Check:', data);
                        alert(`Server Status: ${data.success ? '✅ Running' : '❌ Error'}\nEnvironment: ${data.environment}\nTime: ${data.timestamp}`);
                      } catch (error) {
                        console.error('Health check error:', error);
                        alert('❌ Server not responding');
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Health Check
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Notice */}
          <Card className="bg-blue-500/10 border border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
                <div className="text-blue-300">
                  <p className="font-medium mb-2 text-lg">Blockchain Security:</p>
                  <p className="text-blue-200">
                    Your vote will be added as a new block to the distributed blockchain ledger. Every user stores a copy
                    of all blocks, making tampering virtually impossible. Once cast, your vote cannot be changed or deleted. 
                    Please review your selection carefully before voting.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}