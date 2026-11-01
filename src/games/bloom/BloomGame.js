// BloomGame.js - Authentic Bloom Sort 4x4 Flower Pot Sorting Game
import { BloomRenderer } from './BloomRenderer.js';
import { soundManager } from '../../sound/SoundManager.js';

const COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Blue', hex: '#0ea5e9' },
  { name: 'Yellow', hex: '#eab308' }
];

export class BloomGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    // Game state
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('bloom_high_score') || '0', 10);
    this.isGameOver = false;
    this.activeTool = null; // 'prune' | 'water' | null

    // Booster counts
    this.boosters = {
      reroll: 3,
      shuffle: 2,
      prune: 2,
      water: 2
    };

    // 4x4 Grid
    this.grid = Array(4).fill(null).map(() => Array(4).fill(null));
    this.gridBounds = { left: 0, top: 0, size: 0, cellSize: 0, gap: 6 };
    this.dockBounds = { cx: 0, cy: 0, width: 0, height: 0 };
    this.hoverCell = null;

    // Dock piece (Current flower pot to place)
    this.dockPot = this.generateRandomPot();
    this.isSorting = false;
    this.lastFrameTime = performance.now();

    this.initDOM();
    this.initEvents();
    this.seedInitialPots();
    this.startLoop();
  }

  generateRandomPot(maxPetals = 4) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)].hex;
    const petals = Math.floor(Math.random() * maxPetals) + 1; // 1 to 4 petals
    return { color, petals };
  }

  seedInitialPots() {
    // Seed 4 initial pots on the board to start matching immediately
    const initialPositions = [
      { r: 1, c: 2, color: '#ef4444', petals: 3 },
      { r: 2, c: 2, color: '#a855f7', petals: 4 },
      { r: 1, c: 3, color: '#ef4444', petals: 2 },
      { r: 2, c: 1, color: '#22c55e', petals: 1 }
    ];
    initialPositions.forEach(p => {
      this.grid[p.r][p.c] = { color: p.color, petals: p.petals };
    });
  }

  initDOM() {
    const isMuted = soundManager.isMuted();

    this.container.innerHTML = `
      <div class="game-wrapper bloom-wrapper">
        <canvas id="bloom-canvas"></canvas>

        <div class="game-top-bar" style="padding-top: 10px;">
          <div class="top-controls">
            <button class="icon-btn" id="bloom-back-btn" title="Back to Hub">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <button class="icon-btn" id="bloom-sound-btn" title="Toggle Sound">
              ${isMuted 
                ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
                : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>'}
            </button>
          </div>

          <div style="font-family: 'Fredoka', sans-serif; font-size: 28px; font-weight: 800; color: #fff; text-shadow: 0 3px 6px rgba(0,0,0,0.5);">
            Score: <span id="bloom-score-val">0</span>
          </div>

          <div class="bloom-card" style="background: rgba(0,0,0,0.45); padding: 4px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);">
            <span style="font-size: 10px; font-weight: 800; color: #facc15; display: block;">BEST</span>
            <span id="bloom-best-val" style="font-size: 16px; font-weight: 800; color: #fff;">${this.highScore}</span>
          </div>
        </div>

        <!-- Bottom Boosters Bar -->
        <div class="bloom-boosters-bar">
          <button class="booster-btn" id="booster-reroll" title="New Pot">
            <span class="booster-icon">🔄</span>
            <span class="booster-count" id="count-reroll">${this.boosters.reroll}</span>
          </button>
          <button class="booster-btn" id="booster-shuffle" title="Shuffle Board">
            <span class="booster-icon">🔀</span>
            <span class="booster-count" id="count-shuffle">${this.boosters.shuffle}</span>
          </button>
          <button class="booster-btn" id="booster-prune" title="Prune Pot">
            <span class="booster-icon">✂️</span>
            <span class="booster-count" id="count-prune">${this.boosters.prune}</span>
          </button>
          <button class="booster-btn" id="booster-water" title="Water (+1 Petal)">
            <span class="booster-icon">💧</span>
            <span class="booster-count" id="count-water">${this.boosters.water}</span>
          </button>
        </div>

        <div id="bloom-modal-overlay" class="modal-overlay hidden">
          <div class="modal-card">
            <h2 class="modal-title">GARDEN FULL!</h2>
            <p class="modal-desc">No more empty flower tiles remaining.</p>
            <div class="stats-grid">
              <div class="stat-box">
                <span class="stat-lbl">FINAL SCORE</span>
                <span class="stat-val" id="bloom-modal-score">0</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">BEST RECORD</span>
                <span class="stat-val" id="bloom-modal-best">${this.highScore}</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn btn-secondary" id="bloom-modal-hub-btn">Arcade Hub</button>
              <button class="btn btn-primary" id="bloom-modal-play-btn">Play Again</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('bloom-canvas');
    this.scoreValEl = document.getElementById('bloom-score-val');
    this.bestValEl = document.getElementById('bloom-best-val');
    this.modalEl = document.getElementById('bloom-modal-overlay');

    this.renderer = new BloomRenderer(this.canvas);
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

    const w = rect.width;
    const h = rect.height;
    const gap = 8;
    // 4x4 Garden Tray
    const maxSize = Math.min(w * 0.86, h * 0.50, 380);
    const cellSize = Math.floor((maxSize - gap * 3) / 4);
    const size = cellSize * 4 + gap * 3;
    const left = Math.floor((w - size) / 2);
    const top = Math.floor(h * 0.16);

    this.gridBounds = { left, top, size, cellSize, gap };

    // Dock slot position
    const dockW = Math.min(w * 0.55, 200);
    const dockH = Math.min(cellSize * 1.05, 84);
    const dockY = top + size + (h * 0.88 - (top + size)) * 0.38;

    this.dockBounds = {
      cx: w / 2,
      cy: dockY,
      width: dockW,
      height: dockH
    };
  }

  initEvents() {
    this.boundResize = () => this.handleResize();
    window.addEventListener('resize', this.boundResize);

    document.getElementById('bloom-back-btn').addEventListener('click', () => {
      this.destroy();
      this.onExit();
    });

    const soundBtn = document.getElementById('bloom-sound-btn');
    soundBtn.addEventListener('click', () => {
      soundManager.init();
      const muted = soundManager.toggleMute();
      soundBtn.innerHTML = muted 
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
        : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>';
    });

    document.getElementById('bloom-modal-hub-btn').addEventListener('click', () => {
      this.destroy();
      this.onExit();
    });

    document.getElementById('bloom-modal-play-btn').addEventListener('click', () => {
      this.resetGame();
    });

    // Booster buttons
    document.getElementById('booster-reroll').addEventListener('click', () => {
      if (this.boosters.reroll <= 0 || this.isSorting) return;
      this.boosters.reroll--;
      document.getElementById('count-reroll').textContent = this.boosters.reroll;
      this.dockPot = this.generateRandomPot();
      soundManager.playClick();
    });

    document.getElementById('booster-shuffle').addEventListener('click', () => {
      if (this.boosters.shuffle <= 0 || this.isSorting) return;
      this.boosters.shuffle--;
      document.getElementById('count-shuffle').textContent = this.boosters.shuffle;
      this.shuffleBoard();
      soundManager.playClick();
    });

    const pruneBtn = document.getElementById('booster-prune');
    pruneBtn.addEventListener('click', () => {
      if (this.boosters.prune <= 0 || this.isSorting) return;
      this.activeTool = this.activeTool === 'prune' ? null : 'prune';
      pruneBtn.classList.toggle('active', this.activeTool === 'prune');
      document.getElementById('booster-water').classList.remove('active');
    });

    const waterBtn = document.getElementById('booster-water');
    waterBtn.addEventListener('click', () => {
      if (this.boosters.water <= 0 || this.isSorting) return;
      this.activeTool = this.activeTool === 'water' ? null : 'water';
      waterBtn.classList.toggle('active', this.activeTool === 'water');
      document.getElementById('booster-prune').classList.remove('active');
    });

    // Board click interaction
    const getCellAt = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const { left, top, cellSize, gap } = this.gridBounds;

      if (px < left || px > left + this.gridBounds.size || py < top || py > top + this.gridBounds.size) {
        return null;
      }

      const step = cellSize + gap;
      const col = Math.floor((px - left) / step);
      const row = Math.floor((py - top) / step);

      if (row >= 0 && row < 4 && col >= 0 && col < 4) {
        return { row, col };
      }
      return null;
    };

    this.canvas.addEventListener('pointermove', (e) => {
      this.hoverCell = getCellAt(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('pointerleave', () => {
      this.hoverCell = null;
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.isGameOver || this.isSorting) return;
      const cell = getCellAt(e.clientX, e.clientY);
      if (!cell) return;

      const { row, col } = cell;

      // Tool actions
      if (this.activeTool === 'prune') {
        if (this.grid[row][col]) {
          const { left, top, cellSize, gap } = this.gridBounds;
          const cx = left + col * (cellSize + gap) + cellSize / 2;
          const cy = top + row * (cellSize + gap) + cellSize / 2;
          this.renderer.spawnBloomBurst(cx, cy, this.grid[row][col].color);
          this.grid[row][col] = null;
          this.boosters.prune--;
          document.getElementById('count-prune').textContent = this.boosters.prune;
          this.activeTool = null;
          document.getElementById('booster-prune').classList.remove('active');
          soundManager.playShearsCut();
        }
        return;
      }

      if (this.activeTool === 'water') {
        if (this.grid[row][col]) {
          this.grid[row][col].petals = Math.min(6, this.grid[row][col].petals + 1);
          this.boosters.water--;
          document.getElementById('count-water').textContent = this.boosters.water;
          this.activeTool = null;
          document.getElementById('booster-water').classList.remove('active');
          soundManager.playFlowerPlant();
          if (this.grid[row][col].petals >= 6) {
            this.triggerBloom(row, col);
          }
        }
        return;
      }

      // Normal placement of dock pot onto empty tile
      if (this.grid[row][col] === null && this.dockPot) {
        this.placePot(row, col);
      }
    });
  }

  placePot(row, col) {
    this.grid[row][col] = {
      color: this.dockPot.color,
      petals: this.dockPot.petals
    };

    soundManager.playFlowerPlant();
    this.dockPot = this.generateRandomPot();

    // Trigger Sort Transfers to/from neighboring same-color pots
    this.processSortCascades(row, col);
  }

  shuffleBoard() {
    const existing = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c]) {
          existing.push(this.grid[r][c]);
          this.grid[r][c] = null;
        }
      }
    }
    // Randomly re-assign to cells
    const coords = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) coords.push({ r, c });
    }
    coords.sort(() => Math.random() - 0.5);
    existing.forEach((pot, i) => {
      const { r, c } = coords[i];
      this.grid[r][c] = pot;
    });

    // Check if new adjacencies exist
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c]) {
          this.processSortCascades(r, c);
        }
      }
    }
  }

  processSortCascades(targetR, targetC) {
    const targetPot = this.grid[targetR][targetC];
    if (!targetPot) return;

    const neighbors = [
      { r: targetR - 1, c: targetC },
      { r: targetR + 1, c: targetC },
      { r: targetR, c: targetC - 1 },
      { r: targetR, c: targetC + 1 }
    ];

    const { left, top, cellSize, gap } = this.gridBounds;
    const targetCx = left + targetC * (cellSize + gap) + cellSize / 2;
    const targetCy = top + targetR * (cellSize + gap) + cellSize / 2;

    let hasTransfer = false;

    neighbors.forEach(n => {
      if (n.r >= 0 && n.r < 4 && n.c >= 0 && n.c < 4) {
        const neighborPot = this.grid[n.r][n.c];
        if (neighborPot && neighborPot.color === targetPot.color) {
          // Petals can transfer from neighbor to target (or vice versa)
          const needed = 6 - targetPot.petals;
          if (needed > 0 && neighborPot.petals > 0) {
            hasTransfer = true;
            this.isSorting = true;
            const transferCount = Math.min(needed, neighborPot.petals);

            const nCx = left + n.c * (cellSize + gap) + cellSize / 2;
            const nCy = top + n.r * (cellSize + gap) + cellSize / 2;

            for (let i = 0; i < transferCount; i++) {
              setTimeout(() => {
                this.renderer.spawnFlyingPetal(nCx, nCy, targetCx, targetCy, targetPot.color, () => {
                  neighborPot.petals--;
                  targetPot.petals++;
                  this.score += 5;
                  this.updateHUD();

                  if (neighborPot.petals <= 0) {
                    this.grid[n.r][n.c] = null;
                  }

                  if (targetPot.petals >= 6) {
                    this.triggerBloom(targetR, targetC);
                  }
                });
              }, i * 90);
            }
          }
        }
      }
    });

    setTimeout(() => {
      this.isSorting = false;
      this.checkGameOver();
    }, 500);
  }

  triggerBloom(r, c) {
    const pot = this.grid[r][c];
    if (!pot) return;

    const { left, top, cellSize, gap } = this.gridBounds;
    const cx = left + c * (cellSize + gap) + cellSize / 2;
    const cy = top + r * (cellSize + gap) + cellSize / 2;

    this.renderer.spawnBloomBurst(cx, cy, pot.color);
    soundManager.playBloomChime(6);

    const bloomPoints = 120;
    this.score += bloomPoints;
    this.renderer.spawnFloatingText(`BLOOM! +${bloomPoints}`, cx, cy - 20, '#4ade80', 28);

    this.grid[r][c] = null;
    this.updateHUD();

    // Check if other neighbors can now sort
    const neighbors = [
      { r: r - 1, c },
      { r: r + 1, c },
      { r, c: c - 1 },
      { r, c: c + 1 }
    ];
    neighbors.forEach(n => {
      if (n.r >= 0 && n.r < 4 && n.c >= 0 && n.c < 4 && this.grid[n.r][n.c]) {
        this.processSortCascades(n.r, n.c);
      }
    });
  }

  checkGameOver() {
    let full = true;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === null) {
          full = false;
          break;
        }
      }
      if (!full) break;
    }

    if (full) {
      this.isGameOver = true;
      setTimeout(() => {
        document.getElementById('bloom-modal-score').textContent = this.score.toLocaleString();
        document.getElementById('bloom-modal-best').textContent = this.highScore.toLocaleString();
        this.modalEl.classList.remove('hidden');
      }, 700);
    }
  }

  updateHUD() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('bloom_high_score', this.highScore.toString());
    }

    this.scoreValEl.textContent = this.score.toLocaleString();
    this.bestValEl.textContent = this.highScore.toLocaleString();
  }

  resetGame() {
    this.modalEl.classList.add('hidden');
    this.score = 0;
    this.isGameOver = false;
    this.isSorting = false;
    this.activeTool = null;
    this.grid = Array(4).fill(null).map(() => Array(4).fill(null));
    this.dockPot = this.generateRandomPot();
    this.boosters = { reroll: 3, shuffle: 2, prune: 2, water: 2 };

    document.getElementById('count-reroll').textContent = '3';
    document.getElementById('count-shuffle').textContent = '2';
    document.getElementById('count-prune').textContent = '2';
    document.getElementById('count-water').textContent = '2';
    document.getElementById('booster-prune').classList.remove('active');
    document.getElementById('booster-water').classList.remove('active');

    this.seedInitialPots();
    this.updateHUD();
  }

  startLoop() {
    const loop = (now) => {
      const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = now;

      this.renderer.updateAnimations(dt);
      this.renderer.render({
        grid: this.grid,
        gridBounds: this.gridBounds,
        dockPot: this.dockPot,
        dockBounds: this.dockBounds,
        hoverCell: this.hoverCell,
        activeTool: this.activeTool
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
