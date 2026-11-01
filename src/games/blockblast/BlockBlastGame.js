// BlockBlastGame.js - Polyomino Block Blast 8x8 Puzzle Game
import { BlockBlastRenderer } from './BlockBlastRenderer.js';
import { soundManager } from '../../sound/SoundManager.js';

const SHAPES = [
  // 1x1
  { shape: [[1]], color: '#38bdf8' },
  // 2x1, 1x2
  { shape: [[1, 1]], color: '#22c55e' },
  { shape: [[1], [1]], color: '#22c55e' },
  // 3x1, 1x3
  { shape: [[1, 1, 1]], color: '#f59e0b' },
  { shape: [[1], [1], [1]], color: '#f59e0b' },
  // 4x1, 1x4
  { shape: [[1, 1, 1, 1]], color: '#ec4899' },
  { shape: [[1], [1], [1], [1]], color: '#ec4899' },
  // 5x1, 1x5
  { shape: [[1, 1, 1, 1, 1]], color: '#a855f7' },
  { shape: [[1], [1], [1], [1], [1]], color: '#a855f7' },
  // 2x2 Square
  { shape: [[1, 1], [1, 1]], color: '#eab308' },
  // 3x3 Square
  { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: '#ef4444' },
  // Corner 2x2
  { shape: [[1, 1], [1, 0]], color: '#06b6d4' },
  { shape: [[1, 1], [0, 1]], color: '#06b6d4' },
  { shape: [[1, 0], [1, 1]], color: '#06b6d4' },
  { shape: [[0, 1], [1, 1]], color: '#06b6d4' },
  // L-Shapes (3x2)
  { shape: [[1, 0], [1, 0], [1, 1]], color: '#f97316' },
  { shape: [[0, 1], [0, 1], [1, 1]], color: '#f97316' },
  { shape: [[1, 1, 1], [1, 0, 0]], color: '#f97316' },
  { shape: [[1, 1, 1], [0, 0, 1]], color: '#f97316' },
  // T-Shapes
  { shape: [[1, 1, 1], [0, 1, 0]], color: '#8b5cf6' },
  { shape: [[0, 1, 0], [1, 1, 1]], color: '#8b5cf6' }
];

export class BlockBlastGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    // Game state
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('blockblast_high_score') || '0', 10);
    this.combo = 0;
    this.linesCleared = 0;
    this.isGameOver = false;

    // 8x8 Grid
    this.grid = Array(8).fill(null).map(() => Array(8).fill(null));
    this.gridBounds = { left: 0, top: 0, size: 0, cellSize: 0, gap: 4 };
    this.dockBounds = { left: 0, top: 0, totalWidth: 0, slotWidth: 0, height: 0 };

    // Dock pieces
    this.dockPieces = [null, null, null];
    this.draggedPiece = null;
    this.ghostPosition = null;
    this.isValidGhost = false;

    this.initDOM();
    this.spawnDockPieces();
    this.initEvents();
    this.startLoop();
  }

  initDOM() {
    const isMuted = soundManager.isMuted();

    this.container.innerHTML = `
      <div class="game-wrapper blockblast-wrapper">
        <canvas id="blockblast-canvas"></canvas>

        <div class="game-top-bar" style="pointer-events: none;">
          <div class="top-controls" style="pointer-events: auto;">
            <button class="icon-btn" id="blockblast-back-btn" title="Back to Hub">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <button class="icon-btn" id="blockblast-sound-btn" title="Toggle Sound">
              ${isMuted 
                ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
                : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>'}
            </button>
          </div>
        </div>

        <div id="blockblast-modal-overlay" class="modal-overlay hidden">
          <div class="modal-card">
            <h2 class="modal-title">NO MORE MOVES!</h2>
            <p class="modal-desc">The blocks cannot fit on the board.</p>
            <div class="stats-grid">
              <div class="stat-box">
                <span class="stat-lbl">FINAL SCORE</span>
                <span class="stat-val" id="blockblast-modal-score">0</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">LINES CLEARED</span>
                <span class="stat-val" id="blockblast-modal-lines">0</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn btn-secondary" id="blockblast-modal-hub-btn">Arcade Hub</button>
              <button class="btn btn-primary" id="blockblast-modal-play-btn">Play Again</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('blockblast-canvas');
    this.scoreValEl = document.getElementById('blockblast-score-val');
    this.bestValEl = document.getElementById('blockblast-best-val');
    this.comboValEl = document.getElementById('blockblast-combo-val');
    this.modalEl = document.getElementById('blockblast-modal-overlay');

    this.renderer = new BlockBlastRenderer(this.canvas);
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

    // Calculate grid placement inside centered Card
    const w = rect.width;
    const h = rect.height;
    const gap = 4;
    const maxSize = Math.min(w * 0.88, h * 0.50, 410);
    const cellSize = Math.floor((maxSize - gap * 7) / 8);
    const size = cellSize * 8 + gap * 7;
    const left = Math.floor((w - size) / 2);

    const dockHeight = Math.min(h * 0.14, 96);
    const cardHeaderH = 68;
    const cardPaddingB = 16;
    const totalCardHeight = cardHeaderH + size + 16 + dockHeight + cardPaddingB;

    // Center the entire box vertically on screen
    const cardY = Math.max(68, Math.floor((h - totalCardHeight) / 2));
    const top = cardY + cardHeaderH;

    this.gridBounds = { left, top, size, cellSize, gap, cardY, totalCardHeight };

    // Dock bounds directly under the grid inside the card
    const dockTop = top + size + 16;
    const slotWidth = size / 3;

    this.dockBounds = {
      left,
      top: dockTop,
      totalWidth: size,
      slotWidth,
      height: dockHeight
    };

    this.dockPieces.forEach((p, idx) => {
      if (p) {
        p.x = left + idx * slotWidth + slotWidth / 2;
        p.y = dockTop + dockHeight / 2;
        p.size = Math.min(slotWidth * 0.85, dockHeight * 0.9);
      }
    });
  }

  spawnDockPieces() {
    const { left, top, slotWidth, height } = this.dockBounds;
    const slotSize = Math.min(slotWidth * 0.85, height * 0.9);

    for (let i = 0; i < 3; i++) {
      const template = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      this.dockPieces[i] = {
        index: i,
        shape: template.shape,
        color: template.color,
        x: left + slotWidth * i + slotWidth / 2,
        y: top + height / 2,
        size: slotSize
      };
    }

    this.checkGameOver();
  }

  canShapeFit(shape) {
    const rows = shape.length;
    const cols = shape[0].length;

    for (let r = 0; r <= 8 - rows; r++) {
      for (let c = 0; c <= 8 - cols; c++) {
        let fits = true;
        for (let sr = 0; sr < rows; sr++) {
          for (let sc = 0; sc < cols; sc++) {
            if (shape[sr][sc] === 1 && this.grid[r + sr][c + sc] !== null) {
              fits = false;
              break;
            }
          }
          if (!fits) break;
        }
        if (fits) return true;
      }
    }
    return false;
  }

  checkGameOver() {
    const activePieces = this.dockPieces.filter(p => p !== null);
    if (activePieces.length === 0) return;

    const anyFits = activePieces.some(p => this.canShapeFit(p.shape));
    if (!anyFits) {
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    this.isGameOver = true;
    setTimeout(() => {
      document.getElementById('blockblast-modal-score').textContent = this.score.toLocaleString();
      document.getElementById('blockblast-modal-lines').textContent = this.linesCleared;
      this.modalEl.classList.remove('hidden');
    }, 600);
  }

  initEvents() {
    this.boundResize = () => this.handleResize();
    window.addEventListener('resize', this.boundResize);

    document.getElementById('blockblast-back-btn').addEventListener('click', () => {
      this.destroy();
      this.onExit();
    });

    const soundBtn = document.getElementById('blockblast-sound-btn');
    soundBtn.addEventListener('click', () => {
      soundManager.init();
      const muted = soundManager.toggleMute();
      soundBtn.innerHTML = muted 
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
        : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>';
    });

    document.getElementById('blockblast-modal-hub-btn').addEventListener('click', () => {
      this.destroy();
      this.onExit();
    });

    document.getElementById('blockblast-modal-play-btn').addEventListener('click', () => {
      this.resetGame();
    });

    // Pointer events for dragging dock pieces
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
      const pos = getPos(e);

      // Check which dock slot was pressed
      for (let i = 0; i < this.dockPieces.length; i++) {
        const piece = this.dockPieces[i];
        if (!piece) continue;

        const hitRadius = piece.size * 0.9;
        const dist = Math.hypot(pos.x - piece.x, pos.y - piece.y);
        if (dist <= hitRadius) {
          this.draggedPiece = {
            index: i,
            shape: piece.shape,
            color: piece.color,
            currentX: pos.x,
            currentY: pos.y,
            cellSize: this.gridBounds.cellSize
          };
          this.updateGhost(pos.x, pos.y);
          break;
        }
      }
    };

    const onPointerMove = (e) => {
      if (!this.draggedPiece) return;
      if (e.cancelable) e.preventDefault();
      const pos = getPos(e);
      this.draggedPiece.currentX = pos.x;
      this.draggedPiece.currentY = pos.y;
      this.updateGhost(pos.x, pos.y);
    };

    const onPointerUp = (e) => {
      if (!this.draggedPiece) return;

      if (this.isValidGhost && this.ghostPosition) {
        this.placePiece(this.draggedPiece, this.ghostPosition);
      }

      this.draggedPiece = null;
      this.ghostPosition = null;
      this.isValidGhost = false;
    };

    this.canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  updateGhost(px, py) {
    if (!this.draggedPiece) return;
    const { shape, cellSize } = this.draggedPiece;
    const { left, top, gap } = this.gridBounds;

    const rows = shape.length;
    const cols = shape[0].length;
    const totalW = cols * cellSize;
    const totalH = rows * cellSize;

    // Piece top-left in canvas coordinates
    const pieceLeft = px - totalW / 2;
    const pieceTop = py - totalH - 24;

    const step = cellSize + gap;
    const targetCol = Math.round((pieceLeft - left) / step);
    const targetRow = Math.round((pieceTop - top) / step);

    if (targetRow >= 0 && targetRow + rows <= 8 && targetCol >= 0 && targetCol + cols <= 8) {
      let canPlace = true;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (shape[r][c] === 1 && this.grid[targetRow + r][targetCol + c] !== null) {
            canPlace = false;
            break;
          }
        }
        if (!canPlace) break;
      }

      this.ghostPosition = { row: targetRow, col: targetCol };
      this.isValidGhost = canPlace;
    } else {
      this.isValidGhost = false;
      this.ghostPosition = null;
    }
  }

  placePiece(piece, pos) {
    const { shape, color, index } = piece;
    const rows = shape.length;
    const cols = shape[0].length;

    let cellsCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shape[r][c] === 1) {
          this.grid[pos.row + r][pos.col + c] = { color };
          cellsCount++;
        }
      }
    }

    // Remove piece from dock
    this.dockPieces[index] = null;
    soundManager.playBlockPlace();

    // Base score for placing cells
    this.score += cellsCount * 10;

    // Check full rows and columns
    this.checkLines();

    // Check if dock is empty
    if (this.dockPieces.every(p => p === null)) {
      this.spawnDockPieces();
    } else {
      this.checkGameOver();
    }

    this.updateHUD();
  }

  checkLines() {
    const fullRows = [];
    const fullCols = [];

    // Find full rows
    for (let r = 0; r < 8; r++) {
      if (this.grid[r].every(c => c !== null)) {
        fullRows.push(r);
      }
    }

    // Find full columns
    for (let c = 0; c < 8; c++) {
      let isFull = true;
      for (let r = 0; r < 8; r++) {
        if (this.grid[r][c] === null) {
          isFull = false;
          break;
        }
      }
      if (isFull) {
        fullCols.push(c);
      }
    }

    const totalLines = fullRows.length + fullCols.length;

    if (totalLines > 0) {
      this.combo++;
      this.linesCleared += totalLines;

      const cellsToClear = new Set();
      fullRows.forEach(r => {
        for (let c = 0; c < 8; c++) cellsToClear.add(`${r},${c}`);
      });
      fullCols.forEach(c => {
        for (let r = 0; r < 8; r++) cellsToClear.add(`${r},${c}`);
      });

      // Spawn blast particle fireworks
      const { left, top, cellSize, gap } = this.gridBounds;
      cellsToClear.forEach(coord => {
        const [r, c] = coord.split(',').map(Number);
        const cell = this.grid[r][c];
        const cx = left + c * (cellSize + gap) + cellSize / 2;
        const cy = top + r * (cellSize + gap) + cellSize / 2;
        if (cell) {
          this.renderer.spawnClearParticles(cx, cy, cell.color);
        }
        this.grid[r][c] = null;
      });

      // Score bonus
      const lineScore = totalLines * 150 * (this.combo + 1);
      this.score += lineScore;

      // SFX and floating text
      soundManager.playLineClear(totalLines);
      if (this.combo > 1) {
        soundManager.playComboBlast(this.combo);
      }

      const boardCenter = left + this.gridBounds.size / 2;
      const boardMiddle = top + this.gridBounds.size / 2;

      if (this.combo > 1) {
        this.renderer.spawnFloatingText(`COMBO x${this.combo}!`, boardCenter, boardMiddle - 30, '#f59e0b', 28);
      }
      this.renderer.spawnFloatingText(`+${lineScore.toLocaleString()}`, boardCenter, boardMiddle + 10, '#38bdf8', 24);

    } else {
      this.combo = 0;
    }
  }

  updateHUD() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('blockblast_high_score', this.highScore.toString());
    }
  }

  resetGame() {
    this.modalEl.classList.add('hidden');
    this.score = 0;
    this.combo = 0;
    this.linesCleared = 0;
    this.isGameOver = false;
    this.grid = Array(8).fill(null).map(() => Array(8).fill(null));
    this.dockPieces = [null, null, null];
    this.draggedPiece = null;
    this.ghostPosition = null;
    this.isValidGhost = false;

    this.spawnDockPieces();
    this.updateHUD();
  }

  startLoop() {
    const loop = (now) => {
      this.renderer.updateAnimations(0.016);
      this.renderer.render({
        grid: this.grid,
        gridBounds: this.gridBounds,
        dockPieces: this.dockPieces,
        dockBounds: this.dockBounds,
        draggedPiece: this.draggedPiece,
        ghostPosition: this.ghostPosition,
        isValidGhost: this.isValidGhost,
        score: this.score,
        highScore: this.highScore
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
