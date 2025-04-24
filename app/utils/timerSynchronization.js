// app/utils/timerSynchronization.js
/**
 * Utilitas untuk mengelola timer kuis dengan pendekatan hybrid client-server
 * yang tetap berjalan lancar bahkan dengan koneksi internet lambat
 */

export class QuizTimer {
    constructor(options = {}) {
      // Konfigurasi timer
      this.quizId = options.quizId;
      this.questionId = null;
      this.timeLimit = 0;
      this.serverTimeLeft = 0;
      this.localStartTime = 0;
      this.timerInterval = null;
      this.onTick = options.onTick || (() => {});
      this.onComplete = options.onComplete || (() => {});
      this.updateFrequency = options.updateFrequency || 200; // Miliseconds
      this.serverCheckInterval = options.serverCheckInterval || 2000; // Check server setiap 2 detik
      this.serverCheckTimer = null;
      this.lastServerSync = 0;
      this.useFallbackTimer = options.useFallbackTimer !== false;
      this.debug = options.debug || false;
    }
  
    /**
     * Mulai timer berdasarkan data dari server dan jalankan timer lokal sebagai fallback
     * @param {Object} questionData - Data dari server dengan timeLeft dan questionId
     */
    start(questionData) {
      this.stop(); // Pastikan timer sebelumnya dihentikan
      
      if (!questionData) return;
      
      this.questionId = questionData.id;
      this.timeLimit = questionData.timeLimit;
      this.serverTimeLeft = questionData.timeLeft || questionData.timeLimit;
      this.localStartTime = Date.now();
      this.lastServerSync = Date.now();
      
      if (this.debug) {
        console.log(`[QuizTimer] Started timer for question ${this.questionId}:`, {
          timeLimit: this.timeLimit,
          serverTimeLeft: this.serverTimeLeft
        });
      }
      
      // Mulai interval lokal untuk update UI sering
      this.timerInterval = setInterval(() => {
        // Hitung waktu tersisa berdasarkan timer lokal
        const elapsed = (Date.now() - this.localStartTime) / 1000;
        const localTimeLeft = Math.max(0, this.serverTimeLeft - elapsed);
        
        // Kirim update ke UI
        this.onTick(Math.ceil(localTimeLeft)); // Bulatkan ke atas untuk UX yang lebih baik
        
        // Jika timer sudah habis, berhenti dan panggil callback
        if (localTimeLeft <= 0) {
          this.stop();
          this.onComplete();
        }
      }, this.updateFrequency);
      
      // Mulai pengecekan server secara berkala jika diaktifkan
      if (this.useFallbackTimer) {
        this.startServerCheck();
      }
    }
    
    /**
     * Update timer dari server
     * @param {number} newTimeLeft - Waktu tersisa dari server (detik)
     */
    updateFromServer(newTimeLeft) {
      if (newTimeLeft === undefined) return;
      
      // Update timestamp sinkronisasi server
      this.lastServerSync = Date.now();
      
      // Perbarui timer hanya jika ini tampaknya valid (tidak reset ke nilai yang tidak masuk akal)
      // Periksa terhadap local timer untuk deteksi inkonsistensi
      const elapsed = (Date.now() - this.localStartTime) / 1000;
      const localTimeLeft = Math.max(0, this.serverTimeLeft - elapsed);
      
      // Hanya terima pembaruan server jika:
      // 1. Ini adalah pembaruan pertama ATAU
      // 2. Nilainya masuk akal (tidak terlalu jauh dari perkiraan lokal)
      const isReasonableUpdate = 
        Math.abs(newTimeLeft - localTimeLeft) < 3 || // dalam 3 detik toleransi
        this.serverTimeLeft === this.timeLimit; // pembaruan pertama
      
      if (isReasonableUpdate) {
        // Perbarui serverTimeLeft dan reset local timer
        this.serverTimeLeft = newTimeLeft;
        this.localStartTime = Date.now();
        
        if (this.debug) {
          console.log(`[QuizTimer] Updated from server: ${newTimeLeft}s`);
        }
      } else if (this.debug) {
        console.warn(`[QuizTimer] Rejected unreasonable server update: ${newTimeLeft}s vs local ${localTimeLeft}s`);
      }
    }
    
    /**
     * Mulai pengecekan server secara berkala
     */
    startServerCheck() {
      if (this.serverCheckTimer) clearTimeout(this.serverCheckTimer);
      
      this.serverCheckTimer = setInterval(async () => {
        try {
          // Periksa apakah sudah lama tidak ada pembaruan server
          const now = Date.now();
          const syncElapsed = (now - this.lastServerSync) / 1000;
          
          // Jika sudah 5+ detik tidak ada update dari server, 
          // coba ambil data timer dari server langsung
          if (syncElapsed > 5) {
            const response = await fetch(`/api/quiz/${this.quizId}/timer-update`);
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data.timeLeft !== undefined) {
                this.updateFromServer(data.data.timeLeft);
              }
            }
          }
        } catch (err) {
          console.error("[QuizTimer] Error checking server:", err);
        }
      }, this.serverCheckInterval);
    }
    
    /**
     * Hentikan timer dan bersihkan interval
     */
    stop() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      
      if (this.serverCheckTimer) {
        clearInterval(this.serverCheckTimer);
        this.serverCheckTimer = null;
      }
      
      if (this.debug) {
        console.log("[QuizTimer] Timer stopped");
      }
    }
  }
  
  /**
   * Membuat dan mengembalikan instance QuizTimer baru
   */
  export function createQuizTimer(options) {
    return new QuizTimer(options);
  }