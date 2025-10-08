'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { gsap } from 'gsap';
import Logo from "@/public/PHOTO-2025-06-29-19-01-14-removebg-preview.png"
import Image from 'next/image';


import {
  Vote,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Shield,
  Home,
  Eye,
  UserPlus,
  LogIn
} from 'lucide-react';

interface User {
  name: string;
  cnic: string;
  isAdmin: boolean;
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for user session
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Animate navigation on load
    if (navRef.current) {
      gsap.fromTo(navRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
      );
    }

    // Animate logo
    if (logoRef.current) {
      gsap.fromTo(logoRef.current,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 1, ease: "back.out(1.7)", delay: 0.3 }
      );
    }
  }, []);

  const handleSignOut = async () => {
    try {
      // Import AuthService dynamically to avoid SSR issues
      const { AuthService } = await import('@/lib/auth');
      await AuthService.signOut();
      
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = '/signin';
    } catch (error) {
      console.error('Sign out error:', error);
      // Fallback to localStorage cleanup
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = '/signin';
    }
  };

  const navigationItems = [
    { href: '/', label: 'Home', icon: Home },
    ...(user ? [
      { href: '/profile', label: 'Profile', icon: User },
      { href: '/vote', label: 'Cast Vote', icon: Vote },
      { href: '/results', label: 'Results', icon: Eye },
      { href: '/change-password', label: 'Settings', icon: Settings },
      ...(user.isAdmin ? [
        { href: '/admin', label: 'Admin Panel', icon: Shield }
      ] : [])
    ] : [
      { href: '/signin', label: 'Sign In', icon: LogIn },
      { href: '/signup', label: 'Sign Up', icon: UserPlus }
    ])
  ];

  return (
    <nav ref={navRef} className="sticky top-0 z-50 glass-card border-b border-blockchain-primary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div ref={logoRef} className="">
                <Image
                  src={Logo}
                  alt="Vote Ledger Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              </div>
              <span className="text-xl font-bold gradient-text neon-text">Vote Ledger</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`group flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${pathname === href
                  ? 'text-blockchain-accent bg-blockchain-primary/20 neon-glow'
                  : 'text-gray-300 hover:text-blockchain-accent hover:bg-blockchain-primary/10'
                  }`}
              >
                <Icon className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                <span>{label}</span>
              </Link>
            ))}

            {user && (
              <div className="flex items-center space-x-4 pl-4 border-l border-blockchain-primary/30">
                <span className="text-sm text-gray-300">
                  Welcome, <span className="font-medium text-blockchain-accent">{user.name}</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-blockchain-accent hover:bg-blockchain-primary/20"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden animate-slide-up">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 glass-card border-t border-blockchain-primary/30">
            {navigationItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-300 ${pathname === href
                  ? 'text-blockchain-accent bg-blockchain-primary/20 neon-glow'
                  : 'text-gray-300 hover:text-blockchain-accent hover:bg-blockchain-primary/10'
                  }`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            ))}

            {user && (
              <div className="pt-4 border-t border-blockchain-primary/30">
                <div className="px-3 py-2">
                  <p className="text-sm text-gray-300">
                    Welcome, <span className="font-medium text-blockchain-accent">{user.name}</span>
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 w-full px-3 py-3 text-left text-base font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}