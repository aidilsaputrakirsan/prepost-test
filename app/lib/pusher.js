// app/lib/pusher.js
import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Environment variables - FIXED to use the correct variable names
const appId = process.env.PUSHER_APP_ID || '12345';
const key = process.env.NEXT_PUBLIC_PUSHER_KEY || 'mock-key';
const secret = process.env.PUSHER_SECRET || 'mock-secret';
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';

// Server-side Pusher instance (for server components/API routes)
export const pusher = new Pusher({
  appId,
  key,
  secret,
  cluster,
  useTLS: true,
});

// Client-side Pusher instance
export const pusherClient = new PusherClient(key, {
  cluster,
  forceTLS: true,
});

// Helper function to trigger events
export const triggerEvent = async (channel, event, data) => {
  try {
    await pusher.trigger(channel, event, data);
    return true;
  } catch (error) {
    console.error('Error triggering Pusher event:', error);
    return false;
  }
};

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