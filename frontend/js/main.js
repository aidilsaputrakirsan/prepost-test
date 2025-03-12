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
