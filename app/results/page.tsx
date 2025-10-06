'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import ThreeBackground from '@/components/ThreeBackground';
import { gsap } from 'gsap';
import { Eye, BarChart3, Users, Clock, CheckCircle, AlertCircle, Trophy, Zap } from 'lucide-react';

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
  name: string;
  cnic: string;
  isAdmin: boolean;
}

export default function Results() {
  const [user, setUser] = useState<User | null>(null);
  const [results, setResults] = useState<ElectionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [electionClosed, setElectionClosed] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);
  const [winner, setWinner] = useState<ElectionResult | null>(null);
  const router = useRouter();
  const headerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const winnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/signin');
      return;
    }
    
    setUser(JSON.parse(userData));
    
    // Simulate loading results
    setTimeout(() => {
      const mockResults: ElectionResult[] = [
        {
          candidateId: '1',
          name: 'Dr. Sarah Ahmed',
          party: 'Progressive Party',
          symbol: '🌟',
          votes: 4250,
          percentage: 42.5,
          color: 'blue'
        },
        {
          candidateId: '2',
          name: 'Muhammad Ali Khan',
          party: 'Unity Alliance',
          symbol: '🏛️',
          votes: 3100,
          percentage: 31.0,
          color: 'green'
        },
        {
          candidateId: '3',
          name: 'Fatima Hassan',
          party: 'Democratic Front',
          symbol: '🕊️',
          votes: 1875,
          percentage: 18.75,
          color: 'purple'
        },
        {
          candidateId: '4',
          name: 'Ahmed Raza',
          party: 'National Movement',
          symbol: '⚡',
          votes: 775,
          percentage: 7.75,
          color: 'orange'
        }
      ];
      
      setResults(mockResults);
      setTotalVotes(10000);
      setWinner(mockResults[0]);
      setIsLoading(false);

      // Animate elements
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

      if (resultsRef.current) {
        tl.fromTo(resultsRef.current.children,
          { x: -100, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power2.out" },
          "-=0.8"
        );
      }
    }, 1000);
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
            <p className="text-gray-400 text-lg">General Election 2024 - Final Results</p>
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
                    <Eye className="h-6 w-6 text-green-400 mr-3" />
                    <span className="text-lg font-medium text-gray-400">Voter Turnout</span>
                  </div>
                  <p className="text-3xl font-bold text-green-400">78.5%</p>
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
          <Card className="bg-blockchain-primary/10 border border-blockchain-primary/30 cyber-border">
            <CardContent className="p-8">
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-8 w-8 text-blockchain-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blockchain-accent mb-3 text-xl">Blockchain Verified</h3>
                  <p className="text-gray-300 mb-4 text-lg">
                    These results have been verified and recorded on the blockchain, ensuring complete transparency and immutability.
                  </p>
                  <div className="bg-dark-secondary/50 p-4 rounded-lg border border-blockchain-primary/20">
                    <p className="text-sm text-blockchain-accent font-mono">
                      Block Hash: 0x{Math.random().toString(16).substr(2, 64)}
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