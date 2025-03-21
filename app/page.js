// app/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const [quizId, setQuizId] = useState('');
  const [error, setError] = useState('');
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!quizId.trim()) {
      setError('Please enter a quiz ID');
      return;
    }
    router.push(`/join/${quizId}`);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6">Welcome to PrePostTEST</h1>
        <p className="text-center text-gray-600 mb-8">
          Enter a quiz ID to join a quiz or login as an admin to create quizzes.
        </p>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Enter quiz ID"
              value={quizId}
              onChange={(e) => setQuizId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-200"
          >
            Join Quiz
          </button>
        </form>
        
        <div className="text-center">
          {!isAuthenticated ? (
            <>
              <p className="mb-2">
                Admin?{' '}
                <Link href="/login" className="text-blue-500 hover:underline">
                  Login here
                </Link>
              </p>
              <p>
                <Link href="/register" className="text-blue-500 hover:underline">
                  Register a new admin account
                </Link>
              </p>
            </>
          ) : user?.isAdmin ? (
            <Link 
              href="/admin/panel" 
              className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-200"
            >
              Go to Admin Panel
            </Link>
          ) : user?.currentQuiz ? (
            <Link 
              href={`/waiting-room/${user.currentQuiz}`}
              className="inline-block bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition duration-200"
            >
              Return to Quiz
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}