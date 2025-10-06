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
  id: string;
  name: string;
  party: string;
  symbol: string;
  color: string;
}

interface User {
  name: string;
  cnic: string;
  isAdmin: boolean;
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
  const router = useRouter();
  const candidatesRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/signin');
      return;
    }
    
    setUser(JSON.parse(userData));
    
    // Mock candidates data
    setCandidates([
      { id: '1', name: 'Dr. Sarah Ahmed', party: 'Progressive Party', symbol: '🌟', color: 'blue' },
      { id: '2', name: 'Muhammad Ali Khan', party: 'Unity Alliance', symbol: '🏛️', color: 'green' },
      { id: '3', name: 'Fatima Hassan', party: 'Democratic Front', symbol: '🕊️', color: 'purple' },
      { id: '4', name: 'Ahmed Raza', party: 'National Movement', symbol: '⚡', color: 'orange' }
    ]);
    
    // Check if user has already voted
    const votedStatus = localStorage.getItem('hasVoted');
    setHasVoted(votedStatus === 'true');
    
    setIsLoading(false);

    // Animate header
    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power2.out" }
      );
    }

    // Animate candidates
    if (candidatesRef.current && !votedStatus) {
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

  const handleVote = async () => {
    if (!selectedCandidate) return;
    
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
    
    // Simulate blockchain transaction
    setTimeout(() => {
      const mockTransactionHash = '0x' + Math.random().toString(16).substr(2, 64);
      setTransactionHash(mockTransactionHash);
      setHasVoted(true);
      localStorage.setItem('hasVoted', 'true');
      localStorage.setItem('votedCandidate', selectedCandidate);
      localStorage.setItem('transactionHash', mockTransactionHash);
      
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
      
      setIsVoting(false);
    }, 3000);
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
                Your vote has been securely recorded on the blockchain and cannot be altered.
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
                <h4 className="text-sm font-medium text-gray-400 mb-3">Transaction Hash:</h4>
                <p className="text-xs text-blockchain-accent font-mono break-all bg-dark-primary/50 p-3 rounded">
                  {storedHash || transactionHash}
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

          {/* Election Info */}
          <Card className="mb-12 glass-card border-blockchain-primary/30">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-2">General Election 2024</h3>
                  <p className="text-gray-400 text-lg">National Assembly Constituency</p>
                </div>
                <div className="flex items-center space-x-3 text-green-400">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-medium">Election Active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Candidates */}
          <div ref={candidatesRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {candidates.map((candidate) => (
              <Card 
                key={candidate.id}
                className={`cursor-pointer transition-all duration-500 glass-card border-2 hover:scale-105 ${
                  selectedCandidate === candidate.id 
                    ? 'border-blockchain-primary bg-blockchain-primary/20 neon-glow scale-105' 
                    : `${getColorClasses(candidate.color)} hover:neon-glow`
                }`}
                onClick={() => setSelectedCandidate(candidate.id)}
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

          {/* Vote Button */}
          <div className="text-center mb-12">
            <Button
              onClick={handleVote}
              disabled={!selectedCandidate || isVoting}
              size="lg"
              className="px-16 py-6 text-xl purple-gradient hover:scale-110 transition-all duration-300 neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVoting ? (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Processing Vote...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Vote className="h-6 w-6" />
                  <span>Cast Vote</span>
                  <Zap className="h-6 w-6" />
                </div>
              )}
            </Button>
            
            {!selectedCandidate && (
              <p className="text-gray-500 mt-4 text-lg">
                Please select a candidate to cast your vote
              </p>
            )}
          </div>

          {/* Security Notice */}
          <Card className="bg-blue-500/10 border border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
                <div className="text-blue-300">
                  <p className="font-medium mb-2 text-lg">Security Notice:</p>
                  <p className="text-blue-200">
                    Your vote will be encrypted and recorded on the blockchain. Once cast, it cannot be changed or deleted. 
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