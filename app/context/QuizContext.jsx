// app/context/QuizContext.jsx
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import usePusher from '@/app/hooks/usePusher';
import { eventNames } from '@/app/lib/pusher';
import { useRouter } from 'next/navigation';

const QuizContext = createContext({});

export const useQuiz = () => useContext(QuizContext);

export const QuizProvider = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();
  
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
      console.log("Fetching quiz data for", quizId);
      const response = await fetch(`/api/quiz/${quizId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log("Quiz data fetched:", data.data);
        setCurrentQuiz(data.data);
        setQuizStatus(data.data.status);
        
        // If quiz is active, fetch current question
        if (data.data.status === 'active') {
          console.log("Quiz is active, fetching current question");
          fetchCurrentQuestion(quizId);
        } else if (data.data.status === 'finished') {
          console.log("Quiz is finished, fetching leaderboard");
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
      console.log("Fetching current question");
      const response = await fetch(`/api/quiz/${quizId}/current-question`);
      const data = await response.json();
      
      if (data.success) {
        console.log("Current question fetched:", data.data);
        setCurrentQuestion(data.data);
        setTimeLeft(data.data.timeLimit);
        setAnswer(null);
        setAnswerResult(null);
      } else {
        console.warn("Failed to fetch current question:", data.message);
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
      console.log("Fetching leaderboard");
      const response = await fetch(`/api/quiz/${quizId}/leaderboard`);
      const data = await response.json();
      
      if (data.success) {
        console.log("Leaderboard data:", data.data.entries);
        setLeaderboard(data.data.entries || []);
      } else {
        console.warn("Failed to fetch leaderboard:", data.message);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };
  
  // Submit answer
  const submitAnswer = async (quizId, questionId, selectedOption, responseTime) => {
    try {
      setAnswer(selectedOption);
      
      // Add debugging to see if we have local storage data
      let userData;
      try {
        const storedUser = localStorage.getItem('quiz_user');
        if (storedUser) {
          userData = JSON.parse(storedUser);
          console.log("Found user data in localStorage:", userData.id);
        } else {
          console.warn("No user data in localStorage");
        }
      } catch (e) {
        console.error("Error checking localStorage:", e);
      }
      
      console.log("Submitting answer: Quiz", quizId, "Question", questionId, "Option", selectedOption);
      
      const response = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add custom headers just in case they're not being added by fetch override
          'x-participant-id': userData?.id || '',
          'x-quiz-id': quizId,
          'x-has-local-storage': 'true'
        },
        body: JSON.stringify({
          quizId,
          questionId,
          selectedOption,
          responseTime
        })
      });
      
      if (!response.ok) {
        console.error("Answer submission failed:", response.status, response.statusText);
        const text = await response.text();
        console.error("Response body:", text);
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log("Answer submitted successfully:", data.data);
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
    
    // Store quiz status in localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('quiz_status', 'active');
        
        // Add a timestamp to prevent stale data
        localStorage.setItem('quiz_status_updated', Date.now().toString());
        
        console.log("Quiz status stored in localStorage:", 'active');
        
        // Force redirect to quiz page after short delay
        setTimeout(() => {
          console.log("Redirecting to quiz page from event handler");
          router.push(`/quiz/${quizId}`);
        }, 500);
      } catch (err) {
        console.error("LocalStorage error:", err);
        // Fallback direct navigation
        window.location.href = `/quiz/${quizId}`;
      }
    }
  });

  // Enhanced event handler for quizStopped and quizEnded events
  const handleQuizEnd = (eventName) => (data) => {
    console.log(`${eventName} event received:`, data);
    setQuizStatus('finished');
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('quiz_status', 'finished');
        localStorage.setItem('quiz_status_updated', Date.now().toString());
        console.log("Quiz status stored in localStorage:", 'finished');
        
        // Force redirect to results page
        setTimeout(() => {
          console.log("Redirecting to results page from event handler");
          router.push(`/results/${quizId}`);
        }, 500);
      } catch (e) {
        console.error("Error updating localStorage:", e);
        // Fallback direct navigation
        window.location.href = `/results/${quizId}`;
      }
    }
    
    // Fetch leaderboard data
    fetchLeaderboard(quizId);
  };

  useEvent(eventNames.quizStopped, handleQuizEnd('Quiz stopped'));
  useEvent(eventNames.quizEnded, handleQuizEnd('Quiz ended'));

  useEvent(eventNames.quizStopped, (data) => {
    console.log("Quiz stopped event received:", data);
    setQuizStatus('finished');
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('quiz_status', 'finished');
      } catch (e) {
        console.error("Error updating localStorage:", e);
      }
    }
    
    // Fetch leaderboard data
    fetchLeaderboard(quizId);
    
    // Force redirect to results page
    if (quizId) {
      router.push(`/results/${quizId}`);
    }
  });
  
  useEvent(eventNames.quizReset, () => {
    setQuizStatus('waiting');
    setCurrentQuestion(null);
    setAnswer(null);
    setAnswerResult(null);
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('quiz_status', 'waiting');
      } catch (e) {
        console.error("Error updating localStorage:", e);
      }
    }
  });
  
  useEvent(eventNames.quizEnded, () => {
    setQuizStatus('finished');
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('quiz_status', 'finished');
      } catch (e) {
        console.error("Error updating localStorage:", e);
      }
    }
    
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