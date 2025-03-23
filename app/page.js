// app/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const [quizId, setQuizId] = useState('');
  const [error, setError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Add animation effect after mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!quizId.trim()) {
      setError('Please enter a quiz ID');
      return;
    }
    router.push(`/join/${quizId}`);
  };

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className={`max-w-lg mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg transform transition-all duration-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center animate-pulse-subtle">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">Welcome to PrePostTEST</h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
          Enter a quiz ID to join a quiz or login as an admin to create quizzes.
        </p>
        
        <form onSubmit={handleSubmit} className="mb-6 animate-fade-in-down" style={{ animationDelay: '0.2s' }}>
          <div className="mb-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Enter quiz ID"
              value={quizId}
              onChange={(e) => {
                setQuizId(e.target.value);
                if (error) setError('');
              }}
              className="w-full pl-10 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition-colors duration-200"
            />
          </div>
          {error && (
            <div className="text-red-500 dark:text-red-400 mb-4 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg animate-shake">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}
          <button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition duration-200 transform hover:translate-y-[-2px] hover:shadow-md"
          >
            Join Quiz
          </button>
        </form>
        
        <div className="text-center animate-fade-in-down" style={{ animationDelay: '0.4s' }}>
          {!isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Admin?{' '}
                <Link href="/login" className="text-blue-500 dark:text-blue-400 hover:underline font-medium">
                  Login here
                </Link>
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <Link href="/register" className="text-blue-500 dark:text-blue-400 hover:underline font-medium">
                  Register a new admin account
                </Link>
              </p>
            </div>
          ) : user?.isAdmin ? (
            <Link 
              href="/admin/panel" 
              className="inline-block bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200 transform hover:translate-y-[-2px] hover:shadow-md"
            >
              Go to Admin Panel
            </Link>
          ) : user?.currentQuiz ? (
            <Link 
              href={`/waiting-room/${user.currentQuiz}`}
              className="inline-block bg-yellow-500 dark:bg-yellow-600 hover:bg-yellow-600 dark:hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200 transform hover:translate-y-[-2px] hover:shadow-md"
            >
              Return to Quiz
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}