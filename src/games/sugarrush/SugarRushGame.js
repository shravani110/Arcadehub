// SugarRushGame.js - High-End Mithai Rhythm Reflex Game
import { SugarRushRenderer, MITHAIS } from './SugarRushRenderer.js';
import { soundManager } from '../../sound/SoundManager.js';

export class SugarRushGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    this.highScore = parseInt(localStorage.getItem('sugarrush_high_score') || '0', 10);
    this.score = 0;
    this.maxMisses = 5;

    this.initDOM();
    this.initEffects();
    this.renderer = new SugarRushRenderer(this.canvas);
    this.resetGame();
    this.initEvents();
    this.startLoop();
  }

  initDOM() {
    const isMuted = soundManager.isMuted();

    this.container.innerHTML = `
      <div class="game-wrapper sugarrush-wrapper">
        <canvas id="sugarrush-canvas"></canvas>

        <div class="sugarrush-top-bar">
          <div class="top-controls">
            <button class="icon-btn" id="sugarrush-back-btn" title="Back to Hub">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <button class="icon-btn" id="sugarrush-sound-btn" title="Toggle Sound">
              ${isMuted 
                ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
                : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>'}
            </button>
          </div>

          <div class="sugarrush-hud">
            <div class="sugarrush-hud-card">
              <span class="sugarrush-hud-lbl">LIVES</span>
              <span class="sugarrush-hud-val" id="sugarrush-lives-val" style="color: #ff4d6d;">❤️❤️❤️❤️❤️</span>
            </div>
            <div class="sugarrush-hud-card">
              <span class="sugarrush-hud-lbl">COMBO</span>
              <span class="sugarrush-hud-val" id="sugarrush-combo-val">0×</span>
            </div>
            <div class="sugarrush-hud-card">
              <span class="sugarrush-hud-lbl">PERFECTS</span>
              <span class="sugarrush-hud-val" id="sugarrush-perfects-val" style="color: #ffd166;">0</span>
            </div>
            <div class="sugarrush-hud-card">
              <span class="sugarrush-hud-lbl">SCORE</span>
              <span class="sugarrush-hud-val" id="sugarrush-score-val">0</span>
            </div>
          </div>
        </div>

        <div id="sugarrush-hint" class="sugarrush-hint">
          Tap each lane or use [←] [↓] [→] when sweets reach the glowing ring!
        </div>

        <!-- Touch interactive tap zones for the 3 lanes -->
        <div class="sugarrush-lane-triggers">
          <button class="sugarrush-lane-btn" data-lane="0" aria-label="Lane 1"></button>
          <button class="sugarrush-lane-btn" data-lane="1" aria-label="Lane 2"></button>
          <button class="sugarrush-lane-btn" data-lane="2" aria-label="Lane 3"></button>
        </div>

        <!-- Victory / Game Over Modal -->
        <div id="sugarrush-modal-overlay" class="modal-overlay hidden">
          <div class="modal-card">
            <div class="modal-badge-crown" id="sugarrush-modal-icon">🏆</div>
            <h2 id="sugarrush-modal-title" class="modal-title">SONG CONQUERED!</h2>
            <p id="sugarrush-modal-msg" class="modal-desc">Incredible timing and sweet shop rhythm!</p>
            <div class="stats-grid">
              <div class="stat-box">
                <span class="stat-lbl">FINAL SCORE</span>
                <span class="stat-val" id="sugarrush-modal-score">0</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">ACCURACY</span>
                <span class="stat-val" id="sugarrush-modal-accuracy">100%</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">BEST COMBO</span>
                <span class="stat-val" id="sugarrush-modal-combo">0×</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">HIGH SCORE</span>
                <span class="stat-val" id="sugarrush-modal-best">0</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-primary" id="sugarrush-retry-btn">Play Again</button>
              <button class="btn-secondary" id="sugarrush-exit-btn">Arcade Hub</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#sugarrush-canvas');
    this.livesValEl = this.container.querySelector('#sugarrush-lives-val');
    this.comboValEl = this.container.querySelector('#sugarrush-combo-val');
    this.perfectsValEl = this.container.querySelector('#sugarrush-perfects-val');
    this.scoreValEl = this.container.querySelector('#sugarrush-score-val');
    this.hintEl = this.container.querySelector('#sugarrush-hint');
    this.modalEl = this.container.querySelector('#sugarrush-modal-overlay');
  }

  initEffects() {
    this.particles = [];
    this.screenShake = 0;

    this.effects = {
      burst: (x, y, color = '#ffd166', count = 12, speed = 180, size = 4) => {
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
      render: (ctx) => {
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const pt = this.particles[i];
          const alpha = 1 - pt.life / pt.max;
          ctx.save();
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, Math.max(1, pt.size * alpha), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    };
  }

  generateSongNotes() {
    const patterns = [
      'x..x..x.', 'x.x.x...', '..x..x.x', 'x...x.x.',
      'x.x..x.x', '..x.x...', 'x..x.x..', 'x...x...'
    ];
    const notes = [];
    const step = 60 / 112 / 2; // 112 BPM eighth notes
    let lane = 1;
    let barCount = 0;

    for (let t = 1.0; t < 62.6; t += step * 8) {
      const pat = patterns[Math.floor(Math.random() * patterns.length)];
      for (let s = 0; s < 8; s++) {
        if (pat[s] === 'x') {
          lane = Math.max(0, Math.min(2, lane + (Math.floor(Math.random() * 3) - 1)));
          notes.push({
            t: t + s * step,
            lane,
            y: -60,
            state: 0, // 0 = unhit, 1 = hit, 2 = missed
            flash: 0
          });

          // Occasional double polyrhythm
          if (barCount > 6 && Math.random() < 0.12) {
            const secondLane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
            if (secondLane !== lane) {
              notes.push({
                t: t + s * step,
                lane: secondLane,
                y: -60,
                state: 0,
                flash: 0
              });
            }
          }
        }
      }
      barCount++;
    }

    notes.sort((a, b) => a.t - b.t);
    return notes;
  }

  resetGame() {
    this.score = 0;
    this.gameOver = false;
    this.gameWon = false;

    const notes = this.generateSongNotes();
    const endT = notes.length ? notes[notes.length - 1].t + 2.5 : 12;

    this.state = {
      time: 0,
      notes,
      combo: 0,
      bestCombo: 0,
      perfects: 0,
      goods: 0,
      misses: 0,
      hitFx: [],
      endT
    };

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

    this.container.querySelector('#sugarrush-back-btn').addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    const soundBtn = this.container.querySelector('#sugarrush-sound-btn');
    soundBtn.addEventListener('click', () => {
      const isMuted = soundManager.toggleMute();
      soundBtn.innerHTML = isMuted
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
        : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>';
    });

    this.container.querySelector('#sugarrush-retry-btn').addEventListener('click', () => {
      this.modalEl.classList.add('hidden');
      this.resetGame();
    });

    this.container.querySelector('#sugarrush-exit-btn').addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    // Touch button lane triggers
    const laneBtns = this.container.querySelectorAll('.sugarrush-lane-btn');
    laneBtns.forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const laneIdx = parseInt(btn.dataset.lane, 10);
        this.handleLaneHit(laneIdx);
      });
    });

    // Canvas click fallback
    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const laneIdx = Math.max(0, Math.min(2, Math.floor(x / (this.canvas.width / 3))));
      this.handleLaneHit(laneIdx);
    });

    // Keyboard handlers
    this.keyHandler = (e) => {
      if (e.repeat || this.gameOver || this.gameWon) return;

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        this.handleLaneHit(0);
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS' || e.code === 'Space') {
        e.preventDefault();
        this.handleLaneHit(1);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        this.handleLaneHit(2);
      }
    };

    window.addEventListener('keydown', this.keyHandler);
  }

  handleLaneHit(lane) {
    if (this.gameOver || this.gameWon || !this.state) return;
    if (this.hintEl) this.hintEl.style.opacity = '0';

    const strikeY = this.canvas.height * 0.78;
    const laneWidth = this.canvas.width / 3;
    const centerLaneX = (lane + 0.5) * laneWidth;

    let closestNote = null;
    let minDiff = 999;

    for (const note of this.state.notes) {
      if (note.state !== 0 || note.lane !== lane) continue;
      const diff = Math.abs(note.t - this.state.time);
      if (diff < minDiff) {
        minDiff = diff;
        closestNote = note;
      }
    }

    if (!closestNote || minDiff > 0.16) {
      // Empty tap
      soundManager.playTone(140, 0.05, 90);
      return;
    }

    closestNote.state = 1;
    closestNote.flash = 1.0;

    const isPerfect = minDiff < 0.07;
    if (isPerfect) {
      this.state.perfects++;
    } else {
      this.state.goods++;
    }

    this.state.combo++;
    this.state.bestCombo = Math.max(this.state.bestCombo, this.state.combo);

    const multiplier = 1 + Math.min(4, Math.floor(this.state.combo / 8));
    const pts = (isPerfect ? 100 : 50) * multiplier;
    this.score += pts;

    this.state.hitFx.push({
      lane,
      t: 0.3,
      kind: isPerfect ? 2 : 1
    });

    this.effects.burst(centerLaneX, strikeY, MITHAIS[lane].color, 12, 180, 4);

    soundManager.playTone(MITHAIS[lane].freq, 0.12);
    if (isPerfect) {
      soundManager.playTone(MITHAIS[lane].freq * 1.5, 0.1, MITHAIS[lane].freq * 2);
    }

    this.updateHUD();
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

    this.state.time += dt;
    this.screenShake = Math.max(0, this.screenShake - dt * 50);

    const strikeY = this.canvas.height * 0.78;
    const noteSpeed = 340; // px/sec

    // Update Notes
    for (const note of this.state.notes) {
      if (note.state === 1) {
        note.flash = Math.max(0, note.flash - dt * 4);
      } else if (note.state !== 2) {
        note.y = strikeY - (note.t - this.state.time) * noteSpeed;

        // Passed beyond strike window without being hit -> Miss!
        if (note.t + 0.16 < this.state.time) {
          note.state = 2;
          this.state.misses++;
          this.state.combo = 0;
          this.screenShake = 8;
          this.updateHUD();

          this.state.hitFx.push({
            lane: note.lane,
            t: 0.3,
            kind: 0 // Miss
          });

          soundManager.playTone(160, 0.14, 110);

          if (this.state.misses >= this.maxMisses) {
            this.handleGameOver(false);
            return;
          }
        }
      }
    }

    // Update Hit FX timers
    for (let i = this.state.hitFx.length - 1; i >= 0; i--) {
      this.state.hitFx[i].t -= dt;
      if (this.state.hitFx[i].t <= 0) {
        this.state.hitFx.splice(i, 1);
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

    // Song Completion Check
    if (this.state.time > this.state.endT) {
      this.handleGameOver(true);
    }
  }

  updateHUD() {
    if (this.livesValEl) {
      const remainingLives = Math.max(0, this.maxMisses - this.state.misses);
      const hearts = '❤️'.repeat(remainingLives);
      this.livesValEl.textContent = hearts || '💀';
    }
    if (this.comboValEl) {
      this.comboValEl.textContent = `${this.state.combo}×`;
    }
    if (this.perfectsValEl) {
      this.perfectsValEl.textContent = this.state.perfects;
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
      localStorage.setItem('sugarrush_high_score', this.highScore);
    }

    const totalNotes = this.state.notes.length || 1;
    const hitCount = this.state.perfects + this.state.goods;
    const accuracy = Math.round((hitCount / totalNotes) * 100);

    const modalTitle = this.container.querySelector('#sugarrush-modal-title');
    const modalMsg = this.container.querySelector('#sugarrush-modal-msg');
    const modalIcon = this.container.querySelector('#sugarrush-modal-icon');
    const modalScore = this.container.querySelector('#sugarrush-modal-score');
    const modalAccuracy = this.container.querySelector('#sugarrush-modal-accuracy');
    const modalCombo = this.container.querySelector('#sugarrush-modal-combo');
    const modalBest = this.container.querySelector('#sugarrush-modal-best');

    if (won) {
      modalIcon.textContent = '🏆';
      modalTitle.textContent = 'SWEET HARMONY!';
      modalMsg.textContent = 'You completed the entire song with rhythmic flair!';
      soundManager.playTone(523, 0.25, 1046);
    } else {
      modalIcon.textContent = '💔';
      modalTitle.textContent = 'SUGAR CRASH!';
      modalMsg.textContent = '5 missed notes crashed the rhythm. Keep your ears on the beat!';
      soundManager.playNoise(0.5, 300, 70);
    }

    modalScore.textContent = this.score;
    modalAccuracy.textContent = `${accuracy}%`;
    modalCombo.textContent = `${this.state.bestCombo}×`;
    modalBest.textContent = this.highScore;

    this.modalEl.classList.remove('hidden');
  }

  destroy() {
    this.running = false;
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
    }
  }
}
