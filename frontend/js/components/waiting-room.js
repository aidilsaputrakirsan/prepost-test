 // js/components/waiting-room.js
import api from '../api.js';
import config from '../config.js';
import { initQuiz } from './quiz.js';
import io from 'https://cdn.socket.io/4.6.0/socket.io.esm.min.js';

let socket;
let pollingInterval;
let currentUser;

/**
 * Waiting Room Component
 */
class WaitingRoomComponent {
  constructor(user) {
    // Save user
    currentUser = user;
    
    // Elements
    this.waitingRoomPage = document.getElementById('waitingRoom');
    this.waitingUserAvatar = document.getElementById('waitingUserAvatar');
    this.waitingUserName = document.getElementById('waitingUserName');
    this.waitingParticipantsList = document.getElementById('waitingParticipantsList');
    this.waitingStatusText = document.getElementById('waitingStatusText');
    
    // State
    this.participants = [];
    this.lastParticipantsHash = '';
    this.pollingDelay = config.quiz.pollingDelay || 5000;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize waiting room
   */
  init() {
    // Update user info
    if (this.waitingUserAvatar) {
      this.waitingUserAvatar.src = currentUser.avatar;
    }
    if (this.waitingUserName) {
      this.waitingUserName.textContent = currentUser.name;
    }
    
    // Show waiting room
    if (this.waitingRoomPage) {
      this.waitingRoomPage.classList.remove('hidden');
    }
    
    // Setup Socket.io if enabled
    if (config.socket.enabled) {
      this.setupSocketConnection();
    }
    
    // Start polling for quiz state
    this.startPolling();
  }
  
  /**
   * Setup Socket.io connection
   */
  setupSocketConnection() {
    try {
      socket = io({
        reconnectionAttempts: config.socket.reconnectionAttempts
      });
      
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        socket.emit('joinWaitingRoom', currentUser.id);
      });
      
      socket.on('participantJoined', (data) => {
        this.checkQuizState();
      });
      
      socket.on('quizStateUpdate', (data) => {
        if (data.state === 'started') {
          this.handleQuizStart();
        }
      });
      
      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    } catch (error) {
      console.error('Socket.io error:', error);
      // Fall back to polling
      this.startPolling();
    }
  }
  
  /**
   * Start polling for quiz state
   */
  startPolling() {
    // Clear existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Check state immediately
    this.checkQuizState();
    
    // Set up interval for regular checks
    pollingInterval = setInterval(() => {
      this.checkQuizState();
    }, this.pollingDelay);
  }
  
  /**
   * Check quiz state from server
   */
  async checkQuizState() {
    try {
      const response = await api.getQuizState(currentUser.id);
      
      if (response.status === 'success') {
        // Update participants list if changed
        if (response.participants) {
          // Simple hash to detect changes
          const newHash = this.hashParticipants(response.participants);
          if (newHash !== this.lastParticipantsHash) {
            this.updateParticipantsList(response.participants);
            this.lastParticipantsHash = newHash;
          }
        }
        
        // Check if quiz has started
        if (response.state === 'started') {
          this.handleQuizStart();
        }
      }
    } catch (error) {
      console.error('Error checking quiz state:', error);
      // Increase polling delay on error (max 30 seconds)
      this.pollingDelay = Math.min(30000, this.pollingDelay + 5000);
      
      // Restart polling with new delay
      clearInterval(pollingInterval);
      pollingInterval = setInterval(() => {
        this.checkQuizState();
      }, this.pollingDelay);
    }
  }
  
  /**
   * Update participants list in UI
   * @param {Array} participants - List of participants
   */
  updateParticipantsList(participants) {
    this.participants = participants;
    
    if (!this.waitingParticipantsList) return;
    
    // Clear current list
    this.waitingParticipantsList.innerHTML = '';
    
    // Filter out current user
    const otherParticipants = participants.filter(p => p.id !== currentUser.id);
    
    // Update status text
    const waitingCount = participants.filter(p => p.status === 'waiting').length;
    if (this.waitingStatusText) {
      this.waitingStatusText.textContent = `Menunggu admin memulai... (${waitingCount} peserta siap)`;
    }
    
    // Empty state
    if (otherParticipants.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'participant-item';
      emptyEl.textContent = 'Belum ada peserta lain';
      this.waitingParticipantsList.appendChild(emptyEl);
      return;
    }
    
    // Display only first 10 for performance
    const displayParticipants = otherParticipants.slice(0, 10);
    
    // Add participants to list
    displayParticipants.forEach(participant => {
      const itemEl = document.createElement('div');
      itemEl.className = 'participant-item';
      
      const avatarEl = document.createElement('img');
      avatarEl.className = 'participant-avatar';
      avatarEl.src = participant.avatar;
      avatarEl.alt = participant.name;
      
      const nameEl = document.createElement('div');
      nameEl.className = 'participant-name';
      nameEl.textContent = participant.name;
      
      itemEl.appendChild(avatarEl);
      itemEl.appendChild(nameEl);
      this.waitingParticipantsList.appendChild(itemEl);
    });
    
    // If there are more participants not shown
    if (otherParticipants.length > 10) {
      const moreEl = document.createElement('div');
      moreEl.className = 'participant-item more-participants';
      moreEl.textContent = `...dan ${otherParticipants.length - 10} peserta lainnya`;
      this.waitingParticipantsList.appendChild(moreEl);
    }
  }
  
  /**
   * Handle quiz start event
   */
  handleQuizStart() {
    // Stop polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Disconnect socket
    if (socket && socket.connected) {
      socket.disconnect();
    }
    
    // Hide waiting room
    if (this.waitingRoomPage) {
      this.waitingRoomPage.classList.add('hidden');
    }
    
    // Start quiz
    initQuiz(currentUser);
  }
  
  /**
   * Simple hash function to detect changes in participants array
   * @param {Array} participants - Participants array
   * @returns {string} - Hash string
   */
  hashParticipants(participants) {
    return participants.map(p => `${p.id}-${p.status}-${p.progress || 0}`).join('|');
  }
}

/**
 * Initialize waiting room with user data
 * @param {Object} user - User data
 */
export const initWaitingRoom = (user) => {
  return new WaitingRoomComponent(user);
};