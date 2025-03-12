// socket.js
// This file manages the Socket.io instance to avoid circular dependencies

let io;

module.exports = {
  // Initialize Socket.io with the HTTP server
  init: (httpServer) => {
    io = require('socket.io')(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    // Setup default event listeners
    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);
      
      socket.on('joinWaitingRoom', (userId) => {
        console.log(`User ${userId} joined waiting room`);
        socket.join('waitingRoom');
        // Notify waiting room about new participant
        io.to('waitingRoom').emit('participantJoined', { userId });
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
    
    return io;
  },
  
  // Get the io instance (or throw an error if not initialized)
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized! Call init() first.');
    }
    return io;
  }
};