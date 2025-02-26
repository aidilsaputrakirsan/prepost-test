/* script.js */

// Ganti dengan URL backend (Google Apps Script) kamu
const backendUrl = 'https://script.google.com/macros/s/AKfycbwLYq4oQS4fxuWuh62Xu2rfFsEuHxOXC0OiwKvqt4zgluNIVyiQWjgJXnDUj7IYrNnY/exec';

// Page Elements
const loadingPage = document.getElementById('loading');
const landingPage = document.getElementById('landing');
const loginPage = document.getElementById('login');
const quizPage = document.getElementById('quiz');
const answerResultPage = document.getElementById('answer-result');
const finalScorePage = document.getElementById('final-score');
const leaderboardPage = document.getElementById('leaderboardPage');
const shareModal = document.getElementById('shareModal');

// Buttons & Inputs
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
const btnShowLeaderboard = document.getElementById('btnShowLeaderboard');
const btnRestartFinal = document.getElementById('btnRestartFinal');
const btnShare = document.getElementById('btnShare');
const closeShareModal = document.getElementById('closeShareModal');
const btnCopyLink = document.getElementById('btnCopyLink');

// Timer & Quiz Elements
const questionContainer = document.getElementById('question-container');
const questionTextEl = document.getElementById('question-text');
const optionsContainer = document.getElementById('options');
const timeLeftEl = document.getElementById('timeLeft');
const currentQuestionEl = document.getElementById('currentQuestion');
const totalQuestionsEl = document.getElementById('totalQuestions');
const progressFill = document.querySelector('.progress-fill');

// Theme Toggle (jika ingin disediakan)
const themeToggle = document.getElementById('themeToggle');

// Global Variables
let currentUser = {};   // Akan diisi dari backend saat login
let currentAvatarSeed = 1;
let questions = [];     // Data soal akan diambil dari backend (spreadsheet)
let currentQuestionIndex = 0;
const timerDuration = 15;
let timerInterval;

// -------------------------
// Backend Integration
// -------------------------

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
          // Pastikan soal sudah ada sebelum memulai quiz
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
          loginPage.classList.add('hidden');
          // Ambil soal dari backend dan mulai quiz setelah soal selesai dimuat
          loadQuizData(startQuiz);
        } else {
          alert("Login gagal: " + data.message);
        }
      })
      .catch(err => {
        console.error(err);
        alert("Terjadi kesalahan koneksi saat login.");
      });
  }
  
// Fungsi untuk submit jawaban ke backend
function submitAnswer(selectedOption) {
  clearInterval(timerInterval);
  const currentQ = questions[currentQuestionIndex];
  // Hitung waktu yang digunakan: timerDuration - sisa waktu
  const timeTaken = timerDuration - parseInt(timeLeftEl.textContent);
  
  fetch(backendUrl, {
    method: 'POST',
    body: JSON.stringify({
      action: 'submitAnswer',
      userId: currentUser.id,
      questionId: currentQ.id,
      answer: selectedOption,
      timeTaken: timeTaken
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        // Jika ingin menampilkan result per soal, kamu bisa tampilkan di halaman answerResultPage
        // Untuk saat ini, langsung lanjut ke soal berikutnya
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
        finalScorePage.classList.add("hidden");
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
// UI & Quiz Logic
// -------------------------

// Theme Toggle (jika diperlukan)
themeToggle.addEventListener('change', () => {
  if (themeToggle.checked) {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
});

// Particle Effect
const canvas = document.getElementById('particles');
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

// Avatar Selection
prevAvatar.addEventListener('click', () => {
  currentAvatarSeed = currentAvatarSeed > 1 ? currentAvatarSeed - 1 : 100;
  updateAvatar();
});
nextAvatar.addEventListener('click', () => {
  currentAvatarSeed = currentAvatarSeed < 100 ? currentAvatarSeed + 1 : 1;
  updateAvatar();
});
function updateAvatar() {
  const url = `https://api.dicebear.com/6.x/avataaars/svg?seed=${currentAvatarSeed}`;
  selectedAvatar.src = url;
  userAvatar.src = url;
}

// Navigation Transitions
window.addEventListener('load', () => {
  // Simulasi loading
  setTimeout(() => {
    loadingPage.classList.add('hidden');
    landingPage.classList.remove('hidden');
  }, 1500);
});
btnStart.addEventListener('click', () => {
  landingPage.classList.add('hidden');
  loginPage.classList.remove('hidden');
});
backToLanding.addEventListener('click', () => {
  loginPage.classList.add('hidden');
  landingPage.classList.remove('hidden');
});
btnLogin.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (name === "") {
    alert("Masukkan nama kamu terlebih dahulu.");
    return;
  }
  // Panggil backend login
  loginUser(name, selectedAvatar.src);
});

// Quiz Logic
function startQuiz() {
  currentQuestionIndex = 0;
  updateProgress();
  showQuestion();
  quizPage.classList.remove('hidden');
}
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
function resetTimer() {
  clearInterval(timerInterval);
  let timeLeft = timerDuration;
  timeLeftEl.textContent = timeLeft;
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
function updateTimerCircle(timeLeft) {
  const totalLength = 283; // Sesuaikan dengan nilai SVG circle
  const offset = totalLength - (timeLeft / timerDuration) * totalLength;
  document.querySelector(".timer-progress").style.strokeDashoffset = offset;
}
function updateProgress() {
  const percent = (currentQuestionIndex / questions.length) * 100;
  progressFill.style.width = percent + "%";
}
function endQuiz() {
  quizPage.classList.add("hidden");
  // Tampilkan final score (skor final bisa diambil dari backend atau dihitung lokal)
  finalScorePage.classList.remove("hidden");
  // Contoh: set final score statis; sebaiknya integrasikan dengan backend untuk menghitung skor total
  document.getElementById("finalScore").textContent = "80";
  // Jalankan animasi confetti jika diinginkan (pastikan library confetti.js telah dimuat)
  if (typeof confetti !== "undefined") {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }
}

// Leaderboard & Share Modal
if (btnShowLeaderboard) {
  btnShowLeaderboard.addEventListener("click", () => {
    fetchLeaderboard();
  });
}
if (btnRestartFinal) {
  btnRestartFinal.addEventListener("click", () => {
    window.location.reload();
  });
}
if (btnShare) {
  btnShare.addEventListener("click", () => {
    shareModal.classList.remove("hidden");
  });
}
if (closeShareModal) {
  closeShareModal.addEventListener("click", () => {
    shareModal.classList.add("hidden");
  });
}
if (btnCopyLink) {
  btnCopyLink.addEventListener("click", () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link berhasil disalin!");
  });
}

// Fungsi untuk menampilkan data leaderboard
function populateLeaderboard(leaderboard) {
  const tbody = document.querySelector("#leaderboardTable tbody");
  tbody.innerHTML = "";
  leaderboard.forEach((entry, index) => {
    const tr = document.createElement("tr");
    const rankTd = document.createElement("td");
    rankTd.textContent = index + 1;
    const nameTd = document.createElement("td");
    nameTd.textContent = entry.name;
    const scoreTd = document.createElement("td");
    scoreTd.textContent = entry.score;
    const timeTd = document.createElement("td");
    timeTd.textContent = entry.time || "-"; // jika waktu tersedia
    tr.appendChild(rankTd);
    tr.appendChild(nameTd);
    tr.appendChild(scoreTd);
    tr.appendChild(timeTd);
    tbody.appendChild(tr);
  });
}
