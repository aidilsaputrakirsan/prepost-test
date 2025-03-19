// client/src/services/socket.js
import { io } from 'socket.io-client';

// Update the createSocket function:
const createSocket = () => {
  const BACKEND_URL = process.env.NODE_ENV === 'production'
    ? window.location.origin
    : 'http://localhost:5000';
  
  return io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true
  });
};

// Export a single socket instance
export const socket = createSocket();

// Helper functions for socket events
export const emitEvent = (eventName, data) => {
  if (socket && socket.connected) {
    socket.emit(eventName, data);
  } else {
    console.error('Socket not connected');
  }
};

export const onEvent = (eventName, callback) => {
  if (socket) {
    socket.on(eventName, callback);
  }
};

export const offEvent = (eventName, callback) => {
  if (socket) {
    socket.off(eventName, callback);
  }
};

export default {
  socket,
  emitEvent,
  onEvent,
  offEvent
};