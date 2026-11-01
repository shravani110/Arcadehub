// MasalaMemoryGame.js - High-End Musical Spice Memory Game
import { MasalaMemoryRenderer, SPICES } from './MasalaMemoryRenderer.js';
import { soundManager } from '../../sound/SoundManager.js';

export class MasalaMemoryGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    this.highScore = parseInt(localStorage.getItem('masalamemory_high_score') || '0', 10);
    this.maxRounds = 12;

    this.initDOM();
    this.initEffects();
    this.renderer = new MasalaMemoryRenderer(this.canvas);
    this.resetGame();
    this.initEvents();
    this.startLoop();
  }

  initDOM() {
    const isMuted = soundManager.isMuted();

    this.container.innerHTML = `
      <div class="game-wrapper masalamemory-wrapper">
        <canvas id="masalamemory-canvas"></canvas>

        <div class="masalamemory-top-bar">
          <div class="top-controls">
            <button class="icon-btn" id="masalamemory-back-btn" title="Back to Hub">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <button class="icon-btn" id="masalamemory-sound-btn" title="Toggle Sound">
              ${isMuted 
                ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
                : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>'}
            </button>
          </div>

          <div class="masalamemory-hud">
            <div class="masalamemory-hud-card">
              <span class="masalamemory-hud-lbl">LIVES</span>
              <span class="masalamemory-hud-val" id="masalamemory-lives-val" style="color: #ff4d6d; letter-spacing: 2px;">❤️❤️❤️</span>
            </div>
            <div class="masalamemory-hud-card">
              <span class="masalamemory-hud-lbl">ROUND</span>
              <span class="masalamemory-hud-val" id="masalamemory-round-val">1 / 12</span>
            </div>
            <div class="masalamemory-hud-card">
              <span class="masalamemory-hud-lbl">SCORE</span>
              <span class="masalamemory-hud-val" id="masalamemory-score-val">0</span>
            </div>
          </div>
        </div>

        <div id="masalamemory-hint" class="masalamemory-hint">
          Watch the glowing spice sequence, then tap them in the exact order!
        </div>

        <!-- Victory / Game Over Modal -->
        <div id="masalamemory-modal-overlay" class="modal-overlay hidden">
          <div class="modal-card">
            <div class="modal-badge-crown" id="masalamemory-modal-icon">🏆</div>
            <h2 id="masalamemory-modal-title" class="modal-title">MASALA MASTERED!</h2>
            <p id="masalamemory-modal-msg" class="modal-desc">All 12 rounds recalled with aromatic genius!</p>
            <div class="stats-grid">
              <div class="stat-box">
                <span class="stat-lbl">FINAL SCORE</span>
                <span class="stat-val" id="masalamemory-modal-score">0</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">ROUNDS COMPLETED</span>
                <span class="stat-val" id="masalamemory-modal-rounds">12 / 12</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">LONGEST RECALL</span>
                <span class="stat-val" id="masalamemory-modal-longest">12</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">HIGH SCORE</span>
                <span class="stat-val" id="masalamemory-modal-best">0</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-primary" id="masalamemory-retry-btn">Play Again</button>
              <button class="btn-secondary" id="masalamemory-exit-btn">Arcade Hub</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#masalamemory-canvas');
    this.livesValEl = this.container.querySelector('#masalamemory-lives-val');
    this.roundValEl = this.container.querySelector('#masalamemory-round-val');
    this.longestValEl = this.container.querySelector('#masalamemory-longest-val');
    this.scoreValEl = this.container.querySelector('#masalamemory-score-val');
    this.hintEl = this.container.querySelector('#masalamemory-hint');
    this.modalEl = this.container.querySelector('#masalamemory-modal-overlay');
  }

  initEffects() {
    this.particles = [];
    this.pops = [];
    this.screenShake = 0;

    this.effects = {
      pop: (x, y, text, color = '#ffd166', size = 20) => {
        this.pops.push({ x, y, text, color, size, age: 0 });
      },
      burst: (x, y, color = '#ffd166', count = 14, speed = 160, size = 4) => {
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = speed * (0.35 + Math.random() * 0.75);
          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 0,
            max: 0.5 + Math.random() * 0.5,
            color,
            size: size * (0.6 + Math.random() * 0.8),
            grav: 220
          });
        }
      },
      spiceBurst: (x, y, spiceIndex, count = 16) => {
        const spice = SPICES[spiceIndex];
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 70 + Math.random() * 110;
          let grav = -40; // Default float upward like aroma
          let size = 3 + Math.random() * 3;
          let maxLife = 0.6 + Math.random() * 0.5;
          let pColor = spice.fill;

          if (spiceIndex === 0) {
            // Haldi: Soft golden powder clouds
            pColor = Math.random() < 0.5 ? spice.light : spice.fill;
            size = 4 + Math.random() * 4;
            grav = -50;
          } else if (spiceIndex === 1) {
            // Mirchi: Fiery chilli flakes and sparks
            pColor = Math.random() < 0.4 ? '#ff3b30' : Math.random() < 0.7 ? '#ff9500' : '#d00000';
            grav = 80;
            size = 2.5 + Math.random() * 3.5;
          } else if (spiceIndex === 2) {
            // Pudina: Cool herbal mint leaf flecks
            pColor = Math.random() < 0.6 ? '#74c69d' : '#40916c';
            grav = -30;
          } else if (spiceIndex === 3) {
            // Kesar: Saffron threads floating
            pColor = Math.random() < 0.5 ? '#ff7b00' : '#e63946';
            grav = -60;
            size = 2 + Math.random() * 2.5;
          } else if (spiceIndex === 4) {
            // Jamun: Royal purple mist droplets
            pColor = Math.random() < 0.5 ? '#b5838d' : '#6d597a';
            grav = -45;
          } else if (spiceIndex === 5) {
            // Imli: Tangy amber glaze drops
            pColor = Math.random() < 0.6 ? '#e09f3e' : '#9e2a2b';
            grav = 60;
          }

          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 0,
            max: maxLife,
            color: pColor,
            size,
            grav,
            isSpice: true,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 6
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

        // Particle sparks & aroma flecks
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const pt = this.particles[i];
          const alpha = 1 - pt.life / pt.max;
          ctx.save();
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.fillStyle = pt.color;
          if (pt.isSpice && pt.rotSpeed) {
            ctx.translate(pt.x, pt.y);
            ctx.rotate(pt.rot + pt.rotSpeed * pt.life);
            ctx.beginPath();
            ctx.ellipse(0, 0, pt.size * alpha, pt.size * 0.55 * alpha, 0, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, Math.max(1, pt.size * alpha), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
    };
  }

  resetGame() {
    this.score = 0;
    this.longestRecall = 0;
    this.gameOver = false;
    this.gameWon = false;

    this.state = {
      seq: [Math.floor(Math.random() * SPICES.length)],
      phase: 'gap',
      timer: 1.0,
      showIdx: 0,
      lit: -1,
      litT: 0,
      inputIdx: 0,
      round: 1,
      lives: 3,
      flash: 0,
      cx: 0,
      cy: 0,
      r: 0,
      bowlScales: [1, 1, 1, 1, 1, 1],
      bowlScaleVels: [0, 0, 0, 0, 0, 0],
      ripples: [],
      shineAngle: 0,
      candleTime: 0,
      medallionScale: 1.0
    };

    this.updateHUD();
    this.resizeCanvas();
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.floor(rect.width || this.container.clientWidth);
    const h = Math.floor(rect.height || this.container.clientHeight);
    this.renderer.resize(w, h);

    if (this.state) {
      this.state.r = Math.min(w, h) * 0.31;
      this.state.cx = w / 2;
      this.state.cy = h / 2 + 10;
    }
  }

  initEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());

    this.container.querySelector('#masalamemory-back-btn').addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    const soundBtn = this.container.querySelector('#masalamemory-sound-btn');
    soundBtn.addEventListener('click', () => {
      const isMuted = soundManager.toggleMute();
      soundBtn.innerHTML = isMuted
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
        : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>';
    });

    this.container.querySelector('#masalamemory-retry-btn').addEventListener('click', () => {
      this.modalEl.classList.add('hidden');
      this.resetGame();
    });

    this.container.querySelector('#masalamemory-exit-btn').addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    // Touch & Click detection on spice bowls
    const handleTap = (clientX, clientY) => {
      if (this.gameOver || this.gameWon || !this.state) return;
      if (this.state.phase !== 'input') return;

      if (this.hintEl) this.hintEl.style.opacity = '0';

      const rect = this.canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;

      const cx = this.state.cx;
      const cy = this.state.cy;
      const r = this.state.r;

      for (let i = 0; i < SPICES.length; i++) {
        const angle = (i / SPICES.length) * Math.PI * 2 - Math.PI / 2;
        const bx = cx + Math.cos(angle) * r;
        const by = cy + Math.sin(angle) * r;
        const bowlRadius = r * 0.34;

        const dist = Math.hypot(px - bx, py - by);
        if (dist <= bowlRadius) {
          this.handleSpiceSelect(i, bx, by);
          break;
        }
      }
    };

    this.canvas.addEventListener('click', (e) => handleTap(e.clientX, e.clientY));
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches[0]) {
        e.preventDefault();
        handleTap(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    // Keyboard support: 1-6 for spices, Escape to exit
    this.boundKeyDown = (e) => {
      if (e.code === 'Escape') {
        this.destroy();
        if (this.onExit) this.onExit();
        return;
      }

      if (this.gameOver || this.gameWon || !this.state) return;
      if (this.state.phase !== 'input') return;

      const keyNum = parseInt(e.key, 10);
      if (keyNum >= 1 && keyNum <= 6) {
        const spiceIndex = keyNum - 1;
        const angle = (spiceIndex / SPICES.length) * Math.PI * 2 - Math.PI / 2;
        const bx = this.state.cx + Math.cos(angle) * this.state.r;
        const by = this.state.cy + Math.sin(angle) * this.state.r;
        this.handleSpiceSelect(spiceIndex, bx, by);
      }
    };
    window.addEventListener('keydown', this.boundKeyDown);
  }

  triggerBowl(spiceIndex, isPlayer = false) {
    if (!this.state) return;
    this.state.lit = spiceIndex;
    this.state.litT = 0;
    this.state.bowlScales[spiceIndex] = 0.88;
    this.state.bowlScaleVels[spiceIndex] = 2.4;
    this.state.medallionScale = 1.08;

    const angle = (spiceIndex / SPICES.length) * Math.PI * 2 - Math.PI / 2;
    const bx = this.state.cx + Math.cos(angle) * this.state.r;
    const by = this.state.cy + Math.sin(angle) * this.state.r;

    // Expanding brass ripple shockwave
    this.state.ripples.push({
      x: bx,
      y: by,
      r: 10,
      maxR: this.state.r * 0.9,
      alpha: 0.85,
      color: SPICES[spiceIndex].light
    });

    soundManager.playTone(SPICES[spiceIndex].freq, 0.22);
    this.effects.spiceBurst(bx, by, spiceIndex, isPlayer ? 18 : 12);
  }

  handleSpiceSelect(spiceIndex, bx, by) {
    this.triggerBowl(spiceIndex, true);

    const expectedSpice = this.state.seq[this.state.inputIdx];

    if (spiceIndex === expectedSpice) {
      // Correct spice!
      this.state.inputIdx++;
      this.longestRecall = Math.max(this.longestRecall, this.state.inputIdx);
      this.updateHUD();

      // Check if finished sequence for this round
      if (this.state.inputIdx >= this.state.seq.length) {
        const roundPts = 80 * this.state.round + (this.state.seq.length >= 8 ? 100 : 0);
        this.score += roundPts;
        this.effects.pop(this.state.cx, this.state.cy, `+${roundPts} Round Clear! 🎉`, '#ffd166', 22);
        this.effects.burst(this.state.cx, this.state.cy, '#ffd166', 24, 220, 4.5);
        this.updateHUD();

        if (this.state.round >= this.maxRounds) {
          // Completed all 12 rounds!
          this.handleGameOver(true);
        } else {
          this.state.round++;
          this.state.seq.push(Math.floor(Math.random() * SPICES.length));
          this.state.phase = 'gap';
          this.state.timer = 0.9;
          this.updateHUD();
        }
      }
    } else {
      // Wrong spice!
      this.state.lives--;
      this.state.flash = 1.0;
      this.screenShake = 12;
      this.updateHUD();

      soundManager.playTone(160, 0.3, 90);
      this.effects.pop(bx, by, 'Wrong Spice! ✕', '#ef476f', 18);

      if (this.state.lives <= 0) {
        this.handleGameOver(false);
      } else {
        this.state.phase = 'oops';
        this.state.timer = 1.1;
        this.state.inputIdx = 0;
      }
    }
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

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  update(dt) {
    if (this.gameOver || this.gameWon || !this.state) return;

    this.state.flash = Math.max(0, this.state.flash - dt * 3);
    this.screenShake = Math.max(0, this.screenShake - dt * 50);

    // Ambient candle flicker and rim shine rotation
    this.state.candleTime += dt;
    this.state.shineAngle = (this.state.shineAngle + dt * 0.45) % (Math.PI * 2);
    this.state.medallionScale += (1.0 - this.state.medallionScale) * Math.min(1, dt * 8);

    // Spring physics for all 6 spice bowls (tactile depression & rebound)
    for (let i = 0; i < 6; i++) {
      const diff = 1.0 - this.state.bowlScales[i];
      this.state.bowlScaleVels[i] += diff * 120 * dt;
      this.state.bowlScaleVels[i] *= Math.max(0, 1 - 12 * dt);
      this.state.bowlScales[i] += this.state.bowlScaleVels[i] * dt;
    }

    // Update brass expanding ripple shockwaves
    for (let i = this.state.ripples.length - 1; i >= 0; i--) {
      const rip = this.state.ripples[i];
      rip.r += 240 * dt;
      rip.alpha = Math.max(0, 0.85 * (1 - rip.r / rip.maxR));
      if (rip.r >= rip.maxR) {
        this.state.ripples.splice(i, 1);
      }
    }

    // Light-up timer decay
    if (this.state.lit >= 0) {
      this.state.litT += dt;
      if (this.state.litT > 0.42) {
        this.state.lit = -1;
        this.state.litT = 0;
      }
    }

    const pace = Math.max(0.34, 0.72 - this.state.round * 0.03);

    if (this.state.phase === 'gap') {
      this.state.timer -= dt;
      if (this.state.timer <= 0) {
        this.state.phase = 'show';
        this.state.showIdx = 0;
        this.state.timer = 0.3;
      }
    } else if (this.state.phase === 'show') {
      this.state.timer -= dt;
      if (this.state.timer <= 0) {
        if (this.state.showIdx >= this.state.seq.length) {
          this.state.phase = 'input';
          this.state.inputIdx = 0;
          return;
        }

        const spiceToLight = this.state.seq[this.state.showIdx];
        this.triggerBowl(spiceToLight, false);

        this.state.showIdx++;
        this.state.timer = pace;
      }
    } else if (this.state.phase === 'oops') {
      this.state.timer -= dt;
      if (this.state.timer <= 0) {
        this.state.phase = 'gap';
        this.state.timer = 1.0;
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
    if (this.roundValEl) {
      this.roundValEl.textContent = `${this.state.round} / ${this.maxRounds}`;
    }
    if (this.longestValEl) {
      this.longestValEl.textContent = this.longestRecall;
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
    this.gameOver = !won;
    this.gameWon = won;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('masalamemory_high_score', this.highScore);
    }

    const modalTitle = this.container.querySelector('#masalamemory-modal-title');
    const modalMsg = this.container.querySelector('#masalamemory-modal-msg');
    const modalIcon = this.container.querySelector('#masalamemory-modal-icon');
    const modalScore = this.container.querySelector('#masalamemory-modal-score');
    const modalRounds = this.container.querySelector('#masalamemory-modal-rounds');
    const modalLongest = this.container.querySelector('#masalamemory-modal-longest');
    const modalBest = this.container.querySelector('#masalamemory-modal-best');

    if (won) {
      modalIcon.textContent = '🏆';
      modalTitle.textContent = 'MASALA MASTERED!';
      modalMsg.textContent = 'Incredible sensory memory! All 12 spice rounds conquered!';
      soundManager.playTone(523, 0.25, 1046);
    } else {
      modalIcon.textContent = '💔';
      modalTitle.textContent = 'MEMORY OVERLOAD!';
      modalMsg.textContent = 'The spice blends proved tricky. Tune your ears and try again!';
      soundManager.playNoise(0.5, 300, 70);
    }

    modalScore.textContent = this.score;
    modalRounds.textContent = `${Math.min(12, this.state.round)} / 12`;
    modalLongest.textContent = this.longestRecall;
    modalBest.textContent = this.highScore;

    this.modalEl.classList.remove('hidden');
  }

  destroy() {
    this.running = false;
    window.removeEventListener('keydown', this.boundKeyDown);
  }
}
