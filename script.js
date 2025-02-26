/* script.js */

// Ganti dengan URL web app Google Apps Script yang sudah Anda deploy
const backendUrl = 'https://script.google.com/macros/s/AKfycbyf-snE06iVSTg7B0NaSG2riYfHM8c43RxO2k0PhI1Qn8eC_PgvTM-MspPVeovYOlYJ/exec';

let currentUser = null;
let questions = [];
let currentQuestionIndex = 0;
let questionStartTime = 0;
let timerInterval = null;

// DOM Elements
const landingDiv = document.getElementById('landing');
const loginDiv = document.getElementById('login');
const quizDiv = document.getElementById('quiz');
const leaderboardDiv = document.getElementById('leaderboard');

const btnStart = document.getElementById('btnStart');
const btnLogin = document.getElementById('btnLogin');
const btnNext = document.getElementById('btnNext');
const btnRestart = document.getElementById('btnRestart');

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const questionText = document.getElementById('question-text');
const optionsDiv = document.getElementById('options');
const timerSpan = document.getElementById('timeElapsed');
const leaderboardTableBody = document.querySelector('#leaderboardTable tbody');

// Event Listeners
btnStart.addEventListener('click', () => {
  landingDiv.classList.add('hidden');
  loginDiv.classList.remove('hidden');
});

btnLogin.addEventListener('click', () => {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  if (!name || !email) {
    alert("Please enter both name and email.");
    return;
  }
  loginUser(name, email);
});

btnNext.addEventListener('click', () => {
  submitAnswer();
});

btnRestart.addEventListener('click', () => {
  window.location.reload();
});

// Functions

function loginUser(name, email) {
  fetch(backendUrl, {
    method: 'POST',
    body: JSON.stringify({
      action: 'login',
      name: name,
      email: email
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      currentUser = data.user; // { id, name, email }
      loginDiv.classList.add('hidden');
      startQuiz();
    } else {
      alert("Login failed: " + data.message);
    }
  })
  .catch(err => {
    console.error(err);
    alert("Error connecting to server.");
  });
}

function startQuiz() {
  // Ambil soal post-test dari backend
  fetch(backendUrl, {
    method: 'POST',
    body: JSON.stringify({
      action: 'getQuestions'
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      questions = data.questions;
      if (questions.length > 0) {
        currentQuestionIndex = 0;
        showQuestion();
        quizDiv.classList.remove('hidden');
      } else {
        alert("No questions available.");
      }
    } else {
      alert("Failed to load questions.");
    }
  })
  .catch(err => {
    console.error(err);
    alert("Error connecting to server.");
  });
}

function showQuestion() {
  if (currentQuestionIndex >= questions.length) {
    // Selesai, tampilkan leaderboard
    quizDiv.classList.add('hidden');
    showLeaderboard();
    return;
  }
  
  clearInterval(timerInterval);
  const question = questions[currentQuestionIndex];
  questionText.textContent = question.soal;
  optionsDiv.innerHTML = '';
  
  // Buat tombol opsi (A, B, C, D)
  ['A', 'B', 'C', 'D'].forEach(optionKey => {
    if (question['opsi' + optionKey]) {
      const btn = document.createElement('button');
      btn.textContent = question['opsi' + optionKey];
      btn.dataset.option = optionKey;
      btn.addEventListener('click', () => {
        // Tandai jawaban yang dipilih dan nonaktifkan tombol opsi lainnya
        Array.from(optionsDiv.children).forEach(child => child.disabled = true);
        btn.classList.add('selected');
      });
      optionsDiv.appendChild(btn);
    }
  });
  
  // Reset dan mulai timer untuk soal ini
  timerSpan.textContent = '0';
  questionStartTime = Date.now();
  timerInterval = setInterval(() => {
    const seconds = Math.floor((Date.now() - questionStartTime) / 1000);
    timerSpan.textContent = seconds;
  }, 1000);
}

function submitAnswer() {
  const selectedBtn = optionsDiv.querySelector('button.selected');
  if (!selectedBtn) {
    alert("Please select an answer.");
    return;
  }
  const selectedOption = selectedBtn.dataset.option;
  const question = questions[currentQuestionIndex];
  const timeTaken = (Date.now() - questionStartTime) / 1000; // dalam detik
  
  fetch(backendUrl, {
    method: 'POST',
    body: JSON.stringify({
      action: 'submitAnswer',
      userId: currentUser.id,
      questionId: question.id,
      answer: selectedOption,
      timeTaken: timeTaken
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      currentQuestionIndex++;
      showQuestion();
    } else {
      alert("Failed to submit answer: " + data.message);
    }
  })
  .catch(err => {
    console.error(err);
    alert("Error connecting to server.");
  });
}

function showLeaderboard() {
  fetch(backendUrl, {
    method: 'POST',
    body: JSON.stringify({
      action: 'getLeaderboard'
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      const leaderboard = data.leaderboard;
      leaderboardTableBody.innerHTML = '';
      leaderboard.forEach((entry, index) => {
        const tr = document.createElement('tr');
        const rankTd = document.createElement('td');
        rankTd.textContent = index + 1;
        const nameTd = document.createElement('td');
        nameTd.textContent = entry.name;
        const scoreTd = document.createElement('td');
        scoreTd.textContent = entry.score;
        tr.appendChild(rankTd);
        tr.appendChild(nameTd);
        tr.appendChild(scoreTd);
        leaderboardTableBody.appendChild(tr);
      });
      leaderboardDiv.classList.remove('hidden');
    } else {
      alert("Failed to load leaderboard.");
    }
  })
  .catch(err => {
    console.error(err);
    alert("Error connecting to server.");
  });
}
