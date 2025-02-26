/* script.js */

// Ganti dengan URL web app Google Apps Script yang sudah Anda deploy
const backendUrl = 'https://script.google.com/macros/s/AKfycbwLYq4oQS4fxuWuh62Xu2rfFsEuHxOXC0OiwKvqt4zgluNIVyiQWjgJXnDUj7IYrNnY/exec';

let currentUser = null;
let questions = [];
let currentQuestionIndex = 0;
let timerInterval = null;
let timerCount = 15;

// DOM Elements
const landingDiv = document.getElementById('landing');
const loginDiv = document.getElementById('login');
const quizDiv = document.getElementById('quiz');
const leaderboardDiv = document.getElementById('leaderboard');

const btnStart = document.getElementById('btnStart');
const btnLogin = document.getElementById('btnLogin');
const btnNext = document.getElementById('btnNext');
const btnRestart = document.getElementById('btnRestart');
const toggleThemeBtn = document.getElementById('toggleTheme');

const nameInput = document.getElementById('name');
const questionText = document.getElementById('question-text');
const optionsDiv = document.getElementById('options');
const timerSpan = document.getElementById('timeLeft');
const leaderboardTableBody = document.querySelector('#leaderboardTable tbody');

// Event Listeners
btnStart.addEventListener('click', () => {
  landingDiv.classList.add('hidden');
  loginDiv.classList.remove('hidden');
});

btnLogin.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!name) {
    alert("Please enter your name.");
    return;
  }
  loginUser(name);
});

btnNext.addEventListener('click', () => {
  submitAnswer();
});

btnRestart.addEventListener('click', () => {
  window.location.reload();
});

toggleThemeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

// Particle Effect Setup
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particlesArray = [];
const numberOfParticles = 100;

function initParticles() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  particlesArray = [];
  for (let i = 0; i < numberOfParticles; i++) {
    particlesArray.push(new Particle());
  }
}

function Particle() {
  this.x = Math.random() * canvas.width;
  this.y = Math.random() * canvas.height;
  this.size = Math.random() * 3 + 1;
  this.speedX = Math.random() * 1 - 0.5;
  this.speedY = Math.random() * 1 - 0.5;
  this.color = 'rgba(255,255,255,0.8)';
}

Particle.prototype.update = function() {
  this.x += this.speedX;
  this.y += this.speedY;
  
  // Pembungkusan partikel ketika mencapai tepi layar
  if (this.x < 0) this.x = canvas.width;
  if (this.x > canvas.width) this.x = 0;
  if (this.y < 0) this.y = canvas.height;
  if (this.y > canvas.height) this.y = 0;
}

Particle.prototype.draw = function() {
  ctx.fillStyle = this.color;
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
  ctx.fill();
}

function handleParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < particlesArray.length; i++) {
    particlesArray[i].update();
    particlesArray[i].draw();
  }
  requestAnimationFrame(handleParticles);
}

window.addEventListener('resize', () => {
  initParticles();
});

initParticles();
handleParticles();

// Quiz Functions
function loginUser(name) {
  fetch(backendUrl, {
    method: 'POST',
    body: JSON.stringify({
      action: 'login',
      name: name
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      currentUser = data.user; // { id, name }
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
        quizDiv.classList.remove('hidden');
        showQuestion();
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
  clearInterval(timerInterval);
  timerCount = 15;
  timerSpan.textContent = timerCount;

  if (currentQuestionIndex >= questions.length) {
    quizDiv.classList.add('hidden');
    showLeaderboard();
    return;
  }
  
  const question = questions[currentQuestionIndex];
  questionText.textContent = question.soal;
  optionsDiv.innerHTML = '';
  
  ['A', 'B', 'C', 'D'].forEach(optionKey => {
    if (question['opsi' + optionKey]) {
      const btn = document.createElement('button');
      btn.textContent = question['opsi' + optionKey];
      btn.dataset.option = optionKey;
      btn.classList.add('btn');
      btn.addEventListener('click', () => {
        Array.from(optionsDiv.children).forEach(child => child.disabled = true);
        btn.classList.add('selected');
      });
      optionsDiv.appendChild(btn);
    }
  });
  
  timerInterval = setInterval(() => {
    timerCount--;
    timerSpan.textContent = timerCount;
    if (timerCount <= 0) {
      clearInterval(timerInterval);
      submitAnswer();
    }
  }, 1000);
}

function submitAnswer() {
  clearInterval(timerInterval);
  
  const selectedBtn = optionsDiv.querySelector('button.selected');
  const selectedOption = selectedBtn ? selectedBtn.dataset.option : "";
  const question = questions[currentQuestionIndex];
  const timeTaken = 15 - timerCount;
  
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
