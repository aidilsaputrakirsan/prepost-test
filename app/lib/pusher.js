// app/lib/pusher.js
import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Client-side Pusher instance
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  }
);

// Helper function to trigger events
export const triggerEvent = async (channel, event, data) => {
  try {
    await pusher.trigger(channel, event, data);
    return true;
  } catch (error) {
    console.error(`Error triggering event ${event} on channel ${channel}:`, error);
    return false;
  }
};

// Define channel names
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