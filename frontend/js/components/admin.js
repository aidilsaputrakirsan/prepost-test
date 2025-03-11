// js/components/admin.js
import api from '../api.js';
import config from '../config.js';
import io from 'https://cdn.socket.io/4.6.0/socket.io.esm.min.js';

let socket;
let pollingInterval;
let lastParticipantsHash = '';

/**
 * Admin Component
 */
class AdminComponent {
  constructor() {
    // Elements - Admin Login
    this.adminLoginLink = document.getElementById('adminLoginLink');
    this.adminLoginPage = document.getElementById('adminLogin');
    this.backToLandingFromAdmin = document.getElementById('backToLandingFromAdmin');
    this.adminKey = document.getElementById('adminKey');
    this.btnAdminLogin = document.getElementById('btnAdminLogin');
    
    // Elements - Admin Panel
    this.adminPanelPage = document.getElementById('adminPanel');
    this.adminLogout = document.getElementById('adminLogout');
    this.btnStartQuiz = document.getElementById('btnStartQuiz');
    this.btnEndQuiz = document.getElementById('btnEndQuiz');
    this.btnResetQuiz = document.getElementById('btnResetQuiz');
    this.btnAdminLeaderboard = document.getElementById('btnAdminLeaderboard');
    this.quizStatusIndicator = document.getElementById('quizStatusIndicator');
    this.quizStatusText = document.getElementById('quizStatusText');
    this.participantCount = document.getElementById('participantCount');
    this.totalParticipants = document.getElementById('totalParticipants');
    this.activeParticipants = document.getElementById('activeParticipants');
    this.finishedParticipants = document.getElementById('finishedParticipants');
    this.adminProgressList = document.getElementById('adminProgressList');
    
    // Elements - Landing Page
    this.landingPage = document.getElementById('landing');
    
    // State
    this.isAdmin = false;
    this.adminKeyValue = '';
    this.pollingDelay = 5000;
    this.participants = [];
    this.quizState = 'waiting';
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize admin component
   */
  init() {
    // Add event listeners
    if (this.adminLoginLink) {
      this.adminLoginLink.addEventListener('click', this.showAdminLogin.bind(this));
    }
    
    if (this.backToLandingFromAdmin) {
      this.backToLandingFromAdmin.addEventListener('click', this.hideAdminLogin.bind(this));
    }
    
    if (this.btnAdminLogin) {
      this.btnAdminLogin.addEventListener('click', this.handleAdminLogin.bind(this));
      
      // Enter key support
      this.adminKey?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleAdminLogin();
        }
      });
    }
    
    if (this.adminLogout) {
      this.adminLogout.addEventListener('click', this.handleAdminLogout.bind(this));
    }
    
    if (this.btnStartQuiz) {
      this.btnStartQuiz.addEventListener('click', this.handleStartQuiz.bind(this));
    }
    
    if (this.btnEndQuiz) {
      this.btnEndQuiz.addEventListener('click', this.handleEndQuiz.bind(this));
    }
    
    if (this.btnResetQuiz) {
      this.btnResetQuiz.addEventListener('click', this.handleResetQuiz.bind(this));
    }
    
    if (this.btnAdminLeaderboard) {
      this.btnAdminLeaderboard.addEventListener('click', this.handleViewLeaderboard.bind(this));
    }
  }
  
  /**
   * Show admin login page
   * @param {Event} e - Click event
   */
  showAdminLogin(e) {
    e.preventDefault();
    
    if (this.landingPage) {
      this.landingPage.classList.add('hidden');
    }
    
    if (this.adminLoginPage) {
      this.adminLoginPage.classList.remove('hidden');
    }
  }
  
  /**
   * Hide admin login page
   */
  hideAdminLogin() {
    if (this.adminLoginPage) {
      this.adminLoginPage.classList.add('hidden');
    }
    
    if (this.landingPage) {
      this.landingPage.classList.remove('hidden');
    }
  }
  
  /**
   * Handle admin login
   */
  async handleAdminLogin() {
    if (!this.adminKey || !this.btnAdminLogin) return;
    
    const key = this.adminKey.value.trim();
    if (!key) {
      alert("Mohon masukkan admin key");
      return;
    }
    
    // Show loading
    this.btnAdminLogin.disabled = true;
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.textContent = 'Memeriksa key...';
    this.adminLoginPage.appendChild(loadingIndicator);
    
    try {
      const response = await api.adminLogin(key);
      
      if (response.status === 'success') {
        // Save admin state
        this.isAdmin = true;
        this.adminKeyValue = key;
        
        // Hide login, show panel
        if (this.adminLoginPage) {
          this.adminLoginPage.classList.add('hidden');
        }
        
        if (this.adminPanelPage) {
          this.adminPanelPage.classList.remove('hidden');
        }
        
        // Update UI
        this.updateAdminUI(response);
        
        // Setup socket connection
        if (config.socket.enabled) {
          this.setupSocketConnection();
        }
        
        // Start polling for updates
        this.startPolling();
      } else {
        alert("Admin login gagal: " + response.message);
      }
    } catch (error) {
      console.error('Admin login error:', error);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      this.btnAdminLogin.disabled = false;
      loadingIndicator.remove();
    }
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
        console.log('Admin socket connected:', socket.id);
      });
      
      socket.on('participantJoined', (data) => {
        this.checkQuizState();
      });
      
      socket.on('userStatusUpdate', (data) => {
        this.checkQuizState();
      });
      
      socket.on('userProgress', (data) => {
        this.checkQuizState();
      });
      
      socket.on('disconnect', () => {
        console.log('Admin socket disconnected');
      });
    } catch (error) {
      console.error('Socket.io error:', error);
      // Fall back to polling
      this.startPolling();
    }
  }
  
  /**
   * Start polling for quiz state updates
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
    if (!this.isAdmin) return;
    
    try {
      const response = await api.getQuizState();
      
      if (response.status === 'success') {
        // Update quiz state and UI
        this.quizState = response.state;
        this.updateAdminUI(response);
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
   * Update admin UI with quiz state and participants
   * @param {Object} data - Response data
   */
  updateAdminUI(data) {
    // Update quiz status text
    if (this.quizStatusText) {
      this.quizStatusText.textContent = data.state === 'waiting' ? 'Menunggu' : 
                                      data.state === 'started' ? 'Berjalan' : 'Selesai';
    }
    
    // Update status dot
    if (this.quizStatusIndicator) {
      const statusDot = this.quizStatusIndicator.querySelector('.status-dot');
      if (statusDot) {
        statusDot.className = 'status-dot ' + data.state;
      }
    }
    
    // Update button states
    if (this.btnStartQuiz) {
      this.btnStartQuiz.disabled = data.state !== 'waiting';
    }
    
    if (this.btnEndQuiz) {
      this.btnEndQuiz.disabled = data.state !== 'started';
    }
    
    // Update participants statistics
    const participants = data.participants || [];
    this.participants = participants;
    
    if (this.participantCount) {
      this.participantCount.textContent = `${participants.length} peserta total`;
    }
    
    // Update counts by status
    const waitingCount = participants.filter(p => p.status === 'waiting').length;
    const activeCount = participants.filter(p => p.status === 'active').length;
    const finishedCount = participants.filter(p => p.status === 'finished').length;
    
    if (this.totalParticipants) {
      this.totalParticipants.textContent = participants.length;
    }
    
    if (this.activeParticipants) {
      this.activeParticipants.textContent = activeCount;
    }
    
    if (this.finishedParticipants) {
      this.finishedParticipants.textContent = finishedCount;
    }
    
    // Update progress list if changed
    const newHash = this.hashParticipants(participants);
    if (newHash !== lastParticipantsHash) {
      this.updateProgressList(participants);
      lastParticipantsHash = newHash;
    }
  }
  
  /**
   * Update participants progress list
   * @param {Array} participants - List of participants
   */
  updateProgressList(participants) {
    if (!this.adminProgressList) return;
    
    this.adminProgressList.innerHTML = '';
    
    // Show empty state if no participants
    if (participants.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'progress-item';
      emptyEl.textContent = 'Belum ada peserta';
      this.adminProgressList.appendChild(emptyEl);
      return;
    }
    
    // Limit to 25 participants for performance
    const displayParticipants = participants.slice(0, 25);
    
    // Add participants to list
    displayParticipants.forEach(participant => {
      const itemEl = document.createElement('div');
      itemEl.className = 'progress-item';
      
      const avatarEl = document.createElement('img');
      avatarEl.className = 'progress-avatar';
      avatarEl.src = participant.avatar;
      avatarEl.alt = participant.name;
      
      const infoEl = document.createElement('div');
      infoEl.className = 'progress-info';
      
      const nameEl = document.createElement('div');
      nameEl.className = 'progress-name';
      nameEl.textContent = participant.name;
      
      // Progress bar
      const progressContainerEl = document.createElement('div');
      progressContainerEl.className = 'progress-bar-container';
      
      const progressFillEl = document.createElement('div');
      progressFillEl.className = 'progress-bar-fill';
      
      // Set progress percentage
      const progressPercent = participant.progress ? Math.round(participant.progress * 100) : 0;
      progressFillEl.style.width = `${progressPercent}%`;
      
      // Status indicator
      const statusEl = document.createElement('div');
      statusEl.className = `progress-status ${participant.status}`;
      
      const statusIcon = document.createElement('i');
      statusIcon.className = participant.status === 'waiting' ? 'fas fa-clock' :
                            participant.status === 'active' ? 'fas fa-spinner fa-spin' :
                            'fas fa-check-circle';
      
      const statusText = document.createElement('span');
      statusText.textContent = participant.status === 'waiting' ? 'Menunggu' :
                              participant.status === 'active' ? `${progressPercent}%` :
                              'Selesai';
      
      // Append elements
      statusEl.appendChild(statusIcon);
      statusEl.appendChild(statusText);
      
      progressContainerEl.appendChild(progressFillEl);
      
      infoEl.appendChild(nameEl);
      infoEl.appendChild(progressContainerEl);
      
      itemEl.appendChild(avatarEl);
      itemEl.appendChild(infoEl);
      itemEl.appendChild(statusEl);
      
      this.adminProgressList.appendChild(itemEl);
    });
    
    // Show "more" row if needed
    if (participants.length > 25) {
      const moreEl = document.createElement('div');
      moreEl.className = 'progress-item more-item';
      moreEl.textContent = `...dan ${participants.length - 25} peserta lainnya`;
      this.adminProgressList.appendChild(moreEl);
    }
  }
  
  /**
   * Handle admin logout
   */
  handleAdminLogout() {
    // Reset admin state
    this.isAdmin = false;
    this.adminKeyValue = '';
    
    // Clear polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Disconnect socket
    if (socket && socket.connected) {
      socket.disconnect();
    }
    
    // Hide admin panel
    if (this.adminPanelPage) {
      this.adminPanelPage.classList.add('hidden');
    }
    
    // Show landing page
    if (this.landingPage) {
      this.landingPage.classList.remove('hidden');
    }
  }
  
  /**
   * Handle start quiz button
   */
  async handleStartQuiz() {
    if (!confirm("Yakin ingin memulai quiz untuk semua peserta?")) {
      return;
    }
    
    // Disable button
    if (this.btnStartQuiz) {
      this.btnStartQuiz.disabled = true;
      this.btnStartQuiz.textContent = "Memulai...";
    }
    
    try {
      const response = await api.startQuiz(this.adminKeyValue);
      
      if (response.status === 'success') {
        // Update local state
        this.quizState = 'started';
        
        // Update UI
        if (this.btnStartQuiz) {
          this.btnStartQuiz.disabled = true;
          this.btnStartQuiz.innerHTML = '<i class="fas fa-play"></i><span>Mulai Quiz</span>';
        }
        
        if (this.btnEndQuiz) {
          this.btnEndQuiz.disabled = false;
        }
        
        if (this.quizStatusText) {
          this.quizStatusText.textContent = 'Berjalan';
        }
        
        if (this.quizStatusIndicator) {
          const statusDot = this.quizStatusIndicator.querySelector('.status-dot');
          if (statusDot) {
            statusDot.className = 'status-dot started';
          }
        }
      } else {
        throw new Error(response.message || 'Gagal memulai quiz');
      }
    } catch (error) {
      console.error('Start quiz error:', error);
      alert("Gagal memulai quiz: " + error.message);
      
      // Reset button
      if (this.btnStartQuiz) {
        this.btnStartQuiz.disabled = false;
        this.btnStartQuiz.innerHTML = '<i class="fas fa-play"></i><span>Mulai Quiz</span>';
      }
    }
  }
  
  /**
   * Handle end quiz button
   */
  async handleEndQuiz() {
    if (!confirm("Yakin ingin mengakhiri quiz untuk semua peserta?")) {
      return;
    }
    
    // Disable button
    if (this.btnEndQuiz) {
      this.btnEndQuiz.disabled = true;
      this.btnEndQuiz.textContent = "Mengakhiri...";
    }
    
    try {
      const response = await api.endQuiz(this.adminKeyValue);
      
      if (response.status === 'success') {
        // Update local state
        this.quizState = 'finished';
        
        // Update UI
        if (this.btnStartQuiz) {
          this.btnStartQuiz.disabled = true;
        }
        
        if (this.btnEndQuiz) {
          this.btnEndQuiz.disabled = true;
          this.btnEndQuiz.innerHTML = '<i class="fas fa-stop"></i><span>Akhiri Quiz</span>';
        }
        
        if (this.quizStatusText) {
          this.quizStatusText.textContent = 'Selesai';
        }
        
        if (this.quizStatusIndicator) {
          const statusDot = this.quizStatusIndicator.querySelector('.status-dot');
          if (statusDot) {
            statusDot.className = 'status-dot finished';
          }
        }
      } else {
        throw new Error(response.message || 'Gagal mengakhiri quiz');
      }
    } catch (error) {
      console.error('End quiz error:', error);
      alert("Gagal mengakhiri quiz: " + error.message);
      
      // Reset button
      if (this.btnEndQuiz) {
        this.btnEndQuiz.disabled = false;
        this.btnEndQuiz.innerHTML = '<i class="fas fa-stop"></i><span>Akhiri Quiz</span>';
      }
    }
  }
  
  /**
   * Handle reset quiz button
   */
  async handleResetQuiz() {
    if (!confirm("AWAS! Yakin ingin mereset quiz? Semua data progress peserta akan dihapus!")) {
      return;
    }
    
    if (!confirm("Tindakan ini tidak dapat dibatalkan. Lanjutkan?")) {
      return;
    }
    
    // Disable button
    if (this.btnResetQuiz) {
      this.btnResetQuiz.disabled = true;
      this.btnResetQuiz.textContent = "Mereset...";
    }
    
    try {
      const response = await api.resetQuiz(this.adminKeyValue);
      
      if (response.status === 'success') {
        // Update local state
        this.quizState = 'waiting';
        
        // Update UI
        if (this.btnStartQuiz) {
          this.btnStartQuiz.disabled = false;
        }
        
        if (this.btnEndQuiz) {
          this.btnEndQuiz.disabled = true;
        }
        
        if (this.btnResetQuiz) {
          this.btnResetQuiz.disabled = false;
          this.btnResetQuiz.innerHTML = '<i class="fas fa-redo"></i><span>Reset Quiz</span>';
        }
        
        if (this.quizStatusText) {
          this.quizStatusText.textContent = 'Menunggu';
        }
        
        if (this.quizStatusIndicator) {
          const statusDot = this.quizStatusIndicator.querySelector('.status-dot');
          if (statusDot) {
            statusDot.className = 'status-dot waiting';
          }
        }
        
        // Reset statistics
        if (this.totalParticipants) {
          this.totalParticipants.textContent = '0';
        }
        
        if (this.activeParticipants) {
          this.activeParticipants.textContent = '0';
        }
        
        if (this.finishedParticipants) {
          this.finishedParticipants.textContent = '0';
        }
        
        // Clear progress list
        if (this.adminProgressList) {
          this.adminProgressList.innerHTML = '<div class="progress-item">Belum ada peserta</div>';
        }
      } else {
        throw new Error(response.message || 'Gagal mereset quiz');
      }
    } catch (error) {
      console.error('Reset quiz error:', error);
      alert("Gagal mereset quiz: " + error.message);
    } finally {
      // Reset button
      if (this.btnResetQuiz) {
        this.btnResetQuiz.disabled = false;
        this.btnResetQuiz.innerHTML = '<i class="fas fa-redo"></i><span>Reset Quiz</span>';
      }
    }
  }
  
  /**
   * Handle view leaderboard button
   */
  async handleViewLeaderboard() {
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.textContent = 'Memuat leaderboard...';
    document.body.appendChild(loadingIndicator);
    
    try {
      const response = await api.getLeaderboard();
      
      if (response.status === 'success') {
        // Import leaderboard component dynamically
        const { initLeaderboard } = await import('./leaderboard.js');
        
        // Create dummy user for admin
        const adminUser = { id: 'admin', name: 'Admin', avatar: '' };
        
        // Hide admin panel
        if (this.adminPanelPage) {
          this.adminPanelPage.classList.add('hidden');
        }
        
        // Show leaderboard
        initLeaderboard(adminUser, response.leaderboard);
      } else {
        throw new Error(response.message || 'Gagal memuat leaderboard');
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      alert('Gagal memuat leaderboard. Silakan coba lagi.');
    } finally {
      loadingIndicator.remove();
    }
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

// Export admin initialization
export const initAdmin = () => {
  return new AdminComponent();
};

// js/main.js
import { ParticleAnimation } from './utils/animation.js';
import { initLogin } from './components/login.js';
import { initAdmin } from './components/admin.js';
import storage from './utils/storage.js';

/**
 * Main application class
 */
class App {
  constructor() {
    // Elements
    this.loadingPage = document.getElementById('loading');
    this.landingPage = document.getElementById('landing');
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize application
   */
  init() {
    // Initialize particles
    const particles = new ParticleAnimation('particles');
    
    // Show landing page after loading
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (this.loadingPage) {
          this.loadingPage.classList.add('hidden');
        }
        
        if (this.landingPage) {
          this.landingPage.classList.remove('hidden');
          particles.start();
        }
        
        // Check for saved user session
        this.checkSavedSession();
      }, 1500);
    });
    
    // Initialize admin
    initAdmin();
    
    // Initialize login component
    initLogin();
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      particles.destroy();
    });
  }
  
  /**
   * Check for saved user session
   */
  checkSavedSession() {
    try {
      const savedUser = storage.get('quizUserData');
      if (savedUser) {
        if (confirm(`Lanjutkan sebagai ${savedUser.name}?`)) {
          // Import waiting room component dynamically
          import('./components/waiting-room.js').then(({ initWaitingRoom }) => {
            // Hide landing page
            if (this.landingPage) {
              this.landingPage.classList.add('hidden');
            }
            
            // Initialize waiting room
            initWaitingRoom(savedUser);
          });
        }
      }
    } catch (e) {
      console.warn("Error loading saved user:", e);
    }
  }
}

// Start the application
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
 
