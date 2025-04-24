'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useQuiz } from '@/app/context/QuizContext';
import Loading from '@/app/components/common/Loading';

export default function Leaderboard() {
  // Use useParams hook to access route parameters client-side
  const params = useParams();
  const quizId = params.quizId;
  
  const { user } = useAuth();
  const { leaderboard, loading, error: quizError } = useQuiz();
  
  const router = useRouter();
  const [error, setError] = useState('');
  const [localUser, setLocalUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Set error from context
  useEffect(() => {
    if (quizError) {
      setError(quizError);
    }
  }, [quizError]);

  // Load the user from localStorage if not available from context
  useEffect(() => {
    const checkLocalStorage = () => {
      try {
        // Check if we have the localStorage data for this quiz
        const storedUser = localStorage.getItem('quiz_user');
        const storedQuizId = localStorage.getItem('quiz_id');
        
        console.log("Checking localStorage for user data");
        
        if (storedUser && storedQuizId === quizId) {
          const userData = JSON.parse(storedUser);
          console.log("Found user in localStorage:", userData.name);
          setLocalUser(userData);
          
          // If user has no currentQuiz set, update it
          if (!userData.currentQuiz) {
            userData.currentQuiz = quizId;
            localStorage.setItem('quiz_user', JSON.stringify(userData));
          }
          
          // Make sure we have the quiz status set correctly
          localStorage.setItem('quiz_status', 'finished');
          
          // Apply auth headers for future requests
          if (typeof window !== 'undefined') {
            const originalFetch = window.fetch;
            window.fetch = function(url, options = {}) {
              options = options || {};
              let headers = {};
              
              if (options.headers) {
                if (options.headers instanceof Headers) {
                  for (const [key, value] of options.headers.entries()) {
                    headers[key] = value;
                  }
                } else {
                  headers = { ...options.headers };
                }
              }
              
              headers['x-participant-id'] = userData.id;
              headers['x-quiz-id'] = quizId;
              headers['x-has-local-storage'] = 'true';
              
              options.headers = headers;
              return originalFetch(url, options);
            };
          }
          
          return true;
        }
        
        return false;
      } catch (e) {
        console.error("Error checking localStorage:", e);
        return false;
      }
    };
    
    // Check for user in session or localStorage
    if (!user) {
      const hasLocalUser = checkLocalStorage();
      
      if (!hasLocalUser) {
        console.log("No user found in context or localStorage, redirecting to join");
        router.push(`/join/${quizId}`);
      }
    }
    
    setIsCheckingAuth(false);
  }, [user, router, quizId]);

  if (isCheckingAuth || loading) {
    return <Loading message="Loading leaderboard..." />;
  }

  // Use the user from either Auth context or localStorage
  const effectiveUser = user || localUser;
  
  if (!effectiveUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-6">Authentication Required</h2>
          <p className="mb-6">You need to join the quiz to view the leaderboard.</p>
          <Link
            href={`/join/${quizId}`}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition duration-200"
          >
            Join Quiz
          </Link>
        </div>
      </div>
    );
  }

  // Safety check for undefined or missing data
  const hasValidData = leaderboard && Array.isArray(leaderboard) && leaderboard.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-card p-6 rounded-2xl shadow-md border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Papan Peringkat</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        
        {!hasValidData && !error && (
          <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg text-center">
            <p>No leaderboard data available to display.</p>
          </div>
        )}
        
        {hasValidData && (
        <div className="overflow-x-auto mb-8 bg-gray-800 rounded-xl border border-gray-700">
          <table className="w-full border-collapse">
            <thead className="bg-gray-750">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-300">Peringkat</th>
                <th className="px-4 py-3 text-left font-medium text-gray-300">Nama</th>
                <th className="px-4 py-3 text-center font-medium text-gray-300">Skor</th>
                <th className="px-4 py-3 text-center font-medium text-gray-300">Benar</th>
                <th className="px-4 py-3 text-center font-medium text-gray-300">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => {
                const isCurrentUser = effectiveUser && 
                  ((entry.user && entry.user.toString() === effectiveUser.id.toString()) ||
                  (entry.userId && entry.userId.toString() === effectiveUser.id.toString()));
                
                return (
                  <tr 
                    key={index}
                    className={`${
                      isCurrentUser ? 'bg-indigo-900/30 font-medium' : index % 2 === 0 ? 'bg-card' : 'bg-gray-750'
                    } hover:bg-gray-700 transition-colors duration-150 border-b border-gray-700`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 text-gray-900 ${
                            index === 0 ? 'bg-yellow-400' : 
                            index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                          }`}>
                            {index + 1}
                          </span>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {entry.name}
                      {isCurrentUser && <span className="text-indigo-400 ml-2">(Anda)</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">
                      {entry.score}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.correctAnswers} / {entry.totalQuestions}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.averageResponseTime ? (entry.averageResponseTime / 1000).toFixed(2) + 'd' : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href={`/results/${quizId}`}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition duration-200 text-center"
          >
            Your Results
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition duration-200 text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}