'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import ThreeBackground from '@/components/ThreeBackground';
import { gsap } from 'gsap';
import { 
  Shield, 
  Users, 
  Plus, 
  Play, 
  Square, 
  Upload, 
  CheckCircle, 
  Clock,
  Eye,
  BarChart3,
  UserPlus,
  Edit,
  Trash2,
  Loader2,
  Hash,
  X,
  Sparkles,
  Zap,
  TrendingUp,
  Activity,
  Target
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { AdminCandidatesService, AdminCandidate, AdminCreateCandidateRequest } from '@/services';
import { useToast } from '@/hooks/use-toast';

// Dynamic import for emoji picker to avoid SSR issues
const EmojiPicker = dynamic(
  () => import('emoji-picker-react'),
  { ssr: false }
);

interface User {
  name: string;
  cnic: string;
  isAdmin: boolean;
}


interface ElectionStats {
  totalVoters: number;
  totalVotes: number;
  turnoutPercentage: number;
  status: 'inactive' | 'active' | 'closed';
}

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
  const [electionStats, setElectionStats] = useState<ElectionStats>({
    totalVoters: 12500,
    totalVotes: 10000,
    turnoutPercentage: 80.0,
    status: 'closed'
  });
  const [newCandidate, setNewCandidate] = useState<AdminCreateCandidateRequest>({
    name: '',
    party: '',
    symbol: '',
    description: ''
  });
  const [editingCandidate, setEditingCandidate] = useState<AdminCandidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const candidatesRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/signin');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (!parsedUser.isAdmin) {
      router.push('/');
      return;
    }
    
    setUser(parsedUser);
    
    // Load candidates from API
    loadCandidates();
    
    setIsLoading(false);
  }, [router]);

  // GSAP animations
  useEffect(() => {
    if (!isLoading) {
      const tl = gsap.timeline();
      
      if (headerRef.current) {
        tl.from(headerRef.current, {
          y: -50,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out"
        });
      }
      
      if (statsRef.current) {
        tl.from(statsRef.current.children, {
          y: 30,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out"
        }, "-=0.4");
      }
      
      if (candidatesRef.current) {
        tl.from(candidatesRef.current, {
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out"
        }, "-=0.2");
      }
    }
  }, [isLoading, activeTab]);

// Close emoji picker when clicking outside or scrolling
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target as Node) &&
        !emojiButtonRef.current?.contains(event.target as Node)) {
      setShowEmojiPicker(false);
    }
  };

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowEmojiPicker(false);
    }
  };

  const handleScroll = (e: Event) => {
    // Don't close if scrolling inside the emoji picker itself
    if (emojiPickerRef.current && emojiPickerRef.current.contains(e.target as Node)) {
      return;
    }
    setShowEmojiPicker(false);
  };

  if (showEmojiPicker) {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll, true); // Use capture phase
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('keydown', handleEscape);
    window.removeEventListener('scroll', handleScroll, true);
  };
}, [showEmojiPicker]);

  // Load candidates from API
  const loadCandidates = async () => {
    try {
      setCandidateLoading(true);
      const response = await AdminCandidatesService.getCandidates();
      
      if (response.success && response.candidates) {
        setCandidates(response.candidates);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to load candidates',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error loading candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load candidates',
        variant: 'destructive',
      });
    } finally {
      setCandidateLoading(false);
    }
  };

  const handleElectionAction = async (action: string) => {
    setActionLoading(action);
    
    // Simulate API call
    setTimeout(() => {
      switch (action) {
        case 'activate':
          setElectionStats(prev => ({ ...prev, status: 'active' }));
          break;
        case 'close':
          setElectionStats(prev => ({ ...prev, status: 'closed' }));
          break;
        case 'deploy':
          // Results deployment logic
          break;
      }
      setActionLoading(null);
    }, 2000);
  };

  const handleAddCandidate = async () => {
    if (!newCandidate.name || !newCandidate.party || !newCandidate.symbol) {
      toast({
        title: 'Validation Error',
        description: 'Name, party, and symbol are required',
        variant: 'destructive',
      });
      return;
    }
    
    setCandidateLoading(true);
    
    try {
      // Debug: Check if user is authenticated
      const token = localStorage.getItem('idToken');
      const userData = localStorage.getItem('user');
      
      console.log('Token exists:', !!token);
      console.log('User data exists:', !!userData);
      console.log('User is admin:', userData ? JSON.parse(userData).isAdmin : false);
      
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'Please sign in again',
          variant: 'destructive',
        });
        router.push('/signin');
        return;
      }
      
      const response = await AdminCandidatesService.createCandidate(newCandidate);
      
      if (response.success && response.candidate) {
        setCandidates(prev => [...prev, response.candidate!]);
        setNewCandidate({ name: '', party: '', symbol: '', description: '' });
        toast({
          title: 'Success!',
          description: 'Candidate created successfully',
          className: 'bg-green-500/10 border-green-500/50',
        });
      } else {
        console.error('API Error Response:', response);
        toast({
          title: 'Error',
          description: response.error || 'Failed to create candidate',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error creating candidate:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create candidate',
        variant: 'destructive',
      });
    } finally {
      setCandidateLoading(false);
    }
  };

  const handleDeleteCandidate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }
    
    setCandidateLoading(true);
    
    try {
      const response = await AdminCandidatesService.deleteCandidate(id);
      
      if (response.success) {
        setCandidates(prev => prev.filter(c => c.id !== id));
        toast({
          title: 'Success!',
          description: 'Candidate deleted successfully',
          className: 'bg-green-500/10 border-green-500/50',
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete candidate',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete candidate',
        variant: 'destructive',
      });
    } finally {
      setCandidateLoading(false);
    }
  };

  const handleEditCandidate = (candidate: AdminCandidate) => {
    setEditingCandidate(candidate);
    setNewCandidate({
      name: candidate.name,
      party: candidate.party,
      symbol: candidate.symbol,
      description: candidate.description || ''
    });
  };

  const handleUpdateCandidate = async () => {
    if (!editingCandidate) return;
    
    if (!newCandidate.name || !newCandidate.party || !newCandidate.symbol) {
      toast({
        title: 'Validation Error',
        description: 'Name, party, and symbol are required',
        variant: 'destructive',
      });
      return;
    }
    
    setCandidateLoading(true);
    
    try {
      const response = await AdminCandidatesService.updateCandidate(editingCandidate.id, newCandidate);
      
      if (response.success && response.candidate) {
        setCandidates(prev => prev.map(c => c.id === editingCandidate.id ? response.candidate! : c));
        setEditingCandidate(null);
        setNewCandidate({ name: '', party: '', symbol: '', description: '' });
        toast({
          title: 'Success!',
          description: 'Candidate updated successfully',
          className: 'bg-green-500/10 border-green-500/50',
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update candidate',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error updating candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to update candidate',
        variant: 'destructive',
      });
    } finally {
      setCandidateLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingCandidate(null);
    setNewCandidate({ name: '', party: '', symbol: '', description: '' });
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiObject: any) => {
    setNewCandidate(prev => ({ ...prev, symbol: emojiObject.emoji }));
    setShowEmojiPicker(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blockchain-primary"></div>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation />
      
      <div className="relative min-h-[calc(100vh-4rem)]">
        <ThreeBackground />
        
        <div className="relative max-w-7xl mx-auto p-4 py-8">
          {/* Header */}
          <div ref={headerRef} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
              Admin Control Center
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Manage elections, candidates, and system settings with advanced controls
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-10">
            <div className="flex space-x-1 bg-white/80 backdrop-blur-sm p-1 rounded-xl max-w-lg mx-auto shadow-lg border border-gray-200/50">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3, color: 'from-blue-500 to-blue-600' },
                { id: 'election', label: 'Election', icon: Play, color: 'from-green-500 to-green-600' },
                { id: 'candidates', label: 'Candidates', icon: Users, color: 'from-purple-500 to-purple-600' }
              ].map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-300 flex-1 justify-center relative ${
                    activeTab === id
                      ? `bg-gradient-to-r ${color} text-white shadow-lg`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Registered Voters</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                          {electionStats.totalVoters.toLocaleString()}
                        </p>
                        <div className="flex items-center mt-2">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs text-green-600">+12% this month</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Votes Cast</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                          {electionStats.totalVotes.toLocaleString()}
                        </p>
                        <div className="flex items-center mt-2">
                          <Activity className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="text-xs text-blue-600">Live tracking</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                        <Eye className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Turnout Rate</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                          {electionStats.turnoutPercentage}%
                        </p>
                        <div className="flex items-center mt-2">
                          <Target className="h-4 w-4 text-orange-500 mr-1" />
                          <span className="text-xs text-orange-600">Above average</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                        <BarChart3 className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Election Status</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${
                            electionStats.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                            electionStats.status === 'closed' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {electionStats.status === 'active' ? 'Active' :
                             electionStats.status === 'closed' ? 'Closed' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {electionStats.status === 'active' ? 'Voting in progress' :
                           electionStats.status === 'closed' ? 'Results available' : 'Not started'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${
                        electionStats.status === 'active' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        electionStats.status === 'closed' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
                        'bg-gradient-to-r from-gray-500 to-gray-600'
                      }`}>
                        {electionStats.status === 'active' ? 
                          <CheckCircle className="h-8 w-8 text-white" /> :
                          <Clock className="h-8 w-8 text-white" />
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Status */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-green-800">Blockchain Network</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">Online</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-green-800">Database</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">Connected</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Election Management Tab */}
          {activeTab === 'election' && (
            <div className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Election Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => handleElectionAction('activate')}
                      disabled={electionStats.status === 'active' || actionLoading === 'activate'}
                      variant="gradient"
                      className="flex items-center space-x-2 h-12"
                    >
                      {actionLoading === 'activate' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      <span>Activate Election</span>
                    </Button>
                    
                    <Button
                      onClick={() => handleElectionAction('close')}
                      disabled={electionStats.status !== 'active' || actionLoading === 'close'}
                      variant="secondary"
                      className="flex items-center space-x-2 h-12"
                    >
                      {actionLoading === 'close' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                      <span>Close Election</span>
                    </Button>
                    
                    <Button
                      onClick={() => handleElectionAction('deploy')}
                      disabled={electionStats.status !== 'closed' || actionLoading === 'deploy'}
                      variant="outline"
                      className="flex items-center space-x-2 h-12"
                    >
                      {actionLoading === 'deploy' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blockchain-primary"></div>
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>Deploy Results</span>
                    </Button>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Current Election Status</h4>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        electionStats.status === 'active' ? 'bg-green-500 animate-pulse' :
                        electionStats.status === 'closed' ? 'bg-blue-500' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-sm text-gray-600">
                        Election is currently <strong>{electionStats.status}</strong>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Candidates Management Tab */}
          {activeTab === 'candidates' && (
            <div ref={candidatesRef} className="space-y-8 relative">
              {/* Add New Candidate */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                      <UserPlus className="h-5 w-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}
                    </span>
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    {editingCandidate ? 'Update candidate information and party details' : 'Register a new candidate for the election'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6 pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Candidate Name</label>
                      <Input
                        placeholder="Enter full candidate name"
                        value={newCandidate.name}
                        onChange={(e) => setNewCandidate(prev => ({ ...prev, name: e.target.value }))}
                        disabled={candidateLoading}
                        className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Political Party</label>
                      <Input
                        placeholder="Enter party name"
                        value={newCandidate.party}
                        onChange={(e) => setNewCandidate(prev => ({ ...prev, party: e.target.value }))}
                        disabled={candidateLoading}
                        className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">Party Symbol</label>
                        {newCandidate.symbol && (
                          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border border-purple-200">
                            <span className="text-lg">{newCandidate.symbol}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Choose a symbol to represent the political party (e.g., 🌟, 🏛️, ⚡)</p>
                      <div className="flex space-x-2">
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 bg-gray-50/30 h-12 transition-colors hover:border-purple-300 hover:bg-purple-50/30">
                          {newCandidate.symbol ? (
                            <span className="text-2xl">{newCandidate.symbol}</span>
                          ) : (
                            <span className="text-gray-400 text-sm font-medium">Click button to select symbol</span>
                          )}
                        </div>
                        <Button
                          ref={emojiButtonRef}
                          type="button"
                          onClick={() => {
                            if (emojiButtonRef.current) {
                              const rect = emojiButtonRef.current.getBoundingClientRect();
                              setEmojiPickerPosition({
                                top: rect.bottom + 8,
                                left: rect.left
                              });
                            }
                            setShowEmojiPicker(!showEmojiPicker);
                          }}
                          variant="outline"
                          disabled={candidateLoading}
                          className="flex items-center justify-center min-w-[48px] h-12 border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-colors"
                        >
                          <Hash className="h-4 w-4" />
                        </Button>
                        {newCandidate.symbol && (
                          <Button
                            type="button"
                            onClick={() => setNewCandidate(prev => ({ ...prev, symbol: '' }))}
                            variant="outline"
                            disabled={candidateLoading}
                            className="flex items-center justify-center min-w-[48px] h-12 text-red-500 hover:bg-red-50 hover:border-red-300 border-red-200 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {showEmojiPicker && typeof window !== 'undefined' && createPortal(
                        <>
                          {/* Backdrop */}
                          <div 
                            className="fixed inset-0 z-[999998] bg-black/10"
                            onClick={() => setShowEmojiPicker(false)}
                          />
                          {/* Emoji Picker */}
                          <div 
                            ref={emojiPickerRef}
                            className="fixed z-[999999] shadow-2xl rounded-lg overflow-hidden border border-gray-200 bg-white max-h-[400px] overflow-y-auto"
                            style={{
                              top: Math.min(emojiPickerPosition.top, window.innerHeight - 450),
                              left: Math.min(emojiPickerPosition.left, window.innerWidth - 350),
                              maxWidth: '350px',
                            }}
                          >
                            <EmojiPicker onEmojiClick={handleEmojiClick} />
                          </div>
                        </>,
                        document.body
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Description (Optional)</label>
                      <Input
                        placeholder="Brief description about the candidate"
                        value={newCandidate.description}
                        onChange={(e) => setNewCandidate(prev => ({ ...prev, description: e.target.value }))}
                        disabled={candidateLoading}
                        className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <Button 
                      onClick={editingCandidate ? handleUpdateCandidate : handleAddCandidate}
                      disabled={candidateLoading}
                      className="flex items-center space-x-2 h-12 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {candidateLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                      <span className="font-medium">{editingCandidate ? 'Update Candidate' : 'Add Candidate'}</span>
                    </Button>
                    
                    {editingCandidate && (
                      <Button 
                        onClick={cancelEdit}
                        variant="outline"
                        disabled={candidateLoading}
                        className="h-12 px-6 border-gray-300 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Candidates List */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          Registered Candidates
                        </span>
                        <Badge variant="secondary" className="ml-3 bg-blue-100 text-blue-800">
                          {candidates.length}
                        </Badge>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {candidateLoading && candidates.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading candidates...</span>
                      </div>
                    ) : (
                      candidates.map((candidate, index) => (
                        <div key={candidate.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-white to-gray-50/50 rounded-xl border border-gray-200/50 hover:shadow-lg hover:border-purple-200 transition-shadow duration-300">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-white to-gray-100 rounded-xl border-2 border-gray-200 shadow-sm">
                              <span className="text-3xl">{candidate.symbol}</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">{candidate.name}</h4>
                              <p className="text-sm text-gray-600 font-medium">{candidate.party}</p>
                              {candidate.description && (
                                <p className="text-xs text-gray-500 mt-1 max-w-md">{candidate.description}</p>
                              )}
                              <div className="flex items-center mt-2">
                                <Badge variant="outline" className="text-xs">
                                  Candidate #{index + 1}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleEditCandidate(candidate)}
                              variant="outline"
                              size="sm"
                              disabled={candidateLoading}
                              className="h-10 w-10 p-0 text-blue-500 hover:bg-blue-50/30 hover:border-blue-200 border-blue-100 transition-all duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteCandidate(candidate.id, candidate.name)}
                              variant="outline"
                              size="sm"
                              disabled={candidateLoading}
                              className="h-10 w-10 p-0 text-red-400 hover:bg-red-50/30 hover:border-red-200 border-red-100 transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {candidates.length === 0 && !candidateLoading && (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Candidates Yet</h3>
                        <p className="text-gray-500 mb-4">Start building your election by adding candidates above.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}