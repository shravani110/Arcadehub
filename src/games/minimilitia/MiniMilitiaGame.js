// MiniMilitiaGame.js - 2D Outpost Combat Shooter with 1, 2, 3, or 4 Players
import { MiniMilitiaRenderer } from './MiniMilitiaRenderer.js';
import { MiniMilitiaPhysics } from './MiniMilitiaPhysics.js';
import { MiniMilitiaBot } from './MiniMilitiaBot.js';
import { MiniMilitiaAudio } from './MiniMilitiaAudio.js';
import { MiniMilitiaNetwork } from './MiniMilitiaNetwork.js';
import { soundManager } from '../../sound/SoundManager.js';

export class MiniMilitiaGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    this.physics = new MiniMilitiaPhysics();
    this.audio = new MiniMilitiaAudio();
    this.network = new MiniMilitiaNetwork();

    // Game Lifecycle State: 'start' | 'playing' | 'gameover'
    this.gameState = 'start';
    this.playType = 'single'; // 'single' | 'online'
    this.gameMode = 'timed'; // 'timed' (5-Min Deathmatch) or 'survival' (5 Chances)
    this.playerLives = 5;
    this.maxLives = 5;

    // Player Count (1, 2, 3, or 4 players)
    this.playerCount = Math.max(1, Math.min(4, parseInt(localStorage.getItem('mm_player_count') || '2', 10)));

    // Online Multiplayer State
    this.isOnlineHost = false;
    this.roomCode = null;
    this.playerName = localStorage.getItem('mm_player_name') || 'Soldier #1';
    this.opponentName = 'Opponent';

    // Parse invite link room code if present in hash/url
    this.initialRoomCode = '';
    const hashStr = window.location.hash || '';
    if (hashStr.includes('room=')) {
      const match = hashStr.match(/room=([A-Za-z0-9_-]+)/);
      if (match && match[1]) {
        this.initialRoomCode = match[1].toUpperCase();
        this.playType = 'online';
      }
    }

    // Match scores & timer
    this.playerScore = 0;
    this.opponentScore = 0;
    this.scores = { 1: 0, 2: 0, 3: 0, 4: 0 };
    this.timer = 300; // 5:00 match timer (seconds)
    this.highScore = parseInt(localStorage.getItem('minimilitia_high_score') || '0', 10);
    this.notification = null;
    this.notificationTimer = 0;

    // Performance
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsUpdate = Date.now();

    // Camera (2D panning across Outpost world)
    this.cameraX = 0;
    this.cameraY = 0;

    // Player 1 State (Local Human Soldier)
    this.player = {
      name: this.playerName,
      x: 880,
      y: 220,
      width: 46,
      height: 64,
      velocityX: 0,
      velocityY: 0,
      speed: 4.8,
      gravity: 0.72,
      health: 100,
      isDead: false,
      respawnTimer: 0,
      spawnProtection: 0,
      jetpackFuel: 100,
      isUsingJetpack: false,
      isCrouching: false,
      ammo: 25,
      maxAmmo: 25,
      isReloading: false,
      reloadTimer: 0,
      gunAngle: 0,
      lastShotTime: 0,
      walkFrame: 0,
      walkTimer: 0,
      onGround: false
    };

    // Remote Players Map for Online Multiplayer (Slots 2, 3, 4)
    this.remotePlayers = new Map();

    // Bots for Single Player
    this.bots = [];

    // Bullets and Particles
    this.bullets = [];
    this.particles = [];

    // Aim position in world space
    this.aimX = 1000;
    this.aimY = 220;

    // Player 1 input state
    this.keys = {
      left: false,
      right: false,
      up: false,
      crouch: false
    };
    this.isShooting = false;
    this.lastShootAttempt = 0;

    this.initDOM();
    this.initEvents();
    this.setupNetworkHandlers();
    this.renderer = new MiniMilitiaRenderer(this.canvas);
    this.handleResize();
    this.attemptAutoLandscape();
    this.checkOrientation();

    // Center camera on player
    const { baseW, baseH } = this.getBaseViewport();
    this.cameraX = Math.max(0, Math.min(this.player.x + this.player.width / 2 - baseW / 2, Math.max(0, this.physics.worldWidth - baseW)));
    this.cameraY = Math.max(0, Math.min(this.player.y + this.player.height / 2 - baseH / 2, Math.max(0, this.physics.worldHeight - baseH)));

    this.isRunning = true;
    this.lastTime = Date.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  getPlayerCountDesc(count) {
    switch (count) {
      case 1:
        return '👤 1 Player: Solo Outpost Scout & Target Practice in the catacombs.';
      case 2:
        return '👥 2 Players: 1v1 Tactical Duel across castle battlements and bunkers.';
      case 3:
        return '⚔️ 3 Players: 3-Player Triangle Skirmish in intense multi-level crossfire.';
      case 4:
      default:
        return '💥 4 Players: 4-Player Outpost All-Out Mayhem across all 4 sectors!';
    }
  }

  initDOM() {
    const isMuted = soundManager.isMuted();

    this.container.innerHTML = `
      <div class="minimilitia-wrapper">
        <!-- Floating Navigation Header -->
        <header class="minimilitia-top-bar">
          <button id="mm-back-btn" class="mm-icon-btn" title="Back to Arcade Hub">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          <div class="mm-header-actions">
            <button id="mm-sound-btn" class="mm-icon-btn" title="Toggle Sound">
              ${isMuted 
                ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
                : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>'}
            </button>
            <button id="mm-fullscreen-btn" class="mm-icon-btn" title="Toggle Fullscreen">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>
          </div>
        </header>

        <!-- Canvas Container -->
        <div class="mm-canvas-container" id="mm-canvas-container">
          <canvas id="mm-canvas"></canvas>
        </div>

        <!-- Start Screen Modal Overlay -->
        <div class="mm-modal-overlay" id="mm-start-overlay">
          <div class="mm-modal-card">
            <div class="mm-modal-header">
              <span class="mm-modal-badge">OUTPOST COMBAT ZONE</span>
              <h1 class="mm-modal-title">MINI MILITIA</h1>
              <p class="mm-modal-subtitle">Jetpack airborne combat on the legendary Outpost catacombs map!</p>
            </div>

            <!-- Number of Players Option (1, 2, 3, 4 Players) -->
            <div class="mm-count-section">
              <div class="mm-count-label">SELECT COMBATANTS (1 - 4 PLAYERS)</div>
              <div class="mm-count-buttons">
                <button class="mm-count-btn ${this.playerCount === 1 ? 'active' : ''}" data-count="1">
                  <span class="mm-count-badge">1P</span> SOLO
                </button>
                <button class="mm-count-btn ${this.playerCount === 2 ? 'active' : ''}" data-count="2">
                  <span class="mm-count-badge">2P</span> 1v1
                </button>
                <button class="mm-count-btn ${this.playerCount === 3 ? 'active' : ''}" data-count="3">
                  <span class="mm-count-badge">3P</span> 3 PLAYERS
                </button>
                <button class="mm-count-btn ${this.playerCount === 4 ? 'active' : ''}" data-count="4">
                  <span class="mm-count-badge">4P</span> 4 PLAYERS
                </button>
              </div>
              <div class="mm-count-desc" id="mm-count-desc">
                ${this.getPlayerCountDesc(this.playerCount)}
              </div>
            </div>

            <!-- Mode Selection Tabs -->
            <div class="mm-type-tabs">
              <button class="mm-type-tab ${this.playType === 'single' ? 'active' : ''}" id="mm-tab-single" data-tab="single">
                🎮 SINGLE PLAYER
              </button>
              <button class="mm-type-tab ${this.playType === 'online' ? 'active' : ''}" id="mm-tab-online" data-tab="online">
                🌐 ONLINE MULTIPLAYER
              </button>
            </div>

            <!-- PANEL 1: Single Player -->
            <div class="mm-tab-panel ${this.playType === 'single' ? 'active' : ''}" id="mm-panel-single">
              <div class="mm-mode-selector">
                <div class="mm-mode-option ${this.gameMode === 'timed' ? 'selected' : ''}" id="mm-mode-timed" data-mode="timed">
                  <div class="mm-mode-icon">⏱️</div>
                  <div class="mm-mode-info">
                    <div class="mm-mode-name">Timed Deathmatch (5 Mins)</div>
                    <div class="mm-mode-desc">Continuous respawns • Most kills when timer hits 0:00 wins!</div>
                  </div>
                </div>

                <div class="mm-mode-option ${this.gameMode === 'survival' ? 'selected' : ''}" id="mm-mode-survival" data-mode="survival">
                  <div class="mm-mode-icon">❤️</div>
                  <div class="mm-mode-info">
                    <div class="mm-mode-name">5 Chances Survival Mode</div>
                    <div class="mm-mode-desc">5 lives only • Game ends if you lose all chances or timer ends!</div>
                  </div>
                </div>
              </div>

              <!-- Controls Summary -->
              <div class="mm-controls-guide">
                <div class="mm-guide-item">
                  <span class="mm-guide-key">WASD / Stick</span> Move & Jetpack
                </div>
                <div class="mm-guide-item">
                  <span class="mm-guide-key">Mouse / Stick</span> 360° Aim & Fire
                </div>
                <div class="mm-guide-item">
                  <span class="mm-guide-key">R / Button</span> Reload AK-47
                </div>
              </div>

              <button id="mm-start-btn" class="mm-start-btn">
                START BATTLE (${this.playerCount === 1 ? 'SOLO' : `${this.playerCount} PLAYERS`})
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </button>
            </div>

            <!-- PANEL 2: Online Multiplayer -->
            <div class="mm-tab-panel ${this.playType === 'online' ? 'active' : ''}" id="mm-panel-online">
              <div class="mm-multi-inputs">
                <div class="mm-input-label">SOLDIER CODENAME</div>
                <div class="mm-input-row">
                  <input type="text" id="mm-player-name-input" class="mm-input" placeholder="Enter Soldier Name" value="${this.playerName}" maxlength="12" />
                </div>
              </div>

              <!-- Online Action Choices (Create Room vs Join Room) -->
              <div class="mm-online-grid" id="mm-online-choice-view">
                <div class="mm-online-card">
                  <div class="mm-online-card-title">HOST MATCH</div>
                  <div class="mm-online-card-desc">Host a private Outpost battle room for up to ${this.playerCount} players.</div>
                  <button id="mm-host-room-btn" class="mm-btn-action mm-btn-host">
                    CREATE ROOM (${this.playerCount}P)
                  </button>
                </div>

                <div class="mm-online-card">
                  <div class="mm-online-card-title">JOIN MATCH</div>
                  <input type="text" id="mm-join-code-input" class="mm-input" placeholder="4-LETTER CODE" value="${this.initialRoomCode}" maxlength="6" style="text-align: center; text-transform: uppercase; font-family: monospace;" />
                  <button id="mm-join-room-btn" class="mm-btn-action mm-btn-join">
                    JOIN BATTLE ▶
                  </button>
                </div>
              </div>

              <!-- Host Waiting Room Box with Player Roster -->
              <div class="mm-room-box" id="mm-room-waiting-box" style="display: none;">
                <div class="mm-room-code-tag">ROOM CODE</div>
                <div class="mm-room-code-val" id="mm-display-room-code">----</div>
                <div class="mm-room-status">
                  <span class="mm-pulse-dot"></span>
                  <span id="mm-waiting-status-text">Waiting for players to connect...</span>
                </div>

                <!-- Connected Roster -->
                <div id="mm-roster-list" class="mm-roster-list"></div>

                <div style="display: flex; gap: 8px; margin-top: 6px; justify-content: center;">
                  <button id="mm-copy-link-btn" class="mm-btn-copy">📋 Copy Invite Link</button>
                  <button id="mm-start-room-btn" class="mm-btn-action mm-btn-host" style="display: none; padding: 6px 14px; font-size: 12px;">LAUNCH MATCH ▶</button>
                  <button id="mm-cancel-host-btn" class="mm-btn-copy" style="background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4);">Cancel</button>
                </div>
              </div>

              <div id="mm-online-status" style="font-size: 11px; min-height: 16px; margin-bottom: 6px; font-weight: 700; color: #59b8eb;"></div>
            </div>
          </div>
        </div>

        <!-- Game Over / Round End Modal Overlay -->
        <div class="mm-modal-overlay" id="mm-gameover-overlay" style="display: none;">
          <div class="mm-modal-card">
            <div class="mm-modal-header">
              <h1 class="mm-modal-title" id="mm-gameover-title">MATCH COMPLETE</h1>
              <p class="mm-modal-subtitle" id="mm-gameover-desc">The battlefield has cleared.</p>
            </div>

            <!-- Leaderboard / Stats Grid -->
            <div class="mm-gameover-stats" id="mm-gameover-stats-grid">
              <div class="mm-stat-box blue-stat">
                <div class="stat-label" id="mm-stat-lbl-p1">YOUR KILLS</div>
                <div class="stat-val" id="mm-stat-player">0</div>
              </div>
              <div class="mm-stat-box red-stat">
                <div class="stat-label" id="mm-stat-lbl-p2">ENEMY KILLS</div>
                <div class="stat-val" id="mm-stat-enemy">0</div>
              </div>
            </div>

            <div class="mm-gameover-actions">
              <button id="mm-playagain-btn" class="mm-start-btn">PLAY AGAIN</button>
              <button id="mm-lobby-btn" class="mm-secondary-btn">ARCADE LOBBY</button>
            </div>
          </div>
        </div>

        <!-- Mobile Touch Controls -->
        <div class="mm-touch-controls" id="mm-touch-controls">
          <!-- Left Move/Jetpack Joystick Area -->
          <div class="mm-joystick-zone mm-left-zone" id="mm-left-zone">
            <div class="mm-joystick-base" id="mm-left-base">
              <div class="mm-joystick-thumb" id="mm-left-thumb"></div>
            </div>
            <span class="mm-zone-hint">MOVE / FLY</span>
          </div>

          <!-- Right Aim & Shoot Joystick Area -->
          <div class="mm-joystick-zone mm-right-zone" id="mm-right-zone">
            <div class="mm-joystick-base" id="mm-right-base">
              <div class="mm-joystick-thumb" id="mm-right-thumb"></div>
            </div>
            <span class="mm-zone-hint">AIM & FIRE</span>
          </div>
        </div>

        <!-- Mobile & Tablet Mandatory Horizontal Orientation Overlay -->
        <div class="mm-rotate-overlay" id="mm-rotate-overlay">
          <div class="mm-rotate-card">
            <div class="mm-rotate-icon">
              <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="3"/>
                <path d="M7 2v3m10-3v3m-10 14v3m10-3v3"/>
              </svg>
            </div>
            <h2 class="mm-rotate-title">ROTATE TO LANDSCAPE</h2>
            <p class="mm-rotate-desc">Mini Militia requires horizontal landscape mode for full 360° tactical combat & radar vision.</p>
            <button id="mm-rotate-btn" class="mm-rotate-btn">
              <span>🔄 LOCK LANDSCAPE & PLAY</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#mm-canvas');
    this.canvasContainer = this.container.querySelector('#mm-canvas-container');
  }

  initEvents() {
    // Back to Arcade Hub
    this.container.querySelector('#mm-back-btn')?.addEventListener('click', () => {
      soundManager.playClick();
      this.destroy();
      if (this.onExit) this.onExit();
    });

    // Sound toggle
    const soundBtn = this.container.querySelector('#mm-sound-btn');
    soundBtn?.addEventListener('click', () => {
      soundManager.playClick();
      const muted = soundManager.toggleMute();
      soundBtn.innerHTML = muted
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>';
    });

    // Fullscreen toggle
    this.container.querySelector('#mm-fullscreen-btn')?.addEventListener('click', () => {
      soundManager.playClick();
      if (!document.fullscreenElement) {
        this.container.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });

    // Player Count Selector (1, 2, 3, 4 Players)
    const countBtns = this.container.querySelectorAll('.mm-count-btn');
    countBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        soundManager.playClick();
        const count = parseInt(btn.dataset.count, 10);
        this.playerCount = count;
        localStorage.setItem('mm_player_count', count);

        countBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const descEl = this.container.querySelector('#mm-count-desc');
        if (descEl) descEl.textContent = this.getPlayerCountDesc(count);

        const startBtn = this.container.querySelector('#mm-start-btn');
        if (startBtn) {
          startBtn.innerHTML = `START BATTLE (${count === 1 ? 'SOLO' : `${count} PLAYERS`}) <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
        }

        const hostBtn = this.container.querySelector('#mm-host-room-btn');
        if (hostBtn) hostBtn.textContent = `CREATE ROOM (${count}P)`;
      });
    });

    // Tab Switching: Single Player vs Online Multiplayer
    const tabs = this.container.querySelectorAll('.mm-type-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        soundManager.playClick();
        const target = tab.dataset.tab;
        this.playType = target;

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        this.container.querySelectorAll('.mm-tab-panel').forEach(panel => {
          panel.classList.remove('active');
        });
        const activePanel = this.container.querySelector(`#mm-panel-${target}`);
        if (activePanel) activePanel.classList.add('active');
      });
    });

    // Single Player Mode selection toggles
    const timedOpt = this.container.querySelector('#mm-mode-timed');
    const survOpt = this.container.querySelector('#mm-mode-survival');
    timedOpt?.addEventListener('click', () => {
      this.gameMode = 'timed';
      timedOpt.classList.add('selected');
      survOpt.classList.remove('selected');
    });
    survOpt?.addEventListener('click', () => {
      this.gameMode = 'survival';
      survOpt.classList.add('selected');
      timedOpt.classList.remove('selected');
    });

    // START SINGLE PLAYER button
    this.container.querySelector('#mm-start-btn')?.addEventListener('click', () => {
      soundManager.playClick();
      this.startMatch('single');
    });

    // Player Codename input save
    const nameInput = this.container.querySelector('#mm-player-name-input');
    nameInput?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        this.playerName = val;
        this.player.name = val;
        localStorage.setItem('mm_player_name', val);
      }
    });

    // Online Multiplayer: Create Room Button
    this.container.querySelector('#mm-host-room-btn')?.addEventListener('click', () => {
      soundManager.playClick();
      this.createOnlineRoom();
    });

    // Online Multiplayer: Join Room Button
    this.container.querySelector('#mm-join-room-btn')?.addEventListener('click', () => {
      soundManager.playClick();
      const codeInput = this.container.querySelector('#mm-join-code-input');
      const code = codeInput ? codeInput.value.trim() : '';
      if (code) {
        this.joinOnlineRoom(code);
      } else {
        const statusEl = this.container.querySelector('#mm-online-status');
        if (statusEl) statusEl.textContent = 'Please enter a 4-letter Room Code';
      }
    });

    // Online Multiplayer: Copy Invite Link Button
    this.container.querySelector('#mm-copy-link-btn')?.addEventListener('click', () => {
      soundManager.playClick();
      this.copyInviteLink();
    });

    // Online Multiplayer: Launch Room Match Button (Host manual start)
    this.container.querySelector('#mm-start-room-btn')?.addEventListener('click', () => {
      soundManager.playClick();
      this.network.sendMatchEvent('start');
      this.startMatch('online');
    });

    // Online Multiplayer: Cancel Host Button
    this.container.querySelector('#mm-cancel-host-btn')?.addEventListener('click', () => {
      soundManager.playClick();
      this.network.destroy();
      const choiceView = this.container.querySelector('#mm-online-choice-view');
      const waitBox = this.container.querySelector('#mm-room-waiting-box');
      if (choiceView) choiceView.style.display = 'grid';
      if (waitBox) waitBox.style.display = 'none';
    });

    // Game Over Buttons
    this.container.querySelector('#mm-playagain-btn')?.addEventListener('click', () => {
      soundManager.playClick();
      if (this.playType === 'online' && this.isOnlineHost) {
        this.network.sendMatchEvent('restart');
      }
      this.startMatch(this.playType);
    });

    this.container.querySelector('#mm-lobby-btn')?.addEventListener('click', () => {
      soundManager.playClick();
      const gameOverOverlay = this.container.querySelector('#mm-gameover-overlay');
      const startOverlay = this.container.querySelector('#mm-start-overlay');
      if (gameOverOverlay) gameOverOverlay.style.display = 'none';
      if (startOverlay) startOverlay.style.display = 'flex';
      this.gameState = 'start';
    });

    // Rotate to Landscape button
    this.container.querySelector('#mm-rotate-btn')?.addEventListener('click', async () => {
      soundManager.playClick();
      this.attemptAutoLandscape();
      this.checkOrientation();
      this.handleResize();
    });

    // Window Resize & Orientation Change
    this.onResize = () => {
      this.checkOrientation();
      this.handleResize();
    };
    window.addEventListener('resize', this.onResize);

    this.onOrientationChange = () => {
      setTimeout(() => {
        this.checkOrientation();
        this.handleResize();
      }, 150);
    };
    window.addEventListener('orientationchange', this.onOrientationChange);
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', this.onOrientationChange);
    }

    // Keyboard controls
    this.onKeyDown = (e) => this.handleKeyDown(e);
    this.onKeyUp = (e) => this.handleKeyUp(e);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Mouse controls
    this.onMouseMove = (e) => this.handleMouseMove(e);
    this.onMouseDown = (e) => this.handleMouseDown(e);
    this.onMouseUp = (e) => this.handleMouseUp(e);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);

    // Mobile touch controls
    this.initTouchControls();
  }

  setupNetworkHandlers() {
    this.network.onConnected = ({ isHost, roomCode, slot }) => {
      this.isOnlineHost = isHost;
      this.roomCode = roomCode;
      this.showNotification(`⚔️ CONNECTED TO OUTPOST ROOM ${roomCode}!`);
      soundManager.playClick();
    };

    this.network.onPlayerListChange = (players) => {
      this.updateRosterUI(players);

      // Auto-launch if room reaches selected capacity
      if (this.isOnlineHost && players.length >= this.playerCount) {
        this.showNotification(`💥 ROOM FULL (${players.length}/${this.playerCount}) • LAUNCHING!`);
        setTimeout(() => {
          this.network.sendMatchEvent('start');
          this.startMatch('online');
        }, 1200);
      }
    };

    this.network.onRemotePlayerState = (slot, state) => {
      let rp = this.remotePlayers.get(slot);
      if (!rp) {
        const slotColor = this.network.slotColors[slot] || '#ef4444';
        rp = {
          slot: slot,
          name: `Player ${slot}`,
          color: slotColor,
          x: state.x,
          y: state.y,
          width: 46,
          height: 64,
          velocityX: 0,
          velocityY: 0,
          health: 100,
          isDead: false,
          gunAngle: 0,
          isUsingJetpack: false,
          isCrouching: false,
          walkFrame: 0
        };
        this.remotePlayers.set(slot, rp);
      }

      rp.x = state.x;
      rp.y = state.y;
      rp.velocityX = state.vx;
      rp.velocityY = state.vy;
      rp.gunAngle = state.gunAngle;
      rp.isUsingJetpack = state.isUsingJetpack;
      rp.isCrouching = state.isCrouching;
      rp.walkFrame = state.walkFrame;
      rp.health = state.health;
      rp.isDead = state.isDead;
      rp.respawnTimer = state.respawnTimer;
      rp.lastShotTime = state.lastShotTime;

      // Jetpack particles for remote soldier
      if (state.isUsingJetpack) {
        const cx = state.x + rp.width / 2;
        const by = state.y + rp.height;
        this.particles.push({
          x: cx + (Math.random() - 0.5) * 12,
          y: by,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 2.5 + Math.random() * 2.5,
          size: 3 + Math.random() * 2.5,
          color: Math.random() > 0.4 ? '#ff9900' : '#ffff00',
          life: 0.3,
          maxLife: 0.3
        });
      }
    };

    this.network.onRemotePlayerShoot = (slot, bulletData) => {
      this.audio.playShoot(0.65);
      this.bullets.push({
        id: bulletData.id || Math.random().toString(36).substring(2),
        x: bulletData.x,
        y: bulletData.y,
        angle: bulletData.angle,
        speed: bulletData.speed || 16,
        velocityX: Math.cos(bulletData.angle) * (bulletData.speed || 16),
        velocityY: Math.sin(bulletData.angle) * (bulletData.speed || 16),
        ownerId: `player_${slot}`,
        damage: bulletData.damage || 10,
        createdAt: Date.now(),
        trail: [{ x: bulletData.x, y: bulletData.y }]
      });
    };

    this.network.onRemotePlayerHit = (data) => {
      const rp = this.remotePlayers.get(data.slot);
      if (rp) {
        rp.health = Math.max(0, rp.health - (data.damage || 10));
        this.audio.playHit();
      }
    };

    this.network.onMatchEvent = (event, payload) => {
      if (event === 'start') {
        this.startMatch('online');
      } else if (event === 'restart') {
        this.startMatch('online');
      } else if (event === 'kill') {
        const killerSlot = payload?.killerSlot || 1;
        this.scores[killerSlot] = (this.scores[killerSlot] || 0) + 1;
        if (killerSlot === this.network.playerSlot) {
          this.playerScore++;
          this.showNotification(`YOU ELIMINATED AN OPPONENT! (+1)`);
        } else {
          this.showNotification(`PLAYER ${killerSlot} SCORED A KILL!`);
        }
      }
    };

    this.network.onDisconnect = () => {
      this.showNotification('⚠️ OPPONENT DISCONNECTED');
    };

    this.network.onError = (err) => {
      console.warn('Network error:', err);
      const errBox = this.container.querySelector('#mm-online-status');
      if (errBox) {
        errBox.textContent = 'Connection error. Check code or internet connection.';
        errBox.style.color = '#ef4444';
      }
    };
  }

  updateRosterUI(players) {
    const rosterEl = this.container.querySelector('#mm-roster-list');
    const waitingText = this.container.querySelector('#mm-waiting-status-text');
    const launchBtn = this.container.querySelector('#mm-start-room-btn');
    if (!rosterEl) return;

    if (waitingText) {
      waitingText.textContent = `Connected combatants (${players.length} / ${this.playerCount})`;
    }

    if (launchBtn && this.isOnlineHost) {
      launchBtn.style.display = players.length >= 2 ? 'inline-block' : 'none';
    }

    rosterEl.innerHTML = players.map(p => `
      <div class="mm-roster-item" style="border-left: 3px solid ${p.color};">
        <span style="font-weight: 800; color: ${p.color};">P${p.slot}: ${p.name || `Player ${p.slot}`}</span>
        <span style="font-size: 10px; color: #94a3b8;">${p.isHost ? '👑 HOST' : 'READY ✅'}</span>
      </div>
    `).join('');
  }

  createOnlineRoom() {
    const statusEl = this.container.querySelector('#mm-online-status');
    const choiceView = this.container.querySelector('#mm-online-choice-view');
    const waitBox = this.container.querySelector('#mm-room-waiting-box');
    const displayCode = this.container.querySelector('#mm-display-room-code');

    if (statusEl) {
      statusEl.textContent = 'Establishing secure WebRTC outpost room...';
      statusEl.style.color = '#59b8eb';
    }

    this.network.createRoom(
      this.playerName,
      this.playerCount,
      (code) => {
        this.roomCode = code;
        this.isOnlineHost = true;
        if (choiceView) choiceView.style.display = 'none';
        if (waitBox) waitBox.style.display = 'block';
        if (displayCode) displayCode.textContent = code;
        if (statusEl) statusEl.textContent = '';
      },
      (err) => {
        if (statusEl) {
          statusEl.textContent = `Could not host room: ${err.message || err}`;
          statusEl.style.color = '#ef4444';
        }
      }
    );
  }

  joinOnlineRoom(code) {
    const statusEl = this.container.querySelector('#mm-online-status');
    if (statusEl) {
      statusEl.textContent = `Connecting to room ${code.toUpperCase()}...`;
      statusEl.style.color = '#59b8eb';
    }

    this.network.joinRoom(
      code,
      this.playerName,
      () => {
        this.roomCode = code.toUpperCase();
        this.isOnlineHost = false;
        if (statusEl) statusEl.textContent = 'Connected! Waiting for host to launch battle...';
      },
      (err) => {
        if (statusEl) {
          statusEl.textContent = `Failed to join room: ${err.message || 'Room not found or full'}`;
          statusEl.style.color = '#ef4444';
        }
      }
    );
  }

  copyInviteLink() {
    if (!this.roomCode) return;
    const url = `${window.location.origin}${window.location.pathname}#minimilitia?room=${this.roomCode}`;
    navigator.clipboard?.writeText(url).then(() => {
      this.showNotification('📋 INVITE LINK COPIED TO CLIPBOARD!');
    }).catch(() => {
      prompt('Copy invite link:', url);
    });
  }

  startMatch(playType = 'single') {
    this.playType = playType;
    this.gameState = 'playing';
    this.playerScore = 0;
    this.opponentScore = 0;
    this.scores = { 1: 0, 2: 0, 3: 0, 4: 0 };
    this.timer = 300; // 5:00 minutes
    this.playerLives = this.maxLives;
    this.bullets = [];
    this.particles = [];

    // Safe spawn locations on Outpost map based on slot
    const slot = this.playType === 'online' ? (this.network.playerSlot - 1) : 0;
    const spawn = this.physics.getSafeSpawn(slot);
    this.player.x = spawn.x;
    this.player.y = spawn.y;
    this.player.velocityX = 0;
    this.player.velocityY = 0;
    this.player.health = 100;
    this.player.jetpackFuel = 100;
    this.player.ammo = this.player.maxAmmo;
    this.player.isReloading = false;
    this.player.isDead = false;
    this.player.spawnProtection = Date.now() + 2500;

    // Reset camera to center on player
    const { baseW, baseH } = this.getBaseViewport();
    this.cameraX = Math.max(0, Math.min(this.player.x + this.player.width / 2 - baseW / 2, Math.max(0, this.physics.worldWidth - baseW)));
    this.cameraY = Math.max(0, Math.min(this.player.y + this.player.height / 2 - baseH / 2, Math.max(0, this.physics.worldHeight - baseH)));
    this.aimX = this.player.x + this.player.width / 2 + 100;
    this.aimY = this.player.y + this.player.height / 2;

    // Configure Single Player Bots according to selected combatants (1, 2, 3, or 4 players)
    if (this.playType === 'single') {
      if (this.playerCount === 1) {
        this.bots = [];
      } else if (this.playerCount === 2) {
        this.bots = [
          new MiniMilitiaBot('bot_2', 'Sgt. Viper', 1020, 520, '#ef4444')
        ];
      } else if (this.playerCount === 3) {
        this.bots = [
          new MiniMilitiaBot('bot_2', 'Sgt. Viper', 1020, 520, '#ef4444'),
          new MiniMilitiaBot('bot_3', 'Col. Hunter', 480, 380, '#22c55e')
        ];
      } else {
        this.bots = [
          new MiniMilitiaBot('bot_2', 'Sgt. Viper', 1020, 520, '#ef4444'),
          new MiniMilitiaBot('bot_3', 'Col. Hunter', 480, 380, '#22c55e'),
          new MiniMilitiaBot('bot_4', 'Major Steel', 1420, 630, '#eab308')
        ];
      }
    } else {
      this.bots = [];
      // Populate remote players
      for (const p of this.network.players.values()) {
        if (p.slot !== this.network.playerSlot) {
          const sp = this.physics.getSafeSpawn(p.slot - 1);
          this.remotePlayers.set(p.slot, {
            slot: p.slot,
            name: p.name,
            color: p.color,
            x: sp.x,
            y: sp.y,
            width: 46,
            height: 64,
            velocityX: 0,
            velocityY: 0,
            health: 100,
            isDead: false,
            gunAngle: Math.PI,
            isUsingJetpack: false,
            isCrouching: false,
            walkFrame: 0
          });
        }
      }
    }

    // Hide start & game over modals
    const startOverlay = this.container.querySelector('#mm-start-overlay');
    const gameOverOverlay = this.container.querySelector('#mm-gameover-overlay');
    if (startOverlay) startOverlay.style.display = 'none';
    if (gameOverOverlay) gameOverOverlay.style.display = 'none';

    if (this.playType === 'online') {
      this.showNotification(`⚔️ ${this.playerCount}-PLAYER OUTPOST DUEL • ENGAGE!`);
    } else if (this.playerCount === 1) {
      this.showNotification('🎯 OUTPOST SOLO TRAINING • SCOUT & PRACTICE!');
    } else {
      this.showNotification(`💥 ${this.playerCount}-PLAYER OUTPOST BATTLE • FIGHT!`);
    }
  }

  initTouchControls() {
    const leftZone = this.container.querySelector('#mm-left-zone');
    const leftBase = this.container.querySelector('#mm-left-base');
    const leftThumb = this.container.querySelector('#mm-left-thumb');

    const rightZone = this.container.querySelector('#mm-right-zone');
    const rightBase = this.container.querySelector('#mm-right-base');
    const rightThumb = this.container.querySelector('#mm-right-thumb');

    // Left Touch Joystick (Movement & Jetpack)
    const handleLeftTouch = (touch) => {
      const rect = leftZone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = touch.clientX - cx;
      const dy = touch.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const maxR = 45;
      const clampedDist = Math.min(dist, maxR);
      const angle = Math.atan2(dy, dx);

      const thumbX = Math.cos(angle) * clampedDist;
      const thumbY = Math.sin(angle) * clampedDist;
      leftThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;

      // Directional inputs
      this.keys.left = thumbX < -15;
      this.keys.right = thumbX > 15;
      this.keys.up = thumbY < -18;
      this.keys.crouch = thumbY > 20;
    };

    leftZone?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      leftBase.style.opacity = '1';
      handleLeftTouch(e.targetTouches[0]);
    }, { passive: false });

    leftZone?.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handleLeftTouch(e.targetTouches[0]);
    }, { passive: false });

    const resetLeft = () => {
      leftThumb.style.transform = 'translate(0px, 0px)';
      leftBase.style.opacity = '0.5';
      this.keys.left = false;
      this.keys.right = false;
      this.keys.up = false;
      this.keys.crouch = false;
    };
    leftZone?.addEventListener('touchend', resetLeft);
    leftZone?.addEventListener('touchcancel', resetLeft);

    // Right Touch Joystick (360° Aim & Fire)
    const handleRightTouch = (touch) => {
      const rect = rightZone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = touch.clientX - cx;
      const dy = touch.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const maxR = 45;
      const clampedDist = Math.min(dist, maxR);
      const angle = Math.atan2(dy, dx);

      const thumbX = Math.cos(angle) * clampedDist;
      const thumbY = Math.sin(angle) * clampedDist;
      rightThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;

      // Aim angle
      const playerCenterX = this.player.x + this.player.width / 2;
      const playerCenterY = this.player.y + this.player.height / 2;
      this.player.gunAngle = angle;
      this.aimX = playerCenterX + Math.cos(angle) * 140;
      this.aimY = playerCenterY + Math.sin(angle) * 140;

      // Fire when pulled beyond threshold
      if (dist > 18) {
        this.isShooting = true;
      }
    };

    rightZone?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      rightBase.style.opacity = '1';
      handleRightTouch(e.targetTouches[0]);
    }, { passive: false });

    rightZone?.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handleRightTouch(e.targetTouches[0]);
    }, { passive: false });

    const resetRight = () => {
      rightThumb.style.transform = 'translate(0px, 0px)';
      rightBase.style.opacity = '0.5';
      this.isShooting = false;
    };
    rightZone?.addEventListener('touchend', resetRight);
    rightZone?.addEventListener('touchcancel', resetRight);
  }

  handleKeyDown(e) {
    if (e.key === 'a' || e.key === 'A') this.keys.left = true;
    if (e.key === 'd' || e.key === 'D') this.keys.right = true;
    if (e.key === 'w' || e.key === 'W' || e.key === ' ') this.keys.up = true;
    if (e.key === 's' || e.key === 'S') this.keys.crouch = true;
    if (e.key === 'r' || e.key === 'R') this.reload();
    if (e.key === 'f' || e.key === 'F') this.isShooting = true;

    // Arrow keys support
    if (e.key === 'ArrowLeft') this.keys.left = true;
    if (e.key === 'ArrowRight') this.keys.right = true;
    if (e.key === 'ArrowUp') this.keys.up = true;
    if (e.key === 'ArrowDown') this.keys.crouch = true;
  }

  handleKeyUp(e) {
    if (e.key === 'a' || e.key === 'A') this.keys.left = false;
    if (e.key === 'd' || e.key === 'D') this.keys.right = false;
    if (e.key === 'w' || e.key === 'W' || e.key === ' ') this.keys.up = false;
    if (e.key === 's' || e.key === 'S') this.keys.crouch = false;
    if (e.key === 'f' || e.key === 'F') this.isShooting = false;

    if (e.key === 'ArrowLeft') this.keys.left = false;
    if (e.key === 'ArrowRight') this.keys.right = false;
    if (e.key === 'ArrowUp') this.keys.up = false;
    if (e.key === 'ArrowDown') this.keys.crouch = false;
  }

  handleMouseMove(e) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const { baseW, baseH } = this.getBaseViewport();
    const scale = Math.min(rect.width / baseW, rect.height / baseH);
    const viewW = baseW * scale;
    const viewH = baseH * scale;
    const viewOffsetX = (rect.width - viewW) / 2;
    const viewOffsetY = (rect.height - viewH) / 2;

    const canvasMouseX = (e.clientX - rect.left - viewOffsetX) / scale;
    const canvasMouseY = (e.clientY - rect.top - viewOffsetY) / scale;

    // World aim position
    this.aimX = canvasMouseX + this.cameraX;
    this.aimY = canvasMouseY + this.cameraY;

    // Player gun angle pointing towards crosshair
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;
    this.player.gunAngle = Math.atan2(this.aimY - playerCenterY, this.aimX - playerCenterX);
  }

  handleMouseDown(e) {
    if (e.button === 0) {
      this.isShooting = true;
    }
  }

  handleMouseUp(e) {
    if (e.button === 0) {
      this.isShooting = false;
    }
  }

  reload() {
    if (this.player.isReloading || this.player.ammo === this.player.maxAmmo) return;

    this.player.isReloading = true;
    this.player.reloadTimer = Date.now() + 3500;
    this.audio.playReload();
    this.showNotification('RELOADING AK-47...');
  }

  showNotification(text) {
    this.notification = text;
    this.notificationTimer = Date.now() + 2500;
  }

  attemptAutoLandscape() {
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (_) {}
  }

  checkOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const overlay = this.container.querySelector('#mm-rotate-overlay');

    if (overlay) {
      if (isTouch && isPortrait) {
        overlay.classList.add('visible');
      } else {
        overlay.classList.remove('visible');
      }
    }
  }

  getBaseViewport() {
    const baseH = 720;
    const w = this.canvas?.clientWidth || window.innerWidth;
    const h = this.canvas?.clientHeight || window.innerHeight;
    const aspect = w / Math.max(1, h);
    const baseW = aspect >= (16 / 9) ? Math.min(2160, Math.round(baseH * aspect)) : 1280;
    return { baseW, baseH };
  }

  handleResize() {
    if (!this.canvas || !this.canvasContainer) return;
    const w = this.canvasContainer.clientWidth;
    const h = this.canvasContainer.clientHeight;
    this.renderer.resize(w, h);
  }

  shoot() {
    if (this.player.isDead || this.player.isReloading || this.gameState !== 'playing') return;

    if (this.player.ammo <= 0) {
      this.reload();
      return;
    }

    const now = Date.now();
    if (now - this.lastShootAttempt < 110) return; // 550 RPM
    this.lastShootAttempt = now;

    this.player.ammo--;
    this.player.lastShotTime = now;
    this.audio.playShoot();

    // Muzzle position
    const centerX = this.player.x + this.player.width / 2;
    const centerY = this.player.y + this.player.height / 2;
    const spread = (Math.random() - 0.5) * 0.08;
    const angle = this.player.gunAngle + spread;
    const gunLength = 34;

    const bulletX = centerX + Math.cos(angle) * gunLength;
    const bulletY = centerY + Math.sin(angle) * gunLength;

    const mySlot = this.playType === 'online' ? this.network.playerSlot : 1;
    const bullet = {
      id: Math.random().toString(36).substring(2),
      x: bulletX,
      y: bulletY,
      angle: angle,
      speed: 16,
      velocityX: Math.cos(angle) * 16,
      velocityY: Math.sin(angle) * 16,
      ownerId: `player_${mySlot}`,
      damage: 10,
      createdAt: now,
      trail: [{ x: bulletX, y: bulletY }]
    };

    this.bullets.push(bullet);

    // Broadcast in online multiplayer
    if (this.playType === 'online' && this.network.isConnected) {
      this.network.sendShoot(bullet);
    }

    if (this.player.ammo === 0) {
      this.reload();
    }
  }

  loop() {
    if (!this.isRunning) return;

    const now = Date.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // FPS
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    if (this.gameState === 'playing') {
      // Countdown timer
      this.timer = Math.max(0, this.timer - dt);
      if (this.timer <= 0) {
        this.endGame();
      }

      // Update Local Player
      this.updatePlayer(dt, now);

      // Update Bullets & Environment
      this.updateBullets(now);
      this.updateParticles(dt);

      // Update Bots (Single Player)
      if (this.playType === 'single') {
        this.updateBots(now);
      }

      // 2D Camera Tracking across Outpost Map
      this.updateCamera();
    }

    // Clear notifications
    if (this.notification && now > this.notificationTimer) {
      this.notification = null;
    }

    // Build combatants list for HUD
    const combatants = [
      { slot: 1, name: this.player.name || 'Soldier #1', color: '#3b82f6', score: this.scores[1] || 0 }
    ];

    if (this.playType === 'single') {
      this.bots.forEach((b, idx) => {
        combatants.push({
          slot: idx + 2,
          name: b.name,
          color: b.color,
          score: this.scores[idx + 2] || 0
        });
      });
    } else {
      for (const rp of this.remotePlayers.values()) {
        combatants.push({
          slot: rp.slot,
          name: rp.name,
          color: rp.color,
          score: this.scores[rp.slot] || 0
        });
      }
    }

    // Render frame
    this.renderer.render({
      playType: this.playType,
      playerCount: this.playerCount,
      playerName: this.playerName,
      opponentName: this.opponentName,
      roomCode: this.roomCode,
      player: this.player,
      remotePlayers: Array.from(this.remotePlayers.values()),
      bots: this.playType === 'single' ? this.bots : [],
      bullets: this.bullets,
      particles: this.particles,
      physics: this.physics,
      cameraX: this.cameraX,
      cameraY: this.cameraY,
      aimX: this.aimX,
      aimY: this.aimY,
      playerScore: this.playerScore,
      opponentScore: this.opponentScore,
      scores: this.scores,
      combatants: combatants,
      timer: this.timer,
      lives: (this.playType === 'single' && this.gameMode === 'survival') ? this.playerLives : undefined,
      maxLives: this.maxLives,
      fps: this.fps,
      notification: this.notification,
      time: now
    });

    requestAnimationFrame(this.loop);
  }

  updatePlayer(dt, now) {
    if (this.player.isDead) {
      if (now > this.player.respawnTimer) {
        this.respawnPlayer();
      }
      return;
    }

    // Shooting
    if (this.isShooting) {
      this.shoot();
    }

    // Reload completion
    if (this.player.isReloading && now > this.player.reloadTimer) {
      this.player.ammo = this.player.maxAmmo;
      this.player.isReloading = false;
      this.showNotification('RELOAD COMPLETE (25/25)');
    }

    // Horizontal Movement
    this.player.velocityX = 0;
    if (this.keys.left) this.player.velocityX = -this.player.speed;
    if (this.keys.right) this.player.velocityX = this.player.speed;

    // Jetpack Flying
    if (this.keys.up && this.player.jetpackFuel > 0) {
      this.player.isUsingJetpack = true;
      this.player.velocityY = Math.max(this.player.velocityY - 0.52, -5.4);
      this.player.jetpackFuel = Math.max(0, this.player.jetpackFuel - 0.45);
      this.audio.startJetpack();

      // Thruster flame particles
      const centerX = this.player.x + this.player.width / 2;
      const bottomY = this.player.y + this.player.height;
      for (let i = 0; i < 2; i++) {
        this.particles.push({
          x: centerX + (Math.random() - 0.5) * 14,
          y: bottomY,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 2.5 + Math.random() * 2.5,
          size: 3 + Math.random() * 3,
          color: Math.random() > 0.4 ? '#ff5500' : '#ffff00',
          life: 0.35,
          maxLife: 0.35
        });
      }
    } else {
      this.player.isUsingJetpack = false;
      this.audio.stopJetpack();
      this.player.velocityY += this.player.gravity;
      if (this.player.jetpackFuel < 100) {
        this.player.jetpackFuel = Math.min(100, this.player.jetpackFuel + 0.4);
      }
    }

    // Crouch
    this.player.isCrouching = this.keys.crouch;
    this.player.height = this.player.isCrouching ? 46 : 64;

    // Horizontal Collision
    if (!this.physics.checkCollisionOnX(this.player.x, this.player.y, this.player.width, this.player.height, this.player.velocityX)) {
      this.player.x += this.player.velocityX;
    } else {
      this.player.velocityX = 0;
    }

    // Vertical Collision
    if (!this.physics.checkCollisionOnY(this.player.x, this.player.y, this.player.width, this.player.height, this.player.velocityY)) {
      this.player.y += this.player.velocityY;
    } else {
      if (this.player.velocityY > 0) {
        this.player.onGround = true;
      }
      this.player.velocityY = 0;
    }

    // Ground Bedrock Check
    const groundLvl = this.physics.getGroundLevel(this.player.x);
    if (this.player.y + this.player.height >= groundLvl) {
      this.player.y = groundLvl - this.player.height;
      this.player.velocityY = 0;
      this.player.onGround = true;
    } else {
      this.player.onGround = false;
    }

    // Walk Animation
    if (Math.abs(this.player.velocityX) > 0.5) {
      this.player.walkTimer += 16;
      if (this.player.walkTimer > 90) {
        this.player.walkTimer = 0;
        this.player.walkFrame = (this.player.walkFrame + 1) % 4;
      }
    } else {
      this.player.walkFrame = 0;
    }

    // Broadcast state in online multiplayer
    if (this.playType === 'online' && this.network.isConnected) {
      this.network.sendState(this.player);
    }
  }

  updateBots(now) {
    for (const bot of this.bots) {
      if (bot.isDead) {
        if (now > bot.respawnTimer) {
          bot.respawn(this.physics);
        }
        continue;
      }

      // Tactical Target: find nearest alive combatant (player or other bot)
      let closestTarget = !this.player.isDead ? this.player : null;
      let closestDist = closestTarget ? Math.hypot(this.player.x - bot.x, this.player.y - bot.y) : Infinity;

      for (const otherBot of this.bots) {
        if (otherBot.id !== bot.id && !otherBot.isDead) {
          const d = Math.hypot(otherBot.x - bot.x, otherBot.y - bot.y);
          if (d < closestDist) {
            closestDist = d;
            closestTarget = otherBot;
          }
        }
      }

      bot.update(this.physics, closestTarget, now, (bulletData) => {
        this.audio.playShoot(0.65);
        this.bullets.push({
          id: Math.random().toString(36).substring(2),
          x: bulletData.x,
          y: bulletData.y,
          angle: bulletData.angle,
          speed: 16,
          velocityX: Math.cos(bulletData.angle) * 16,
          velocityY: Math.sin(bulletData.angle) * 16,
          ownerId: bot.id,
          damage: 10,
          createdAt: now,
          trail: [{ x: bulletData.x, y: bulletData.y }]
        });
      });
    }
  }

  updateBullets(now) {
    const myId = `player_${this.playType === 'online' ? this.network.playerSlot : 1}`;

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.velocityX;
      b.y += b.velocityY;

      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 5) b.trail.shift();

      // Environment collision (obstacles, rocks, castle walls)
      if (this.physics.checkBulletCollision(b.x, b.y)) {
        this.spawnImpactSparks(b.x, b.y, '#ffd700');
        this.bullets.splice(i, 1);
        continue;
      }

      // Check hit against Local Player
      if (b.ownerId !== myId && !this.player.isDead) {
        if (
          b.x >= this.player.x &&
          b.x <= this.player.x + this.player.width &&
          b.y >= this.player.y &&
          b.y <= this.player.y + this.player.height
        ) {
          this.spawnImpactSparks(b.x, b.y, '#ef4444');
          this.takePlayerDamage(b.damage, b.ownerId);
          this.bullets.splice(i, 1);
          continue;
        }
      }

      // Check hit against Bots (Single Player)
      if (this.playType === 'single') {
        let hitBot = false;
        for (let bi = 0; bi < this.bots.length; bi++) {
          const bot = this.bots[bi];
          if (b.ownerId !== bot.id && !bot.isDead) {
            if (
              b.x >= bot.x &&
              b.x <= bot.x + bot.width &&
              b.y >= bot.y &&
              b.y <= bot.y + bot.height
            ) {
              hitBot = true;
              this.spawnImpactSparks(b.x, b.y, '#ef4444');
              this.audio.playHit();
              bot.takeDamage(b.damage);

              if (bot.isDead) {
                this.audio.playExplosion();
                // Determine killer
                if (b.ownerId === myId) {
                  this.playerScore++;
                  this.scores[1] = (this.scores[1] || 0) + 1;
                  this.showNotification(`YOU ELIMINATED ${bot.name.toUpperCase()}! (+1)`);
                  if (this.playerScore > this.highScore) {
                    this.highScore = this.playerScore;
                    localStorage.setItem('minimilitia_high_score', this.highScore);
                  }
                } else {
                  const killerBot = this.bots.find(kb => kb.id === b.ownerId);
                  const killerSlot = bi + 2;
                  this.scores[killerSlot] = (this.scores[killerSlot] || 0) + 1;
                  this.showNotification(`${killerBot?.name?.toUpperCase() || 'ENEMY'} ELIMINATED ${bot.name.toUpperCase()}!`);
                }

                // Explosion particles
                const cx = bot.x + bot.width / 2;
                const cy = bot.y + bot.height / 2;
                for (let k = 0; k < 18; k++) {
                  const angle = Math.random() * Math.PI * 2;
                  const spd = 2 + Math.random() * 4.5;
                  this.particles.push({
                    x: cx,
                    y: cy,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd,
                    size: 3 + Math.random() * 3.5,
                    color: Math.random() > 0.5 ? '#ef4444' : '#ff9900',
                    life: 0.55,
                    maxLife: 0.55
                  });
                }
              }

              this.bullets.splice(i, 1);
              break;
            }
          }
        }
        if (hitBot) continue;
      }

      // Check hit against Remote Players (Online Multiplayer)
      if (this.playType === 'online') {
        let hitRemote = false;
        for (const rp of this.remotePlayers.values()) {
          const rpId = `player_${rp.slot}`;
          if (b.ownerId !== rpId && !rp.isDead) {
            if (
              b.x >= rp.x &&
              b.x <= rp.x + rp.width &&
              b.y >= rp.y &&
              b.y <= rp.y + rp.height
            ) {
              hitRemote = true;
              this.spawnImpactSparks(b.x, b.y, '#ef4444');
              this.audio.playHit();

              if (b.ownerId === myId) {
                // Host registers hit
                this.network.sendHit(b.damage, myId);
              }
              this.bullets.splice(i, 1);
              break;
            }
          }
        }
        if (hitRemote) continue;
      }

      // Bullet lifetime timeout (2.8s)
      if (now - b.createdAt > 2800) {
        this.bullets.splice(i, 1);
      }
    }
  }

  takePlayerDamage(damage, attackerId) {
    if (this.player.isDead) return;
    if (this.player.spawnProtection && Date.now() < this.player.spawnProtection) return;

    this.player.health = Math.max(0, this.player.health - damage);
    this.audio.playHit();

    if (this.player.health <= 0) {
      this.player.isDead = true;
      this.opponentScore++;
      this.audio.playExplosion();

      // Check survival chances mode
      if (this.playType === 'single' && this.gameMode === 'survival') {
        this.playerLives--;
        if (this.playerLives <= 0) {
          this.endGame('OUT OF LIVES! MISSION FAILED');
          return;
        }
      }

      this.player.respawnTimer = Date.now() + 3000;
      this.showNotification(`ELIMINATED! RESPAWNING IN 3 SECONDS...`);

      // Death explosion particles
      const centerX = this.player.x + this.player.width / 2;
      const centerY = this.player.y + this.player.height / 2;
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 5;
        this.particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: 3 + Math.random() * 4,
          color: Math.random() > 0.5 ? '#ef4444' : '#ff9900',
          life: 0.6,
          maxLife: 0.6
        });
      }
    }
  }

  respawnPlayer() {
    const slot = this.playType === 'online' ? (this.network.playerSlot - 1) : 0;
    const spawn = this.physics.getSafeSpawn(slot);
    this.player.x = spawn.x;
    this.player.y = spawn.y;
    this.player.velocityX = 0;
    this.player.velocityY = 0;
    this.player.health = 100;
    this.player.jetpackFuel = 100;
    this.player.ammo = this.player.maxAmmo;
    this.player.isReloading = false;
    this.player.isDead = false;
    this.player.spawnProtection = Date.now() + 2500;

    // Snap camera smoothly to player
    const { baseW, baseH } = this.getBaseViewport();
    this.cameraX = Math.max(0, Math.min(this.player.x + this.player.width / 2 - baseW / 2, Math.max(0, this.physics.worldWidth - baseW)));
    this.cameraY = Math.max(0, Math.min(this.player.y + this.player.height / 2 - baseH / 2, Math.max(0, this.physics.worldHeight - baseH)));
    this.aimX = this.player.x + this.player.width / 2 + 100;
    this.aimY = this.player.y + this.player.height / 2;

    this.showNotification('RESPAWNED & PROTECTED!');
  }

  updateCamera() {
    const { baseW, baseH } = this.getBaseViewport();
    const targetCamX = this.player.x + this.player.width / 2 - baseW / 2;
    const targetCamY = this.player.y + this.player.height / 2 - baseH / 2;

    this.cameraX += (targetCamX - this.cameraX) * 0.12;
    this.cameraY += (targetCamY - this.cameraY) * 0.12;

    // Clamp within 2048 x 1070 Outpost bounds
    this.cameraX = Math.max(0, Math.min(this.cameraX, Math.max(0, this.physics.worldWidth - baseW)));
    this.cameraY = Math.max(0, Math.min(this.cameraY, Math.max(0, this.physics.worldHeight - baseH)));
  }

  spawnImpactSparks(x, y, color) {
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 2.2 + Math.random() * 2,
        color: color,
        life: 0.28,
        maxLife: 0.28
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  endGame(customReason) {
    this.gameState = 'gameover';
    this.audio.stopJetpack();

    const titleEl = this.container.querySelector('#mm-gameover-title');
    const descEl = this.container.querySelector('#mm-gameover-desc');
    const playerStatEl = this.container.querySelector('#mm-stat-player');
    const enemyStatEl = this.container.querySelector('#mm-stat-enemy');
    const overlayEl = this.container.querySelector('#mm-gameover-overlay');

    if (customReason) {
      if (titleEl) titleEl.textContent = 'MATCH OVER';
      if (descEl) descEl.textContent = customReason;
    } else if (this.playerCount === 1) {
      if (titleEl) titleEl.textContent = 'SCOUT COMPLETE!';
      if (descEl) descEl.textContent = 'Outpost sector reconnaissance and weapon training completed.';
    } else if (this.playerScore > this.opponentScore) {
      if (titleEl) titleEl.textContent = '🏆 OUTPOST VICTORY!';
      if (descEl) descEl.textContent = `${this.player.name || 'Commander'} has conquered the Outpost!`;
    } else if (this.playerScore < this.opponentScore) {
      if (titleEl) titleEl.textContent = '💀 DEFEAT!';
      if (descEl) descEl.textContent = 'Enemy forces dominated the sector. Regroup and strike back!';
    } else {
      if (titleEl) titleEl.textContent = '🤝 STALEMATE!';
      if (descEl) descEl.textContent = 'Outpost combat ended in a thrilling tie.';
    }

    if (playerStatEl) playerStatEl.textContent = this.playerScore;
    if (enemyStatEl) enemyStatEl.textContent = this.opponentScore;
    if (overlayEl) overlayEl.style.display = 'flex';
  }

  destroy() {
    this.isRunning = false;
    this.audio.destroy();
    this.network.destroy();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onOrientationChange);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
  }
}
