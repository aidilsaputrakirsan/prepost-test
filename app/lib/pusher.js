// app/lib/pusher.js
import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// app/lib/pusher.js
// Simplified fallback implementation

// Server-side pusher (fallback)
export const pusher = {
  trigger: async () => true
};

// Client-side pusher (fallback)
export const pusherClient = {
  subscribe: () => ({
    bind: () => {},
    unbind: () => {}
  })
};

// Helper function
export const triggerEvent = async () => true;

// Channel naming conventions
export const channelNames = {
  quiz: (quizId) => `quiz-${quizId}`,
  admin: (quizId) => `private-admin-${quizId}`,
};

// Event names
export const eventNames = {
  quizStarted: 'quiz-started',
  quizStopped: 'quiz-stopped',
  quizReset: 'quiz-reset',
  quizEnded: 'quiz-ended',
  questionSent: 'question-sent',
  timerUpdate: 'timer-update',
  participantJoined: 'participant-joined',
  participantRemoved: 'participant-removed',
  participantsUpdate: 'participants-update',
  answerSubmitted: 'answer-submitted',
  answerResult: 'answer-result',
  leaderboardUpdate: 'leaderboard-update',
};