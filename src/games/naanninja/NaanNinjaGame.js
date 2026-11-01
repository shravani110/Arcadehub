// NaanNinjaGame.js - High-End Animated Food Ninja Slicing Game
import { NaanNinjaRenderer } from './NaanNinjaRenderer.js';
import { soundManager } from '../../sound/SoundManager.js';

export class NaanNinjaGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    this.highScore = parseInt(localStorage.getItem('naanninja_high_score') || '0', 10);
    this.goal = 750;

    this.initDOM();
    this.initEffects();
    this.renderer = new NaanNinjaRenderer(this.canvas);
    this.resetState();
    this.initEvents();
    this.startLoop();
  }

  initDOM() {
    const isMuted = soundManager.isMuted();

    this.container.innerHTML = `
      <div class="game-wrapper naanninja-wrapper">
        <canvas id="naanninja-canvas"></canvas>

        <div class="naanninja-top-bar">
          <div class="top-controls">
            <button class="icon-btn" id="naanninja-back-btn" title="Back to Hub">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <button class="icon-btn" id="naanninja-sound-btn" title="Toggle Sound">
              ${isMuted 
                ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
                : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>'}
            </button>
          </div>

          <div class="naanninja-hud">
            <div class="naanninja-hud-card">
              <span class="naanninja-hud-lbl">LIVES</span>
              <span class="naanninja-hud-val" id="naanninja-lives-val" style="color: #ff4d6d;">❤️❤️❤️</span>
            </div>
            <div class="naanninja-hud-card">
              <span class="naanninja-hud-lbl">GOAL</span>
              <span class="naanninja-hud-val" id="naanninja-goal-val">750</span>
            </div>
            <div class="naanninja-hud-card">
              <span class="naanninja-hud-lbl">BEST COMBO</span>
              <span class="naanninja-hud-val" id="naanninja-combo-val">0×</span>
            </div>
            <div class="naanninja-hud-card">
              <span class="naanninja-hud-lbl">SCORE</span>
              <span class="naanninja-hud-val" id="naanninja-score-val">0</span>
            </div>
          </div>
        </div>

        <div id="naanninja-banner" class="naanninja-double-banner hidden">
          ⚡ 2X SCORE MULTIPLIER ACTIVE! ⚡
        </div>

        <!-- Slicing instructions hint -->
        <div id="naanninja-swipe-hint" class="naanninja-hint">
          Swipe or drag across ingredients to slice them!
        </div>

        <!-- Victory / Game Over Modal -->
        <div id="naanninja-modal-overlay" class="modal-overlay hidden">
          <div class="modal-card">
            <div class="modal-badge-crown" id="naanninja-modal-icon">🏆</div>
            <h2 id="naanninja-modal-title" class="modal-title">BOARD CLEARED!</h2>
            <p id="naanninja-modal-msg" class="modal-desc">Goal reached with culinary mastery!</p>
            <div class="stats-grid">
              <div class="stat-box">
                <span class="stat-lbl">FINAL SCORE</span>
                <span class="stat-val" id="naanninja-modal-score">0</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">SLICED FOODS</span>
                <span class="stat-val" id="naanninja-modal-sliced">0</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">BEST COMBO</span>
                <span class="stat-val" id="naanninja-modal-combo">0×</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">HIGH SCORE</span>
                <span class="stat-val" id="naanninja-modal-best">0</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-primary" id="naanninja-retry-btn">Play Again</button>
              <button class="btn-secondary" id="naanninja-exit-btn">Arcade Hub</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#naanninja-canvas');
    this.livesValEl = this.container.querySelector('#naanninja-lives-val');
    this.scoreValEl = this.container.querySelector('#naanninja-score-val');
    this.comboValEl = this.container.querySelector('#naanninja-combo-val');
    this.bannerEl = this.container.querySelector('#naanninja-banner');
    this.hintEl = this.container.querySelector('#naanninja-swipe-hint');
    this.modalEl = this.container.querySelector('#naanninja-modal-overlay');
  }

  initEffects() {
    this.particles = [];
    this.pops = [];
    this.screenShake = 0;

    this.effects = {
      pop: (x, y, text, color = '#ffd166', size = 20) => {
        this.pops.push({ x, y, text, color, size, age: 0 });
      },
      burst: (x, y, color = '#06d6a0', count = 12, speed = 180, size = 4) => {
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
            grav: 280
          });
        }
      },
      render: (ctx) => {
        // Floating text pops
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
          ctx.fillText(p.text, p.x, p.y - progress * 45);
          ctx.restore();
        }

        // Particle sparks
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const pt = this.particles[i];
          const alpha = 1 - pt.life / pt.max;
          ctx.save();
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.fillStyle = pt.color;
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, Math.max(1, pt.size * alpha), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    };
  }

  resetState() {
    this.state = {
      items: [],
      halves: [],
      trail: [],
      lives: 3,
      misses: 0,
      score2x: 0,
      spawnT: 0.1,
      sliced: 0,
      bestCombo: 0,
      runT: 0,
      flash: 0,
      goal: this.goal,
      score: 0
    };

    this.currentSwipeSlices = 0;
    this.isDragging = false;
    this.gameOver = false;
    this.gameWon = false;

    this.updateHUD();
    this.resizeCanvas();
  }

  resizeCanvas() {
    const rect = this.container.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    this.renderer.resize(w, h);
  }

  initEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());

    this.container.querySelector('#naanninja-back-btn').addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    const soundBtn = this.container.querySelector('#naanninja-sound-btn');
    soundBtn.addEventListener('click', () => {
      const isMuted = soundManager.toggleMute();
      soundBtn.innerHTML = isMuted
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
        : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>';
    });

    this.container.querySelector('#naanninja-retry-btn').addEventListener('click', () => {
      this.modalEl.classList.add('hidden');
      this.resetState();
    });

    this.container.querySelector('#naanninja-exit-btn').addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    // Touch & Pointer Slicing Handlers
    const onPointerDown = (e) => {
      if (this.gameOver || this.gameWon) return;
      this.isDragging = true;
      this.currentSwipeSlices = 0;
      if (this.hintEl) this.hintEl.style.opacity = '0';
      const pos = this.getCanvasPos(e);
      this.state.trail = [{ x: pos.x, y: pos.y, t: performance.now() }];
      soundManager.playBladeSlash();
    };

    const onPointerMove = (e) => {
      if (!this.isDragging || this.gameOver || this.gameWon) return;
      const pos = this.getCanvasPos(e);
      this.handleSliceMove(pos.x, pos.y);
    };

    const onPointerUp = () => {
      this.isDragging = false;
      this.currentSwipeSlices = 0;
    };

    this.canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      onPointerDown(e.touches[0]);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging) return;
      e.preventDefault();
      onPointerMove(e.touches[0]);
    }, { passive: false });

    window.addEventListener('touchend', onPointerUp);
    window.addEventListener('touchcancel', onPointerUp);
  }

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  handleSliceMove(x, y) {
    const now = performance.now();
    this.state.trail.push({ x, y, t: now });

    // Keep trail to recent 160ms
    this.state.trail = this.state.trail.filter(pt => now - pt.t < 160);

    let slicedThisStep = 0;

    for (let i = 0; i < this.state.items.length; i++) {
      const item = this.state.items[i];
      if (item.sliced) continue;

      const dist = Math.hypot(x - item.x, y - item.y);
      if (dist < item.r + 20) {
        item.sliced = true;
        slicedThisStep++;
        this.currentSwipeSlices++;
        this.state.sliced++;

        // Spawn 2 split halves flying outward
        for (const side of [-1, 1]) {
          this.state.halves.push({
            x: item.x,
            y: item.y,
            vx: item.vx * 0.4 + side * (130 + Math.random() * 90),
            vy: item.vy * 0.3 - 90,
            rot: item.rot,
            vr: item.vr + side * 4,
            kind: item.kind,
            age: 0,
            side
          });
        }

        if (item.kind === 'bomb') {
          // Chilli bomb detonated
          this.state.lives--;
          this.state.flash = 1.0;
          this.screenShake = 22;
          this.updateHUD();
          soundManager.playNoise(0.4, 600, 60);
          this.effects.burst(item.x, item.y, '#ef476f', 28, 340, 5);
          this.effects.pop(item.x, item.y - 40, 'BOOM! 🌶️', '#ef476f', 26);

          if (this.state.lives <= 0) {
            this.handleGameOver(false);
            return;
          }
        } else if (item.kind === 'gold') {
          // Golden Naan: 2x score for 6s + 40 pts
          this.state.score2x = 6.0;
          this.addScore(40);
          this.effects.pop(item.x, item.y - 36, 'Double Score! 2X 🌟', '#ffd166', 22);
          soundManager.playTone(784, 0.15, 1046);
          this.effects.burst(item.x, item.y, '#ffd166', 24, 250, 4);
        } else if (item.kind === 'life') {
          // Heart: +1 Life
          this.state.lives = Math.min(4, this.state.lives + 1);
          this.updateHUD();
          this.effects.pop(item.x, item.y - 36, '+1 Life! 💖', '#06d6a0', 22);
          soundManager.playTone(523, 0.15, 784);
          this.effects.burst(item.x, item.y, '#06d6a0', 18, 200, 4);
        } else {
          // Normal Naan or Vada
          const basePts = (item.kind === 'vada' ? 18 : 15);
          const pts = basePts * (this.state.score2x > 0 ? 2 : 1);
          this.addScore(pts);
          soundManager.playFoodSlice();
          this.effects.burst(item.x, item.y, item.kind === 'vada' ? '#fcd385' : '#edd9ba', 12, 160, 3.5);
        }

        // Combo bonus for 3+ items chained in a single continuous swipe
        if (this.currentSwipeSlices >= 3 && slicedThisStep > 0) {
          const comboPts = this.currentSwipeSlices * 12 * (this.state.score2x > 0 ? 2 : 1);
          this.addScore(comboPts);
          this.effects.pop(x, y - 50, `${this.currentSwipeSlices}× COMBO! +${comboPts}`, '#06d6a0', 24);
          this.state.bestCombo = Math.max(this.state.bestCombo, this.currentSwipeSlices);
          this.updateHUD();
          soundManager.playTone(660, 0.12, 990);
        }
      }
    }

    // Clean up sliced items from main array
    this.state.items = this.state.items.filter(item => !item.sliced);

    if (this.state.score >= this.state.goal) {
      this.handleGameOver(true);
    }
  }

  addScore(pts) {
    this.state.score += pts;
    if (this.state.score > this.highScore) {
      this.highScore = this.state.score;
      localStorage.setItem('naanninja_high_score', this.highScore);
    }
    this.updateHUD();
  }

  updateHUD() {
    if (this.livesValEl) {
      const hearts = '❤️'.repeat(Math.max(0, this.state.lives));
      this.livesValEl.textContent = hearts || '💀';
    }
    if (this.scoreValEl) {
      this.scoreValEl.textContent = this.state.score;
    }
    if (this.comboValEl) {
      this.comboValEl.textContent = `${this.state.bestCombo}×`;
    }
    if (this.bannerEl) {
      if (this.state.score2x > 0) {
        this.bannerEl.classList.remove('hidden');
      } else {
        this.bannerEl.classList.add('hidden');
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
    if (this.gameOver || this.gameWon) return;

    this.state.runT += dt;
    this.state.score2x = Math.max(0, this.state.score2x - dt);
    this.state.flash = Math.max(0, this.state.flash - dt * 3);
    this.screenShake = Math.max(0, this.screenShake - dt * 60);

    const W = this.canvas.width;
    const H = this.canvas.height;

    // Item Spawner
    this.state.spawnT -= dt;
    if (this.state.spawnT <= 0) {
      // Dynamic frequency increasing with time
      const minInterval = Math.max(0.75, 1.5 - this.state.runT * 0.012);
      this.state.spawnT = minInterval * (0.7 + Math.random() * 0.6);

      const waveSize = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < waveSize; i++) {
        const roll = Math.random();
        const kind = roll < 0.60 ? 'naan' : roll < 0.78 ? 'vada' : roll < 0.92 ? 'bomb' : roll < 0.98 ? 'gold' : 'life';
        const startX = 60 + Math.random() * (W - 120);
        const vy = -(580 + Math.random() * 240);
        const vx = ((W / 2) - startX) * (0.5 + Math.random() * 0.7);

        this.state.items.push({
          x: startX,
          y: H + 30,
          vx,
          vy,
          kind,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 6,
          sliced: false,
          r: kind === 'bomb' ? 22 : 28
        });

        if (i >= 2 && Math.random() < 0.5) break;
      }
    }

    // Update Whole Flying Items
    for (let i = this.state.items.length - 1; i >= 0; i--) {
      const item = this.state.items[i];
      item.vy += 900 * dt;
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.rot += item.vr * dt;

      // Fallen below screen
      if (item.y > H + 60) {
        this.state.items.splice(i, 1);
        if (item.kind !== 'bomb' && !item.sliced) {
          this.state.misses++;
          soundManager.playTone(160, 0.15, 110);
          if (this.state.misses % 3 === 0) {
            this.state.lives--;
            this.updateHUD();
            this.screenShake = 12;
            if (this.state.lives <= 0) {
              this.handleGameOver(false);
              return;
            }
          }
        }
      }
    }

    // Update Sliced Halves
    for (let i = this.state.halves.length - 1; i >= 0; i--) {
      const half = this.state.halves[i];
      half.vy += 900 * dt;
      half.x += half.vx * dt;
      half.y += half.vy * dt;
      half.rot += half.vr * dt;
      half.age += dt;

      if (half.age > 1.4) {
        this.state.halves.splice(i, 1);
      }
    }

    // Update Particles
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

    // Update Pops
    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i];
      p.age += dt;
      if (p.age >= 0.8) {
        this.pops.splice(i, 1);
      }
    }

    // Decay trail
    const now = performance.now();
    this.state.trail = this.state.trail.filter(pt => now - pt.t < 160);
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

    const modalTitle = this.container.querySelector('#naanninja-modal-title');
    const modalMsg = this.container.querySelector('#naanninja-modal-msg');
    const modalIcon = this.container.querySelector('#naanninja-modal-icon');
    const modalScore = this.container.querySelector('#naanninja-modal-score');
    const modalSliced = this.container.querySelector('#naanninja-modal-sliced');
    const modalCombo = this.container.querySelector('#naanninja-modal-combo');
    const modalBest = this.container.querySelector('#naanninja-modal-best');

    if (won) {
      modalIcon.textContent = '🏆';
      modalTitle.textContent = 'BOARD CLEARED!';
      modalMsg.textContent = 'You reached 750 points with culinary mastery!';
      soundManager.playTone(523, 0.2, 784);
    } else {
      modalIcon.textContent = '💔';
      modalTitle.textContent = 'RUN OVER!';
      modalMsg.textContent = 'Watch out for chilli bombs and keep slicing!';
      soundManager.playNoise(0.5, 400, 80);
    }

    modalScore.textContent = this.state.score;
    modalSliced.textContent = this.state.sliced;
    modalCombo.textContent = `${this.state.bestCombo}×`;
    modalBest.textContent = this.highScore;

    this.modalEl.classList.remove('hidden');
  }

  destroy() {
    this.running = false;
  }
}
