// -------------------------
// Page Elements
// -------------------------
const loadingPage = document.getElementById('loading');
const landingPage = document.getElementById('landing');
const loginPage = document.getElementById('login');
const waitingRoomPage = document.getElementById('waitingRoom');
const quizPage = document.getElementById('quiz');
const answerResultPage = document.getElementById('answer-result');
const finalScorePage = document.getElementById('final-score');
const leaderboardPage = document.getElementById('leaderboardPage');
const shareModal = document.getElementById('shareModal');
const adminLoginPage = document.getElementById('adminLogin');
const adminPanelPage = document.getElementById('adminPanel');

// -------------------------
// Buttons & Inputs
// -------------------------
const btnStart = document.getElementById('btnStart');
const btnLogin = document.getElementById('btnLogin');
const backToLanding = document.getElementById('backToLanding');
const prevAvatar = document.getElementById('prevAvatar');
const nextAvatar = document.getElementById('nextAvatar');
const nameInput = document.getElementById('name');
const selectedAvatar = document.getElementById('selectedAvatar');
const userAvatar = document.getElementById('userAvatar');
const userNameEl = document.getElementById('userName');
const btnNext = document.getElementById('btnNext');
const btnContinue = document.getElementById('btnContinue');
const btnShowLeaderboard = document.getElementById('btnShowLeaderboard');
const btnRestartFinal = document.getElementById('btnRestartFinal');
const btnShare = document.getElementById('btnShare');
const closeShareModal = document.getElementById('closeShareModal');
const btnCopyLink = document.getElementById('btnCopyLink');

// Admin Elements
const adminLoginLink = document.getElementById('adminLoginLink');
const backToLandingFromAdmin = document.getElementById('backToLandingFromAdmin');
const btnAdminLogin = document.getElementById('btnAdminLogin');
const adminKey = document.getElementById('adminKey');
const adminLogout = document.getElementById('adminLogout');
const btnStartQuiz = document.getElementById('btnStartQuiz');
const btnEndQuiz = document.getElementById('btnEndQuiz');
const btnResetQuiz = document.getElementById('btnResetQuiz');
const btnAdminLeaderboard = document.getElementById('btnAdminLeaderboard');
const quizStatusIndicator = document.getElementById('quizStatusIndicator');
const quizStatusText = document.getElementById('quizStatusText');
const participantCount = document.getElementById('participantCount');
const totalParticipants = document.getElementById('totalParticipants');
const activeParticipants = document.getElementById('activeParticipants');
const finishedParticipants = document.getElementById('finishedParticipants');
const adminProgressList = document.getElementById('adminProgressList');

// Waiting Room Elements
const waitingParticipantsList = document.getElementById('waitingParticipantsList');
const waitingUserAvatar = document.getElementById('waitingUserAvatar');
const waitingUserName = document.getElementById('waitingUserName');
const waitingStatusText = document.getElementById('waitingStatusText');

// Timer & Quiz Elements
const questionContainer = document.getElementById('question-container');
const questionTextEl = document.getElementById('question-text');
const optionsContainer = document.getElementById('options');
const timeLeftEl = document.getElementById('timeLeft');
const currentQuestionEl = document.getElementById('currentQuestion');
const totalQuestionsEl = document.getElementById('totalQuestions');
const progressFill = document.querySelector('.progress-fill');

// Ganti dengan URL backend (Google Apps Script) terbaru
const backendUrl = 'https://script.google.com/macros/s/AKfycby1dk98eZTpjCXBiczAB-8aSLLy2Ig3WAv9a4949auag8hPTUFNY6LSxSUVS2TKwfW4/exec';

// -------------------------
// Global Variables
// -------------------------
let currentUser = {};   // Data pengguna saat ini
let currentAvatarSeed = 1;
let questions = [];     // Data soal dari backend
let currentQuestionIndex = 0;
const timerDuration = 15;
let timerInterval;
let totalScore = 0;     // Akumulasi skor peserta

// Admin variables
let isAdmin = false;
let participantsList = [];
let quizState = "waiting"; // waiting, started, finished
let pollingInterval;
let lastParticipantsHash = '';
let retryCount = 0;
let pollingDelay = 10000; // Mulai dari 10 detik, bukan 3 detik

// Cache variables
let questionsCache = null;
let leaderboardCache = null;
let leaderboardCacheTime = 0;

// -------------------------
// Networking Utilities
// -------------------------

// Fungsi fetch dengan retry dan exponential backoff
function fetchWithRetry(body, maxRetries = 3, initialDelay = 2000) {
  return new Promise((resolve, reject) => {
    const attempt = (retryNum) => {
      fetch(backendUrl, {
        method: 'POST',
        body: JSON.stringify(body)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // Reset retry counter on success
          retryCount = 0;
          resolve(data);
        })
        .catch(err => {
          console.warn(`Attempt ${retryNum + 1} failed:`, err);
          
          if (retryNum < maxRetries) {
            // Exponential backoff with jitter
            const jitter = Math.random() * 1000;
            const delay = initialDelay * Math.pow(2, retryNum) + jitter;
            
            console.log(`Retrying in ${Math.round(delay / 1000)} seconds...`);
            setTimeout(() => attempt(retryNum + 1), delay);
          } else {
            console.error("Max retries reached:", err);
            reject(err);
          }
        });
    };
    
    attempt(0);
  });
}

// -------------------------
// Backend Integration
// -------------------------

// Fungsi untuk login user via backend
function loginUser(name, avatarUrl) {
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.textContent = 'Connecting...';
  document.querySelector('#login .card-content').appendChild(loadingIndicator);
  
  fetchWithRetry({
    action: 'login',
    name: name,
    avatar: avatarUrl
  })
    .then(data => {
      loadingIndicator.remove();
      
      if (data.status === 'success') {
        currentUser = data.user; // { id, name, avatar }
        userNameEl.textContent = currentUser.name;
        userAvatar.src = currentUser.avatar || avatarUrl;
        
        // Cache user di localStorage
        localStorage.setItem('quizUserData', JSON.stringify({
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar || avatarUrl
        }));
        
        // Perubahan alur: ke ruang tunggu
        loginPage.classList.add('hidden');
        
        // Update waiting room UI
        waitingUserAvatar.src = currentUser.avatar || avatarUrl;
        waitingUserName.textContent = currentUser.name;
        
        // Tampilkan waiting room
        waitingRoomPage.classList.remove('hidden');
        
        // Mulai polling untuk cek status quiz
        startPollingQuizState();
      } else {
        alert("Login gagal: " + data.message);
      }
    })
    .catch(err => {
      loadingIndicator.remove();
      console.error(err);
      alert("Terjadi kesalahan koneksi saat login. Silakan coba lagi.");
    });
}

// Fungsi untuk mengambil soal dari backend (Spreadsheet)
function loadQuizData(callback) {
  // Gunakan cache jika tersedia
  if (questionsCache) {
    console.log("Using cached questions data");
    questions = questionsCache;
    totalQuestionsEl.textContent = questions.length;
    if (questions.length > 0) {
      callback();
      return;
    }
  }
  
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.textContent = 'Memuat soal...';
  waitingRoomPage.appendChild(loadingIndicator);
  
  fetchWithRetry({ action: 'getQuestions' })
    .then(data => {
      loadingIndicator.remove();
      
      if (data.status === 'success') {
        questions = data.questions;
        questionsCache = data.questions; // Cache questions
        
        totalQuestionsEl.textContent = questions.length;
        if (questions.length > 0) {
          callback();
        } else {
          alert("Soal tidak tersedia. Silakan periksa sheet SoalPostTest.");
        }
      } else {
        alert("Gagal mengambil soal: " + data.message);
      }
    })
    .catch(err => {
      loadingIndicator.remove();
      console.error(err);
      alert("Terjadi kesalahan koneksi saat mengambil soal. Silakan coba lagi.");
    });
}

// Fungsi untuk submit jawaban ke backend
function submitAnswer(selectedOption) {
  clearInterval(timerInterval);
  const currentQ = questions[currentQuestionIndex];
  const timeTaken = timerDuration - parseInt(timeLeftEl.textContent);
  
  // Disable all buttons while submitting
  const optionButtons = document.querySelectorAll('.option-btn');
  optionButtons.forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.option === selectedOption) {
      btn.classList.add('submitting');
    }
  });
  
  fetchWithRetry({
    action: 'submitAnswer',
    userId: currentUser.id,
    questionId: currentQ.id,
    answer: selectedOption,
    timeTaken: timeTaken,
    questionNumber: currentQuestionIndex + 1,
    totalQuestions: questions.length
  })
    .then(data => {
      if (data.status === 'success') {
        // Tambahkan skor dari soal ini ke totalScore
        totalScore += data.score;
        currentQuestionIndex++;
        updateProgress();
        
        // Highlight correct/incorrect answer
        const selectedButton = document.querySelector(`.option-btn[data-option="${selectedOption}"]`);
        if (selectedButton) {
          selectedButton.classList.remove('submitting');
          selectedButton.classList.add(data.isCorrect ? 'correct' : 'incorrect');
        }
        
        setTimeout(() => {
          showQuestion();
        }, 1000);
      } else {
        alert("Gagal submit jawaban: " + data.message);
        optionButtons.forEach(btn => {
          btn.disabled = false;
          btn.classList.remove('submitting');
        });
      }
    })
    .catch(err => {
      console.error(err);
      alert("Terjadi kesalahan koneksi saat submit jawaban. Mencoba lagi...");
      
      // Re-enable buttons
      optionButtons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('submitting');
      });
      
      // Restart timer
      resetTimer();
    });
}

// Fungsi polling untuk mengecek status quiz
function startPollingQuizState() {
  // Bersihkan interval sebelumnya jika ada
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  // Polling dengan interval adaptif
  pollingInterval = setInterval(() => {
    checkQuizState();
  }, pollingDelay);
  
  // Check pertama kali
  checkQuizState();
}

// Fungsi untuk cek status quiz dari backend
function checkQuizState() {
  const requestData = {
    action: 'getQuizState',
    userId: currentUser?.id
  };
  
  // Jika admin, tambahkan adminKey
  if (isAdmin && adminKey?.value) {
    requestData.adminKey = adminKey.value;
  }
  
  fetchWithRetry(requestData)
    .then(data => {
      if (data.status === 'success') {
        quizState = data.state;
        
        // Jika admin, update UI admin panel
        if (isAdmin) {
          updateAdminUI(data);
        }
        
        // Update daftar peserta di waiting room jika ada perubahan data
        if (data.participants && !isAdmin) {
          // Gunakan hashing sederhana untuk cek perubahan data
          const newHash = hashParticipants(data.participants);
          if (newHash !== lastParticipantsHash) {
            updateWaitingParticipants(data.participants);
            lastParticipantsHash = newHash;
          }
        }
        
        // Jika quiz sudah dimulai dan user bukan admin
        if (quizState === 'started' && !isAdmin) {
          // Hentikan polling
          clearInterval(pollingInterval);
          
          // Ambil soal dari backend dan mulai quiz
          loadQuizData(startQuiz);
          
          // Sembunyikan waiting room
          waitingRoomPage.classList.add('hidden');
        }
        
        // Jika berhasil, kurangi polling delay secara bertahap (min 5 detik)
        if (pollingDelay > 5000) {
          pollingDelay = Math.max(5000, pollingDelay - 1000);
        }
      }
    })
    .catch(err => {
      console.error("Error checking quiz state:", err);
      
      // Tingkatkan interval polling saat error (max 30 detik)
      retryCount++;
      pollingDelay = Math.min(30000, 5000 + (retryCount * 5000));
      
      // Update interval dengan delay baru
      clearInterval(pollingInterval);
      pollingInterval = setInterval(() => {
        checkQuizState();
      }, pollingDelay);
    });
}

// Fungsi untuk mengambil leaderboard dari backend
function fetchLeaderboard() {
  // Check cache, gunakan jika masih fresh (< 60 detik)
  const now = Date.now();
  if (leaderboardCache && (now - leaderboardCacheTime < 60000) && !isAdmin) {
    console.log("Using cached leaderboard data");
    populateLeaderboard(leaderboardCache);
    
    // Jika panggil dari halaman final score, sembunyikan halaman tersebut
    if (!finalScorePage.classList.contains('hidden')) {
      finalScorePage.classList.add("hidden");
    }
    
    leaderboardPage.classList.remove("hidden");
    return;
  }
  
  // Tampilkan indikator loading
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.textContent = 'Memuat leaderboard...';
  document.body.appendChild(loadingIndicator);
  
  const requestData = { action: 'getLeaderboard' };
  if (currentUser?.id) {
    requestData.userId = currentUser.id;
  }
  
  fetchWithRetry(requestData)
    .then(data => {
      loadingIndicator.remove();
      
      if (data.status === 'success') {
        // Cache leaderboard data
        leaderboardCache = data.leaderboard;
        leaderboardCacheTime = Date.now();
        
        populateLeaderboard(data.leaderboard);
        
        // Jika panggil dari halaman final score, sembunyikan halaman tersebut
        if (!finalScorePage.classList.contains('hidden')) {
          finalScorePage.classList.add("hidden");
        }
        
        // Jika panggil dari admin panel, sembunyikan halaman tersebut
        if (!adminPanelPage.classList.contains('hidden')) {
          adminPanelPage.classList.add("hidden");
        }
        
        leaderboardPage.classList.remove("hidden");
      } else {
        alert("Gagal memuat leaderboard: " + data.message);
      }
    })
    .catch(err => {
      loadingIndicator.remove();
      console.error(err);
      alert("Terjadi kesalahan koneksi saat mengambil leaderboard. Silakan coba lagi.");
    });
}

// Utility function untuk hash array participants (deteksi perubahan)
function hashParticipants(participants) {
  return participants.map(p => `${p.id}-${p.status}-${p.progress || 0}`).join('|');
}

// -------------------------
// Quiz Logic
// -------------------------

// Fungsi untuk memulai quiz
function startQuiz() {
  currentQuestionIndex = 0;
  totalScore = 0; // Reset total score
  updateProgress();
  showQuestion();
  quizPage.classList.remove('hidden');
}

// Fungsi untuk menampilkan soal
function showQuestion() {
  if (currentQuestionIndex >= questions.length) {
    endQuiz();
    return;
  }
  
  const currentQ = questions[currentQuestionIndex];
  currentQuestionEl.textContent = currentQuestionIndex + 1;
  questionTextEl.textContent = currentQ.soal;
  optionsContainer.innerHTML = "";
  
  ["A", "B", "C", "D"].forEach(option => {
    if (currentQ["opsi" + option]) {
      const btn = document.createElement("button");
      btn.className = "btn btn-primary option-btn";
      btn.textContent = currentQ["opsi" + option];
      btn.dataset.option = option;
      btn.addEventListener("click", () => {
        Array.from(optionsContainer.children).forEach(child => child.disabled = true);
        btn.classList.add("selected");
        submitAnswer(btn.dataset.option);
      });
      optionsContainer.appendChild(btn);
    }
  });
  
  resetTimer();
}

// Fungsi untuk mengakhiri quiz
function endQuiz() {
  // Show loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.textContent = 'Menyelesaikan quiz...';
  quizPage.appendChild(loadingIndicator);
  
  // Update status user ke 'finished'
  fetchWithRetry({
    action: 'updateUserStatus',
    userId: currentUser.id,
    status: 'finished'
  })
    .then(response => response.json())
    .catch(err => {
      console.error("Error updating status:", err);
    })
    .finally(() => {
      console.log("Mencoba mendapatkan statistik dari server...");
      
      // Ambil statistik yang akurat dari server
      fetchWithRetry({
        action: 'getStatistics',
        userId: currentUser.id
      })
        .then(data => {
          loadingIndicator.remove();
          
          if (data.status === 'success' && data.statistics) {
            // Gunakan data dari server
            displayResults(data.statistics);
          } else {
            console.warn("Tidak bisa mendapatkan statistik, menggunakan perhitungan lokal");
            // Buat perhitungan sederhana jika tidak berhasil mendapatkan data
            const correctAnswers = Math.floor(totalScore / 10);
            const statistics = {
              totalQuestions: questions.length,
              correctAnswers: correctAnswers,
              incorrectAnswers: questions.length - correctAnswers,
              totalScore: totalScore
            };
            displayResults(statistics);
          }
        })
        .catch(err => {
          loadingIndicator.remove();
          console.error("Error getting statistics:", err);
          
          // Fallback jika gagal mendapatkan data
          const correctAnswers = Math.floor(totalScore / 10);
          const statistics = {
            totalQuestions: questions.length,
            correctAnswers: correctAnswers,
            incorrectAnswers: questions.length - correctAnswers,
            totalScore: totalScore
          };
          displayResults(statistics);
        });
    });
}

// Tampilkan hasil di UI
function displayResults(statistics) {
  // Tampilkan halaman hasil
  quizPage.classList.add("hidden");
  finalScorePage.classList.remove("hidden");
  
  // Tampilkan skor total
  document.getElementById("finalScore").textContent = statistics.totalScore;
  
  // Tampilkan jawaban benar dan salah
  document.getElementById("totalCorrect").textContent = statistics.correctAnswers;
  document.getElementById("totalIncorrect").textContent = statistics.incorrectAnswers;
  
  // Tampilkan waktu rata-rata (default 7s jika tidak tersedia)
  const avgTime = statistics.avgTime || "7.0";
  document.getElementById("avgTime").textContent = avgTime + "s";
  
  // Tampilkan konfeti
  if (typeof confetti !== "undefined") {
    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.warn("Confetti error:", err);
      // Load confetti as fallback
      loadConfetti();
    }
  } else {
    // Load confetti dynamically
    loadConfetti();
  }
  
  console.log("Hasil quiz:", statistics);
}

// Fungsi untuk memuat confetti jika tidak tersedia
function loadConfetti() {
  if (typeof confetti === "undefined") {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
    script.onload = function() {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    };
    document.head.appendChild(script);
  }
}

// Fungsi untuk reset timer
function resetTimer() {
  clearInterval(timerInterval);
  let timeLeft = timerDuration;
  timeLeftEl.textContent = timeLeft;
  updateTimerCircle(timeLeft);
  
  timerInterval = setInterval(() => {
    timeLeft--;
    timeLeftEl.textContent = timeLeft;
    updateTimerCircle(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitAnswer(""); // submit jawaban kosong jika tidak memilih
    }
  }, 1000);
}

// Fungsi untuk update lingkaran timer
function updateTimerCircle(timeLeft) {
  const totalLength = 283;
  const offset = totalLength - (timeLeft / timerDuration) * totalLength;
  document.querySelector(".timer-progress").style.strokeDashoffset = offset;
}

// Fungsi untuk update progress bar
function updateProgress() {
  const percent = (currentQuestionIndex / questions.length) * 100;
  progressFill.style.width = percent + "%";
}

// -------------------------
// Admin Functions
// -------------------------

// Update daftar peserta di waiting room
function updateWaitingParticipants(participants) {
  participantsList = participants;
  
  // Update UI
  waitingParticipantsList.innerHTML = '';
  
  // Filter diri sendiri
  const otherParticipants = participants.filter(p => p.id !== currentUser.id);
  
  // Update status teks
  const waitingCount = participants.filter(p => p.status === 'waiting').length;
  waitingStatusText.textContent = `Menunggu admin memulai... (${waitingCount} peserta siap)`;
  
  // Hanya tampilkan maksimal 10 peserta untuk performa
  const displayParticipants = otherParticipants.slice(0, 10);
  
  if (displayParticipants.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'participant-item';
    emptyEl.textContent = 'Belum ada peserta lain';
    waitingParticipantsList.appendChild(emptyEl);
    return;
  }
  
  // Tambahkan peserta ke daftar
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
    waitingParticipantsList.appendChild(itemEl);
  });
  
  // Jika ada lebih banyak peserta yang tidak ditampilkan
  if (otherParticipants.length > 10) {
    const moreEl = document.createElement('div');
    moreEl.className = 'participant-item more-participants';
    moreEl.textContent = `...dan ${otherParticipants.length - 10} peserta lainnya`;
    waitingParticipantsList.appendChild(moreEl);
  }
}

// Update UI admin panel
function updateAdminUI(data) {
  // Update status quiz
  quizStatusText.textContent = data.state === 'waiting' ? 'Menunggu' : 
                              data.state === 'started' ? 'Berjalan' : 'Selesai';
  
  // Update status dot
  quizStatusIndicator.querySelector('.status-dot').className = 'status-dot ' + data.state;
  
  // Update status tombol
  btnStartQuiz.disabled = data.state !== 'waiting';
  btnEndQuiz.disabled = data.state !== 'started';
  
  // Update jumlah peserta
  const participants = data.participants || [];
  participantCount.textContent = `${participants.length} peserta total`;
  
  // Update statistik
  const waitingCount = participants.filter(p => p.status === 'waiting').length;
  const activeCount = participants.filter(p => p.status === 'active').length;
  const finishedCount = participants.filter(p => p.status === 'finished').length;
  
  totalParticipants.textContent = participants.length;
  activeParticipants.textContent = activeCount;
  finishedParticipants.textContent = finishedCount;
  
  // Update progress list, hanya jika ada perubahan (menggunakan hash)
  const newHash = hashParticipants(participants);
  if (newHash !== lastParticipantsHash) {
    updateAdminProgressList(participants);
    lastParticipantsHash = newHash;
  }
}

// Update daftar progress peserta di admin panel
function updateAdminProgressList(participants) {
  adminProgressList.innerHTML = '';
  
  // Jika tidak ada peserta
  if (participants.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'progress-item';
    emptyEl.textContent = 'Belum ada peserta';
    adminProgressList.appendChild(emptyEl);
    return;
  }
  
  // Tampilkan maksimal 25 peserta sekaligus untuk performa
  const displayParticipants = participants.slice(0, 25);
  
  // Tambahkan semua peserta ke daftar
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
    
    // Calculate progress
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
    
    adminProgressList.appendChild(itemEl);
  });
  
  // Jika ada lebih banyak peserta yang tidak ditampilkan
  if (participants.length > 25) {
    const moreEl = document.createElement('div');
    moreEl.className = 'progress-item more-item';
    moreEl.textContent = `...dan ${participants.length - 25} peserta lainnya`;
    adminProgressList.appendChild(moreEl);
  }
}

// Fungsi untuk menampilkan data leaderboard
function populateLeaderboard(leaderboard) {
  // Pastikan minimal ada 1,2,3 data
  const firstPlaceAvatar = document.getElementById('firstPlaceAvatar');
  const firstPlaceName = document.getElementById('firstPlaceName');
  const firstPlaceScore = document.getElementById('firstPlaceScore');
  const secondPlaceAvatar = document.getElementById('secondPlaceAvatar');
  const secondPlaceName = document.getElementById('secondPlaceName');
  const secondPlaceScore = document.getElementById('secondPlaceScore');
  const thirdPlaceAvatar = document.getElementById('thirdPlaceAvatar');
  const thirdPlaceName = document.getElementById('thirdPlaceName');
  const thirdPlaceScore = document.getElementById('thirdPlaceScore');
  
  if (leaderboard[0]) {
    firstPlaceAvatar.innerHTML = `<img src="${leaderboard[0].avatar}" alt="1st">`;
    firstPlaceName.textContent = leaderboard[0].name;
    firstPlaceScore.textContent = leaderboard[0].score;
  }
  if (leaderboard[1]) {
    secondPlaceAvatar.innerHTML = `<img src="${leaderboard[1].avatar}" alt="2nd">`;
    secondPlaceName.textContent = leaderboard[1].name;
    secondPlaceScore.textContent = leaderboard[1].score;
  }
  if (leaderboard[2]) {
    thirdPlaceAvatar.innerHTML = `<img src="${leaderboard[2].avatar}" alt="3rd">`;
    thirdPlaceName.textContent = leaderboard[2].name;
    thirdPlaceScore.textContent = leaderboard[2].score;
  }

  // Lalu tampilkan sisanya di tabel
  const tbody = document.querySelector("#leaderboardTable tbody");
  tbody.innerHTML = "";
  
  // Hanya tampilkan maksimal 20 entri untuk performa
  const displayLimit = Math.min(leaderboard.length, 20);
  
  for (let index = 3; index < displayLimit; index++) {
    const entry = leaderboard[index];
    const tr = document.createElement("tr");
    const rankTd = document.createElement("td");
    rankTd.textContent = index + 1;
    const nameTd = document.createElement("td");
    nameTd.textContent = entry.name;
    const scoreTd = document.createElement("td");
    scoreTd.textContent = entry.score;
    const timeTd = document.createElement("td");
    timeTd.textContent = entry.time || "-";
    tr.appendChild(rankTd);
    tr.appendChild(nameTd);
    tr.appendChild(scoreTd);
    tr.appendChild(timeTd);
    tbody.appendChild(tr);
  }
  
  // Jika ada lebih banyak peserta yang tidak ditampilkan
  if (leaderboard.length > displayLimit) {
    const tr = document.createElement("tr");
    tr.className = "more-entries";
    const td = document.createElement("td");
    td.colSpan = 4;
    td.textContent = `...dan ${leaderboard.length - displayLimit} peserta lainnya`;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
  
  // Update share modal jika user menyelesaikan quiz
  if (!isAdmin && currentUser.id) {
    const shareAvatar = document.getElementById('shareAvatar');
    const shareUsername = document.getElementById('shareUsername');
    const shareScore = document.getElementById('shareScore');
    
    if (shareAvatar) shareAvatar.src = currentUser.avatar;
    if (shareUsername) shareUsername.textContent = currentUser.name;
    if (shareScore) {
      const userScore = leaderboard.find(entry => entry.userId == currentUser.id)?.score || 0;
      shareScore.textContent = `Score: ${userScore}`;
    }
  }
}

// -------------------------
// UI Effects & Interactions
// -------------------------

// Particle Effect - Render hanya jika visible untuk efisiensi
const canvas = document.getElementById('particles');
let particlesActive = false;
let particles = [];
const particleCount = 40; // Kurangi jumlah partikel

function initParticles() {
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  particles = [];
  
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speedX: Math.random() * 1 - 0.5,
      speedY: Math.random() * 1 - 0.5
    });
  }
  
  if (!particlesActive) {
    particlesActive = true;
    animateParticles();
  }
}

function animateParticles() {
  if (!canvas || !particlesActive) return;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  particles.forEach(p => {
    p.x += p.speedX;
    p.y += p.speedY;
    if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width) p.x = 0;
    if (p.y < 0) p.y = canvas.height;
    if (p.y > canvas.height) p.y = 0;
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  if (particlesActive) {
    requestAnimationFrame(animateParticles);
  }
}

// Hanya aktifkan particles ketika landing page terlihat
function toggleParticles() {
  if (landingPage && !landingPage.classList.contains('hidden')) {
    if (!particlesActive) {
      initParticles();
      particlesActive = true;
    }
  } else {
    particlesActive = false;
  }
}

// Avatar Selection
if (prevAvatar && nextAvatar) {
  prevAvatar.addEventListener('click', () => {
    currentAvatarSeed = currentAvatarSeed > 1 ? currentAvatarSeed - 1 : 100;
    updateAvatar();
  });
  
  nextAvatar.addEventListener('click', () => {
    currentAvatarSeed = currentAvatarSeed < 100 ? currentAvatarSeed + 1 : 1;
    updateAvatar();
  });
}

function updateAvatar() {
  const url = `https://api.dicebear.com/6.x/avataaars/svg?seed=${currentAvatarSeed}`;
  selectedAvatar.src = url;
  userAvatar.src = url;
}

// Navigation Transitions
window.addEventListener('load', () => {
  setTimeout(() => {
    loadingPage.classList.add('hidden');
    landingPage.classList.remove('hidden');
    toggleParticles();
    
    // Coba cek di localStorage jika user sudah login sebelumnya
    try {
      const savedUser = localStorage.getItem('quizUserData');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        
        // Konfirmasi mau lanjut pakai user yang sama
        if (confirm(`Lanjutkan sebagai ${userData.name}?`)) {
          currentUser = userData;
          userNameEl.textContent = currentUser.name;
          userAvatar.src = currentUser.avatar;
          
          // Update waiting room UI
          waitingUserAvatar.src = currentUser.avatar;
          waitingUserName.textContent = currentUser.name;
          
          // Langsung ke waiting room
          landingPage.classList.add('hidden');
          waitingRoomPage.classList.remove('hidden');
          
          // Mulai polling
          startPollingQuizState();
        }
      }
    } catch (e) {
      console.warn("Error loading saved user:", e);
    }
  }, 1500);
});

if (btnStart) {
  btnStart.addEventListener('click', () => {
    landingPage.classList.add('hidden');
    loginPage.classList.remove('hidden');
    toggleParticles();
  });
}

if (backToLanding) {
  backToLanding.addEventListener('click', () => {
    loginPage.classList.add('hidden');
    landingPage.classList.remove('hidden');
    toggleParticles();
  });
}

if (btnLogin) {
  btnLogin.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (name === "") {
      alert("Masukkan nama kamu terlebih dahulu.");
      return;
    }
    if (name.length < 3) {
      alert("Nama minimal 3 karakter.");
      return;
    }
    loginUser(name, selectedAvatar.src);
  });
  
  // Enter key untuk login
  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      btnLogin.click();
    }
  });
}

// Admin Link in Landing Page
if (adminLoginLink) {
  adminLoginLink.addEventListener('click', function(e) {
    e.preventDefault();
    landingPage.classList.add('hidden');
    adminLoginPage.classList.remove('hidden');
    toggleParticles();
  });
}

// Back to Landing from Admin
if (backToLandingFromAdmin) {
  backToLandingFromAdmin.addEventListener('click', function() {
    adminLoginPage.classList.add('hidden');
    landingPage.classList.remove('hidden');
    toggleParticles();
  });
}

// Admin Login
if (btnAdminLogin) {
  btnAdminLogin.addEventListener('click', function() {
    const key = adminKey.value.trim();
    if (!key) {
      alert("Mohon masukkan admin key");
      return;
    }
    
    // Tampilkan loading
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.textContent = 'Memeriksa key...';
    adminLoginPage.appendChild(loadingIndicator);
    
    // Verifikasi admin key
    fetchWithRetry({
      action: 'adminLogin',
      adminKey: key
    })
      .then(data => {
        loadingIndicator.remove();
        
        if (data.status === 'success') {
          isAdmin = true;
          
          // Tampilkan admin panel
          adminLoginPage.classList.add('hidden');
          adminPanelPage.classList.remove('hidden');
          
          // Update UI admin
          updateAdminUI(data);
          
          // Mulai polling untuk update status
          startPollingQuizState();
        } else {
          alert("Admin login gagal: " + data.message);
        }
      })
      .catch(err => {
        loadingIndicator.remove();
        console.error(err);
        alert("Terjadi kesalahan koneksi saat login admin.");
      });
  });
}

// Logout admin
if (adminLogout) {
  adminLogout.addEventListener('click', function() {
    isAdmin = false;
    clearInterval(pollingInterval);
    adminPanelPage.classList.add('hidden');
    landingPage.classList.remove('hidden');
    toggleParticles();
  });
}

// Start quiz (admin only)
if (btnStartQuiz) {
  btnStartQuiz.addEventListener('click', function() {
    // Konfirmasi
    if (!confirm("Yakin ingin memulai quiz untuk semua peserta?")) {
      return;
    }
    
    // Disable button saat proses
    btnStartQuiz.disabled = true;
    btnStartQuiz.textContent = "Memulai...";
    
    fetchWithRetry({
      action: 'startQuiz',
      adminKey: adminKey.value
    })
      .then(data => {
        if (data.status === 'success') {
          // Quiz dimulai, update UI
          quizState = 'started';
          btnStartQuiz.disabled = true;
          btnStartQuiz.textContent = "Mulai Quiz";
          btnEndQuiz.disabled = false;
          
          // Update status
          quizStatusText.textContent = 'Berjalan';
          quizStatusIndicator.querySelector('.status-dot').className = 'status-dot started';
        } else {
          alert("Gagal memulai quiz: " + data.message);
          btnStartQuiz.disabled = false;
          btnStartQuiz.textContent = "Mulai Quiz";
        }
      })
      .catch(err => {
        console.error(err);
        alert("Terjadi kesalahan koneksi saat memulai quiz.");
        btnStartQuiz.disabled = false;
        btnStartQuiz.textContent = "Mulai Quiz";
      });
  });
}

// End quiz (admin only)
if (btnEndQuiz) {
  btnEndQuiz.addEventListener('click', function() {
    // Konfirmasi
    if (!confirm("Yakin ingin mengakhiri quiz untuk semua peserta?")) {
      return;
    }
    
    // Disable button saat proses
    btnEndQuiz.disabled = true;
    btnEndQuiz.textContent = "Mengakhiri...";
    
    fetchWithRetry({
      action: 'endQuiz',
      adminKey: adminKey.value
    })
      .then(data => {
        if (data.status === 'success') {
          // Quiz selesai, update UI
          quizState = 'finished';
          btnStartQuiz.disabled = true;
          btnEndQuiz.disabled = true;
          btnEndQuiz.textContent = "Akhiri Quiz";
          
          // Update status
          quizStatusText.textContent = 'Selesai';
          quizStatusIndicator.querySelector('.status-dot').className = 'status-dot finished';
        } else {
          alert("Gagal mengakhiri quiz: " + data.message);
          btnEndQuiz.disabled = false;
          btnEndQuiz.textContent = "Akhiri Quiz";
        }
      })
      .catch(err => {
        console.error(err);
        alert("Terjadi kesalahan koneksi saat mengakhiri quiz.");
        btnEndQuiz.disabled = false;
        btnEndQuiz.textContent = "Akhiri Quiz";
      });
  });
}

// Reset quiz (admin only)
if (btnResetQuiz) {
  btnResetQuiz.addEventListener('click', function() {
    // Konfirmasi
    if (!confirm("AWAS! Yakin ingin mereset quiz? Semua data progress peserta akan dihapus!")) {
      return;
    }
    
    // Konfirmasi kedua untuk keamanan
    if (!confirm("Tindakan ini tidak dapat dibatalkan. Lanjutkan?")) {
      return;
    }
    
    // Disable button saat proses
    btnResetQuiz.disabled = true;
    btnResetQuiz.textContent = "Mereset...";
    
    fetchWithRetry({
      action: 'resetQuiz',
      adminKey: adminKey.value
    })
      .then(data => {
        if (data.status === 'success') {
          // Quiz direset, update UI
          quizState = 'waiting';
          btnStartQuiz.disabled = false;
          btnEndQuiz.disabled = true;
          btnResetQuiz.disabled = false;
          btnResetQuiz.textContent = "Reset Quiz";
          
          // Update status
          quizStatusText.textContent = 'Menunggu';
          quizStatusIndicator.querySelector('.status-dot').className = 'status-dot waiting';
          
          // Reset statistik
          totalParticipants.textContent = '0';
          activeParticipants.textContent = '0';
          finishedParticipants.textContent = '0';
          
          // Reset progress list
          adminProgressList.innerHTML = '<div class="progress-item">Belum ada peserta</div>';
          
          // Reset cache
          questionsCache = null;
          leaderboardCache = null;
        } else {
          alert("Gagal mereset quiz: " + data.message);
          btnResetQuiz.disabled = false;
          btnResetQuiz.textContent = "Reset Quiz";
        }
      })
      .catch(err => {
        console.error(err);
        alert("Terjadi kesalahan koneksi saat mereset quiz.");
        btnResetQuiz.disabled = false;
        btnResetQuiz.textContent = "Reset Quiz";
      });
  });
}

// View leaderboard (admin)
if (btnAdminLeaderboard) {
  btnAdminLeaderboard.addEventListener('click', function() {
    // Dapatkan leaderboard terbaru
    fetchLeaderboard();
  });
}

// Show leaderboard button
if (btnShowLeaderboard) {
  btnShowLeaderboard.addEventListener("click", () => {
    fetchLeaderboard();
  });
}

// Restart button
if (btnRestartFinal) {
  btnRestartFinal.addEventListener("click", () => {
    window.location.reload();
  });
}

// Share button
if (btnShare) {
  btnShare.addEventListener("click", () => {
    shareModal.classList.remove("hidden");
  });
}

// Close share modal
if (closeShareModal) {
  closeShareModal.addEventListener("click", () => {
    shareModal.classList.add("hidden");
  });
}

// Copy link
if (btnCopyLink) {
  btnCopyLink.addEventListener("click", () => {
    navigator.clipboard.writeText(window.location.href);
    btnCopyLink.textContent = "✓ Tersalin!";
    setTimeout(() => {
      btnCopyLink.textContent = "Salin Link";
    }, 2000);
  });
}

// Tambahkan clean up saat halaman ditutup
window.addEventListener('beforeunload', function() {
  // Hentikan polling
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  // Hentikan partikel
  particlesActive = false;
});

// Tambahkan CSS untuk loading indicator dan animasi
(function() {
  const style = document.createElement('style');
  style.textContent = `
    .loading-indicator {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 15px 30px;
      background: rgba(0,0,0,0.8);
      color: white;
      border-radius: 8px;
      z-index: 9999;
      font-weight: bold;
    }
    
    .option-btn.submitting {
      opacity: 0.7;
      animation: pulse 1s infinite;
    }
    
    .option-btn.correct {
      background-color: #28a745 !important;
      border-color: #28a745 !important;
      color: white !important;
    }
    
    .option-btn.incorrect {
      background-color: #dc3545 !important;
      border-color: #dc3545 !important;
      color: white !important;
    }
    
    @keyframes pulse {
      0% { opacity: 0.7; }
      50% { opacity: 1; }
      100% { opacity: 0.7; }
    }
    
    .more-participants, .more-item, .more-entries {
      font-style: italic;
      color: #777;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
})();

// Inisialisasi avatar pada load
window.addEventListener('DOMContentLoaded', () => {
  if (selectedAvatar) {
    updateAvatar();
  }
});