// FruitSliceGame.js - Fruit Slice Frenzy Blade Slicing Arcade Game
import { FruitSliceRenderer } from './FruitSliceRenderer.js';
import { soundManager } from '../../sound/SoundManager.js';

const FRUIT_TYPES = [
  { type: 'watermelon', color: '#e53935', radius: 42, score: 10 },
  { type: 'orange', color: '#ff9800', radius: 36, score: 10 },
  { type: 'apple', color: '#7cb342', radius: 34, score: 10 },
  { type: 'lemon', color: '#fbc02d', radius: 32, score: 10 },
  { type: 'strawberry', color: '#e91e63', radius: 28, score: 15 }
];

export class FruitSliceGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    // Game state
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('fruitslice_high_score') || '0', 10);
    this.strikes = 0;
    this.isGameOver = false;
    this.bombFlash = 0.0;

    // Entities
    this.fruits = [];
    this.slicedPieces = [];
    this.bladeTrail = [];
    this.isSwiping = false;
    this.currentSwipeSlices = 0;

    // Spawn timer
    this.timeUntilWave = 0.2;
    this.lastFrameTime = performance.now();

    this.initDOM();
    this.initEvents();
    this.startLoop();
  }

  initDOM() {
    const isMuted = soundManager.isMuted();

    this.container.innerHTML = `
      <div class="game-wrapper fruitslice-wrapper">
        <canvas id="fruitslice-canvas"></canvas>

        <div class="game-top-bar" style="padding-top: 8px;">
          <!-- Left: Back Arrow and Sound Toggle -->
          <div class="top-controls">
            <button class="icon-btn" id="fruitslice-back-btn" title="Back to Hub" style="background: rgba(255,255,255,0.7); color: #1e293b;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <button class="icon-btn" id="fruitslice-sound-btn" title="Toggle Sound" style="background: rgba(255,255,255,0.7); color: #1e293b;">
              ${isMuted 
                ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
                : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>'}
            </button>
          </div>

          <!-- Center: Game Name (Fruit Slice Frenzy) -->
          <div class="fruitslice-title-banner">
            <span class="fruitslice-main-title">Fruit Slice Frenzy</span>
            <div class="rainbow-line"></div>
          </div>

          <!-- Right: Lives & Score -->
          <div class="fruitslice-hud">
            <div class="fruitslice-lives" title="3 Bomb Lives">
              <span class="life-heart" id="life-1">❤️</span>
              <span class="life-heart" id="life-2">❤️</span>
              <span class="life-heart" id="life-3">❤️</span>
            </div>
            <div class="fruitslice-card">
              <span class="fruitslice-lbl">SCORE</span>
              <span class="fruitslice-val" id="fruitslice-score-val">0</span>
            </div>
          </div>
        </div>

        <div id="fruitslice-modal-overlay" class="modal-overlay hidden">
          <div class="modal-card">
            <h2 id="fruitslice-modal-title" class="modal-title">GAME OVER</h2>
            <p id="fruitslice-modal-desc" class="modal-desc">You missed 3 fruits!</p>
            <div class="stats-grid">
              <div class="stat-box">
                <span class="stat-lbl">FINAL SCORE</span>
                <span class="stat-val" id="fruitslice-modal-score">0</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">BEST RECORD</span>
                <span class="stat-val" id="fruitslice-modal-best">${this.highScore}</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn btn-secondary" id="fruitslice-modal-hub-btn">Arcade Hub</button>
              <button class="btn btn-primary" id="fruitslice-modal-play-btn">Play Again</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('fruitslice-canvas');
    this.scoreValEl = document.getElementById('fruitslice-score-val');
    this.bestValEl = document.getElementById('fruitslice-best-val');
    this.modalEl = document.getElementById('fruitslice-modal-overlay');

    this.renderer = new FruitSliceRenderer(this.canvas);
    this.handleResize();
  }

  handleResize() {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    const ctx = this.canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.renderer.resize(rect.width, rect.height);
  }

  initEvents() {
    this.boundResize = () => this.handleResize();
    window.addEventListener('resize', this.boundResize);

    document.getElementById('fruitslice-back-btn').addEventListener('click', () => {
      this.destroy();
      this.onExit();
    });

    const soundBtn = document.getElementById('fruitslice-sound-btn');
    soundBtn.addEventListener('click', () => {
      soundManager.init();
      const muted = soundManager.toggleMute();
      soundBtn.innerHTML = muted 
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
        : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>';
    });

    document.getElementById('fruitslice-modal-hub-btn').addEventListener('click', () => {
      this.destroy();
      this.onExit();
    });

    document.getElementById('fruitslice-modal-play-btn').addEventListener('click', () => {
      this.resetGame();
    });

    // Pointer events for slicing
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const onPointerDown = (e) => {
      if (this.isGameOver) return;
      this.isSwiping = true;
      this.currentSwipeSlices = 0;
      const pos = getPos(e);
      this.bladeTrail = [{ x: pos.x, y: pos.y, age: 0 }];
      soundManager.playSwordWhoosh();
    };

    const onPointerMove = (e) => {
      if (!this.isSwiping || this.isGameOver) return;
      if (e.cancelable) e.preventDefault();
      const pos = getPos(e);

      const last = this.bladeTrail[this.bladeTrail.length - 1];
      if (last) {
        const dist = Math.hypot(pos.x - last.x, pos.y - last.y);
        if (dist > 6) {
          this.bladeTrail.push({ x: pos.x, y: pos.y, age: 0 });
          this.checkSliceCollision(last, pos);
        }
      } else {
        this.bladeTrail.push({ x: pos.x, y: pos.y, age: 0 });
      }
    };

    const onPointerUp = () => {
      if (this.currentSwipeSlices >= 3) {
        const bonus = this.currentSwipeSlices * 30;
        this.score += bonus;
        soundManager.playFruitCombo(this.currentSwipeSlices);
        this.renderer.spawnFloatingText(`COMBO ${this.currentSwipeSlices}x! +${bonus}`, this.renderer.width / 2, this.renderer.height * 0.35, '#ff007f', 32);
        this.updateHUD();
      }
      this.isSwiping = false;
      this.currentSwipeSlices = 0;
    };

    this.canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  checkSliceCollision(p1, p2) {
    const cutAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const fruit = this.fruits[i];
      // Distance from point to line segment
      const dist = this.distToSegment(fruit, p1, p2);

      if (dist <= fruit.radius) {
        if (fruit.isBomb) {
          // BOMB HIT!
          const bomb = this.fruits.splice(i, 1)[0];
          this.hitBomb(bomb);
          return;
        } else {
          // Slice fruit!
          this.fruits.splice(i, 1);
          this.sliceFruit(fruit, cutAngle);
          this.currentSwipeSlices++;
          this.score += fruit.score;
          this.updateHUD();
          soundManager.playFruitSlice();
        }
      }
    }
  }

  distToSegment(p, v, w) {
    const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }

  sliceFruit(fruit, cutAngle) {
    const normalAngle = cutAngle + Math.PI / 2;
    const spreadSpeed = Math.random() * 2.5 + 3.0;

    // Halve 1
    this.slicedPieces.push({
      type: fruit.type,
      radius: fruit.radius,
      x: fruit.x + Math.cos(normalAngle) * 8,
      y: fruit.y + Math.sin(normalAngle) * 8,
      vx: fruit.vx + Math.cos(normalAngle) * spreadSpeed,
      vy: fruit.vy + Math.sin(normalAngle) * spreadSpeed,
      rotation: fruit.rotation,
      vRot: -0.12 - Math.random() * 0.1,
      clipAngle: cutAngle
    });

    // Halve 2
    this.slicedPieces.push({
      type: fruit.type,
      radius: fruit.radius,
      x: fruit.x - Math.cos(normalAngle) * 8,
      y: fruit.y - Math.sin(normalAngle) * 8,
      vx: fruit.vx - Math.cos(normalAngle) * spreadSpeed,
      vy: fruit.vy - Math.sin(normalAngle) * spreadSpeed,
      rotation: fruit.rotation,
      vRot: 0.12 + Math.random() * 0.1,
      clipAngle: cutAngle + Math.PI
    });

    // Spawn juice splash
    this.renderer.spawnJuiceSplash(fruit.x, fruit.y, fruit.color);
    this.renderer.spawnFloatingText(`+${fruit.score}`, fruit.x, fruit.y - 10, fruit.color, 20);
  }

  hitBomb(bomb) {
    this.strikes++;
    this.bombFlash = 0.8;
    soundManager.playBombExplode();
    this.renderer.spawnJuiceSplash(bomb.x, bomb.y, '#ef4444');
    this.renderer.spawnFloatingText(`-1 LIFE! 💣`, bomb.x, bomb.y - 20, '#ef4444', 28);

    const lifeEl = document.getElementById(`life-${this.strikes}`);
    if (lifeEl) {
      lifeEl.classList.add('lost');
    }

    if (this.strikes >= 3) {
      this.isGameOver = true;
      document.getElementById('fruitslice-modal-title').textContent = 'BOOM! 3 BOMBS HIT!';
      document.getElementById('fruitslice-modal-desc').textContent = 'You hit 3 bombs! Game over!';
      document.getElementById('fruitslice-modal-score').textContent = this.score.toLocaleString();
      document.getElementById('fruitslice-modal-best').textContent = this.highScore.toLocaleString();

      setTimeout(() => {
        this.modalEl.classList.remove('hidden');
      }, 700);
    }
  }

  spawnWave() {
    const w = this.renderer.width;
    const h = this.renderer.height;
    // Wave count: 1 to 3 fruits
    const count = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < count; i++) {
      const isBomb = Math.random() < 0.16;
      const x = w * 0.15 + Math.random() * (w * 0.7);
      const y = h + 30;

      // Launch velocity scaled to screen height
      const targetHeight = h * (Math.random() * 0.4 + 0.25);
      const gravity = 0.48;
      const upwardVy = -Math.sqrt(2 * gravity * (y - targetHeight));
      const targetX = w * 0.5 + (Math.random() - 0.5) * (w * 0.5);
      const timeToApex = -upwardVy / gravity;
      const vx = (targetX - x) / (timeToApex * 1.8);

      if (isBomb) {
        this.fruits.push({
          isBomb: true,
          radius: 36,
          color: '#ef4444',
          x, y, vx, vy: upwardVy,
          rotation: 0,
          vRot: (Math.random() - 0.5) * 0.05
        });
      } else {
        const template = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
        this.fruits.push({
          isBomb: false,
          type: template.type,
          color: template.color,
          radius: template.radius,
          score: template.score,
          x, y, vx, vy: upwardVy,
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.12
        });
      }
    }
  }

  update(dt) {
    if (this.isGameOver) return;

    const h = this.renderer.height;
    const gravity = 0.48;

    // Bomb flash decay
    if (this.bombFlash > 0) {
      this.bombFlash = Math.max(0, this.bombFlash - dt * 2.0);
    }

    // Spawn wave timer
    this.timeUntilWave -= dt;
    if (this.timeUntilWave <= 0) {
      this.spawnWave();
      this.timeUntilWave = Math.random() * 1.2 + 1.4;
    }

    // Update fruits
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];
      f.x += f.vx;
      f.y += f.vy;
      f.vy += gravity;
      f.rotation += f.vRot;

      // Check if fallen off the bottom
      if (f.y > h + 70 && f.vy > 0) {
        this.fruits.splice(i, 1);
        // Missing a fruit does NOT reduce lives (lives are only lost on bomb hit)
      }
    }

    // Update sliced halves
    for (let i = this.slicedPieces.length - 1; i >= 0; i--) {
      const p = this.slicedPieces[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += gravity;
      p.rotation += p.vRot;

      if (p.y > h + 80) {
        this.slicedPieces.splice(i, 1);
      }
    }

    // Update blade trail points age
    for (let i = this.bladeTrail.length - 1; i >= 0; i--) {
      this.bladeTrail[i].age += dt;
      if (this.bladeTrail[i].age > 0.22) {
        this.bladeTrail.splice(i, 1);
      }
    }
  }

  updateHUD() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('fruitslice_high_score', this.highScore.toString());
    }

    this.scoreValEl.textContent = this.score.toLocaleString();
  }

  resetGame() {
    this.modalEl.classList.add('hidden');
    this.score = 0;
    this.strikes = 0;
    this.isGameOver = false;
    this.bombFlash = 0.0;
    this.fruits = [];
    this.slicedPieces = [];
    this.bladeTrail = [];
    this.timeUntilWave = 0.2;

    for (let i = 1; i <= 3; i++) {
      const el = document.getElementById(`life-${i}`);
      if (el) el.classList.remove('lost');
    }

    this.updateHUD();
  }

  startLoop() {
    const loop = (now) => {
      const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = now;

      this.update(dt);
      this.renderer.updateAnimations(dt);
      this.renderer.render({
        fruits: this.fruits,
        slicedPieces: this.slicedPieces,
        bladeTrail: this.bladeTrail,
        bombFlash: this.bombFlash
      });

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    window.removeEventListener('resize', this.boundResize);
  }
}
