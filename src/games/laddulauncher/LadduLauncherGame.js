// LadduLauncherGame.js - High-End Slingshot Demolition Physics Game
import { LadduLauncherRenderer } from './LadduLauncherRenderer.js';
import { soundManager } from '../../sound/SoundManager.js';

// The 12 Canonical Strategic Campaign Levels
const LEVELS = [
  { jars: [[0.78, 0.62], [0.86, 0.62]], blocks: [[0.75, 0.66, 0.16, 0.03]], laddus: 3 },
  { jars: [[0.7, 0.5], [0.82, 0.5], [0.76, 0.38]], blocks: [[0.66, 0.54, 0.22, 0.03]], laddus: 3 },
  { jars: [[0.6, 0.62], [0.72, 0.62], [0.66, 0.47]], blocks: [[0.56, 0.66, 0.22, 0.03], [0.62, 0.51, 0.1, 0.03]], laddus: 4 },
  { jars: [[0.85, 0.44], [0.85, 0.58]], blocks: [[0.8, 0.62, 0.12, 0.03], [0.66, 0.5, 0.03, 0.26]], laddus: 3 },
  { jars: [[0.5, 0.4], [0.62, 0.52], [0.74, 0.4]], blocks: [[0.46, 0.55, 0.03, 0.2], [0.58, 0.56, 0.03, 0.2], [0.7, 0.55, 0.03, 0.2]], laddus: 4 },
  { jars: [[0.76, 0.6], [0.82, 0.44], [0.68, 0.44]], blocks: [[0.64, 0.64, 0.24, 0.03]], laddus: 3 },
  { jars: [[0.55, 0.62], [0.67, 0.62], [0.61, 0.5], [0.61, 0.36]], blocks: [[0.51, 0.66, 0.2, 0.03], [0.55, 0.54, 0.13, 0.03]], laddus: 4 },
  { jars: [[0.88, 0.62], [0.76, 0.62], [0.82, 0.48], [0.7, 0.34]], blocks: [[0.66, 0.66, 0.26, 0.03], [0.68, 0.38, 0.1, 0.03]], laddus: 4 },
  { jars: [[0.5, 0.62], [0.62, 0.62], [0.74, 0.62], [0.56, 0.48], [0.68, 0.48]], blocks: [[0.46, 0.66, 0.32, 0.03], [0.5, 0.52, 0.24, 0.03]], laddus: 5 },
  { jars: [[0.6, 0.58], [0.78, 0.34], [0.86, 0.62]], blocks: [[0.56, 0.62, 0.08, 0.03], [0.74, 0.38, 0.08, 0.03], [0.64, 0.5, 0.03, 0.24]], laddus: 4 },
  { jars: [[0.52, 0.62], [0.52, 0.48], [0.66, 0.62], [0.66, 0.48], [0.8, 0.62], [0.8, 0.48]], blocks: [[0.46, 0.66, 0.4, 0.03], [0.48, 0.52, 0.36, 0.03]], laddus: 5 },
  { jars: [[0.58, 0.56], [0.7, 0.44], [0.82, 0.56], [0.64, 0.32], [0.88, 0.32]], blocks: [[0.54, 0.6, 0.1, 0.03], [0.66, 0.48, 0.1, 0.03], [0.78, 0.6, 0.1, 0.03], [0.6, 0.36, 0.1, 0.03]], laddus: 5 }
];

export class LadduLauncherGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    this.highScore = parseInt(localStorage.getItem('laddulauncher_high_score') || '0', 10);
    this.score = 0;

    this.initDOM();
    this.initEffects();
    this.renderer = new LadduLauncherRenderer(this.canvas);
    this.resetCampaign();
    this.initEvents();
    this.startLoop();
  }

  initDOM() {
    const isMuted = soundManager.isMuted();

    this.container.innerHTML = `
      <div class="game-wrapper laddulauncher-wrapper">
        <canvas id="laddulauncher-canvas"></canvas>

        <div class="laddulauncher-top-bar">
          <div class="top-controls">
            <button class="icon-btn" id="laddulauncher-back-btn" title="Back to Hub">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <button class="icon-btn" id="laddulauncher-sound-btn" title="Toggle Sound">
              ${isMuted 
                ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
                : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>'}
            </button>
          </div>

          <div class="laddulauncher-hud">
            <div class="laddulauncher-hud-card">
              <span class="laddulauncher-hud-lbl">LEVEL</span>
              <span class="laddulauncher-hud-val" id="laddulauncher-level-val">1 / 12</span>
            </div>
            <div class="laddulauncher-hud-card">
              <span class="laddulauncher-hud-lbl">RETRIES</span>
              <span class="laddulauncher-hud-val" id="laddulauncher-retries-val" style="color: #ffd166;">⭐⭐⭐</span>
            </div>
            <div class="laddulauncher-hud-card">
              <span class="laddulauncher-hud-lbl">JARS</span>
              <span class="laddulauncher-hud-val" id="laddulauncher-jars-val">0 / 0</span>
            </div>
            <div class="laddulauncher-hud-card">
              <span class="laddulauncher-hud-lbl">SCORE</span>
              <span class="laddulauncher-hud-val" id="laddulauncher-score-val">0</span>
            </div>
          </div>
        </div>

        <div id="laddulauncher-hint" class="laddulauncher-hint">
          Drag back from the laddu to aim slingshot, then release to launch!
        </div>

        <!-- Victory / Game Over Modal -->
        <div id="laddulauncher-modal-overlay" class="modal-overlay hidden">
          <div class="modal-card">
            <div class="modal-badge-crown" id="laddulauncher-modal-icon">🏆</div>
            <h2 id="laddulauncher-modal-title" class="modal-title">CAMPAIGN COMPLETE!</h2>
            <p id="laddulauncher-modal-msg" class="modal-desc">All 12 levels smashed with strategic precision!</p>
            <div class="stats-grid">
              <div class="stat-box">
                <span class="stat-lbl">FINAL SCORE</span>
                <span class="stat-val" id="laddulauncher-modal-score">0</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">JARS SMASHED</span>
                <span class="stat-val" id="laddulauncher-modal-smashed">0</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">LEVEL REACHED</span>
                <span class="stat-val" id="laddulauncher-modal-level">12 / 12</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">HIGH SCORE</span>
                <span class="stat-val" id="laddulauncher-modal-best">0</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-primary" id="laddulauncher-retry-btn">Play Again</button>
              <button class="btn-secondary" id="laddulauncher-exit-btn">Arcade Hub</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#laddulauncher-canvas');
    this.levelValEl = this.container.querySelector('#laddulauncher-level-val');
    this.retriesValEl = this.container.querySelector('#laddulauncher-retries-val');
    this.jarsValEl = this.container.querySelector('#laddulauncher-jars-val');
    this.scoreValEl = this.container.querySelector('#laddulauncher-score-val');
    this.hintEl = this.container.querySelector('#laddulauncher-hint');
    this.modalEl = this.container.querySelector('#laddulauncher-modal-overlay');
  }

  initEffects() {
    this.particles = [];
    this.pops = [];
    this.screenShake = 0;

    this.effects = {
      pop: (x, y, text, color = '#ffd166', size = 18) => {
        this.pops.push({ x, y, text, color, size, age: 0 });
      },
      burst: (x, y, color = '#ffd166', count = 16, speed = 220, size = 4) => {
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = speed * (0.3 + Math.random() * 0.7);
          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 0,
            max: 0.5 + Math.random() * 0.5,
            color,
            size: size * (0.6 + Math.random() * 0.8),
            grav: 320
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

        // Particle Bursts (Glass shards & Syrup droplets)
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

  resetCampaign() {
    this.score = 0;
    this.brokenCount = 0;
    this.retries = 3;
    this.currentLevelIdx = 0;
    this.gameOver = false;
    this.gameWon = false;

    this.resizeCanvas();
    this.loadLevel(this.currentLevelIdx);
  }

  resizeCanvas() {
    const rect = this.container.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    this.renderer.resize(w, h);
    if (this.state) {
      this.repositionEntities(w, h);
    }
  }

  repositionEntities(w, h) {
    const cfg = LEVELS[this.currentLevelIdx];
    if (!cfg) return;
    this.state.jars.forEach((jar, i) => {
      if (cfg.jars[i]) {
        jar.x = w * cfg.jars[i][0];
        jar.y = h * cfg.jars[i][1];
      }
    });
  }

  loadLevel(levelIndex) {
    const cfg = LEVELS[levelIndex];
    const W = this.canvas.width;
    const H = this.canvas.height;

    this.state = {
      level: levelIndex + 1,
      jars: cfg.jars.map(([jx, jy]) => ({
        x: W * jx,
        y: H * jy,
        vx: 0,
        vy: 0,
        r: 17,
        broken: false,
        sleep: true
      })),
      blocks: cfg.blocks.map(([bx, by, bw, bh]) => ({
        x: bx,
        y: by,
        w: bw,
        h: bh
      })),
      laddus: cfg.laddus,
      maxLaddus: cfg.laddus,
      flying: null,
      aiming: false,
      aimX: 0,
      aimY: 0,
      shotT: 0
    };

    this.updateHUD();
  }

  updateHUD() {
    if (this.levelValEl) {
      this.levelValEl.textContent = `${this.state.level} / ${LEVELS.length}`;
    }
    if (this.retriesValEl) {
      this.retriesValEl.textContent = '⭐'.repeat(Math.max(0, this.retries)) || '💀';
    }
    if (this.jarsValEl) {
      const remaining = this.state.jars.filter(j => !j.broken).length;
      const total = this.state.jars.length;
      this.jarsValEl.textContent = `${total - remaining} / ${total}`;
    }
    if (this.scoreValEl) {
      this.scoreValEl.textContent = this.score;
    }
  }

  initEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());

    this.container.querySelector('#laddulauncher-back-btn').addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    const soundBtn = this.container.querySelector('#laddulauncher-sound-btn');
    soundBtn.addEventListener('click', () => {
      const isMuted = soundManager.toggleMute();
      soundBtn.innerHTML = isMuted
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
        : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>';
    });

    this.container.querySelector('#laddulauncher-retry-btn').addEventListener('click', () => {
      this.modalEl.classList.add('hidden');
      this.resetCampaign();
    });

    this.container.querySelector('#laddulauncher-exit-btn').addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    // Pointer Slingshot Controls
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const onPointerDown = (e) => {
      if (this.gameOver || this.gameWon || !this.state) return;
      if (this.state.laddus <= 0 || (this.state.flying && this.state.flying.live)) return;

      const pos = getPos(e);
      const slingX = this.canvas.width * 0.12;
      const slingY = this.canvas.height - 178;
      const dist = Math.hypot(pos.x - slingX, pos.y - slingY);

      if (dist < 130) {
        this.state.aiming = true;
        this.state.aimX = pos.x;
        this.state.aimY = pos.y;
        if (this.hintEl) this.hintEl.style.opacity = '0';
      }
    };

    const onPointerMove = (e) => {
      if (!this.state || !this.state.aiming) return;
      const pos = getPos(e);
      this.state.aimX = pos.x;
      this.state.aimY = pos.y;
    };

    const onPointerUp = () => {
      if (!this.state || !this.state.aiming) return;
      this.state.aiming = false;

      if (this.state.laddus <= 0 || (this.state.flying && this.state.flying.live)) return;

      const slingX = this.canvas.width * 0.12;
      const slingY = this.canvas.height - 178;
      const dx = slingX - this.state.aimX;
      const dy = slingY - this.state.aimY;
      const pullDist = Math.hypot(dx, dy);

      if (pullDist < 14) return; // Released without pulling

      const power = Math.min(1, pullDist / 170);
      this.state.laddus--;
      this.state.flying = {
        x: slingX,
        y: slingY,
        vx: dx * 4.4 * power,
        vy: dy * 4.4 * power,
        live: true
      };
      this.state.shotT = 1.6;

      soundManager.playNoise(0.18, 2600, 700);
      this.updateHUD();
    };

    this.canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      onPointerDown(e.touches[0]);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (this.state && this.state.aiming) {
        e.preventDefault();
        onPointerMove(e.touches[0]);
      }
    }, { passive: false });

    window.addEventListener('touchend', onPointerUp);
    window.addEventListener('touchcancel', onPointerUp);
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

    this.state.shotT = Math.max(0, this.state.shotT - dt);
    this.screenShake = Math.max(0, this.screenShake - dt * 50);

    const W = this.canvas.width;
    const H = this.canvas.height;
    const floorY = H - 90;

    // 1. Update Physics for Gulab Jamun Jars
    for (const jar of this.state.jars) {
      if (jar.broken || jar.sleep) continue;

      jar.vy += 850 * dt;
      jar.x += jar.vx * dt;
      jar.y += jar.vy * dt;

      let hitFloor = false;
      if (jar.y + jar.r >= floorY) {
        jar.y = floorY - jar.r;
        hitFloor = true;
      }

      // Check collision with wooden block shelves
      for (const b of this.state.blocks) {
        const bx = W * b.x;
        const by = H * b.y;
        const bw = W * b.w;
        const bh = H * b.h;

        if (jar.x + jar.r > bx && jar.x - jar.r < bx + bw && jar.y + jar.r >= by && jar.y - jar.r < by + bh && jar.vy >= 0) {
          jar.y = by - jar.r;
          hitFloor = true;
        }
      }

      if (hitFloor) {
        if (Math.abs(jar.vy) > 260) {
          // Smashed upon hard landing!
          this.breakJar(jar, Math.abs(jar.vy) > 420);
        } else {
          jar.vy = 0;
          jar.vx *= 0.6;
          if (Math.abs(jar.vx) < 8) {
            jar.vx = 0;
            jar.sleep = true;
          }
        }
      }

      // Left/Right screen wall bounce
      if (jar.x < jar.r) {
        jar.x = jar.r;
        jar.vx = Math.abs(jar.vx) * 0.5;
      } else if (jar.x > W - jar.r) {
        jar.x = W - jar.r;
        jar.vx = -Math.abs(jar.vx) * 0.5;
      }
    }

    // 2. Update Flying Shot Laddu
    const fly = this.state.flying;
    if (fly && fly.live) {
      fly.vy += 850 * dt;
      fly.x += fly.vx * dt;
      fly.y += fly.vy * dt;

      // Particles trail while flying
      if (Math.random() < 0.4) {
        this.effects.burst(fly.x, fly.y, '#f48c06', 2, 40, 2);
      }

      // Hit test against jars
      for (const jar of this.state.jars) {
        if (!jar.broken) {
          const dist = Math.hypot(fly.x - jar.x, fly.y - jar.y);
          if (dist < jar.r + 14) {
            jar.vx += fly.vx * 0.45;
            jar.vy += Math.max(120, fly.vy * 0.35);
            jar.sleep = false;
            this.breakJar(jar, false);
            fly.live = false;
            break;
          }
        }
      }

      // Hit test against wooden blocks (elastic bounce)
      for (const b of this.state.blocks) {
        const bx = W * b.x;
        const by = H * b.y;
        const bw = W * b.w;
        const bh = H * b.h;

        if (fly.x > bx - 12 && fly.x < bx + bw + 12 && fly.y > by - 12 && fly.y < by + bh + 12) {
          if (Math.abs(fly.y - by) < Math.min(Math.abs(fly.x - bx), Math.abs(fly.x - bx - bw))) {
            fly.vy *= -0.45;
            fly.y = by - 12;
          } else {
            fly.vx *= -0.45;
            fly.x = fly.x < bx + bw / 2 ? bx - 12 : bx + bw + 12;
          }
          soundManager.playTone(190, 0.08, 120);
        }
      }

      // Wall bounce
      if (fly.x < 12 && fly.vx < 0) {
        fly.vx *= -0.5;
      }

      // Out of bounds or at rest
      if (fly.y > H + 60 || fly.x > W + 80) {
        fly.live = false;
      }
      if (fly.live && Math.abs(fly.vy) < 30 && Math.abs(fly.vx) < 30 && fly.y > H - 120) {
        fly.live = false;
      }

      if (!fly.live && this.state.shotT <= 0) {
        this.evaluateTurn();
      }
    } else if (this.state.shotT <= 0 && !this.state.aiming) {
      const allSettled = this.state.jars.every(j => j.broken || j.sleep || (Math.abs(j.vy) < 2 && Math.abs(j.vx) < 2));
      if (allSettled) {
        this.evaluateTurn();
      }
    }

    // 3. Update Particles
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

    // 4. Update Pops
    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i];
      p.age += dt;
      if (p.age >= 0.8) {
        this.pops.splice(i, 1);
      }
    }
  }

  breakJar(jar, hardSmash) {
    jar.broken = true;
    this.brokenCount++;
    const pts = hardSmash ? 120 : 100;
    this.score += pts;
    this.updateHUD();

    this.effects.burst(jar.x, jar.y, '#ffd166', 16, 240, 4);
    this.effects.burst(jar.x, jar.y, '#d16b1f', 12, 180, 5); // Syrup splash
    this.effects.pop(jar.x, jar.y - 30, hardSmash ? 'SMASH! +120 💥' : 'SHATTER! +100 ✨', '#ffd166', 20);

    soundManager.playGlassShatter();
    this.screenShake = 10;
  }

  evaluateTurn() {
    const remainingJars = this.state.jars.filter(j => !j.broken);

    // If jars still remain
    if (remainingJars.length > 0) {
      if (this.state.laddus <= 0) {
        this.retries--;
        this.updateHUD();

        if (this.retries < 0) {
          this.handleGameOver(false);
          return;
        }

        this.effects.pop(this.canvas.width / 2, this.canvas.height * 0.25, `Retry! ${this.retries} left ⭐`, '#ffd166', 24);
        soundManager.playTone(220, 0.25, 160);
        this.loadLevel(this.currentLevelIdx);
      }
      return;
    }

    // All jars broken! Level clear bonus!
    const ammoBonus = this.state.laddus * 50;
    this.score += (100 + ammoBonus);
    this.updateHUD();

    if (this.currentLevelIdx >= LEVELS.length - 1) {
      // Completed all 12 levels!
      this.handleGameOver(true);
    } else {
      this.effects.pop(
        this.canvas.width / 2,
        this.canvas.height * 0.25,
        ammoBonus > 0 ? `Level Clear! +${ammoBonus} Ammo Bonus 🎯` : 'Level Clear! 🎉',
        '#06d6a0',
        24
      );
      soundManager.playTone(523, 0.2, 784);
      this.currentLevelIdx++;
      setTimeout(() => {
        if (this.running) {
          this.loadLevel(this.currentLevelIdx);
        }
      }, 900);
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
      localStorage.setItem('laddulauncher_high_score', this.highScore);
    }

    const modalTitle = this.container.querySelector('#laddulauncher-modal-title');
    const modalMsg = this.container.querySelector('#laddulauncher-modal-msg');
    const modalIcon = this.container.querySelector('#laddulauncher-modal-icon');
    const modalScore = this.container.querySelector('#laddulauncher-modal-score');
    const modalSmashed = this.container.querySelector('#laddulauncher-modal-smashed');
    const modalLevel = this.container.querySelector('#laddulauncher-modal-level');
    const modalBest = this.container.querySelector('#laddulauncher-modal-best');

    if (won) {
      modalIcon.textContent = '🏆';
      modalTitle.textContent = 'CAMPAIGN MASTERED!';
      modalMsg.textContent = 'All 12 levels shattered with pinpoint precision!';
      soundManager.playTone(523, 0.25, 1046);
    } else {
      modalIcon.textContent = '💔';
      modalTitle.textContent = 'OUT OF RETRIES!';
      modalMsg.textContent = 'Refine your slingshot trajectory and try again!';
      soundManager.playNoise(0.5, 300, 70);
    }

    modalScore.textContent = this.score;
    modalSmashed.textContent = this.brokenCount;
    modalLevel.textContent = `${this.currentLevelIdx + 1} / ${LEVELS.length}`;
    modalBest.textContent = this.highScore;

    this.modalEl.classList.remove('hidden');
  }

  destroy() {
    this.running = false;
  }
}
