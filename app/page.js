'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const [quizId, setQuizId] = useState('');
  const [error, setError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAdminLink, setShowAdminLink] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Efek animasi setelah komponen dimuat
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  // Easter egg untuk registrasi admin - muncul setelah hover di sudut kanan bawah selama 3 detik
  const handleCornerHover = () => {
    const timer = setTimeout(() => {
      setShowAdminLink(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!quizId.trim()) {
      setError('Masukkan ID kuis');
      return;
    }
    router.push(`/join/${quizId}`);
  };
  
  // Bentuk latar belakang animasi
  const renderBackgroundShapes = () => {
    return (
      <div className="absolute inset-0 overflow-hidden z-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-500 rounded-full mix-blend-lighten filter blur-xl animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-56 h-56 bg-purple-500 rounded-full mix-blend-lighten filter blur-xl animate-float" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-36 h-36 bg-blue-500 rounded-full mix-blend-lighten filter blur-xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-green-500 rounded-full mix-blend-lighten filter blur-xl animate-float" style={{ animationDelay: '1.5s' }}></div>
      </div>
    );
  };

  return (
    <main className="container relative mx-auto px-4 py-12 md:py-20 min-h-[calc(100vh-12rem)] bg-gray-800">
      {renderBackgroundShapes()}
      
      <div className={`relative z-10 max-w-lg mx-auto bg-card p-8 rounded-2xl shadow-xl backdrop-blur-sm 
                       border border-gray-700
                       transform transition-all duration-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-700 
                         rounded-full flex items-center justify-center animate-float shadow-lg">
            <span className="text-4xl">🧠</span>
            
            {/* Partikel dekoratif */}
            <div className="absolute top-0 left-1/4 w-2 h-2 bg-indigo-300 rounded-full animate-ping" style={{ animationDuration: '1.5s' }}></div>
            <div className="absolute bottom-0 right-1/4 w-2 h-2 bg-purple-300 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Selamat Datang di PrePostTEST
        </h1>
        
        <p className="text-center text-gray-400 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Masukkan ID kuis untuk bergabung atau login sebagai admin untuk membuat kuis.
        </p>
        
        <form onSubmit={handleSubmit} className="mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="mb-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <input
              type="text"
              placeholder="Masukkan ID kuis"
              value={quizId}
              onChange={(e) => {
                setQuizId(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-4 py-2 pl-10 border border-gray-700 bg-gray-800 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-900/50 text-red-400 rounded-lg animate-shake flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="w-full bg-indigo-500 text-gray-200 py-3 rounded-lg text-lg font-medium hover:bg-indigo-600 transition duration-200"
          >
            Gabung Kuis
          </button>
        </form>
        
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {!isAuthenticated ? (
            <div className="space-y-4">
              
            </div>
          ) : user?.isAdmin ? (
            <Link 
              href="/admin/panel" 
              className="inline-block px-6 py-3 bg-emerald-500 text-gray-200 rounded-lg font-medium hover:bg-emerald-600 transition duration-200"
            >
              Ke Panel Admin
            </Link>
          ) : user?.currentQuiz ? (
            <Link 
              href={`/waiting-room/${user.currentQuiz}`}
              className="inline-block px-6 py-3 bg-amber-500 text-gray-200 rounded-lg font-medium hover:bg-amber-600 transition duration-200"
            >
              Kembali ke Kuis
            </Link>
          ) : null}
        </div>
      </div>
      
      {/* Sudut tersembunyi untuk registrasi admin */}
      <div 
        className="fixed bottom-0 right-0 w-10 h-10 z-20" 
        onMouseEnter={handleCornerHover}
        onMouseLeave={() => setShowAdminLink(false)}
      >
        {/* Link registrasi admin tersembunyi */}
        {showAdminLink && (
          <Link 
            href="/register" 
            className="fixed bottom-2 right-2 w-10 h-10 opacity-0"
          />
        )}
      </div>
    </main>
  );
}