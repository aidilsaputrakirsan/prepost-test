 // js/components/login.js
import api from '../api.js';
import config from '../config.js';
import storage from '../utils/storage.js';
import { initWaitingRoom } from './waiting-room.js';

/**
 * Login Component
 */
class LoginComponent {
  constructor() {
    // Elements
    this.landingPage = document.getElementById('landing');
    this.loginPage = document.getElementById('login');
    this.btnStart = document.getElementById('btnStart');
    this.backToLanding = document.getElementById('backToLanding');
    this.nameInput = document.getElementById('name');
    this.btnLogin = document.getElementById('btnLogin');
    this.selectedAvatar = document.getElementById('selectedAvatar');
    this.prevAvatar = document.getElementById('prevAvatar');
    this.nextAvatar = document.getElementById('nextAvatar');
    
    // State
    this.currentAvatarSeed = 1;
    
    // Bind methods
    this.init = this.init.bind(this);
    this.showLogin = this.showLogin.bind(this);
    this.hideLogin = this.hideLogin.bind(this);
    this.updateAvatar = this.updateAvatar.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize component
   */
  init() {
    // Avatar navigation
    if (this.prevAvatar && this.nextAvatar) {
      this.prevAvatar.addEventListener('click', () => {
        this.currentAvatarSeed = this.currentAvatarSeed > 1 
          ? this.currentAvatarSeed - 1 
          : config.avatar.maxSeed;
        this.updateAvatar();
      });
      
      this.nextAvatar.addEventListener('click', () => {
        this.currentAvatarSeed = this.currentAvatarSeed < config.avatar.maxSeed 
          ? this.currentAvatarSeed + 1 
          : 1;
        this.updateAvatar();
      });
    }
    
    // Button click handlers
    if (this.btnStart) {
      this.btnStart.addEventListener('click', this.showLogin);
    }
    
    if (this.backToLanding) {
      this.backToLanding.addEventListener('click', this.hideLogin);
    }
    
    if (this.btnLogin) {
      this.btnLogin.addEventListener('click', this.handleLogin);
      
      // Enter key for login
      this.nameInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleLogin();
        }
      });
    }
    
    // Initialize avatar
    this.updateAvatar();
  }
  
  /**
   * Update avatar with current seed
   */
  updateAvatar() {
    const url = `${config.avatar.baseUrl}?seed=${this.currentAvatarSeed}`;
    if (this.selectedAvatar) {
      this.selectedAvatar.src = url;
    }
  }
  
  /**
   * Show login page
   */
  showLogin() {
    if (this.landingPage) {
      this.landingPage.classList.add('hidden');
    }
    if (this.loginPage) {
      this.loginPage.classList.remove('hidden');
    }
  }
  
  /**
   * Hide login page and return to landing
   */
  hideLogin() {
    if (this.loginPage) {
      this.loginPage.classList.add('hidden');
    }
    if (this.landingPage) {
      this.landingPage.classList.remove('hidden');
    }
  }
  
  /**
   * Handle login submission
   */
  async handleLogin() {
    if (!this.nameInput || !this.btnLogin) return;
    
    const name = this.nameInput.value.trim();
    if (name === "") {
      alert("Masukkan nama kamu terlebih dahulu.");
      return;
    }
    
    if (name.length < 3) {
      alert("Nama minimal 3 karakter.");
      return;
    }
    
    // Show loading
    this.btnLogin.disabled = true;
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.textContent = 'Connecting...';
    this.loginPage.querySelector('.card-content').appendChild(loadingIndicator);
    
    try {
      const response = await api.login(name, this.selectedAvatar.src);
      
      if (response.status === 'success') {
        // Save user data
        storage.save('quizUserData', {
          id: response.user.id,
          name: response.user.name,
          avatar: response.user.avatar
        });
        
        // Redirect to waiting room
        this.loginPage.classList.add('hidden');
        initWaitingRoom(response.user);
      } else {
        alert("Login gagal: " + response.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert("Terjadi kesalahan koneksi saat login. Silakan coba lagi.");
    } finally {
      this.btnLogin.disabled = false;
      loadingIndicator.remove();
    }
  }
}

export const initLogin = () => {
  return new LoginComponent();
};