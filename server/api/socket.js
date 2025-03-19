// server/api/socket.js
// This is a special handler for Socket.io in the Vercel environment
const app = require('../server');
const { Server } = require('socket.io');
const setupSocketHandlers = require('../socket/socketHandler');

// This handles Socket.io connections specially for Vercel
module.exports = (req, res) => {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.io server for Vercel...');
    
    // Create new Socket.io server instance
    const io = new Server(res.socket.server, {
      path: '/socket.io/',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    // Set up socket handlers
    setupSocketHandlers(io);
    
    // Save the io instance on the server object
    res.socket.server.io = io;
  }
  
  // Send a response to keep the connection alive
  res.end('Socket.io server running');
};