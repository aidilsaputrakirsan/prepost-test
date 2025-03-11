 // js/components/results.js
import api from '../api.js';
import { showConfetti } from '../utils/animation.js';

let currentUser;
let statistics;

/**
 * Results Component
 */
class ResultsComponent {
  constructor(user, stats) {
    // Save data
    currentUser = user;
    statistics = stats;
    
    // Elements
    this.finalScorePage = document.getElementById('final-score');
    this.finalScore = document.getElementById('finalScore');
    this.totalCorrect = document.getElementById('totalCorrect');
    this.totalIncorrect = document.getElementById('totalIncorrect');
    this.avgTime = document.getElementById('avgTime');
    this.btnShowLeaderboard = document.getElementById('btnShowLeaderboard');
    this.btnRestartFinal = document.getElementById('btnRestartFinal');
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize results page
   */
  init() {
    // Show page
    if (this.finalScorePage) {
      this.finalScorePage.classList.remove('hidden');
    }
    
    // Update UI with statistics
    this.updateUI();
    
    // Show confetti
    showConfetti();
    
    // Add event listeners
    if (this.btnShowLeaderboard) {
      this.btnShowLeaderboard.addEventListener('click', this.showLeaderboard.bind(this));
    }
    
    if (this.btnRestartFinal) {
      this.btnRestartFinal.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }
  
  /**
   * Update UI with statistics
   */
  updateUI() {
    // Update score
    if (this.finalScore) {
      this.finalScore.textContent = statistics.totalScore || 0;
    }
    
    // Update correct/incorrect counts
    if (this.totalCorrect) {
      this.totalCorrect.textContent = statistics.correctAnswers || 0;
    }
    
    if (this.totalIncorrect) {
      this.totalIncorrect.textContent = statistics.incorrectAnswers || 0;
    }
    
    // Update average time
    if (this.avgTime) {
      this.avgTime.textContent = `${statistics.avgTime || "0.0"}s`;
    }
    
    // Update score circle animation
    const scoreProgress = document.getElementById('scoreProgress');
    if (scoreProgress) {
      const percentage = statistics.totalQuestions > 0 
        ? (statistics.correctAnswers / statistics.totalQuestions) 
        : 0;
      const circumference = 283;
      const offset = circumference - (percentage * circumference);
      
      // Add delay for animation effect
      setTimeout(() => {
        scoreProgress.style.strokeDashoffset = offset;
      }, 500);
    }
  }
  
  /**
   * Show leaderboard
   */
  async showLeaderboard() {
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.textContent = 'Memuat leaderboard...';
    document.body.appendChild(loadingIndicator);
    
    try {
      const response = await api.getLeaderboard(currentUser.id);
      
      if (response.status === 'success') {
        // Import leaderboard component dynamically
        const { initLeaderboard } = await import('./leaderboard.js');
        
        // Hide current page
        if (this.finalScorePage) {
          this.finalScorePage.classList.add('hidden');
        }
        
        // Show leaderboard
        initLeaderboard(currentUser, response.leaderboard);
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
}

/**
 * Show results with user and statistics data
 * @param {Object} user - User data
 * @param {Object} stats - Statistics data
 */
export const showResults = (user, stats) => {
  return new ResultsComponent(user, stats);
};
