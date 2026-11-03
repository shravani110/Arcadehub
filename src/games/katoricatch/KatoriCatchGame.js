// KatoriCatchGame.js - High-End Metallic Thali Platter Catch Game
import { KatoriCatchRenderer } from './KatoriCatchRenderer.js';
import { soundManager } from '../../sound/SoundManager.js';

export class KatoriCatchGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    this.highScore = parseInt(localStorage.getItem('katoricatch_high_score') || '0', 10);
    this.goal = 40;

    this.initDOM();
    this.initEffects();
    this.renderer = new KatoriCatchRenderer(this.canvas);
    this.resetState();
    this.initEvents();
    this.startLoop();
  }

  initDOM() {
    const isMuted = soundManager.isMuted();

    this.container.innerHTML = `
      <div class="game-wrapper katoricatch-wrapper">
        <canvas id="katoricatch-canvas"></canvas>

        <div class="katoricatch-header-container">
          <!-- Horizontal Line 1: Back on left, Game Name in center, Sound on right -->
          <div class="katoricatch-top-bar">
            <button class="icon-btn" id="katoricatch-back-btn" title="Back to Hub">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <h1 class="katoricatch-title">KATORI CATCH</h1>
            <button class="icon-btn" id="katoricatch-sound-btn" title="Toggle Sound">
              ${isMuted 
                ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
                : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>'}
            </button>
          </div>

          <!-- Horizontal Line 2 (below): Lives, Banked, Chain, Score -->
          <div class="katoricatch-hud">
            <div class="katoricatch-hud-card">
              <span class="katoricatch-hud-lbl">LIVES</span>
              <span class="katoricatch-hud-val" id="katoricatch-lives-val" style="color: #ff4d6d;">❤️❤️❤️</span>
            </div>
            <div class="katoricatch-hud-card">
              <span class="katoricatch-hud-lbl">BANKED</span>
              <span class="katoricatch-hud-val" id="katoricatch-banked-val">0 / 40</span>
            </div>
            <div class="katoricatch-hud-card">
              <span class="katoricatch-hud-lbl">CHAIN</span>
              <span class="katoricatch-hud-val" id="katoricatch-combo-val">0×</span>
            </div>
            <div class="katoricatch-hud-card">
              <span class="katoricatch-hud-lbl">SCORE</span>
              <span class="katoricatch-hud-val" id="katoricatch-score-val">0</span>
            </div>
          </div>
        </div>

        <div id="katoricatch-hint" class="katoricatch-hint">
          Slide thali to catch katoris dead-centre! Rim catches ricochet!
        </div>

        <!-- Victory / Game Over Modal -->
        <div id="katoricatch-modal-overlay" class="modal-overlay hidden">
          <div class="modal-card">
            <div class="modal-badge-crown" id="katoricatch-modal-icon">🏆</div>
            <h2 id="katoricatch-modal-title" class="modal-title">ALL 40 BANKED!</h2>
            <p id="katoricatch-modal-msg" class="modal-desc">Flawless thali control and lightning reflexes!</p>
            <div class="stats-grid">
              <div class="stat-box">
                <span class="stat-lbl">FINAL SCORE</span>
                <span class="stat-val" id="katoricatch-modal-score">0</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">KATORIS BANKED</span>
                <span class="stat-val" id="katoricatch-modal-banked">0 / 40</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">BEST CHAIN</span>
                <span class="stat-val" id="katoricatch-modal-combo">0×</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">HIGH SCORE</span>
                <span class="stat-val" id="katoricatch-modal-best">0</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-primary" id="katoricatch-retry-btn">Play Again</button>
              <button class="btn-secondary" id="katoricatch-exit-btn">Arcade Hub</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#katoricatch-canvas');
    this.livesValEl = this.container.querySelector('#katoricatch-lives-val');
    this.bankedValEl = this.container.querySelector('#katoricatch-banked-val');
    this.comboValEl = this.container.querySelector('#katoricatch-combo-val');
    this.scoreValEl = this.container.querySelector('#katoricatch-score-val');
    this.hintEl = this.container.querySelector('#katoricatch-hint');
    this.modalEl = this.container.querySelector('#katoricatch-modal-overlay');
  }

  initEffects() {
    this.particles = [];
    this.pops = [];
    this.screenShake = 0;

    this.effects = {
      pop: (x, y, text, color = '#83c5be', size = 18) => {
        this.pops.push({ x, y, text, color, size, age: 0 });
      },
      burst: (x, y, color = '#83c5be', count = 14, speed = 180, size = 4) => {
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = speed * (0.35 + Math.random() * 0.75);
          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 0,
            max: 0.45 + Math.random() * 0.45,
            color,
            size: size * (0.6 + Math.random() * 0.8),
            grav: 260
          });
        }
      },
      sparks: (x, y, count = 16) => {
        for (let i = 0; i < count; i++) {
          const angle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
          const spd = 140 + Math.random() * 220;
          const colors = ['#ffffff', '#ffd166', '#f4a261', '#e76f51'];
          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 0,
            max: 0.35 + Math.random() * 0.25,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 2.2 + Math.random() * 2.2,
            grav: 450,
            isSpark: true
          });
        }
      },
      render: (ctx) => {
        // Floating Text Pops
        for (let i = this.pops.length - 1; i >= 0; i--) {
          const p = this.pops[i];
          const progress = p.age / 0.8;
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - progress);
          ctx.fillStyle = p.color;
          ctx.font = `800 ${p.size}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.85)';
          ctx.shadowBlur = 8;
          ctx.fillText(p.text, p.x, p.y - progress * 40);
          ctx.restore();
        }

        // Particle sparks & metallic gleams
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const pt = this.particles[i];
          const alpha = 1 - pt.life / pt.max;
          ctx.save();
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          if (pt.isSpark) {
            ctx.ellipse(pt.x, pt.y, pt.size * alpha * 1.5, pt.size * alpha * 0.7, Math.atan2(pt.vy, pt.vx), 0, Math.PI * 2);
          } else {
            ctx.arc(pt.x, pt.y, Math.max(1, pt.size * alpha), 0, Math.PI * 2);
          }
          ctx.fill();
          ctx.restore();
        }
      }
    };
  }

  resetState() {
    this.score = 0;
    this.bestChain = 0;
    this.targetThaliX = (this.canvas.width || 400) / 2;
    this.lastThaliX = this.targetThaliX;

    this.state = {
      thaliX: this.targetThaliX,
      thaliTilt: 0,
      thaliRecoilY: 0,
      thaliRecoilVel: 0,
      thaliWobble: 0,
      shockwaves: [],
      ambientGlowT: 0,
      katoris: [],
      spawnT: 0.15,
      caught: 0,
      goal: this.goal,
      lives: 3,
      combo: 0,
      speedTier: 1,
      flash: 0
    };

    this.gameOver = false;
    this.gameWon = false;

    this.updateHUD();
    this.resizeCanvas();
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.floor(rect.width || this.container.clientWidth);
    const h = Math.floor(rect.height || this.container.clientHeight);
    this.renderer.resize(w, h);
    if (this.state) {
      this.targetThaliX = Math.min(Math.max(66, this.targetThaliX), w - 66);
      this.state.thaliX = this.targetThaliX;
    }
  }

  initEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());

    this.container.querySelector('#katoricatch-back-btn').addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    const soundBtn = this.container.querySelector('#katoricatch-sound-btn');
    soundBtn.addEventListener('click', () => {
      const isMuted = soundManager.toggleMute();
      soundBtn.innerHTML = isMuted
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
        : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>';
    });

    this.container.querySelector('#katoricatch-retry-btn').addEventListener('click', () => {
      this.modalEl.classList.add('hidden');
      this.resetState();
    });

    this.container.querySelector('#katoricatch-exit-btn').addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    this.keysHeld = {};

    this.boundKeyDown = (e) => {
      this.keysHeld[e.code] = true;
      if (e.code === 'Escape') {
        this.destroy();
        if (this.onExit) this.onExit();
      }
    };
    this.boundKeyUp = (e) => {
      this.keysHeld[e.code] = false;
    };
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);

    // Thali Movement Controls
    const handleMove = (clientX) => {
      if (this.gameOver || this.gameWon) return;
      if (this.hintEl) this.hintEl.style.opacity = '0';
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      this.targetThaliX = Math.min(Math.max(66, x), this.canvas.width - 66);
    };

    this.boundMouseMove = (e) => handleMove(e.clientX);
    this.boundTouchMove = (e) => {
      if (e.touches[0]) {
        e.preventDefault();
        handleMove(e.touches[0].clientX);
      }
    };

    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('touchmove', this.boundTouchMove, { passive: false });
  }

  startLoop() {
    this.running = true;
    let lastTime = performance.now();

    const loop = (currentTime) => {
      if (!this.running) return;

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      this.update(dt);
      this.render();

      if (this.running) {
        this.animId = requestAnimationFrame(loop);
      }
    };

    this.animId = requestAnimationFrame(loop);
  }

  update(dt) {
    if (this.gameOver || this.gameWon) return;

    // Keyboard steering (ArrowLeft / KeyA / ArrowRight / KeyD)
    const keySpeed = 620;
    if (this.keysHeld['ArrowLeft'] || this.keysHeld['KeyA']) {
      if (this.hintEl) this.hintEl.style.opacity = '0';
      this.targetThaliX = Math.max(66, this.targetThaliX - keySpeed * dt);
    }
    if (this.keysHeld['ArrowRight'] || this.keysHeld['KeyD']) {
      if (this.hintEl) this.hintEl.style.opacity = '0';
      this.targetThaliX = Math.min(this.canvas.width - 66, this.targetThaliX + keySpeed * dt);
    }

    this.state.flash = Math.max(0, this.state.flash - dt * 3);
    this.screenShake = Math.max(0, this.screenShake - dt * 50);

    const W = this.canvas.width;
    const H = this.canvas.height;
    const thaliY = H - 128;

    // Smooth Thali Interpolation & Tilt Physics
    const vx = (this.targetThaliX - this.state.thaliX) * 18;
    this.state.thaliX += (this.targetThaliX - this.state.thaliX) * Math.min(1, dt * 22);
    this.state.thaliTilt = Math.max(-0.25, Math.min(0.25, vx * 0.0008));

    // Thali Recoil Spring & Rim Vibration Physics
    const recoilDiff = 0 - this.state.thaliRecoilY;
    this.state.thaliRecoilVel += recoilDiff * 200 * dt;
    this.state.thaliRecoilVel *= Math.max(0, 1 - 18 * dt);
    this.state.thaliRecoilY += this.state.thaliRecoilVel * dt;
    this.state.thaliWobble = Math.max(0, this.state.thaliWobble - dt * 28);
    this.state.ambientGlowT = (this.state.ambientGlowT || 0) + dt;

    // Update Expanding Shockwaves
    for (let s = this.state.shockwaves.length - 1; s >= 0; s--) {
      const sw = this.state.shockwaves[s];
      sw.r += 260 * dt;
      sw.alpha = Math.max(0, 0.9 * (1 - sw.r / sw.maxR));
      if (sw.r >= sw.maxR) this.state.shockwaves.splice(s, 1);
    }

    // Dynamic Spawner based on Speed Tier
    this.state.speedTier = 1 + Math.floor(this.state.caught / 8);
    this.state.spawnT -= dt;

    if (this.state.spawnT <= 0) {
      const interval = Math.max(0.5, 1.35 - this.state.speedTier * 0.12) * (0.75 + Math.random() * 0.5);
      this.state.spawnT = interval;

      this.state.katoris.push({
        x: 40 + Math.random() * (W - 80),
        y: -24,
        vx: (Math.random() - 0.5) * 110,
        vy: 65 + this.state.speedTier * 28,
        tumblePhase: Math.random() * Math.PI * 2,
        tumbleSpeed: (Math.random() < 0.5 ? 1 : -1) * (4 + Math.random() * 5),
        wobbleAngle: (Math.random() - 0.5) * 0.4,
        gold: Math.random() < 0.08,
        dead: false
      });
    }

    // Update Katoris Physics
    for (let i = this.state.katoris.length - 1; i >= 0; i--) {
      const k = this.state.katoris[i];
      k.vy += 620 * dt;
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      k.tumblePhase += (k.tumbleSpeed || 3) * dt;

      // Trailing golden sparkles for 24K katoris in flight
      if (k.gold && Math.random() < 0.35) {
        this.particles.push({
          x: k.x + (Math.random() - 0.5) * 16,
          y: k.y + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 30,
          vy: -20 - Math.random() * 30,
          life: 0,
          max: 0.35,
          color: '#ffe596',
          size: 2.5,
          grav: 80,
          isSpark: false
        });
      }

      // Left & Right Wall Metal Bounce
      if (k.x < 18 && k.vx < 0) {
        k.vx *= -0.75;
        k.tumbleSpeed = -k.tumbleSpeed;
        soundManager.playTone(500, 0.05, 400);
      } else if (k.x > W - 18 && k.vx > 0) {
        k.vx *= -0.75;
        k.tumbleSpeed = -k.tumbleSpeed;
        soundManager.playTone(500, 0.05, 400);
      }

      // Thali Catch & Ricochet Detection
      const dx = k.x - this.state.thaliX;
      if (k.vy > 0 && k.y > thaliY - 12 && k.y < thaliY + 18 && Math.abs(dx) < 66) {
        if (Math.abs(dx) < 36) {
          // Dead-Centre Bank Catch!
          this.state.caught++;
          this.state.combo++;
          this.bestChain = Math.max(this.bestChain, this.state.combo);

          // Thali downward elastic recoil
          this.state.thaliRecoilY = 8;
          this.state.thaliRecoilVel = 50;

          // Shockwave burst ring
          this.state.shockwaves.push({
            x: this.state.thaliX,
            y: thaliY,
            r: 10,
            maxR: 65,
            alpha: 0.9,
            gold: k.gold
          });

          const multiplier = Math.min(5, 1 + Math.floor(this.state.combo / 5));
          const pts = (k.gold ? 100 : 20) * multiplier;
          this.score += pts;

          this.updateHUD();
          this.effects.burst(k.x, thaliY, k.gold ? '#ffd166' : '#83c5be', 16, 170, 4);
          this.effects.pop(k.x, thaliY - 32, `+${pts} ${k.gold ? '🌟' : ''}`, k.gold ? '#ffd166' : '#83c5be', k.gold ? 22 : 17);

          soundManager.playTone(560 + Math.min(420, this.state.combo * 24), 0.09, 880);

          if (k.gold) {
            this.screenShake = 6;
          }

          this.state.katoris.splice(i, 1);

          if (this.state.caught >= this.state.goal) {
            this.handleGameOver(true);
            return;
          }
          continue;
        } else {
          // Rim Ricochet Bounce!
          k.vy = -Math.max(190, k.vy * 0.55);
          k.vx = dx > 0 ? Math.abs(k.vx) + 130 : -Math.abs(k.vx) - 130;
          k.y = thaliY - 12;
          k.tumbleSpeed = (k.vx > 0 ? 1 : -1) * (10 + Math.random() * 8);

          // Thali high frequency metallic vibration
          this.state.thaliWobble = 6;

          this.effects.sparks(k.x, thaliY, 16);
          this.effects.pop(k.x, thaliY - 24, 'Ting! ⚡', '#e29578', 15);
          soundManager.playMetalClink();
        }
      }

      // Dropped onto Kitchen Floor
      if (k.y > H - 30) {
        this.state.katoris.splice(i, 1);
        this.state.combo = 0;
        this.state.lives--;
        this.state.flash = 1.0;
        this.screenShake = 12;
        this.updateHUD();

        soundManager.playNoise(0.22, 900, 100);

        if (this.state.lives <= 0) {
          this.handleGameOver(false);
          return;
        }
      }
    }

    // Update Particles & Pops
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life += dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += pt.grav * dt;
      if (pt.life >= pt.max) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i];
      p.age += dt;
      if (p.age >= 0.8) {
        this.pops.splice(i, 1);
      }
    }
  }

  updateHUD() {
    if (this.livesValEl) {
      const hearts = '❤️'.repeat(Math.max(0, this.state.lives));
      this.livesValEl.textContent = hearts || '💀';
    }
    if (this.bankedValEl) {
      this.bankedValEl.textContent = `${this.state.caught} / ${this.state.goal}`;
    }
    if (this.comboValEl) {
      this.comboValEl.textContent = `${this.state.combo}×`;
    }
    if (this.scoreValEl) {
      this.scoreValEl.textContent = this.score;
    }
  }

  render() {
    const ctx = this.renderer.ctx;
    ctx.save();

    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake;
      const dy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(dx, dy);
    }

    this.renderer.render(this.state, this.effects);
    ctx.restore();
  }

  handleGameOver(won) {
    if (!this.running) return;
    this.gameOver = !won;
    this.gameWon = won;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('katoricatch_high_score', this.highScore);
    }

    const modalTitle = this.container.querySelector('#katoricatch-modal-title');
    const modalMsg = this.container.querySelector('#katoricatch-modal-msg');
    const modalIcon = this.container.querySelector('#katoricatch-modal-icon');
    const modalScore = this.container.querySelector('#katoricatch-modal-score');
    const modalBanked = this.container.querySelector('#katoricatch-modal-banked');
    const modalCombo = this.container.querySelector('#katoricatch-modal-combo');
    const modalBest = this.container.querySelector('#katoricatch-modal-best');

    if (!modalTitle || !modalScore || !modalIcon) return;

    if (won) {
      modalIcon.textContent = '🏆';
      modalTitle.textContent = 'ALL 40 BANKED!';
      modalMsg.textContent = 'Masterful precision and reflexes with the thali platter!';
      soundManager.playTone(523, 0.25, 1046);
    } else {
      modalIcon.textContent = '💔';
      modalTitle.textContent = 'RUN OVER!';
      modalMsg.textContent = 'Three katoris hit the floor. Bank them dead-centre!';
      soundManager.playNoise(0.5, 400, 80);
    }

    modalScore.textContent = this.score;
    if (modalBanked) modalBanked.textContent = `${this.state.caught} / ${this.state.goal}`;
    if (modalCombo) modalCombo.textContent = `${this.bestChain}×`;
    if (modalBest) modalBest.textContent = this.highScore;

    if (this.modalEl) this.modalEl.classList.remove('hidden');
  }

  destroy() {
    this.running = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('touchmove', this.boundTouchMove);
  }
}
