// app/lib/pusher.js
import Pusher from 'pusher';
import PusherClient from 'pusher-js';

export const pusher = {
  trigger: async () => true
};

export const pusherClient = {
  subscribe: () => ({
    bind: () => {},
    unbind: () => {}
  })
};

export const triggerEvent = async () => true;

export const channelNames = {
  quiz: (quizId) => `quiz-${quizId}`,
  admin: (quizId) => `admin-${quizId}`,
};

// Define event names
export const eventNames = {
  // Quiz events
  quizStarted: 'quiz-started',
  quizStopped: 'quiz-stopped',
  quizReset: 'quiz-reset',
  quizEnded: 'quiz-ended',
  
  // Question events
  questionSent: 'question-sent',
  timerUpdate: 'timer-update',
  
  // Participant events
  participantJoined: 'participant-joined',
  participantRemoved: 'participant-removed',
  participantsUpdate: 'participants-update',
  
  // Answer events
  answerSubmitted: 'answer-submitted',
  answerResult: 'answer-result',
  
  // Leaderboard events
  leaderboardUpdate: 'leaderboard-update',
};