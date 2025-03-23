'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useQuiz } from '@/app/context/QuizContext';
import Loading from '@/app/components/common/Loading';
import QuestionHistory from '@/app/components/quiz/QuestionHistory';

export default function QuizResults() {
  // Use useParams hook to access route parameters client-side
  const params = useParams();
  const quizId = params.quizId;
  
  const { user } = useAuth();
  const { quizStatus, leaderboard, loading, error: quizError } = useQuiz();
  
  const router = useRouter();
  const [userRank, setUserRank] = useState(null);
  const [userEntry, setUserEntry] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [error, setError] = useState('');
  const [answersLoading, setAnswersLoading] = useState(false);
  const [showAnswerHistory, setShowAnswerHistory] = useState(false);
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

  // Redirect based on quiz status for authenticated sessions
  useEffect(() => {
    // Always prioritize the 'finished' status from localStorage to prevent loops
    const storedStatus = localStorage.getItem('quiz_status');
    console.log("Results page - Stored quiz status:", storedStatus);
    
    // If localStorage says we're finished, don't redirect away from results
    if (storedStatus === 'finished') {
      console.log("Quiz marked as finished in localStorage, staying on results page");
      return;
    }
    
    // Only redirect if we have definitive information that we're not finished
    if (user && quizStatus && quizStatus !== 'finished' && quizStatus !== null) {
      console.log(`Quiz status from context: ${quizStatus}, redirecting accordingly`);
      if (quizStatus === 'waiting') {
        router.push(`/waiting-room/${quizId}`);
      } else if (quizStatus === 'active') {
        router.push(`/quiz/${quizId}`);
      }
    }
  }, [user, quizStatus, router, quizId]);

  // Process leaderboard data to find user's entry and rank
  useEffect(() => {
    if (leaderboard && leaderboard.length > 0) {
      const effectiveUser = user || localUser;
      
      if (effectiveUser) {
        // Find user's entry and rank
        const userEntryIndex = leaderboard.findIndex(entry => {
          // Check by user ID in different possible formats
          return (
            (entry.user && entry.user.toString() === effectiveUser.id.toString()) ||
            (entry.userId && entry.userId.toString() === effectiveUser.id.toString())
          );
        });
        
        if (userEntryIndex !== -1) {
          setUserEntry(leaderboard[userEntryIndex]);
          setUserRank(userEntryIndex + 1);
        }
      }
    }
  }, [leaderboard, user, localUser]);
  
  // Fetch user's answers for this quiz
  useEffect(() => {
    const fetchUserAnswers = async () => {
      const effectiveUser = user || localUser;
      
      if (!effectiveUser || !quizId) return;
      
      try {
        setAnswersLoading(true);
        
        console.log("Fetching user answers with ID:", effectiveUser.id);
        
        const response = await fetch(`/api/quiz/${quizId}/user-answers`, {
          headers: {
            'x-participant-id': effectiveUser.id,
            'x-quiz-id': quizId,
            'x-has-local-storage': 'true'
          }
        });
        
        if (!response.ok) {
          console.error("Failed to fetch user answers:", response.status);
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          console.log("User answers fetched:", data.data.length);
          setUserAnswers(data.data || []);
        } else {
          console.error("Error fetching answers:", data.message);
        }
      } catch (error) {
        console.error("Error fetching user answers:", error);
      } finally {
        setAnswersLoading(false);
      }
    };
    
    if (!isCheckingAuth) {
      fetchUserAnswers();
    }
  }, [user, localUser, quizId, isCheckingAuth]);

  if (isCheckingAuth || loading || answersLoading) {
    return <Loading message="Loading quiz results..." />;
  }

  // Use the user from either Auth context or localStorage
  const effectiveUser = user || localUser;
  
  if (!effectiveUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-6">Authentication Required</h2>
          <p className="mb-6">You need to join the quiz to view results.</p>
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

  // Determine what to display for score and correct answers
  const displayScore = userEntry ? userEntry.score : effectiveUser?.score || 0;
  
  // For correct answers, use the data from leaderboard or estimate from score or userAnswers
  let correctAnswers = 0;
  let totalQuestions = 0;
  
  if (userEntry) {
    // Use the values from the leaderboard entry
    correctAnswers = userEntry.correctAnswers || 0;
    totalQuestions = userEntry.totalQuestions || 0;
  } else if (userAnswers.length > 0) {
    // If we have answers data, use that
    totalQuestions = userAnswers.length;
    correctAnswers = userAnswers.filter(a => a.isCorrect).length;
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

  console.log("Rendering results with user:", effectiveUser.name, "score:", displayScore);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Quiz Results</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        
        <div className="bg-gray-50 p-6 rounded-lg mb-8 shadow-sm">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg text-gray-700 mb-2">Participant</h3>
            <p className="text-xl font-bold">{effectiveUser.name}</p>
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
            <div className="p-4 bg-blue-50 rounded-lg mb-4">
              <p>
                You placed <strong>#{userRank}</strong> out of {leaderboard.length} participants
              </p>
            </div>
          )}
          
          <div className="text-center">
            <button
              onClick={() => setShowAnswerHistory(!showAnswerHistory)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
            >
              {showAnswerHistory ? "Hide Answer History" : "Show Answer History"}
            </button>
          </div>
        </div>
        
        {showAnswerHistory && (
          <div className="mb-8 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-center">Your Answer History</h3>
            
            {userAnswers.length === 0 ? (
              <p className="text-center text-gray-500 italic">No answer history available</p>
            ) : (
              <div className="space-y-4">
                {userAnswers.map((answer, index) => (
                  <QuestionHistory key={answer.answerId || index} answer={answer} />
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href={`/leaderboard/${quizId}`}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition duration-200 text-center"
          >
            View Leaderboard
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