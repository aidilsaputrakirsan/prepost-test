// app/lib/pusher.js
import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Initialize Pusher server-side client
export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Initialize Pusher client-side
let pusherClient;

// Only initialize on client-side to avoid SSR issues
if (typeof window !== 'undefined') {
  pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    authEndpoint: '/api/pusher/auth',
  });
} else {
  // Placeholder for server-side
  pusherClient = {
    subscribe: () => ({
      bind: () => {},
      unbind: () => {},
    })
  };
}

export { pusherClient };

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

// Channel naming convention
export const channelNames = {
  quiz: (quizId) => `quiz-${quizId}`,
  admin: (quizId) => `private-admin-${quizId}`,
};

// Standard event names
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