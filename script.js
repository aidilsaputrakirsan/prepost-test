/* script.js */

// Ganti dengan URL backend (Google Apps Script) jika diperlukan
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
const btnContinue = document.getElementById('btnContinue');
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

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');

// Global Variables
let currentUser = {};
let currentAvatarSeed = 1;
let questions = [];
let currentQuestionIndex = 0;
let timerDuration = 15;
let timerInterval;

// Simulasi load data (ganti dengan fetch jika ingin mengambil data soal dari backend)
function loadQuizData() {
  // Contoh data dummy
  questions = [
    {
      id: 1,
      soal: "Apa ibu kota Indonesia?",
      opsiA: "Jakarta",
      opsiB: "Bandung",
      opsiC: "Surabaya",
      opsiD: "Medan",
      jawaban: "A"
    },
    {
      id: 2,
      soal: "Siapa presiden pertama Indonesia?",
      opsiA: "Soekarno",
      opsiB: "Soeharto",
      opsiC: "Habibie",
      opsiD: "Gus Dur",
      jawaban: "A"
    }
    // Tambahkan soal lain...
  ];
  totalQuestionsEl.textContent = questions.length;
}

// Theme Toggle
themeToggle.addEventListener('change', () => {
  if(themeToggle.checked) {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
});

// Particle Effect (sederhana)
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
const particleCount = 80;
function initParticles() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  particles = [];
  for(let i = 0; i < particleCount; i++) {
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
    if(p.x < 0) p.x = canvas.width;
    if(p.x > canvas.width) p.x = 0;
    if(p.y < 0) p.y = canvas.height;
    if(p.y > canvas.height) p.y = 0;
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
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
  if(name === "") {
    alert("Masukkan nama kamu terlebih dahulu.");
    return;
  }
  currentUser.name = name;
  userNameEl.textContent = name;
  // Simpan avatar user juga
  currentUser.avatar = selectedAvatar.src;
  loginPage.classList.add('hidden');
  loadQuizData();
  startQuiz();
});

// Quiz Logic
function startQuiz() {
  currentQuestionIndex = 0;
  updateProgress();
  showQuestion();
  quizPage.classList.remove('hidden');
}
function showQuestion() {
  if(currentQuestionIndex >= questions.length) {
    endQuiz();
    return;
  }
  const currentQ = questions[currentQuestionIndex];
  currentQuestionEl.textContent = currentQuestionIndex + 1;
  questionTextEl.textContent = currentQ.soal;
  optionsContainer.innerHTML = "";
  ["A", "B", "C", "D"].forEach(option => {
    if(currentQ["opsi" + option]) {
      const btn = document.createElement("button");
      btn.className = "btn btn-primary option-btn";
      btn.textContent = currentQ["opsi" + option];
      btn.dataset.option = option;
      btn.addEventListener("click", () => {
        Array.from(optionsContainer.children).forEach(child => child.disabled = true);
        btn.classList.add("selected");
        // Sederhana: simpan jawaban dan lanjut ke soal berikutnya
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
  // Update lingkaran progress jika diperlukan
  timerInterval = setInterval(() => {
    timeLeft--;
    timeLeftEl.textContent = timeLeft;
    updateTimerCircle(timeLeft);
    if(timeLeft <= 0) {
      clearInterval(timerInterval);
      submitAnswer(""); // kosong jika tidak pilih jawaban
    }
  }, 1000);
}
function updateTimerCircle(timeLeft) {
  const totalLength = 283; // contoh nilai untuk lingkaran
  const offset = totalLength - (timeLeft / timerDuration) * totalLength;
  document.querySelector(".timer-progress").style.strokeDashoffset = offset;
}
function submitAnswer(selectedOption) {
  clearInterval(timerInterval);
  // Simpan jawaban (bisa gunakan fetch ke backend)
  console.log("Jawaban untuk soal", currentQuestionIndex + 1, ":", selectedOption);
  // Tampilkan result sementara (bisa tambahkan animasi, skor, dsb.)
  // Lanjut ke soal berikutnya
  currentQuestionIndex++;
  updateProgress();
  setTimeout(() => {
    showQuestion();
  }, 500);
}
function updateProgress() {
  const percent = ((currentQuestionIndex) / questions.length) * 100;
  progressFill.style.width = percent + "%";
}
function endQuiz() {
  quizPage.classList.add("hidden");
  // Tampilkan halaman final score (dapat ditambahkan perhitungan skor)
  finalScorePage.classList.remove("hidden");
  // Contoh update skor final
  document.getElementById("finalScore").textContent = "80";
  // Jalankan animasi confetti jika diinginkan
}

// Leaderboard & Share Modal (contoh sederhana)
btnShowLeaderboard && btnShowLeaderboard.addEventListener("click", () => {
  finalScorePage.classList.add("hidden");
  leaderboardPage.classList.remove("hidden");
});
btnRestartFinal && btnRestartFinal.addEventListener("click", () => {
  window.location.reload();
});
btnShare && btnShare.addEventListener("click", () => {
  shareModal.classList.remove("hidden");
});
closeShareModal && closeShareModal.addEventListener("click", () => {
  shareModal.classList.add("hidden");
});
btnCopyLink && btnCopyLink.addEventListener("click", () => {
  navigator.clipboard.writeText(window.location.href);
  alert("Link berhasil disalin!");
});
