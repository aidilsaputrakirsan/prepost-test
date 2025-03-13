// client/src/contexts/QuizContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { socket, emitEvent, onEvent, offEvent } from '../services/socket';

export const QuizContext = createContext();

export const QuizProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStatus, setQuizStatus] = useState('waiting'); // waiting, active, finished
  const [leaderboard, setLeaderboard] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  // Initialize socket connection and set up event listeners
  useEffect(() => {
    function onConnect() {
      console.log('Socket connected');
      setIsConnected(true);
    }

    function onDisconnect() {
      console.log('Socket disconnected');
      setIsConnected(false);
    }

    // Set up socket connection listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  // Set up quiz-specific event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Handle errors
    function onError(data) {
      setError(data.message);
    }

    // Handle joining the waiting room
    function onJoinedWaitingRoom(data) {
      console.log('Joined waiting room:', data);
      setQuizStatus('waiting');
    }

    // Handle participants updates
    function onParticipantsUpdate(data) {
      setParticipants(data.participants);
    }

    // Handle quiz starting
    function onQuizStarted(data) {
      console.log('Quiz started:', data);
      setQuizStatus('active');
      setAnswer(null);
      setAnswerResult(null);
    }

    // Handle receiving a question
    function onQuestion(data) {
      console.log('Question received:', data);
      setCurrentQuestion(data);
      setTimeLeft(data.timeLimit);
      setAnswer(null);
      setAnswerResult(null);
    }

    // Handle timer updates
    function onTimer(data) {
      setTimeLeft(data.timeLeft);
    }

    // Handle answer results
    function onAnswerResult(data) {
      console.log('Answer result:', data);
      setAnswerResult(data);
    }

    // Handle quiz ending
    function onQuizEnded() {
      setQuizStatus('finished');
    }

    // Handle quiz stopping
    function onQuizStopped() {
      setQuizStatus('finished');
    }

    // Handle quiz resetting
    function onQuizReset() {
      setQuizStatus('waiting');
      setCurrentQuestion(null);
      setAnswer(null);
      setAnswerResult(null);
    }

    // Handle leaderboard updates
    function onLeaderboard(data) {
      setLeaderboard(data.entries);
    }

    // Handle participant removal
    function onParticipantRemoved(data) {
      if (currentUser && data.userId === currentUser._id) {
        // User has been removed from the quiz
        setError('Anda telah dikeluarkan dari kuis oleh admin');
      }
    }

    // Register event listeners
    socket.on('error', onError);
    socket.on('joinedWaitingRoom', onJoinedWaitingRoom);
    socket.on('participantsUpdate', onParticipantsUpdate);
    socket.on('quizStarted', onQuizStarted);
    socket.on('question', onQuestion);
    socket.on('timer', onTimer);
    socket.on('answerResult', onAnswerResult);
    socket.on('quizEnded', onQuizEnded);
    socket.on('quizStopped', onQuizStopped);
    socket.on('quizReset', onQuizReset);
    socket.on('leaderboard', onLeaderboard);
    socket.on('participantRemoved', onParticipantRemoved);

    // Cleanup function to remove event listeners
    return () => {
      socket.off('error', onError);
      socket.off('joinedWaitingRoom', onJoinedWaitingRoom);
      socket.off('participantsUpdate', onParticipantsUpdate);
      socket.off('quizStarted', onQuizStarted);
      socket.off('question', onQuestion);
      socket.off('timer', onTimer);
      socket.off('answerResult', onAnswerResult);
      socket.off('quizEnded', onQuizEnded);
      socket.off('quizStopped', onQuizStopped);
      socket.off('quizReset', onQuizReset);
      socket.off('leaderboard', onLeaderboard);
      socket.off('participantRemoved', onParticipantRemoved);
    };
  }, [isConnected, currentUser]);

  // Functions to interact with the quiz
  const joinWaitingRoom = (userId, quizId) => {
    if (!isConnected) {
      setError('Tidak dapat terhubung ke server');
      return;
    }
    emitEvent('joinWaitingRoom', { userId, quizId });
  };

  const startQuiz = (quizId, adminId) => {
    if (!isConnected) {
      setError('Tidak dapat terhubung ke server');
      return;
    }
    emitEvent('startQuiz', { quizId, adminId });
  };

  const stopQuiz = (quizId, adminId) => {
    if (!isConnected) {
      setError('Tidak dapat terhubung ke server');
      return;
    }
    emitEvent('stopQuiz', { quizId, adminId });
  };

  const resetQuiz = (quizId, adminId) => {
    if (!isConnected) {
      setError('Tidak dapat terhubung ke server');
      return;
    }
    emitEvent('resetQuiz', { quizId, adminId });
  };

  const submitAnswer = (userId, quizId, questionId, selectedOption, responseTime) => {
    if (!isConnected) {
      setError('Tidak dapat terhubung ke server');
      return;
    }
    setAnswer(selectedOption);
    emitEvent('submitAnswer', { userId, quizId, questionId, selectedOption, responseTime });
  };

  const removeParticipant = (quizId, adminId, userId) => {
    if (!isConnected) {
      setError('Tidak dapat terhubung ke server');
      return;
    }
    emitEvent('removeParticipant', { quizId, adminId, userId });
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    isConnected,
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