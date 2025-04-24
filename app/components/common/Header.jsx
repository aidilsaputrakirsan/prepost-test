'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [avatarColor, setAvatarColor] = useState('#8B5CF6');

  // Generate a random color for user avatar on mount
  useEffect(() => {
    const colors = [
      '#3B82F6', // blue
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#10B981', // emerald
      '#F59E0B', // amber
      '#6366F1', // indigo
    ];
    setAvatarColor(colors[Math.floor(Math.random() * colors.length)]);
  }, []);

  // Listen for scroll to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 bg-gradient-to-r from-indigo-900 to-purple-900 text-white shadow-md ${
      isScrolled ? 'py-2 shadow-lg' : 'py-4'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link 
            href="/" 
            className="text-2xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center"
          >
            <span className="mr-2 text-2xl animate-float">🧠</span>
            <span className="hidden sm:block relative overflow-hidden">
              <span className="block transform transition-transform duration-300 hover:translate-y-[-100%]">
                PrePostTEST
              </span>
              <span className="absolute top-0 left-0 transform translate-y-full transition-transform duration-300 hover:translate-y-0">
                PrePostTEST
              </span>
            </span>
            <span className="sm:hidden">PPT</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 bg-white/20 px-3 py-2 rounded-xl hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-inner transition-transform duration-300 transform hover:scale-110" 
                    style={{ backgroundColor: avatarColor }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden md:block font-medium">{user.name}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {isMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 py-2 bg-card rounded-xl shadow-xl z-50 animate-expand-in backdrop-blur-sm ring-1 ring-white/10"
                    onMouseLeave={() => setIsMenuOpen(false)}
                  >
                    {user.isAdmin && (
                      <Link 
                        href="/admin/panel" 
                        className="flex items-center px-4 py-2 text-gray-200 hover:bg-indigo-900/30"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center w-full text-left px-4 py-2 text-gray-200 hover:bg-red-900/30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 2.414A1 1 0 0010.707 2H4a1 1 0 00-1 1zm9 5a1 1 0 00-1-1H8a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V8z" clipRule="evenodd" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link 
                  href="/login"
                  className="px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all duration-200 backdrop-blur-sm font-medium"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}