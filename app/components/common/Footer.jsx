'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [showRegisterLink, setShowRegisterLink] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const currentYear = new Date().getFullYear();

  // Tampilkan tautan registrasi admin tersembunyi setelah 5 klik pada teks hak cipta
  const handleCopyrightClick = () => {
    setClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setShowRegisterLink(true);
      }
      return newCount;
    });
  };

  return (
    <footer className="bg-gray-800 text-gray-200 py-8 mt-auto relative overflow-hidden">
      {/* Pola latar belakang animasi */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div className="absolute -inset-4 grid grid-cols-12 gap-4 transform -rotate-12">
          {Array.from({ length: 24 }).map((_, i) => (
            <div 
              key={i} 
              className="h-24 bg-indigo-400 rounded-full blur-xl animate-pulse-subtle"
              style={{ 
                animationDelay: `${i * 120}ms`,
                opacity: Math.random() * 0.7 + 0.3
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="text-xl font-bold text-gray-200 hover:text-indigo-400 transition-colors duration-200 flex items-center">
              <span className="mr-2 animate-float">🧠</span>
              PrePostTEST
            </Link>
            <p className="text-gray-400 mt-2 text-sm">Platform untuk pengalaman kuis interaktif</p>
          </div>
          
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-gray-200 transition-all duration-200 transform hover:scale-110">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-200 transition-all duration-200 transform hover:scale-110">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.059 10.059 0 01-3.114 1.191 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-200 transition-all duration-200 transform hover:scale-110">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p 
            className="cursor-pointer text-gray-400 hover:text-gray-200 transition-colors duration-200"
            onClick={handleCopyrightClick}
          >
            © {currentYear} PrePostTEST. Dibuat oleh ITK
          </p>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-4 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-200 transition-colors duration-200">Kebijakan Privasi</a>
            <a href="#" className="hover:text-gray-200 transition-colors duration-200">Syarat Layanan</a>
            <a href="#" className="hover:text-gray-200 transition-colors duration-200">Kontak</a>

            {/* Tautan registrasi admin tersembunyi */}
            {showRegisterLink && (
              <Link 
                href="/register" 
                className="text-xs text-gray-500 hover:text-gray-400 transition-colors duration-200 absolute bottom-2 right-2"
                >
                Registrasi Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}