'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useQuiz } from '@/app/context/QuizContext';
import Loading from '@/app/components/common/Loading';

export default function QuizResults({ params }) {
  const { quizId } = params;
  const { user } = useAuth();
  const { quizStatus, leaderboard, loading, error: quizError } = useQuiz();
  
  const router = useRouter();
  const [userRank, setUserRank] = useState(null);
  const [userEntry, setUserEntry] = useState(null);
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

    // Redirect based on quiz status
    if (quizStatus === 'waiting') {
      router.push(`/waiting-room/${quizId}`);
      return;
    } else if (quizStatus === 'active') {
      router.push(`/quiz/${quizId}`);
      return;
    }
  }, [user, quizStatus, router, quizId]);

  // Process leaderboard data to find user's entry and rank
  useEffect(() => {
    if (leaderboard && leaderboard.length > 0 && user) {
      // Find user's entry and rank
      const userEntryIndex = leaderboard.findIndex(entry => {
        // Check by user ID in different possible formats
        return (
          (entry.user && entry.user.toString() === user.id.toString()) ||
          (entry.userId && entry.userId.toString() === user.id.toString())
        );
      });
      
      if (userEntryIndex !== -1) {
        setUserEntry(leaderboard[userEntryIndex]);
        setUserRank(userEntryIndex + 1);
      }
    }
  }, [leaderboard, user]);

  if (loading) {
    return <Loading message="Loading quiz results..." />;
  }

  // Determine what to display for score and correct answers
  const displayScore = userEntry ? userEntry.score : user?.score || 0;
  
  // For correct answers, use the data from leaderboard or estimate from score
  let correctAnswers = 0;
  let totalQuestions = 0;
  
  if (userEntry) {
    // Use the values from the leaderboard entry
    correctAnswers = userEntry.correctAnswers || 0;
    totalQuestions = userEntry.totalQuestions || 0;
  } else if (leaderboard && leaderboard.length > 0) {
    // If we have leaderboard data but no user entry, use the total questions from another entry
    totalQuestions = leaderboard[0].totalQuestions || 0;
    
    // Estimate correct answers based on score
    if (displayScore > 0) {
      // Basic formula: score is approximately 100 per correct answer + speed bonus
      correctAnswers = Math.round(displayScore / 150);
    }
  }
  
  // Force reasonable values if we have incongruent data
  if (displayScore > 200 && correctAnswers === 0) {
    correctAnswers = Math.max(1, Math.floor(displayScore / 150));
  }
  
  if (totalQuestions === 0 && correctAnswers > 0) {
    totalQuestions = Math.max(correctAnswers, 1);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold mb-6">Quiz Results</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        
        <div className="bg-gray-50 p-6 rounded-lg mb-8 shadow-sm">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg text-gray-700 mb-2">Participant</h3>
            <p className="text-xl font-bold">{user?.name}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h4 className="text-sm text-gray-500 mb-1">Total Score</h4>
              <p className="text-2xl font-bold text-blue-600">{displayScore}</p>
            </div>
            
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h4 className="text-sm text-gray-500 mb-1">Correct Answers</h4>
              <p className="text-xl">
                <span className="font-bold text-green-600">{correctAnswers}</span>
                <span className="text-gray-500"> / {totalQuestions}</span>
              </p>
            </div>
            
            {userRank && (
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h4 className="text-sm text-gray-500 mb-1">Rank</h4>
                <p className="text-2xl font-bold text-amber-500">#{userRank}</p>
              </div>
            )}
            
            {userEntry && userEntry.averageResponseTime > 0 && (
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h4 className="text-sm text-gray-500 mb-1">Avg. Response Time</h4>
                <p className="text-xl font-medium">{(userEntry.averageResponseTime / 1000).toFixed(2)}s</p>
              </div>
            )}
          </div>
          
          {userRank && leaderboard && leaderboard.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p>
                You placed <strong>#{userRank}</strong> out of {leaderboard.length} participants
              </p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href={`/leaderboard/${quizId}`}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition duration-200"
          >
            View Leaderboard
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition duration-200"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}