'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
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
  Loader2
} from 'lucide-react';
import { AdminCandidatesService, AdminCandidate, AdminCreateCandidateRequest } from '@/services';
import { useToast } from '@/hooks/use-toast';

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
      const response = await AdminCandidatesService.createCandidate(newCandidate);
      
      if (response.success && response.candidate) {
        setCandidates(prev => [response.candidate!, ...prev]);
        setNewCandidate({ name: '', party: '', symbol: '', description: '' });
        toast({
          title: 'Success!',
          description: 'Candidate created successfully',
          className: 'bg-green-500/10 border-green-500/50',
        });
      } else {
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
        description: 'Failed to create candidate',
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="relative min-h-[calc(100vh-4rem)]">
        {/* Background Pattern */}
        <div className="absolute inset-0 blockchain-bg opacity-5"></div>
        <div className="absolute inset-0 node-pattern opacity-30"></div>
        
        <div className="relative max-w-7xl mx-auto p-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blockchain-gradient rounded-full mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Manage elections, candidates, and system settings</p>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg max-w-md mx-auto">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'election', label: 'Election', icon: Play },
                { id: 'candidates', label: 'Candidates', icon: Users }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
                    activeTab === id
                      ? 'bg-white text-blockchain-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
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
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="shadow-lg border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Registered Voters</p>
                        <p className="text-2xl font-bold text-gray-900">{electionStats.totalVoters.toLocaleString()}</p>
                      </div>
                      <Users className="h-8 w-8 text-blockchain-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-lg border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Votes</p>
                        <p className="text-2xl font-bold text-gray-900">{electionStats.totalVotes.toLocaleString()}</p>
                      </div>
                      <Eye className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-lg border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Turnout Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{electionStats.turnoutPercentage}%</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-lg border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Election Status</p>
                        <p className={`text-2xl font-bold ${
                          electionStats.status === 'active' ? 'text-green-600' :
                          electionStats.status === 'closed' ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {electionStats.status === 'active' ? 'Active' :
                           electionStats.status === 'closed' ? 'Closed' : 'Inactive'}
                        </p>
                      </div>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        electionStats.status === 'active' ? 'bg-green-100' :
                        electionStats.status === 'closed' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {electionStats.status === 'active' ? 
                          <CheckCircle className="h-5 w-5 text-green-500" /> :
                          <Clock className="h-5 w-5 text-gray-500" />
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
            <div className="space-y-6">
              {/* Add New Candidate */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserPlus className="h-5 w-5" />
                    <span>Add New Candidate</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                      placeholder="Candidate Name"
                      value={newCandidate.name}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, name: e.target.value }))}
                      disabled={candidateLoading}
                    />
                    <Input
                      placeholder="Party Name"
                      value={newCandidate.party}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, party: e.target.value }))}
                      disabled={candidateLoading}
                    />
                    <Input
                      placeholder="Symbol (emoji)"
                      value={newCandidate.symbol}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, symbol: e.target.value }))}
                      disabled={candidateLoading}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newCandidate.description}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, description: e.target.value }))}
                      disabled={candidateLoading}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={editingCandidate ? handleUpdateCandidate : handleAddCandidate}
                      disabled={candidateLoading}
                      className="flex items-center space-x-2"
                    >
                      {candidateLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      <span>{editingCandidate ? 'Update Candidate' : 'Add Candidate'}</span>
                    </Button>
                    
                    {editingCandidate && (
                      <Button 
                        onClick={cancelEdit}
                        variant="outline"
                        disabled={candidateLoading}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Candidates List */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Registered Candidates ({candidates.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {candidateLoading && candidates.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading candidates...</span>
                      </div>
                    ) : (
                      candidates.map((candidate) => (
                        <div key={candidate.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <span className="text-2xl">{candidate.symbol}</span>
                            <div>
                              <h4 className="font-semibold text-gray-900">{candidate.name}</h4>
                              <p className="text-sm text-gray-600">{candidate.party}</p>
                              {candidate.description && (
                                <p className="text-xs text-gray-500 mt-1">{candidate.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleEditCandidate(candidate)}
                              variant="outline"
                              size="sm"
                              disabled={candidateLoading}
                              className="text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteCandidate(candidate.id, candidate.name)}
                              variant="outline"
                              size="sm"
                              disabled={candidateLoading}
                              className="text-red-600 hover:bg-red-50 hover:border-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {candidates.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No candidates registered yet. Add candidates above to get started.
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