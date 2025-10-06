'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import ThreeBackground from '@/components/ThreeBackground';
import { gsap } from 'gsap';
import { User, Mail, CreditCard, Shield, Edit, Settings, Eye, Zap, Star } from 'lucide-react';

interface UserProfile {
  name: string;
  cnic: string;
  email: string;
  isAdmin: boolean;
  registrationDate?: string;
  lastLogin?: string;
  votingHistory?: number;
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/signin');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser({
      ...parsedUser,
      registrationDate: '2024-01-15',
      lastLogin: new Date().toISOString().split('T')[0],
      votingHistory: 3
    });
    setIsLoading(false);

    // Animate profile sections
    const tl = gsap.timeline();
    
    if (profileRef.current) {
      tl.fromTo(profileRef.current,
        { y: 100, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 1, ease: "back.out(1.7)" }
      );
    }

    if (statsRef.current) {
      tl.fromTo(statsRef.current.children,
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" },
        "-=0.5"
      );
    }

    if (actionsRef.current) {
      tl.fromTo(actionsRef.current.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" },
        "-=0.3"
      );
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <ThreeBackground variant="minimal" />
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blockchain-primary mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const profileStats = [
    { label: 'Elections Participated', value: user.votingHistory?.toString() || '0', icon: Eye, color: 'text-blue-400' },
    { label: 'Account Status', value: 'Active', icon: Shield, color: 'text-green-400' },
    { label: 'Member Since', value: user.registrationDate || 'Unknown', icon: CreditCard, color: 'text-purple-400' },
    { label: 'Last Login', value: user.lastLogin || 'Today', icon: User, color: 'text-orange-400' }
  ];

  return (
    <div className="min-h-screen bg-dark-primary">
      <ThreeBackground variant="minimal" />
      <Navigation />
      
      <div className="relative min-h-[calc(100vh-4rem)]">
        <div className="particle-bg absolute inset-0 opacity-20"></div>
        
        <div className="relative max-w-6xl mx-auto p-4 py-8 z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 purple-gradient rounded-full mb-6 neon-glow pulse-glow">
              <User className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text neon-text mb-4">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-400 text-lg">Manage your Vote Ledger account and voting preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <Card ref={profileRef} className="glass-card border-blockchain-primary/30 cyber-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-2xl">
                    <User className="h-6 w-6 text-blockchain-primary" />
                    <span className="gradient-text">Profile Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-400">Full Name</label>
                      <div className="p-4 bg-dark-secondary/50 rounded-lg border border-blockchain-primary/20 hover:border-blockchain-primary/40 transition-all duration-300">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-blockchain-accent" />
                          <span className="text-white text-lg">{user.name}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-400">CNIC Number</label>
                      <div className="p-4 bg-dark-secondary/50 rounded-lg border border-blockchain-primary/20 hover:border-blockchain-primary/40 transition-all duration-300">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-5 w-5 text-blockchain-accent" />
                          <span className="text-white text-lg">{user.cnic}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-400">Email Address</label>
                      <div className="p-4 bg-dark-secondary/50 rounded-lg border border-blockchain-primary/20 hover:border-blockchain-primary/40 transition-all duration-300">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-blockchain-accent" />
                          <span className="text-white text-lg">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-400">Account Type</label>
                      <div className="p-4 bg-dark-secondary/50 rounded-lg border border-blockchain-primary/20 hover:border-blockchain-primary/40 transition-all duration-300">
                        <div className="flex items-center space-x-3">
                          <Shield className={`h-5 w-5 ${user.isAdmin ? 'text-yellow-400' : 'text-green-400'}`} />
                          <span className={`font-medium text-lg ${user.isAdmin ? 'text-yellow-400' : 'text-green-400'}`}>
                            {user.isAdmin ? 'Administrator' : 'Voter'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button 
                      onClick={() => router.push('/change-password')}
                      className="group flex items-center space-x-2 purple-gradient hover:scale-105 transition-all duration-300 neon-glow"
                    >
                      <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                      <span>Change Password</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center space-x-2 border-blockchain-primary/30 text-blockchain-accent hover:bg-blockchain-primary/10 hover:border-blockchain-primary/50 transition-all duration-300"
                      disabled
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats & Quick Actions */}
            <div className="space-y-8">
              {/* Account Stats */}
              <Card className="glass-card border-blockchain-primary/30">
                <CardHeader>
                  <CardTitle className="text-xl gradient-text">Account Statistics</CardTitle>
                </CardHeader>
                <CardContent ref={statsRef} className="space-y-6">
                  {profileStats.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex items-center justify-between p-3 bg-dark-secondary/30 rounded-lg hover:bg-dark-secondary/50 transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${color}`} />
                        <span className="text-sm text-gray-400">{label}</span>
                      </div>
                      <span className="text-sm font-medium text-white">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="glass-card border-blockchain-primary/30">
                <CardHeader>
                  <CardTitle className="text-xl gradient-text">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent ref={actionsRef} className="space-y-4">
                  <Button 
                    onClick={() => router.push('/vote')}
                    className="w-full justify-start group purple-gradient hover:scale-105 transition-all duration-300 neon-glow"
                  >
                    <Zap className="h-4 w-4 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                    Cast Your Vote
                  </Button>
                  <Button 
                    onClick={() => router.push('/results')}
                    className="w-full justify-start border-blockchain-primary/30 text-blockchain-accent hover:bg-blockchain-primary/10 hover:border-blockchain-primary/50 transition-all duration-300" 
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-3" />
                    View Results
                  </Button>
                  {user.isAdmin && (
                    <Button 
                      onClick={() => router.push('/admin')}
                      className="w-full justify-start bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 hover:scale-105 transition-all duration-300 neon-glow"
                    >
                      <Shield className="h-4 w-4 mr-3" />
                      Admin Panel
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}