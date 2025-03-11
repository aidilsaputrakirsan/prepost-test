 // js/config.js
/**
 * Konfigurasi aplikasi
 */
const config = {
    // Konfigurasi quiz
    quiz: {
      timerDuration: 15, // Durasi timer dalam detik
      pollingDelay: 5000, // Delay polling status quiz dalam ms
    },
    
    // Avatar service
    avatar: {
      baseUrl: 'https://api.dicebear.com/6.x/avataaars/svg',
      maxSeed: 100
    },
    
    // Socket.io
    socket: {
      enabled: true,
      reconnectionAttempts: 5
    }
  };
  
  export default config;