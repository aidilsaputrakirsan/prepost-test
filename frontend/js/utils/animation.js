 // js/utils/animation.js
/**
 * Animation utilities for background effects
 */
class ParticleAnimation {
    constructor(canvasId, options = {}) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      
      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.particleCount = options.particleCount || 40;
      this.active = false;
      this.resizeListener = this.handleResize.bind(this);
      
      // Set canvas size
      this.handleResize();
      window.addEventListener('resize', this.resizeListener);
    }
    
    /**
     * Initialize particles
     */
    init() {
      if (!this.canvas) return;
      
      this.particles = [];
      for (let i = 0; i < this.particleCount; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          size: Math.random() * 3 + 1,
          speedX: Math.random() * 1 - 0.5,
          speedY: Math.random() * 1 - 0.5
        });
      }
    }
    
    /**
     * Start animation
     */
    start() {
      if (this.active || !this.canvas) return;
      
      this.active = true;
      this.init();
      this.animate();
    }
    
    /**
     * Stop animation
     */
    stop() {
      this.active = false;
    }
    
    /**
     * Animation loop
     */
    animate() {
      if (!this.active || !this.canvas) return;
      
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = this.canvas.width;
        if (p.x > this.canvas.width) p.x = 0;
        if (p.y < 0) p.y = this.canvas.height;
        if (p.y > this.canvas.height) p.y = 0;
        
        this.ctx.fillStyle = "rgba(255,255,255,0.2)";
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      });
      
      if (this.active) {
        requestAnimationFrame(this.animate.bind(this));
      }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
      if (!this.canvas) return;
      
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.init();
    }
    
    /**
     * Clean up event listeners
     */
    destroy() {
      window.removeEventListener('resize', this.resizeListener);
      this.stop();
    }
  }
  
  /**
   * Show confetti animation
   * @param {Object} options - Confetti options
   */
  function showConfetti(options = {}) {
    if (typeof confetti !== "undefined") {
      try {
        confetti({
          particleCount: options.particleCount || 100,
          spread: options.spread || 70,
          origin: options.origin || { y: 0.6 },
          ...options
        });
      } catch (err) {
        console.warn("Confetti error:", err);
        loadConfetti();
      }
    } else {
      loadConfetti();
    }
  }
  
  /**
   * Load confetti script dynamically
   */
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
  
  export { ParticleAnimation, showConfetti };