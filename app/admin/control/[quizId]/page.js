// app/(admin)/control/[quizId]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useQuiz } from '@/app/context/QuizContext';
import Loading from '@/app/components/common/Loading';

export default function QuizControl() {
  // Use useParams hook to access route parameters client-side
  const params = useParams();
  const quizId = params.quizId;
  
  const { user } = useAuth();
  const router = useRouter();
  
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizStatus, setQuizStatus] = useState('waiting');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Validate admin access
  useEffect(() => {
    if (!user || !user.isAdmin) {
      router.push('/login');
      return;
    }
    
    fetchQuizData();
  }, [user, router, quizId, fetchQuizData]);
  
  // Fetch quiz data
  const fetchQuizData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch quiz info
      const quizResponse = await fetch(`/api/quiz/${quizId}`);
      const quizData = await quizResponse.json();
      
      if (!quizData.success) {
        setError(quizData.message || 'Failed to load quiz');
        return;
      }
      
      setQuiz(quizData.data);
      setQuizStatus(quizData.data.status);
      setCurrentQuestionIndex(quizData.data.currentQuestionIndex || 0);
      
      // Fetch questions
      const questionsResponse = await fetch(`/api/quiz/${quizId}/questions`);
      const questionsData = await questionsResponse.json();
      
      if (questionsData.success) {
        setQuestions(questionsData.data || []);
      }
      
      // Fetch participants
      const participantsResponse = await fetch(`/api/user/quiz/${quizId}`);
      const participantsData = await participantsResponse.json();
      
      if (participantsData.success) {
        setParticipants(participantsData.data || []);
      }
    } catch (err) {
      console.error('Error fetching quiz data:', err);
      setError('Failed to load quiz data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [quizId]);
  
  // Start quiz
  const handleStartQuiz = async () => {
    try {
      setActionLoading(true);
      setError('');
      
      // Check if we have questions
      if (questions.length === 0) {
        setError('Cannot start quiz without questions. Please add questions first.');
        return;
      }
      
      // Check if we have participants
      if (participants.length === 0) {
        setError('Cannot start quiz without participants. Please wait for participants to join.');
        return;
      }
      
      const response = await fetch(`/api/quiz/${quizId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setQuizStatus('active');
        setSuccess('Quiz started successfully!');
        
        // Refresh quiz data
        fetchQuizData();
      } else {
        setError(data.message || 'Failed to start quiz');
      }
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError('Failed to start quiz. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Move to next question
  const handleNextQuestion = async () => {
    try {
      setActionLoading(true);
      setError('');
      
      const response = await fetch(`/api/quiz/${quizId}/next-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setCurrentQuestionIndex(data.data.currentQuestionIndex);
        
        if (data.data.status === 'finished') {
          setQuizStatus('finished');
          setSuccess('Quiz completed successfully!');
        } else {
          setSuccess('Moved to next question successfully!');
        }
        
        // Refresh quiz data
        fetchQuizData();
      } else {
        setError(data.message || 'Failed to move to next question');
      }
    } catch (err) {
      console.error('Error moving to next question:', err);
      setError('Failed to move to next question. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Stop quiz
  const handleStopQuiz = async () => {
    if (!confirm('Are you sure you want to stop the quiz? This will end the quiz for all participants.')) {
      return;
    }
    
    try {
      setActionLoading(true);
      setError('');
      
      const response = await fetch(`/api/quiz/${quizId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setQuizStatus('finished');
        setSuccess('Quiz stopped successfully!');
        
        // Refresh quiz data
        fetchQuizData();
      } else {
        setError(data.message || 'Failed to stop quiz');
      }
    } catch (err) {
      console.error('Error stopping quiz:', err);
      setError('Failed to stop quiz. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Remove participant
  const handleRemoveParticipant = async (userId) => {
    try {
      const response = await fetch(`/api/quiz/${quizId}/participants/${userId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update participants list
        setParticipants(participants.filter(p => p._id !== userId));
        setSuccess('Participant removed successfully!');
      } else {
        setError(data.message || 'Failed to remove participant');
      }
    } catch (err) {
      console.error('Error removing participant:', err);
      setError('Failed to remove participant. Please try again.');
    }
  };
  
  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success, error]);
  
  if (loading) {
    return <Loading message="Loading quiz control panel..." />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Quiz Control: {quizId}</h2>
          <Link href="/admin/panel" className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-200">
            Back to Panel
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
            <p>{success}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Quiz Status</h3>
            <div className="flex items-center mb-2">
              <span className="mr-2">Current Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                quizStatus === 'waiting' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : quizStatus === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {quizStatus === 'waiting'
                  ? 'Waiting'
                  : quizStatus === 'active'
                  ? 'Active'
                  : 'Finished'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {quizStatus === 'waiting' 
                ? 'Waiting for you to start the quiz.' 
                : quizStatus === 'active' 
                ? `Currently on question ${currentQuestionIndex + 1} of ${questions.length}.` 
                : 'The quiz has ended.'}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {quizStatus === 'waiting' && (
                <button
                  onClick={handleStartQuiz}
                  disabled={actionLoading || questions.length === 0}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-200 disabled:opacity-50"
                >
                  {actionLoading ? 'Starting...' : 'Start Quiz'}
                </button>
              )}
              
              {quizStatus === 'active' && (
                <>
                  <button
                    onClick={handleNextQuestion}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 disabled:opacity-50"
                  >
                    {actionLoading ? 'Loading...' : 'Next Question'}
                  </button>
                  
                  <button
                    onClick={handleStopQuiz}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200 disabled:opacity-50"
                  >
                    {actionLoading ? 'Stopping...' : 'Stop Quiz'}
                  </button>
                </>
              )}
              
              {quizStatus === 'finished' && (
                <Link
                  href={`/admin/leaderboard/${quizId}`}
                  className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition duration-200"
                >
                  View Results
                </Link>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Participants ({participants.length})</h3>
            {participants.length === 0 ? (
              <p className="text-sm text-gray-600">
                No participants have joined yet. Share the Quiz ID with participants.
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                  {participants.map((participant) => (
                    <li key={participant._id} className="py-2 flex justify-between items-center">
                      <span>{participant.name}</span>
                      <button
                        onClick={() => handleRemoveParticipant(participant._id)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove participant"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Questions ({questions.length})</h3>
            {questions.length === 0 ? (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  No questions added yet. Add questions before starting the quiz.
                </p>
                <Link
                  href={`/admin/create-question/${quizId}`}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
                >
                  Add Questions
                </Link>
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                  {questions.map((question, index) => (
                    <li 
                      key={question._id} 
                      className={`py-2 ${
                        index === currentQuestionIndex && quizStatus === 'active'
                          ? 'font-medium text-blue-600'
                          : ''
                      }`}
                    >
                      <span className="mr-2">{index + 1}.</span>
                      <span>{question.text.length > 30 ? question.text.substring(0, 30) + '...' : question.text}</span>
                      
                      {index === currentQuestionIndex && quizStatus === 'active' && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Current
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3">Share Quiz</h3>
          <p className="mb-3">
            Share this link with participants to join the quiz:
          </p>
          <div className="flex">
            <input
              type="text"
              value={`${window.location.origin}/join/${quizId}`}
              readOnly
              className="flex-grow px-4 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/join/${quizId}`);
                setSuccess('Link copied to clipboard!');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 transition duration-200"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Quiz ID: <span className="font-mono bg-gray-200 px-1 py-0.5 rounded">{quizId}</span>
          </p>
        </div>
        
        {quizStatus === 'active' && currentQuestionIndex < questions.length && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
            <h3 className="text-lg font-semibold mb-3">Current Question</h3>
            <div className="mb-3">
              <p className="font-medium mb-2">{questions[currentQuestionIndex].text}</p>
              <ul className="space-y-2">
                {questions[currentQuestionIndex].options.map((option, index) => (
                  <li key={index} className={`p-2 border rounded ${
                    index === questions[currentQuestionIndex].correctOption
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300'
                  }`}>
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2 text-sm">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span>{option}</span>
                      {index === questions[currentQuestionIndex].correctOption && (
                        <span className="ml-auto text-green-600 text-sm">Correct Answer</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end">
              <p className="text-sm text-gray-600">
                Time Limit: {questions[currentQuestionIndex].timeLimit} seconds
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}