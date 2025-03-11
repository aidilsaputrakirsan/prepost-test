 // js/api.js
/**
 * API client untuk berkomunikasi dengan backend
 */
class APIClient {
    constructor(baseURL) {
      this.baseURL = baseURL || '/api';
      this.retryCount = 0;
      this.maxRetries = 3;
    }
  
    /**
     * Fungsi fetch dengan retry dan exponential backoff
     * @param {string} endpoint - Endpoint API
     * @param {Object} options - Opsi fetch
     * @returns {Promise} - Response dari server
     */
    async fetchWithRetry(endpoint, options = {}) {
      const url = `${this.baseURL}${endpoint}`;
      
      const attempt = async (retryNum) => {
        try {
          const response = await fetch(url, options);
          
          if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
          }
          
          const data = await response.json();
          this.retryCount = 0; // Reset counter on success
          return data;
        } catch (err) {
          console.warn(`API attempt ${retryNum + 1} failed:`, err);
          
          if (retryNum < this.maxRetries) {
            // Exponential backoff with jitter
            const jitter = Math.random() * 1000;
            const delay = 2000 * Math.pow(2, retryNum) + jitter;
            
            console.log(`Retrying in ${Math.round(delay / 1000)} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return attempt(retryNum + 1);
          } else {
            console.error("Max retries reached:", err);
            throw err;
          }
        }
      };
      
      return attempt(0);
    }
  
    /**
     * Login user
     * @param {string} name - Nama pengguna
     * @param {string} avatar - URL avatar
     * @returns {Promise} - User data
     */
    async login(name, avatar) {
      return this.fetchWithRetry('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, avatar })
      });
    }
  
    /**
     * Mendapatkan semua pertanyaan quiz
     * @returns {Promise} - Array of questions
     */
    async getQuestions() {
      return this.fetchWithRetry('/quiz/questions');
    }
  
    /**
     * Submit jawaban
     * @param {Object} answerData - Data jawaban
     * @returns {Promise} - Response with score
     */
    async submitAnswer(answerData) {
      return this.fetchWithRetry('/quiz/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(answerData)
      });
    }
  
    /**
     * Mendapatkan status quiz
     * @param {string} userId - ID pengguna
     * @returns {Promise} - Quiz state and participants
     */
    async getQuizState(userId) {
      return this.fetchWithRetry(`/quiz/state?userId=${userId}`);
    }
  
    /**
     * Mendapatkan leaderboard
     * @param {string} userId - Optional user ID untuk highlight
     * @returns {Promise} - Leaderboard data
     */
    async getLeaderboard(userId) {
      const endpoint = userId ? `/quiz/leaderboard?userId=${userId}` : '/quiz/leaderboard';
      return this.fetchWithRetry(endpoint);
    }
  
    /**
     * Update status pengguna
     * @param {string} userId - ID pengguna
     * @param {string} status - Status baru ("waiting", "active", "finished")
     * @returns {Promise} - Response
     */
    async updateUserStatus(userId, status) {
      return this.fetchWithRetry('/quiz/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, status })
      });
    }
  
    /**
     * Mendapatkan statistik pengguna
     * @param {string} userId - ID pengguna
     * @returns {Promise} - Statistics data
     */
    async getStatistics(userId) {
      return this.fetchWithRetry(`/quiz/statistics?userId=${userId}`);
    }
  
    /**
     * Admin login
     * @param {string} adminKey - Admin key
     * @returns {Promise} - Response with participants
     */
    async adminLogin(adminKey) {
      return this.fetchWithRetry('/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminKey })
      });
    }
  
    /**
     * Memulai quiz
     * @param {string} adminKey - Admin key
     * @returns {Promise} - Response
     */
    async startQuiz(adminKey) {
      return this.fetchWithRetry('/admin/start-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminKey })
      });
    }
  
    /**
     * Mengakhiri quiz
     * @param {string} adminKey - Admin key
     * @returns {Promise} - Response
     */
    async endQuiz(adminKey) {
      return this.fetchWithRetry('/admin/end-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminKey })
      });
    }
  
    /**
     * Reset quiz
     * @param {string} adminKey - Admin key
     * @returns {Promise} - Response
     */
    async resetQuiz(adminKey) {
      return this.fetchWithRetry('/admin/reset-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminKey })
      });
    }
  }
  
  // Export instance
  const api = new APIClient();
  export default api;