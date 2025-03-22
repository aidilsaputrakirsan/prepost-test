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

  // Set error from context
  useEffect(() => {
    if (quizError) {
      setError(quizError);
    }
  }, [quizError]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push(`/join/${quizId}`);
      return;
    }
  }, [user, router, quizId]);

  if (loading) {
    return <Loading message="Loading leaderboard..." />;
  }

  // Safety check for undefined or missing data
  const hasValidData = leaderboard && Array.isArray(leaderboard) && leaderboard.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Leaderboard</h2>
        
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
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Rank</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Score</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Correct</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.user && user && entry.user.toString() === user.id.toString() || 
                                        entry.userId && user && entry.userId.toString() === user.id.toString();
                  
                  return (
                    <tr 
                      key={index}
                      className={`${
                        isCurrentUser ? 'bg-blue-50 font-medium' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-gray-100 transition-colors duration-150`}
                    >
                      <td className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center">
                          {index < 3 ? (
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 text-white ${
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
                      <td className="px-4 py-3 border-b border-gray-100">
                        {entry.name}
                        {isCurrentUser && <span className="text-blue-500 ml-2">(You)</span>}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-center font-medium">
                        {entry.score}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-center">
                        {entry.correctAnswers} / {entry.totalQuestions}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-center">
                        {entry.averageResponseTime ? (entry.averageResponseTime / 1000).toFixed(2) + 's' : '-'}
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