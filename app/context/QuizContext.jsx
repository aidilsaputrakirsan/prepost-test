// app/context/QuizContext.jsx
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import usePusher from '@/app/hooks/usePusher';
import { eventNames } from '@/app/lib/pusher';

const QuizContext = createContext({});

export const useQuiz = () => useContext(QuizContext);

export const QuizProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStatus, setQuizStatus] = useState('waiting'); // waiting, active, finished
  const [leaderboard, setLeaderboard] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Set up Pusher when user joins a quiz
  const quizId = user?.currentQuiz || null;
  const { connected, useEvent, useAdminEvent } = usePusher(quizId);
  
  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // Fetch quiz data when user joins
  useEffect(() => {
    if (quizId && user) {
      fetchQuizData(quizId);
    } else {
      // Reset state when user leaves quiz
      setCurrentQuiz(null);
      setCurrentQuestion(null);
      setTimeLeft(0);
      setQuizStatus('waiting');
      setLeaderboard([]);
      setAnswer(null);
      setAnswerResult(null);
      setParticipants([]);
    }
  }, [quizId, user]);
  
  // Fetch quiz data
  const fetchQuizData = async (quizId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quiz/${quizId}`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentQuiz(data.data);
        setQuizStatus(data.data.status);
        
        // If quiz is active, fetch current question
        if (data.data.status === 'active') {
          fetchCurrentQuestion(quizId);
        } else if (data.data.status === 'finished') {
          fetchLeaderboard(quizId);
        }
        
        // Fetch participants
        fetchParticipants(quizId);
      } else {
        setError(data.message || 'Failed to fetch quiz data');
      }
    } catch (error) {
      console.error('Error fetching quiz data:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch current question
  const fetchCurrentQuestion = async (quizId) => {
    try {
      const response = await fetch(`/api/quiz/${quizId}/current-question`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentQuestion(data.data);
        setTimeLeft(data.data.timeLimit);
        setAnswer(null);
        setAnswerResult(null);
      }
    } catch (error) {
      console.error('Error fetching current question:', error);
    }
  };
  
  // Fetch participants
  const fetchParticipants = async (quizId) => {
    try {
      const response = await fetch(`/api/user/quiz/${quizId}`);
      const data = await response.json();
      
      if (data.success) {
        setParticipants(data.data);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };
  
  // Fetch leaderboard
  const fetchLeaderboard = async (quizId) => {
    try {
      const response = await fetch(`/api/quiz/${quizId}/leaderboard`);
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.data.entries || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };
  
  // Submit answer
  const submitAnswer = async (quizId, questionId, selectedOption, responseTime) => {
    try {
      setAnswer(selectedOption);
      
      const response = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quizId,
          questionId,
          selectedOption,
          responseTime
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAnswerResult(data.data);
      } else {
        setError(data.message || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Network error. Please try again.');
    }
  };
  
  // Join waiting room
  const joinWaitingRoom = useCallback(async (quizId) => {
    try {
      if (!user) {
        setError('You must be logged in to join a quiz');
        return;
      }
      
      // No need for a separate API call - when user is created with createParticipant,
      // they are automatically added to the waiting room
      
      setQuizStatus('waiting');
    } catch (error) {
      console.error('Error joining waiting room:', error);
      setError('Failed to join waiting room');
    }
  }, [user]);
  
  // Admin: Start quiz
  const startQuiz = async (quizId) => {
    try {
      if (!user?.isAdmin) {
        setError('Only admins can start a quiz');
        return;
      }
      
      const response = await fetch(`/api/quiz/${quizId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.message || 'Failed to start quiz');
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      setError('Network error. Please try again.');
    }
  };
  
  // Admin: Stop quiz
  const stopQuiz = async (quizId) => {
    try {
      if (!user?.isAdmin) {
        setError('Only admins can stop a quiz');
        return;
      }
      
      const response = await fetch(`/api/quiz/${quizId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.message || 'Failed to stop quiz');
      }
    } catch (error) {
      console.error('Error stopping quiz:', error);
      setError('Network error. Please try again.');
    }
  };
  
  // Admin: Reset quiz
  const resetQuiz = async (quizId) => {
    try {
      if (!user?.isAdmin) {
        setError('Only admins can reset a quiz');
        return;
      }
      
      const response = await fetch(`/api/quiz/${quizId}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.message || 'Failed to reset quiz');
      }
    } catch (error) {
      console.error('Error resetting quiz:', error);
      setError('Network error. Please try again.');
    }
  };
  
  // Admin: Remove participant
  const removeParticipant = async (quizId, userId) => {
    try {
      if (!user?.isAdmin) {
        setError('Only admins can remove participants');
        return;
      }
      
      const response = await fetch(`/api/quiz/${quizId}/participants/${userId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update participants list
        setParticipants(participants.filter(p => p._id !== userId));
      } else {
        setError(data.message || 'Failed to remove participant');
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      setError('Network error. Please try again.');
    }
  };
  
  // Listen for Pusher events
  useEvent(eventNames.quizStarted, (data) => {
    console.log("Quiz started event received:", data);
    
    // First, update state immediately
    setQuizStatus('active');
    setAnswer(null);
    setAnswerResult(null);
    
    // Force store quiz status in localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        // Store quiz status to prevent it from being lost
        localStorage.setItem('quiz_status', 'active');
        localStorage.setItem('quiz_id', quizId);
        
        // Log for debugging
        console.log("Quiz data stored in localStorage:", quizId);
        
        // Ensure user data is still in localStorage
        const userData = localStorage.getItem('quiz_user');
        console.log("User data in localStorage:", userData ? "Present" : "Missing");
        
        // Add a slight delay for state updates to propagate
        setTimeout(() => {
          console.log("Navigating to quiz page:", `/quiz/${quizId}`);
          window.location.href = `/quiz/${quizId}`;
        }, 300);
      } catch (err) {
        console.error("LocalStorage error:", err);
        // Fallback direct navigation
        window.location.href = `/quiz/${quizId}`;
      }
    }
  });

useEvent(eventNames.quizStopped, (data) => {
  console.log("Quiz stopped event received:", data);
  setQuizStatus('finished');
  fetchLeaderboard(quizId);
  
  // Force redirect to results page
  if (quizId && typeof window !== 'undefined') {
    window.location.href = `/results/${quizId}`;
  }
});
  
  useEvent(eventNames.quizReset, () => {
    setQuizStatus('waiting');
    setCurrentQuestion(null);
    setAnswer(null);
    setAnswerResult(null);
  });
  
  useEvent(eventNames.quizEnded, () => {
    setQuizStatus('finished');
    fetchLeaderboard(quizId);
  });
  
  useEvent(eventNames.questionSent, (data) => {
    console.log("Question received:", data);
    setCurrentQuestion(data);
    setTimeLeft(data.timeLimit);
    setAnswer(null);
    setAnswerResult(null);
  });
  
  useEvent(eventNames.timerUpdate, (data) => {
    setTimeLeft(data.timeLeft);
  });
  
  useEvent(eventNames.participantsUpdate, (data) => {
    setParticipants(data.participants);
  });
  
  useEvent(eventNames.answerResult, (data) => {
    setAnswerResult(data);
  });
  
  useEvent(eventNames.leaderboardUpdate, (data) => {
    setLeaderboard(data.entries || []);
  });
  
  useEvent(eventNames.participantRemoved, (data) => {
    if (user && data.userId === user.id) {
      setError('You have been removed from the quiz by the admin');
    }
  });
  
  const clearError = () => {
    setError(null);
  };
  
  const value = {
    currentQuiz,
    currentQuestion,
    timeLeft,
    quizStatus,
    leaderboard,
    answer,
    answerResult,
    participants,
    error,
    loading,
    connected,
    joinWaitingRoom,
    startQuiz,
    stopQuiz,
    resetQuiz,
    submitAnswer,
    removeParticipant,
    clearError
  };
  
  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
};

export default QuizContext;