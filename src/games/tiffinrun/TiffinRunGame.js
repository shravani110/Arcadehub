// TiffinRunGame.js - High-End Animated Tiffin Run matching London Cafe Arcade
import { TiffinRunRenderer } from './TiffinRunRenderer.js';
import { soundManager } from '../../sound/SoundManager.js';

export class TiffinRunGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    this.highScore = parseInt(localStorage.getItem('tiffinrun_high_score') || '0', 10);
    this.maxSectors = 6;
    this.goalDistance = 900;
    this.score = 0;
    this.isPaused = false;
    this.isPlaying = false;

    this.initDOM();
    this.initEffects();
    this.renderer = new TiffinRunRenderer(this.canvas);
    this.resetState();
    this.initEvents();
  }

  initDOM() {
    const isMuted = soundManager.isMuted();

    this.container.innerHTML = `
      <div class="tiffinrun-wrapper">
        <!-- Exact London Cafe Top Bar -->
        <header class="tiffinrun-top-bar">
          <button id="tiffin-back-btn" class="tiffinrun-back-btn" aria-label="Back to Arcade" title="Back to Arcade">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </button>
          
          <div class="tiffinrun-header-title-box">
            <p class="tiffinrun-header-title">Tiffin Run</p>
            <p class="tiffinrun-header-subtitle" id="tiffin-subtitle">Sector 1 / 6</p>
          </div>

          <div class="tiffinrun-hud-stats">
            <span class="tiffinrun-hearts" id="tiffin-hearts">❤️❤️❤️</span>
            <span class="tiffinrun-score-display" id="tiffin-score">0</span>
            <span class="tiffinrun-stat-divider">·</span>
            <span class="tiffinrun-best-display">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2"/><path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2"/><path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3"/></svg>
              <span id="tiffin-best">${this.highScore}</span>
            </span>
          </div>

          <button id="tiffin-pause-btn" class="tiffinrun-icon-btn" aria-label="Pause" title="Pause">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/></svg>
          </button>

          <button id="tiffin-sound-btn" class="tiffinrun-icon-btn" aria-label="Mute" title="Toggle Sound">
            ${isMuted 
              ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
              : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg>'}
          </button>
        </header>

        <!-- Canvas Container -->
        <div class="tiffinrun-canvas-container">
          <canvas id="tiffinrun-canvas"></canvas>

          <!-- Splash / Start Overlay matching orig_tiffin_run.png -->
          <div id="tiffin-splash-overlay" class="tiffinrun-splash-overlay">
            <span class="tiffinrun-splash-badge">ARCADE • 2–4 MIN</span>
            <h1 class="tiffinrun-splash-title">Tiffin Run</h1>
            <p class="tiffinrun-splash-blurb">Three lanes, one hungry runner. Jump the puddles, switch lanes, stack idlis for combo multipliers.</p>

            <div class="tiffinrun-how-box">
              <ul class="tiffinrun-how-list">
                <li>Tap anywhere to jump — you can double-jump.</li>
                <li>Swipe left / right (or arrow keys) to change lanes.</li>
                <li>Jump the chai puddles, dodge the spice sacks.</li>
                <li>Every idli builds your combo; taking a hit resets it.</li>
                <li>Survive all 6 sectors to clear the run.</li>
              </ul>
            </div>

            <div class="tiffinrun-meta-row">
              <span class="tiffinrun-meta-item">👤 Solo</span>
              <span class="tiffinrun-meta-item">⏱️ 2–4 min</span>
              <span class="tiffinrun-meta-item">🏆 best ${this.highScore}</span>
            </div>

            <button id="tiffin-start-btn" class="tiffinrun-play-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
              Play
            </button>

            <a id="tiffin-splash-back-link" class="tiffinrun-back-link">
              ← ALL GAMES
            </a>
          </div>

          <!-- Game Over / Victory Modal -->
          <div id="tiffin-modal-overlay" class="tiffinrun-modal-overlay hidden">
            <div class="tiffinrun-modal-card">
              <div class="tiffinrun-modal-icon" id="tiffin-modal-icon">🏆</div>
              <h2 id="tiffin-modal-title" class="tiffinrun-modal-title">RUN COMPLETED!</h2>
              <p id="tiffin-modal-msg" class="tiffinrun-modal-desc">All 6 sectors delivered on time!</p>
              
              <div class="tiffinrun-stats-grid">
                <div class="tiffinrun-stat-box">
                  <span class="tiffinrun-stat-lbl">FINAL SCORE</span>
                  <span class="tiffinrun-stat-val" id="tiffin-modal-score">0</span>
                </div>
                <div class="tiffinrun-stat-box">
                  <span class="tiffinrun-stat-lbl">SECTORS</span>
                  <span class="tiffinrun-stat-val" id="tiffin-modal-sectors">6 / 6</span>
                </div>
                <div class="tiffinrun-stat-box">
                  <span class="tiffinrun-stat-lbl">DISTANCE</span>
                  <span class="tiffinrun-stat-val" id="tiffin-modal-dist">900m</span>
                </div>
                <div class="tiffinrun-stat-box">
                  <span class="tiffinrun-stat-lbl">BEST SCORE</span>
                  <span class="tiffinrun-stat-val" id="tiffin-modal-best">0</span>
                </div>
              </div>

              <div class="tiffinrun-modal-actions">
                <button class="tiffinrun-btn-primary" id="tiffin-retry-btn">Play Again</button>
                <button class="tiffinrun-btn-secondary" id="tiffin-exit-btn">All Games</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#tiffinrun-canvas');
    this.subtitleEl = this.container.querySelector('#tiffin-sector-subtitle');
    this.heartsEl = this.container.querySelector('#tiffin-hearts');
    this.scoreEl = this.container.querySelector('#tiffin-score');
    this.bestEl = this.container.querySelector('#tiffin-best');
    this.splashOverlay = this.container.querySelector('#tiffin-splash-overlay');
    this.modalOverlay = this.container.querySelector('#tiffin-modal-overlay');
  }

  initEffects() {
    this.particles = [];
    this.pops = [];
    this.dustPuffs = [];

    this.effects = {
      pop: (x, y, text, color = '#ffb703', size = 20) => {
        this.pops.push({ x, y, text, color, size, age: 0 });
      },
      burst: (x, y, color = '#ffd166', count = 10, speed = 140, size = 3.5) => {
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = speed * (0.35 + Math.random() * 0.75);
          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 0,
            max: 0.45 + Math.random() * 0.4,
            color,
            size: size * (0.6 + Math.random() * 0.8),
            grav: 220
          });
        }
      },
      dust: (x, y, dir = 1) => {
        for (let i = 0; i < 3; i++) {
          this.dustPuffs.push({
            x: x + (Math.random() - 0.5) * 12,
            y: y + (Math.random() - 0.5) * 4,
            vx: dir * (10 + Math.random() * 30),
            vy: -15 - Math.random() * 25,
            size: 4 + Math.random() * 6,
            life: 0,
            max: 0.35 + Math.random() * 0.25,
            color: 'rgba(210, 180, 140, '
          });
        }
      },
      render: (ctx) => {
        // Dust puffs behind runner
        for (let i = this.dustPuffs.length - 1; i >= 0; i--) {
          const dp = this.dustPuffs[i];
          const progress = dp.life / dp.max;
          const alpha = Math.max(0, (1 - progress) * 0.45);
          ctx.save();
          ctx.fillStyle = `${dp.color}${alpha})`;
          ctx.beginPath();
          ctx.arc(dp.x, dp.y, dp.size * (1 + progress * 0.8), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Floating Text Pops
        for (let i = this.pops.length - 1; i >= 0; i--) {
          const p = this.pops[i];
          const progress = p.age / 0.8;
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - progress);
          ctx.fillStyle = p.color;
          ctx.font = `800 ${p.size}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.85)';
          ctx.shadowBlur = 8;
          ctx.fillText(p.text, p.x, p.y - progress * 40);
          ctx.restore();
        }

        // Particle sparks
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

  resetState() {
    this.score = 0;
    this.state = {
      scrolled: 0,
      speed: 5.0,
      lane: 1,
      laneT: 1,
      tiffinTilt: 0,
      tiffinTiltVel: 0,
      squashY: 1.0,
      squashVel: 0,
      jumpY: 0,
      vy: 0,
      wasInAir: false,
      lives: 3,
      invuln: 0,
      runT: 0,
      stepT: 0,
      combo: 0,
      obstacles: [],
      idlis: [],
      nextSpawn: 14,
      nextIdli: 6,
      sector: 1,
      goal: this.goalDistance,
      flash: 0,
      mile: 0,
      gameOver: false,
      cleared: false
    };

    this.particles = [];
    this.pops = [];
    this.dustPuffs = [];
    this.updateHUD();
    this.resizeCanvas();
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    this.renderer.resize(w, h);
  }

  initEvents() {
    this.boundResize = () => this.resizeCanvas();
    window.addEventListener('resize', this.boundResize);
    this.boundResize();

    // Start Play button
    this.container.querySelector('#tiffin-start-btn').addEventListener('click', () => {
      soundManager.playClick();
      this.splashOverlay.classList.add('hidden');
      this.isPlaying = true;
      this.startLoop();
    });

    // Splash Back Link
    this.container.querySelector('#tiffin-splash-back-link').addEventListener('click', () => {
      soundManager.playClick();
      this.destroy();
      this.onExit();
    });

    // Top Bar Back Button
    this.container.querySelector('#tiffin-back-btn').addEventListener('click', () => {
      soundManager.playClick();
      this.destroy();
      this.onExit();
    });

    // Sound toggle
    const soundBtn = this.container.querySelector('#tiffin-sound-btn');
    soundBtn.addEventListener('click', () => {
      const muted = soundManager.toggleMute();
      soundBtn.innerHTML = muted
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg>';
    });

    // Pause toggle
    const pauseBtn = this.container.querySelector('#tiffin-pause-btn');
    pauseBtn.addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      pauseBtn.innerHTML = this.isPaused
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/></svg>';
    });

    // Retry & Exit modal buttons
    this.container.querySelector('#tiffin-retry-btn').addEventListener('click', () => {
      this.modalOverlay.classList.add('hidden');
      this.resetState();
      this.isPlaying = true;
      this.startLoop();
    });

    this.container.querySelector('#tiffin-exit-btn').addEventListener('click', () => {
      this.destroy();
      this.onExit();
    });

    // Touch & Swipe navigation on canvas
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const onPointerDown = (clientX, clientY) => {
      if (!this.isPlaying || this.state.gameOver || this.state.cleared || this.isPaused) return;
      touchStartX = clientX;
      touchStartY = clientY;
      touchStartTime = performance.now();
    };

    const onPointerUp = (clientX, clientY) => {
      if (!this.isPlaying || this.state.gameOver || this.state.cleared || this.isPaused) return;
      const dx = clientX - touchStartX;
      const dy = clientY - touchStartY;
      const dt = performance.now() - touchStartTime;

      if (Math.abs(dx) > 30 && dt < 450) {
        // Horizontal swipe
        this.changeLane(dx > 0 ? 1 : -1);
      } else if (dy < -40 && dt < 450) {
        // Upward swipe -> Jump
        this.jump();
      } else if (Math.hypot(dx, dy) < 18) {
        // Tap -> Jump
        this.jump();
      }
    };

    this.canvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
    window.addEventListener('mouseup', (e) => onPointerUp(e.clientX, e.clientY));

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches[0]) {
        e.preventDefault();
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (e.changedTouches[0]) {
        onPointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    });

    // Keyboard navigation
    this.boundKeyDown = (e) => {
      if (!this.isPlaying || this.state.gameOver || this.state.cleared || this.isPaused) return;

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        this.changeLane(-1);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        this.changeLane(1);
      } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        this.jump();
      }
    };
    window.addEventListener('keydown', this.boundKeyDown);

    // Initial render behind splash
    this.renderer.render(this.state, this.effects);
  }

  changeLane(dir) {
    const target = Math.max(0, Math.min(2, this.state.lane + dir));
    if (target !== this.state.lane) {
      this.state.lane = target;
      // Spring sway impulse in opposite direction of movement
      this.state.tiffinTiltVel += -dir * 1.6;
      soundManager.playTone(240, 0.06, 300);
    }
  }

  jump() {
    if (this.state.vy === 0 || this.state.jumpY < 90) {
      const isDouble = this.state.jumpY > 0;
      this.state.vy = isDouble ? 470 : 560;
      this.state.squashY = 0.82;
      this.state.squashVel = 1.4;
      this.state.tiffinTiltVel += (Math.random() - 0.5) * 0.4;
      soundManager.playTone(300, 0.12, 620);
      this.effects.burst(this.renderer.width / 2, this.renderer.height * 0.78, '#ffd68a', isDouble ? 12 : 6, 120, 3);
    }
  }

  updateHUD() {
    if (this.heartsEl) {
      this.heartsEl.textContent = '❤️'.repeat(Math.max(0, this.state.lives));
    }
    if (this.scoreEl) {
      this.scoreEl.textContent = this.score;
    }
    if (this.subtitleEl) {
      this.subtitleEl.textContent = `Sector ${this.state.sector} / ${this.maxSectors}`;
    }
    if (this.bestEl) {
      this.bestEl.textContent = this.highScore;
    }
  }

  startLoop() {
    this.lastTime = performance.now();
    const tick = (now) => {
      if (!this.isPlaying) return;

      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      if (!this.isPaused) {
        this.update(dt);
        this.renderer.render(this.state, this.effects);
      }

      this.animId = requestAnimationFrame(tick);
    };
    this.animId = requestAnimationFrame(tick);
  }

  update(dt) {
    if (this.state.gameOver || this.state.cleared) return;

    const s = this.state;
    s.runT += dt;
    s.speed = Math.min(12, 5 + s.runT * 0.09);
    s.scrolled += s.speed * dt;
    s.invuln = Math.max(0, s.invuln - dt);
    s.flash = Math.max(0, s.flash - dt * 3);

    // Smooth lane transition
    s.laneT += (s.lane - s.laneT) * Math.min(1, dt * 14);

    // Tiffin spring-damper physics (organic sway & inertial lag)
    const targetTilt = (s.lane - s.laneT) * 0.42;
    const tiltDiff = targetTilt - s.tiffinTilt;
    s.tiffinTiltVel += tiltDiff * 95 * dt;
    s.tiffinTiltVel *= Math.max(0, 1 - 10 * dt);
    s.tiffinTilt += s.tiffinTiltVel * dt;

    // Squash & Stretch spring-damper physics
    const squashDiff = 1.0 - s.squashY;
    s.squashVel += squashDiff * 160 * dt;
    s.squashVel *= Math.max(0, 1 - 16 * dt);
    s.squashY += s.squashVel * dt;

    // Jump gravity physics & landing detection
    if (s.jumpY > 0 || s.vy !== 0) {
      s.wasInAir = true;
      s.vy -= 1500 * dt;
      s.jumpY += s.vy * dt;
      if (s.jumpY <= 0) {
        s.jumpY = 0;
        s.vy = 0;
        // Landing event!
        if (s.wasInAir) {
          s.wasInAir = false;
          s.squashY = 0.72; // Squash on impact
          s.squashVel = -0.6;
          soundManager.playTone(180, 0.08, 120);
          const W = this.renderer.width;
          const H = this.renderer.height;
          const playerZ = 0.4;
          const pScale = this.renderer.proj(playerZ);
          const px = W / 2 + (s.laneT - 1) * (W * 0.40) * pScale;
          const py = H * 0.30 + (H * 0.92 - H * 0.30) * pScale;
          this.effects.dust(px - 14 * pScale, py, -1);
          this.effects.dust(px + 14 * pScale, py, 1);
        }
      }
    } else {
      // On ground: emit running dust puffs on footstep cadence
      s.stepT += dt * s.speed;
      if (s.stepT >= 0.22) {
        s.stepT = 0;
        const W = this.renderer.width;
        const H = this.renderer.height;
        const playerZ = 0.4;
        const pScale = this.renderer.proj(playerZ);
        const px = W / 2 + (s.laneT - 1) * (W * 0.40) * pScale;
        const py = H * 0.30 + (H * 0.92 - H * 0.30) * pScale;
        const footDir = Math.sin(s.runT * 18) > 0 ? 1 : -1;
        this.effects.dust(px + footDir * 10 * pScale, py, -footDir);
      }
    }

    // Sector progression check
    const currentSector = Math.min(this.maxSectors, 1 + Math.floor(s.scrolled / 150));
    if (currentSector !== s.sector) {
      s.sector = currentSector;
      soundManager.playTone(392, 0.22, 587);
      this.effects.pop(this.renderer.width / 2, this.renderer.height * 0.40, `Sector ${currentSector}`, '#ffb703', 30);
      this.updateHUD();
    }

    // Victory Goal check
    if (s.scrolled >= s.goal) {
      s.cleared = true;
      this.showModal(true);
      return;
    }

    // Obstacle Spawner
    s.nextSpawn -= s.speed * dt;
    if (s.nextSpawn <= 0) {
      const difficulty = 1 - s.sector * 0.1;
      s.nextSpawn = (9 + Math.random() * 8) * difficulty;
      const targetLane = Math.floor(Math.random() * 3);
      const kind = Math.random() < 0.48 ? 'puddle' : 'sack';
      s.obstacles.push({ z: s.scrolled + 42, lane: targetLane, kind });

      // Sector 2+ can spawn dual obstacle
      if (s.sector >= 2 && Math.random() < 0.22) {
        const freeLane = Math.floor(Math.random() * 3);
        for (let l = 0; l < 3; l++) {
          if (l !== freeLane && l !== targetLane) {
            s.obstacles.push({ z: s.scrolled + 42, lane: l, kind: 'sack' });
          }
        }
      }
    }

    // Idli Spawner
    s.nextIdli -= s.speed * dt;
    if (s.nextIdli <= 0) {
      s.nextIdli = 9 + Math.random() * 8;
      const targetLane = Math.floor(Math.random() * 3);
      const stackCount = 2 + Math.floor(Math.random() * 4);
      const isGold = Math.random() < 0.12;

      for (let i = 0; i < stackCount; i++) {
        s.idlis.push({
          z: s.scrolled + 42 + i * 2.2,
          lane: targetLane,
          gold: isGold,
          taken: false
        });
      }
    }

    // Obstacle Collisions
    const playerZ = s.scrolled + 0.4;
    for (let i = s.obstacles.length - 1; i >= 0; i--) {
      const obs = s.obstacles[i];
      if (obs.z < s.scrolled - 2) {
        s.obstacles.splice(i, 1);
      } else if (
        Math.abs(obs.z - playerZ) < 0.75 &&
        obs.lane === Math.round(s.laneT) &&
        s.invuln <= 0
      ) {
        if (obs.kind === 'puddle' && s.jumpY > 46) {
          // Cleared safely!
        } else {
          s.lives--;
          s.combo = 0;
          s.invuln = 1.3;
          s.flash = 1;
          soundManager.playNoise(0.3, 900, 120);
          this.effects.burst(this.renderer.width / 2, this.renderer.height * 0.72, '#ff5d5d', 14, 180, 4);
          this.effects.pop(this.renderer.width / 2, this.renderer.height * 0.70, obs.kind === 'puddle' ? 'Chai!' : 'Oof!', '#ff6b6b', 24);
          this.updateHUD();

          if (s.lives <= 0) {
            s.gameOver = true;
            this.showModal(false);
            return;
          }
        }
      }
    }

    // Idli Collections
    for (let i = s.idlis.length - 1; i >= 0; i--) {
      const idli = s.idlis[i];
      if (idli.z < s.scrolled - 2) {
        if (!idli.taken) s.combo = 0;
        s.idlis.splice(i, 1);
      } else if (
        !idli.taken &&
        Math.abs(idli.z - playerZ) < 1.0 &&
        idli.lane === Math.round(s.laneT) &&
        s.jumpY < 90
      ) {
        idli.taken = true;
        s.combo++;
        const multiplier = Math.min(5, 1 + Math.floor(s.combo / 5));
        const pts = (idli.gold ? 60 : 20) * multiplier;
        this.score += pts;

        soundManager.playTone(520 + Math.min(500, s.combo * 24), 0.09);
        this.effects.burst(this.renderer.width / 2, this.renderer.height * 0.80, idli.gold ? '#ffd166' : '#fdf6e3', idli.gold ? 16 : 8, 130, 3);
        this.effects.pop(this.renderer.width / 2, this.renderer.height * 0.74, `+${pts}`, idli.gold ? '#ffd166' : '#fdf6e3', idli.gold ? 22 : 16);
        this.updateHUD();
      }
    }

    // 50m Distance Bonus
    if (s.scrolled - s.mile >= 50) {
      s.mile += 50;
      this.score += 25;
      soundManager.playTone(660, 0.08);
      this.updateHUD();
    }

    // Update Particles, Dust Puffs & Pops
    for (let i = this.dustPuffs.length - 1; i >= 0; i--) {
      const dp = this.dustPuffs[i];
      dp.x += dp.vx * dt;
      dp.y += dp.vy * dt;
      dp.life += dt;
      if (dp.life >= dp.max) this.dustPuffs.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += pt.grav * dt;
      pt.life += dt;
      if (pt.life >= pt.max) this.particles.splice(i, 1);
    }

    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i];
      p.age += dt;
      if (p.age >= 0.8) this.pops.splice(i, 1);
    }
  }

  showModal(isWin) {
    this.isPlaying = false;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('tiffinrun_high_score', this.highScore);
    }

    const iconEl = this.container.querySelector('#tiffin-modal-icon');
    const titleEl = this.container.querySelector('#tiffin-modal-title');
    const msgEl = this.container.querySelector('#tiffin-modal-msg');
    const scoreEl = this.container.querySelector('#tiffin-modal-score');
    const sectorsEl = this.container.querySelector('#tiffin-modal-sectors');
    const distEl = this.container.querySelector('#tiffin-modal-dist');
    const bestEl = this.container.querySelector('#tiffin-modal-best');

    if (isWin) {
      iconEl.textContent = '🏆';
      titleEl.textContent = 'RUN COMPLETED!';
      msgEl.textContent = 'All 6 sectors delivered on time across the city!';
      soundManager.playTone(523, 0.35, 784);
    } else {
      iconEl.textContent = '💥';
      titleEl.textContent = 'DELIVERY FAILED!';
      msgEl.textContent = `Reached Sector ${this.state.sector} / 6 (${Math.round(this.state.scrolled)}m)`;
      soundManager.playTone(260, 0.35, 90);
    }

    scoreEl.textContent = this.score;
    sectorsEl.textContent = `${this.state.sector} / 6`;
    distEl.textContent = `${Math.round(this.state.scrolled)}m`;
    bestEl.textContent = this.highScore;

    this.modalOverlay.classList.remove('hidden');
  }

  destroy() {
    this.isPlaying = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('keydown', this.boundKeyDown);
  }
}
