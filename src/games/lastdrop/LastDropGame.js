// LastDropGame.js - Authentic 2-Player / Player vs Robot Showdown Liquid Tension Game
// Exactly matching user reference screenshot media_1793281110937_1ac958b7.png
import { LastDropRenderer } from './LastDropRenderer.js';
import { soundManager } from '../../sound/SoundManager.js';

export class LastDropGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    // Game Mode & Turns
    this.mode = 'vs_robot'; // 'vs_robot' | 'two_player'
    this.turn = 'player1';   // 'player1' (user) | 'player2' (robot or friend)
    this.turnCount = 1;
    this.turnStartRatio = 0.0;
    this.minPourPerTurn = 0.035;

    // Liquid Physics State (Starts completely empty at 0.0 matching user request)
    this.fillRatio = 0.0;
    this.multiplier = 1.0;
    this.isPouring = false;
    this.isSpilling = false;
    this.isGameOver = false;
    this.spillProgress = 0.0;
    this.robotThinking = false;

    // Timing
    this.score = 0;
    this.lastFrameTime = performance.now();
    this.lastPulseTime = 0;

    this.initDOM();
    this.initEvents();
    this.startLoop();
    window.lastDropGame = this;
  }

  initDOM() {
    const isMuted = soundManager.isMuted();

    this.container.innerHTML = `
      <div class="game-wrapper lastdrop-wrapper">
        <canvas id="lastdrop-canvas"></canvas>

        <!-- Top Navigation -->
        <div class="lastdrop-top-row">
          <button class="lastdrop-icon-btn" id="lastdrop-back-btn" title="Exit to Arcade Hub" aria-label="Exit">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Centered Turn Title (Matching screenshot "Opponent's turn" / "Your turn") -->
        <div class="lastdrop-turn-header" id="lastdrop-turn-name">Your turn</div>

        <!-- Bottom Circular Action Button (Matching screenshot media_1793281110937_1ac958b7.png) -->
        <div class="lastdrop-bottom-bar">
          <button class="lastdrop-circle-btn" id="lastdrop-pour-btn" aria-label="Hold to pour juice" title="Hold to Pour"></button>
        </div>

        <!-- Victory / Spilled Showdown Modal -->
        <div id="lastdrop-modal-overlay" class="lastdrop-modal-overlay hidden">
          <div class="lastdrop-modal-card">
            <div class="lastdrop-modal-icon" id="lastdrop-modal-icon">🏆</div>
            <h2 id="lastdrop-modal-title" class="lastdrop-modal-title">YOU WIN!</h2>
            <p id="lastdrop-modal-msg" class="lastdrop-modal-desc">Robot broke the surface tension!</p>
            
            <div class="lastdrop-stats-row">
              <div class="lastdrop-stat-box">
                <span class="lastdrop-stat-lbl">TURNS</span>
                <span class="lastdrop-stat-val" id="lastdrop-modal-turns">1</span>
              </div>
              <div class="lastdrop-stat-box">
                <span class="lastdrop-stat-lbl">PEAK LEVEL</span>
                <span class="lastdrop-stat-val" id="lastdrop-modal-bulge">104%</span>
              </div>
            </div>

            <div class="lastdrop-modal-actions">
              <button class="lastdrop-btn-secondary" id="lastdrop-modal-hub-btn">Arcade Hub</button>
              <button class="lastdrop-btn-primary" id="lastdrop-modal-play-btn">Play Again</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('lastdrop-canvas');
    this.turnNameEl = document.getElementById('lastdrop-turn-name');
    this.pourBtn = document.getElementById('lastdrop-pour-btn');
    this.hintEl = document.getElementById('lastdrop-pour-hint');
    this.modalEl = document.getElementById('lastdrop-modal-overlay');
    this.modeBtn = document.getElementById('lastdrop-mode-btn');
    this.modeLbl = document.getElementById('lastdrop-mode-lbl');

    this.renderer = new LastDropRenderer(this.canvas);
    this.handleResize();
    this.updateTurnUI();
  }

  handleResize() {
    const rect = this.container.getBoundingClientRect();
    this.renderer.resize(rect.width, rect.height);
  }

  initEvents() {
    this.boundResize = () => this.handleResize();
    window.addEventListener('resize', this.boundResize);

    // Back to hub
    document.getElementById('lastdrop-back-btn').addEventListener('click', () => {
      this.destroy();
      this.onExit();
    });

    // Sound toggle (if present)
    const soundBtn = document.getElementById('lastdrop-sound-btn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        soundManager.init();
        const muted = soundManager.toggleMute();
        soundBtn.innerHTML = muted 
          ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
          : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>';
      });
    }

    // Mode Toggle (vs Robot <-> 2-Player Pass & Play, if present)
    if (this.modeBtn) {
      this.modeBtn.addEventListener('click', () => {
        this.mode = this.mode === 'vs_robot' ? 'two_player' : 'vs_robot';
        if (this.modeLbl) this.modeLbl.textContent = this.mode === 'vs_robot' ? '🤖 vs Robot' : '👥 2-Player';
        this.resetGame();
      });
    }

    // Pour handlers for human turn
    const startHumanPour = (e) => {
      if (e) e.preventDefault();
      if (this.isSpilling || this.isGameOver) return;
      if (this.mode === 'vs_robot' && this.turn === 'player2') return; // Robot's turn

      if (!this.isPouring) {
        this.isPouring = true;
        this.turnStartRatio = this.fillRatio;
        this.pourBtn.classList.add('pouring');
        soundManager.startPourLiquid();
      }
    };

    const stopHumanPour = (e) => {
      if (e) e.preventDefault();
      if (!this.isPouring || this.isSpilling || this.isGameOver) return;
      if (this.mode === 'vs_robot' && this.turn === 'player2') return;

      this.isPouring = false;
      this.pourBtn.classList.remove('pouring');
      soundManager.stopPourLiquid();

      // Valid turn completed! Pass turn immediately without any minimum fill requirement
      soundManager.playCupBank();
      this.passTurn();
    };

    this.pourBtn.addEventListener('pointerdown', startHumanPour);
    window.addEventListener('pointerup', stopHumanPour);
    window.addEventListener('pointercancel', stopHumanPour);

    // Also support tapping anywhere on canvas to pour
    this.canvas.addEventListener('pointerdown', (e) => {
      startHumanPour(e);
    });

    // Keyboard controls (Space / Enter to pour, Escape to exit)
    this.boundKeyDown = (e) => {
      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) startHumanPour(e);
      if (e.code === 'Escape') {
        this.destroy();
        this.onExit();
      }
    };
    this.boundKeyUp = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') stopHumanPour(e);
    };
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);

    // Modal action buttons
    document.getElementById('lastdrop-modal-hub-btn').addEventListener('click', () => {
      this.destroy();
      this.onExit();
    });

    document.getElementById('lastdrop-modal-play-btn').addEventListener('click', () => {
      this.resetGame();
    });
  }

  passTurn() {
    this.turnCount++;

    if (this.turn === 'player1') {
      this.turn = 'player2';
      this.updateTurnUI();

      if (this.mode === 'vs_robot') {
        this.executeRobotTurn();
      }
    } else {
      this.turn = 'player1';
      this.updateTurnUI();
    }
  }

  updateTurnUI() {
    if (this.turn === 'player1') {
      this.turnNameEl.textContent = this.mode === 'two_player' ? "Player 1's turn" : "Your turn";
      this.pourBtn.disabled = false;
      this.pourBtn.style.opacity = '1';
      if (this.hintEl) this.hintEl.textContent = 'Hold button to pour juice';
    } else {
      if (this.mode === 'vs_robot') {
        this.turnNameEl.textContent = "Opponent's turn";
        this.pourBtn.disabled = true;
        this.pourBtn.style.opacity = '0.65';
        if (this.hintEl) this.hintEl.textContent = "Opponent is pouring...";
      } else {
        this.turnNameEl.textContent = "Player 2's turn";
        this.pourBtn.disabled = false;
        this.pourBtn.style.opacity = '1';
        if (this.hintEl) this.hintEl.textContent = "Player 2 hold button to pour";
      }
    }
  }

  executeRobotTurn() {
    if (this.isSpilling || this.isGameOver) return;

    this.robotThinking = true;

    // Robot delay before starting pour (human-like pause)
    const thinkDelay = 750 + Math.random() * 400;

    setTimeout(() => {
      if (this.isSpilling || this.isGameOver || this.turn !== 'player2') return;

      this.robotThinking = false;
      this.isPouring = true;
      this.pourBtn.classList.add('pouring');
      soundManager.startPourLiquid();

      // Calculate robot pour amount based on current fill
      let targetPour = 0;
      if (this.fillRatio < 0.45) {
        targetPour = 0.18 + Math.random() * 0.12;
      } else if (this.fillRatio < 0.75) {
        targetPour = 0.10 + Math.random() * 0.08;
      } else if (this.fillRatio < 0.94) {
        targetPour = 0.045 + Math.random() * 0.04;
      } else {
        // High surface tension zone!
        const willRiskSpill = Math.random() < 0.38;
        if (willRiskSpill) {
          // Push past 1.10 to trigger spill!
          targetPour = (1.11 - this.fillRatio) + 0.02;
        } else {
          // Careful micro pour
          targetPour = 0.025 + Math.random() * 0.025;
        }
      }

      const targetRatio = this.fillRatio + targetPour;
      const pourInterval = setInterval(() => {
        if (this.isSpilling || this.isGameOver) {
          clearInterval(pourInterval);
          this.isPouring = false;
          this.pourBtn.classList.remove('pouring');
          soundManager.stopPourLiquid();
          return;
        }

        // Check if target ratio reached
        if (this.fillRatio >= targetRatio) {
          clearInterval(pourInterval);
          this.isPouring = false;
          this.pourBtn.classList.remove('pouring');
          soundManager.stopPourLiquid();

          if (!this.isSpilling) {
            soundManager.playCupBank();
            // Pass back to human
            setTimeout(() => {
              this.passTurn();
            }, 600);
          }
        }
      }, 50);

    }, thinkDelay);
  }

  triggerSpill(culprit) {
    this.isSpilling = true;
    this.isPouring = false;
    this.isGameOver = true;
    this.pourBtn.classList.remove('pouring');
    soundManager.stopPourLiquid();
    soundManager.playLiquidSpill();

    if (this.renderer.trigger3DSpill) {
      this.renderer.trigger3DSpill();
    }

    setTimeout(() => {
      let title, msg, icon;

      if (this.mode === 'vs_robot') {
        if (culprit === 'player1') {
          title = 'SPILL! OPPONENT WINS!';
          msg = 'You broke the surface tension and spilled the juice!';
          icon = '🤖';
          soundManager.playGameOver();
        } else {
          title = 'YOU WIN! 🏆';
          msg = 'Opponent broke the surface tension and spilled the juice!';
          icon = '👑';
          soundManager.playVictory();
        }
      } else {
        if (culprit === 'player1') {
          title = 'PLAYER 2 WINS! 🏆';
          msg = 'Player 1 spilled the watermelon juice!';
          icon = '🎉';
          soundManager.playVictory();
        } else {
          title = 'PLAYER 1 WINS! 🏆';
          msg = 'Player 2 spilled the watermelon juice!';
          icon = '🎉';
          soundManager.playVictory();
        }
      }

      document.getElementById('lastdrop-modal-icon').textContent = icon;
      document.getElementById('lastdrop-modal-title').textContent = title;
      document.getElementById('lastdrop-modal-msg').textContent = msg;
      document.getElementById('lastdrop-modal-turns').textContent = this.turnCount.toString();
      document.getElementById('lastdrop-modal-bulge').textContent = `${Math.round(this.fillRatio * 100)}%`;

      this.modalEl.classList.remove('hidden');
    }, 1100);
  }

  resetGame() {
    this.modalEl.classList.add('hidden');
    this.turn = 'player1';
    this.turnCount = 1;
    this.fillRatio = 0.0;
    this.multiplier = 1.0;
    this.isPouring = false;
    this.isSpilling = false;
    this.isGameOver = false;
    this.spillProgress = 0.0;
    this.robotThinking = false;
    this.updateTurnUI();
  }

  startLoop() {
    const loop = (now) => {
      const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = now;

      this.update(dt, now);
      this.renderer.render({
        fillRatio: this.fillRatio,
        isPouring: this.isPouring,
        isSpilling: this.isSpilling,
        multiplier: this.multiplier,
        spillProgress: this.spillProgress,
        turn: this.turn,
        mode: this.mode
      });

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  update(dt, now) {
    if (this.isPouring && !this.isSpilling && !this.isGameOver) {
      if (!this.freezeFill) {
        // Pour rate
        const pourRate = 0.18;
        this.fillRatio += pourRate * dt;
      }

      // Surface tension analysis
      if (this.fillRatio > 1.0) {
        // High surface tension bulging!
        const tension = Math.min((this.fillRatio - 1.0) / 0.10, 1.0);
        this.multiplier = 3.0 + tension * 7.0;

        // Heartbeat pulse sound effect
        if (now - this.lastPulseTime > Math.max(120, 360 - tension * 260)) {
          this.lastPulseTime = now;
          soundManager.playTensionPulse(tension);
        }
      }

      // Check spill threshold (1.10 = 10% meniscus bulge)
      if (this.fillRatio >= 1.10) {
        this.triggerSpill(this.turn);
      }
    }

    if (this.isSpilling) {
      this.spillProgress = Math.min(1.0, this.spillProgress + dt * 1.8);
    }
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    soundManager.stopPourLiquid();
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    if (this.renderer) {
      this.renderer.destroy();
    }
    if (window.lastDropGame === this) {
      window.lastDropGame = null;
    }
  }
}
