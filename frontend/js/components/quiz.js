// js/components/quiz.js
import api from '../api.js';
import config from '../config.js';
import { showResults } from './results.js';

let currentUser;
let questions = [];
let currentQuestionIndex = 0;
let totalScore = 0;
let timerInterval;

/**
 * Quiz Component
 */
class QuizComponent {
  constructor(user) {
    // Save user
    currentUser = user;
    
    // Elements
    this.quizPage = document.getElementById('quiz');
    this.userAvatar = document.getElementById('userAvatar');
    this.userName = document.getElementById('userName');
    this.questionTextEl = document.getElementById('question-text');
    this.optionsContainer = document.getElementById('options');
    this.timeLeftEl = document.getElementById('timeLeft');
    this.currentQuestionEl = document.getElementById('currentQuestion');
    this.totalQuestionsEl = document.getElementById('totalQuestions');
    this.progressFill = document.querySelector('.progress-fill');
    
    // State
    this.timerDuration = config.quiz.timerDuration || 15;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize quiz
   */
  async init() {
    // Update user info
    if (this.userAvatar) {
      this.userAvatar.src = currentUser.avatar;
    }
    if (this.userName) {
      this.userName.textContent = currentUser.name;
    }
    
    // Show quiz page
    if (this.quizPage) {
      this.quizPage.classList.remove('hidden');
    }
    
    // Load questions
    await this.loadQuestions();
    
    // Reset quiz state
    currentQuestionIndex = 0;
    totalScore = 0;
    
    // Start quiz
    this.updateProgress();
    this.showQuestion();
  }
  
  /**
   * Load questions from server
   */
  async loadQuestions() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.textContent = 'Memuat soal...';
    document.body.appendChild(loadingIndicator);
    
    try {
      const response = await api.getQuestions();
      
      if (response.status === 'success') {
        questions = response.questions;
        
        if (this.totalQuestionsEl) {
          this.totalQuestionsEl.textContent = questions.length;
        }
        
        if (questions.length === 0) {
          throw new Error('Tidak ada soal tersedia');
        }
      } else {
        throw new Error(response.message || 'Gagal mengambil soal');
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      alert("Gagal memuat soal. " + error.message);
    } finally {
      loadingIndicator.remove();
    }
  }
  
  /**
   * Show current question
   */
  showQuestion() {
    if (currentQuestionIndex >= questions.length) {
      this.endQuiz();
      return;
    }
    
    const currentQ = questions[currentQuestionIndex];
    
    if (this.currentQuestionEl) {
      this.currentQuestionEl.textContent = currentQuestionIndex + 1;
    }
    
    if (this.questionTextEl) {
      this.questionTextEl.textContent = currentQ.soal;
      // Animasi fade-in pertanyaan
      this.questionTextEl.classList.remove('animate__fadeIn');
      void this.questionTextEl.offsetWidth; // Trigger reflow
      this.questionTextEl.classList.add('animate__fadeIn');
    }
    
    if (this.optionsContainer) {
      this.optionsContainer.innerHTML = "";
      this.optionsContainer.classList.remove('animate__fadeIn');
      void this.optionsContainer.offsetWidth; // Trigger reflow
      this.optionsContainer.classList.add('animate__fadeIn');
      
      // Tambahkan delay kecil agar animasi pertanyaan dan opsi berbeda
      setTimeout(() => {
        ["A", "B", "C", "D"].forEach(option => {
          if (currentQ["opsi" + option]) {
            const btn = document.createElement("button");
            btn.className = "btn option-btn";
            btn.textContent = currentQ["opsi" + option];
            btn.dataset.option = option; // Tambahkan data-option untuk CSS
            btn.addEventListener("click", () => this.handleOptionSelect(btn));
            this.optionsContainer.appendChild(btn);
            
            // Animasi staggered untuk opsi
            setTimeout(() => {
              btn.style.transform = "translateY(0)";
              btn.style.opacity = "1";
            }, 100 * ["A", "B", "C", "D"].indexOf(option));
          }
        });
      }, 200);
    }
    
    this.resetTimer();
  }
  
  /**
   * Handle option selection
   * @param {HTMLElement} button - Selected option button
   */
  handleOptionSelect(button) {
    // Disable all buttons
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => btn.disabled = true);
    
    // Highlight selected button with ripple effect
    button.classList.add("selected");
    button.classList.add("submitting");
    
    // Tambahkan efek klik ripple
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    button.appendChild(ripple);
    
    // Get button dimensions for ripple
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    // Position the ripple
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size/2}px`;
    ripple.style.top = `${event.clientY - rect.top - size/2}px`;
    
    // Submit answer
    this.submitAnswer(button.dataset.option);
    
    // Hapus ripple setelah animasi selesai
    setTimeout(() => {
      if (ripple && ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 500);
  }
  
  /**
   * Submit answer to server
   * @param {string} selectedOption - Selected option (A, B, C, D)
   */
  async submitAnswer(selectedOption) {
    // Clear timer
    clearInterval(timerInterval);
    
    const currentQ = questions[currentQuestionIndex];
    const timeTaken = this.timerDuration - parseInt(this.timeLeftEl?.textContent || 0);
    
    try {
      const response = await api.submitAnswer({
        userId: currentUser.id,
        questionId: currentQ.id,
        answer: selectedOption,
        timeTaken,
        questionNumber: currentQuestionIndex + 1,
        totalQuestions: questions.length
      });
      
      if (response.status === 'success') {
        // Add score from this question to total
        totalScore += response.score;
        
        // Highlight correct/incorrect answer
        const selectedButton = document.querySelector(`.option-btn[data-option="${selectedOption}"]`);
        if (selectedButton) {
          selectedButton.classList.remove('submitting');
          selectedButton.classList.add(response.isCorrect ? 'correct' : 'incorrect');
          
          // Add animation for correct/incorrect
          if (response.isCorrect) {
            selectedButton.innerHTML += '<span class="answer-icon correct">✓</span>';
          } else {
            selectedButton.innerHTML += '<span class="answer-icon incorrect">✗</span>';
          }
        }
        
        // Show all correct answers if answer was incorrect
        if (!response.isCorrect) {
          const correctOption = currentQ.jawaban;
          const correctButton = document.querySelector(`.option-btn[data-option="${correctOption}"]`);
          if (correctButton && correctButton !== selectedButton) {
            correctButton.classList.add('correct');
            correctButton.innerHTML += '<span class="answer-icon correct">✓</span>';
          }
        }
        
        // Move to next question after delay
        setTimeout(() => {
          currentQuestionIndex++;
          this.updateProgress();
          this.showQuestion();
        }, 1500); // Increased delay to show the correct answer
      } else {
        throw new Error(response.message || 'Gagal submit jawaban');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert("Terjadi kesalahan. Mencoba lagi...");
      
      // Re-enable buttons
      const optionButtons = document.querySelectorAll('.option-btn');
      optionButtons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('submitting');
      });
      
      // Restart timer
      this.resetTimer();
    }
  }
  
  /**
   * Update progress bar
   */
  updateProgress() {
    if (!this.progressFill) return;
    
    const percent = (currentQuestionIndex / questions.length) * 100;
    this.progressFill.style.width = percent + "%";
    
    // Add animation class if not already there
    if (!this.progressFill.classList.contains('animate-progress')) {
      this.progressFill.classList.add('animate-progress');
    }
  }
  
  /**
   * Reset timer for current question
   */
  resetTimer() {
    clearInterval(timerInterval);
    
    if (!this.timeLeftEl) return;
    
    let timeLeft = this.timerDuration;
    this.timeLeftEl.textContent = timeLeft;
    this.updateTimerCircle(timeLeft);
    
    timerInterval = setInterval(() => {
      timeLeft--;
      this.timeLeftEl.textContent = timeLeft;
      this.updateTimerCircle(timeLeft);
      
      // Change color when time is running out
      if (timeLeft <= 5) {
        this.timeLeftEl.style.color = '#fa5252';
      } else {
        this.timeLeftEl.style.color = '';
      }
      
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        this.submitAnswer(""); // Submit empty answer on timeout
      }
    }, 1000);
  }
  
  /**
   * Update timer circle animation
   * @param {number} timeLeft - Time left in seconds
   */
  updateTimerCircle(timeLeft) {
    const timerProgress = document.querySelector(".timer-progress");
    if (!timerProgress) return;
    
    const totalLength = 283;
    const offset = totalLength - (timeLeft / this.timerDuration) * totalLength;
    timerProgress.style.strokeDashoffset = offset;
    
    // Change color when time is running out
    if (timeLeft <= 5) {
      timerProgress.style.stroke = '#fa5252';
    } else {
      timerProgress.style.stroke = 'url(#timerGradient)';
    }
  }
  
  /**
   * End quiz and show results
   */
  async endQuiz() {
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.textContent = 'Menyelesaikan quiz...';
    document.body.appendChild(loadingIndicator);
    
    try {
      // Update user status to finished
      await api.updateUserStatus(currentUser.id, 'finished');
      
      // Get accurate statistics from server
      const response = await api.getStatistics(currentUser.id);
      
      if (response.status === 'success' && response.statistics) {
        // Hide quiz page
        if (this.quizPage) {
          this.quizPage.classList.add('hidden');
        }
        
        // Show results page with statistics from server
        showResults(currentUser, response.statistics);
        
        // Update score badge if function exists
        if (typeof updateScoreBadge === 'function') {
          updateScoreBadge(
            response.statistics.totalScore, 
            response.statistics.totalQuestions
          );
        }
      } else {
        throw new Error(response.message || 'Gagal mendapatkan statistik');
      }
    } catch (error) {
      console.error('Error ending quiz:', error);
      
      // Use local calculation as fallback
      const correctAnswers = Math.floor(totalScore / 10);
      const statistics = {
        totalQuestions: questions.length,
        correctAnswers,
        incorrectAnswers: questions.length - correctAnswers,
        totalScore
      };
      
      // Hide quiz page
      if (this.quizPage) {
        this.quizPage.classList.add('hidden');
      }
      
      // Show results with local stats
      showResults(currentUser, statistics);
      
      // Update score badge if function exists
      if (typeof updateScoreBadge === 'function') {
        updateScoreBadge(statistics.totalScore, statistics.totalQuestions);
      }
    } finally {
      loadingIndicator.remove();
    }
  }
}

/**
 * Initialize quiz with user data
 * @param {Object} user - User data
 */
export const initQuiz = (user) => {
  return new QuizComponent(user);
};