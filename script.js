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

// Theme Toggle Element - Simpan referensinya setelah DOM sudah siap
let themeToggle;

// Ganti dengan URL backend (Google Apps Script) terbaru
const backendUrl = 'https://script.google.com/macros/s/AKfycbx-P6fLDmzeJq9Pa3yFYWNeh9bNI7oMgSyx59ZVL_Sbv7yrKolmXILd1KM22LiLNSNk/exec';

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

// -------------------------
// Theme Functions
// -------------------------

// Tunggu hingga DOM benar-benar dimuat
document.addEventListener('DOMContentLoaded', function() {
  // Tambahkan sedikit penundaan untuk memastikan DOM benar-benar siap
  setTimeout(function() {
    console.log('Inisialisasi tema...');
    
    // Dapatkan referensi ke toggle
    themeToggle = document.getElementById('themeToggle');
    console.log('Elemen toggle ditemukan:', themeToggle);
    
    if (!themeToggle) {
      console.error('Tidak dapat menemukan elemen dengan id "themeToggle"');
      return; // Keluar jika elemen tidak ditemukan
    }
    
    // Periksa tema yang tersimpan
    try {
      const savedTheme = localStorage.getItem('theme');
      console.log('Tema tersimpan:', savedTheme);
      
      if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.checked = true;
        console.log('Tema terang diterapkan');
      }
      
      // Tambahkan event listener
      themeToggle.addEventListener('change', function() {
        console.log('Toggle berubah, checked:', this.checked);
        
        if (this.checked) {
          document.body.classList.add('light-theme');
          localStorage.setItem('theme', 'light');
          console.log('Beralih ke tema terang');
        } else {
          document.body.classList.remove('light-theme');
          localStorage.setItem('theme', 'dark');
          console.log('Beralih ke tema gelap');
        }
      });
      
      console.log('Event listener tema berhasil ditambahkan');
    } catch (error) {
      console.error('Error saat mengatur tema:', error);
    }
  }, 100); // Penundaan kecil 100ms
});

// -------------------------
// Backend Integration
// -------------------------

// Fungsi untuk login user via backend
function loginUser(name, avatarUrl) {
  fetch(backendUrl, {
    method: 'POST',
    body: JSON.stringify({
      action: 'login',
      name: name,
      avatar: avatarUrl
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        currentUser = data.user; // { id, name, avatar }
        userNameEl.textContent = currentUser.name;
        userAvatar.src = currentUser.avatar || avatarUrl;
        
        // Perubahan alur: ke ruang tunggu, bukan langsung quiz
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
      console.error(err);
      alert("Terjadi kesalahan koneksi saat login.");
    });
}

// Fungsi untuk mengambil soal dari backend (Spreadsheet)
function loadQuizData(callback) {
  fetch(backendUrl, {
    method: 'POST',
    body: JSON.stringify({ action: 'getQuestions' })
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        questions = data.questions;
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
      console.error(err);
      alert("Terjadi kesalahan koneksi saat mengambil soal.");
    });
}

// Fungsi untuk submit jawaban ke backend
function submitAnswer(selectedOption) {
  clearInterval(timerInterval);
  const currentQ = questions[currentQuestionIndex];
  const timeTaken = timerDuration - parseInt(timeLeftEl.textContent);
  
  fetch(backendUrl, {
    method: 'POST',
    body: JSON.stringify({
      action: 'submitAnswer',
      userId: currentUser.id,
      questionId: currentQ.id,
      answer: selectedOption,
      timeTaken: timeTaken,
      questionNumber: currentQuestionIndex + 1,
      totalQuestions: questions.length
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        // Tambahkan skor dari soal ini ke totalScore
        totalScore += data.score;
        currentQuestionIndex++;
        updateProgress();
        setTimeout(() => {
          showQuestion();
        }, 500);
      } else {
        alert("Gagal submit jawaban: " + data.message);
      }
    })
    .catch(err => {
      console.error(err);
      alert("Terjadi kesalahan koneksi saat submit jawaban.");
    });
}

// Fungsi polling untuk mengecek status quiz
function startPollingQuizState() {
  // Bersihkan interval sebelumnya jika ada
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  // Polling setiap 3 detik
  pollingInterval = setInterval(() => {
    checkQuizState();
  }, 3000);
  
  // Check pertama kali
  checkQuizState();
}

// Fungsi untuk cek status quiz dari backend
function checkQuizState() {
  fetch(backendUrl, {
    method: 'POST',
    body: JSON.stringify({
      action: 'getQuizState',
      userId: currentUser?.id
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        quizState = data.state;
        
        // Jika admin, update UI admin panel
        if (isAdmin) {
          updateAdminUI(data);
        }
        
        // Update daftar peserta di waiting room
        if (data.participants && !isAdmin) {
          updateWaitingParticipants(data.participants);
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
      }
    })
    .catch(err => {
      console.error("Error checking quiz state:", err);
    });
}

// Fungsi untuk mengambil leaderboard dari backend
function fetchLeaderboard() {
  fetch(backendUrl, {
    method: 'POST',
    body: JSON.stringify({ action: 'getLeaderboard' })
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
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
      console.error(err);
      alert("Terjadi kesalahan koneksi saat mengambil leaderboard.");
    });
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
  // Update status user ke 'finished'
  fetch(backendUrl, {
    method: 'POST',
    body: JSON.stringify({
      action: 'updateUserStatus',
      userId: currentUser.id,
      status: 'finished'
    })
  })
    .then(response => response.json())
    .catch(err => {
      console.error(err);
      // Lanjutkan meskipun ada error
    })
    .finally(() => {
      // Perlu selalu dijalankan, terlepas dari hasil fetch
      // Tampilkan halaman hasil
      quizPage.classList.add("hidden");
      finalScorePage.classList.remove("hidden");
      document.getElementById("finalScore").textContent = totalScore;
      
      // Hitung statistik hasil
      const totalSoal = questions.length;
      const jawabanBenar = Math.round(totalScore / 1000); // Perkiraan jumlah benar (1000 poin per soal benar)
      
      document.getElementById("totalCorrect").textContent = jawabanBenar;
      document.getElementById("totalIncorrect").textContent = totalSoal - jawabanBenar;
      
      // Hitung rata-rata waktu (sekitar 8 detik per soal)
      document.getElementById("avgTime").textContent = (Math.round((timerDuration - 8) * 10) / 10) + "s";
      
      // Tampilkan konfeti
      if (typeof confetti !== "undefined") {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    });
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
  
  if (otherParticipants.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'participant-item';
    emptyEl.textContent = 'Belum ada peserta lain';
    waitingParticipantsList.appendChild(emptyEl);
    return;
  }
  
  // Tambahkan semua peserta ke daftar
  otherParticipants.forEach(participant => {
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
  
  // Update progress list
  updateAdminProgressList(participants);
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
  
  // Tambahkan semua peserta ke daftar
  participants.forEach(participant => {
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
  leaderboard.forEach((entry, index) => {
    // Lewati 3 teratas agar tidak duplikat di tabel
    if (index < 3) return;
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
  });
  
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

// Particle Effect
const canvas = document.getElementById('particles');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let particles = [];
  const particleCount = 80;
  
  function initParticles() {
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
  }
  
  function animateParticles() {
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
    requestAnimationFrame(animateParticles);
  }
  
  window.addEventListener('resize', initParticles);
  initParticles();
  animateParticles();
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
  }, 1500);
});

if (btnStart) {
  btnStart.addEventListener('click', () => {
    landingPage.classList.add('hidden');
    loginPage.classList.remove('hidden');
  });
}

if (backToLanding) {
  backToLanding.addEventListener('click', () => {
    loginPage.classList.add('hidden');
    landingPage.classList.remove('hidden');
  });
}

if (btnLogin) {
  btnLogin.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (name === "") {
      alert("Masukkan nama kamu terlebih dahulu.");
      return;
    }
    loginUser(name, selectedAvatar.src);
  });
}

// Admin Link in Landing Page
if (adminLoginLink) {
  adminLoginLink.addEventListener('click', function(e) {
    e.preventDefault();
    landingPage.classList.add('hidden');
    adminLoginPage.classList.remove('hidden');
  });
}

// Back to Landing from Admin
if (backToLandingFromAdmin) {
  backToLandingFromAdmin.addEventListener('click', function() {
    adminLoginPage.classList.add('hidden');
    landingPage.classList.remove('hidden');
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
    
    // Verifikasi admin key
    fetch(backendUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'adminLogin',
        adminKey: key
      })
    })
      .then(response => response.json())
      .then(data => {
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
  });
}

// Start quiz (admin only)
if (btnStartQuiz) {
  btnStartQuiz.addEventListener('click', function() {
    // Konfirmasi
    if (!confirm("Yakin ingin memulai quiz untuk semua peserta?")) {
      return;
    }
    
    fetch(backendUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'startQuiz',
        adminKey: adminKey.value
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          // Quiz dimulai, update UI
          quizState = 'started';
          btnStartQuiz.disabled = true;
          btnEndQuiz.disabled = false;
          
          // Update status
          quizStatusText.textContent = 'Berjalan';
          quizStatusIndicator.querySelector('.status-dot').className = 'status-dot active';
        } else {
          alert("Gagal memulai quiz: " + data.message);
        }
      })
      .catch(err => {
        console.error(err);
        alert("Terjadi kesalahan koneksi saat memulai quiz.");
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
    
    fetch(backendUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'endQuiz',
        adminKey: adminKey.value
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          // Quiz selesai, update UI
          quizState = 'finished';
          btnStartQuiz.disabled = true;
          btnEndQuiz.disabled = true;
          
          // Update status
          quizStatusText.textContent = 'Selesai';
          quizStatusIndicator.querySelector('.status-dot').className = 'status-dot finished';
        } else {
          alert("Gagal mengakhiri quiz: " + data.message);
        }
      })
      .catch(err => {
        console.error(err);
        alert("Terjadi kesalahan koneksi saat mengakhiri quiz.");
      });
  });
}

// Reset quiz (admin only)
if (btnResetQuiz) {
  btnResetQuiz.addEventListener('click', function() {
    // Konfirmasi
    if (!confirm("Yakin ingin mereset quiz? Semua data progress peserta akan dihapus!")) {
      return;
    }
    
    fetch(backendUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'resetQuiz',
        adminKey: adminKey.value
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          // Quiz direset, update UI
          quizState = 'waiting';
          btnStartQuiz.disabled = false;
          btnEndQuiz.disabled = true;
          
          // Update status
          quizStatusText.textContent = 'Menunggu';
          quizStatusIndicator.querySelector('.status-dot').className = 'status-dot waiting';
          
          // Reset statistik
          totalParticipants.textContent = '0';
          activeParticipants.textContent = '0';
          finishedParticipants.textContent = '0';
          
          // Reset progress list
          adminProgressList.innerHTML = '<div class="progress-item">Belum ada peserta</div>';
        } else {
          alert("Gagal mereset quiz: " + data.message);
        }
      })
      .catch(err => {
        console.error(err);
        alert("Terjadi kesalahan koneksi saat mereset quiz.");
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
    alert("Link berhasil disalin!");
  });
}

// Tambahkan clean up saat halaman ditutup
window.addEventListener('beforeunload', function() {
  // Hentikan polling
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
});