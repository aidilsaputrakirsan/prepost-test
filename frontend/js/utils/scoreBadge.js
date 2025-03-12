// js/utils/scoreBadge.js
function updateScoreBadge(score, totalQuestions) {
    const scoreContainer = document.querySelector('.score-container');
    const scoreBadge = document.getElementById('scoreBadge');
    
    if (scoreContainer && scoreBadge) {
      // Calculate percentage
      const maxScore = totalQuestions * 15; // 10 base + 5 max bonus
      const percentage = (score / maxScore) * 100;
      
      // Show badge based on percentage
      if (percentage >= 90) {
        scoreBadge.innerHTML = '<i class="fas fa-crown"></i>';
        scoreBadge.style.background = 'linear-gradient(135deg, #FFD700, #FFC107)';
        scoreContainer.classList.add('show-badge');
      } else if (percentage >= 75) {
        scoreBadge.innerHTML = '<i class="fas fa-medal"></i>';
        scoreBadge.style.background = 'linear-gradient(135deg, #C0C0C0, #E0E0E0)';
        scoreContainer.classList.add('show-badge');
      } else if (percentage >= 60) {
        scoreBadge.innerHTML = '<i class="fas fa-award"></i>';
        scoreBadge.style.background = 'linear-gradient(135deg, #CD7F32, #E8A66B)';
        scoreContainer.classList.add('show-badge');
      } else {
        scoreContainer.classList.remove('show-badge');
      }
    }
  }
  
  export { updateScoreBadge };