import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';

export const QuizContext = createContext();

export const QuizProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStatus, setQuizStatus] = useState('waiting'); // waiting, active, finished
  const [leaderboard, setLeaderboard] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    // Socket setup will be implemented later
    // For now, we'll create a minimal implementation

    return () => {
      // Cleanup (will be implemented with real socket)
    };
  }, []);

  // Set up event listeners when socket or currentUser changes
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Event listeners will be implemented later

    return () => {
      // Cleanup event listeners
    };
  }, [socket, currentUser]);

  // Functions to interact with the quiz
  const joinWaitingRoom = (userId, quizId) => {
    if (socket) {
      socket.emit('joinWaitingRoom', { userId, quizId });
    }
  };

  const startQuiz = (quizId, adminId) => {
    if (socket) {
      socket.emit('startQuiz', { quizId, adminId });
    }
  };

  const stopQuiz = (quizId, adminId) => {
    if (socket) {
      socket.emit('stopQuiz', { quizId, adminId });
    }
  };

  const resetQuiz = (quizId, adminId) => {
    if (socket) {
      socket.emit('resetQuiz', { quizId, adminId });
    }
  };

  const submitAnswer = (userId, quizId, questionId, selectedOption, responseTime) => {
    if (socket) {
      setAnswer(selectedOption);
      socket.emit('submitAnswer', { userId, quizId, questionId, selectedOption, responseTime });
    }
  };

  const removeParticipant = (quizId, adminId, userId) => {
    if (socket) {
      socket.emit('removeParticipant', { quizId, adminId, userId });
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    socket,
    currentQuiz,
    currentQuestion,
    timeLeft,
    quizStatus,
    leaderboard,
    answer,
    answerResult,
    participants,
    error,
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