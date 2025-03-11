// js/components/leaderboard.js
let currentUser;
let leaderboardData;

/**
 * Leaderboard Component
 */
class LeaderboardComponent {
  constructor(user, data) {
    // Save data
    currentUser = user;
    leaderboardData = data;
    
    // Elements
    this.leaderboardPage = document.getElementById('leaderboardPage');
    this.btnShare = document.getElementById('btnShare');
    this.btnRestartFinal = document.getElementById('btnRestartFinal');
    this.shareModal = document.getElementById('shareModal');
    this.closeShareModal = document.getElementById('closeShareModal');
    this.btnCopyLink = document.getElementById('btnCopyLink');
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize leaderboard
   */
  init() {
    // Show page
    if (this.leaderboardPage) {
      this.leaderboardPage.classList.remove('hidden');
    }
    
    // Populate leaderboard data
    this.populateLeaderboard();
    
    // Add event listeners
    if (this.btnShare) {
      this.btnShare.addEventListener('click', this.showShareModal.bind(this));
    }
    
    if (this.btnRestartFinal) {
      this.btnRestartFinal.addEventListener('click', () => {
        window.location.reload();
      });
    }
    
    if (this.closeShareModal) {
      this.closeShareModal.addEventListener('click', this.hideShareModal.bind(this));
    }
    
    if (this.btnCopyLink) {
      this.btnCopyLink.addEventListener('click', this.copyShareLink.bind(this));
    }
  }
  
  /**
   * Populate leaderboard with data
   */
  populateLeaderboard() {
    // Elements for podium
    const podiumElements = {
      firstPlace: {
        avatar: document.getElementById('firstPlaceAvatar'),
        name: document.getElementById('firstPlaceName'),
        score: document.getElementById('firstPlaceScore')
      },
      secondPlace: {
        avatar: document.getElementById('secondPlaceAvatar'),
        name: document.getElementById('secondPlaceName'),
        score: document.getElementById('secondPlaceScore')
      },
      thirdPlace: {
        avatar: document.getElementById('thirdPlaceAvatar'),
        name: document.getElementById('thirdPlaceName'),
        score: document.getElementById('thirdPlaceScore')
      }
    };
    
    // Update podium
    if (leaderboardData[0] && podiumElements.firstPlace.avatar) {
      podiumElements.firstPlace.avatar.innerHTML = `<img src="${leaderboardData[0].avatar}" alt="1st">`;
      podiumElements.firstPlace.name.textContent = leaderboardData[0].name;
      podiumElements.firstPlace.score.textContent = leaderboardData[0].score;
    }
    
    if (leaderboardData[1] && podiumElements.secondPlace.avatar) {
      podiumElements.secondPlace.avatar.innerHTML = `<img src="${leaderboardData[1].avatar}" alt="2nd">`;
      podiumElements.secondPlace.name.textContent = leaderboardData[1].name;
      podiumElements.secondPlace.score.textContent = leaderboardData[1].score;
    }
    
    if (leaderboardData[2] && podiumElements.thirdPlace.avatar) {
      podiumElements.thirdPlace.avatar.innerHTML = `<img src="${leaderboardData[2].avatar}" alt="3rd">`;
      podiumElements.thirdPlace.name.textContent = leaderboardData[2].name;
      podiumElements.thirdPlace.score.textContent = leaderboardData[2].score;
    }
    
    // Update table
    const tbody = document.querySelector("#leaderboardTable tbody");
    if (tbody) {
      tbody.innerHTML = "";
      
      // Limit to 20 entries for performance
      const displayLimit = Math.min(leaderboardData.length, 20);
      
      // Skip podium entries
      for (let index = 3; index < displayLimit; index++) {
        const entry = leaderboardData[index];
        const tr = document.createElement("tr");
        
        // Highlight current user
        if (entry.userId === currentUser.id) {
          tr.className = "current-user";
        }
        
        // Add data
        const rankTd = document.createElement("td");
        rankTd.textContent = index + 1;
        
        const nameTd = document.createElement("td");
        nameTd.textContent = entry.name;
        
        const scoreTd = document.createElement("td");
        scoreTd.textContent = entry.score;
        
        const timeTd = document.createElement("td");
        timeTd.textContent = "-";
        
        tr.appendChild(rankTd);
        tr.appendChild(nameTd);
        tr.appendChild(scoreTd);
        tr.appendChild(timeTd);
        tbody.appendChild(tr);
      }
      
      // Show "more entries" row if needed
      if (leaderboardData.length > displayLimit) {
        const tr = document.createElement("tr");
        tr.className = "more-entries";
        const td = document.createElement("td");
        td.colSpan = 4;
        td.textContent = `...dan ${leaderboardData.length - displayLimit} peserta lainnya`;
        tr.appendChild(td);
        tbody.appendChild(tr);
      }
    }
    
    // Update share modal
    this.updateShareModal();
  }
  
  /**
   * Update share modal with user data
   */
  updateShareModal() {
    const shareAvatar = document.getElementById('shareAvatar');
    const shareUsername = document.getElementById('shareUsername');
    const shareScore = document.getElementById('shareScore');
    
    if (shareAvatar) {
      shareAvatar.src = currentUser.avatar;
    }
    
    if (shareUsername) {
      shareUsername.textContent = currentUser.name;
    }
    
    if (shareScore) {
      // Find user's score in leaderboard
      const userEntry = leaderboardData.find(entry => entry.userId === currentUser.id);
      const score = userEntry ? userEntry.score : 0;
      shareScore.textContent = `Score: ${score}`;
    }
  }
  
  /**
   * Show share modal
   */
  showShareModal() {
    if (this.shareModal) {
      this.shareModal.classList.remove('hidden');
    }
  }
  
  /**
   * Hide share modal
   */
  hideShareModal() {
    if (this.shareModal) {
      this.shareModal.classList.add('hidden');
    }
  }
  
  /**
   * Copy share link to clipboard
   */
  copyShareLink() {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        if (this.btnCopyLink) {
          this.btnCopyLink.innerHTML = '<i class="fas fa-check"></i><span>Tersalin!</span>';
          setTimeout(() => {
            this.btnCopyLink.innerHTML = '<i class="fas fa-link"></i><span>Copy Link</span>';
          }, 2000);
        }
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        alert('Gagal menyalin link');
      });
  }
}

/**
 * Initialize leaderboard with user and data
 * @param {Object} user - Current user
 * @param {Array} data - Leaderboard data
 */
export const initLeaderboard = (user, data) => {
  return new LeaderboardComponent(user, data);
}; 
