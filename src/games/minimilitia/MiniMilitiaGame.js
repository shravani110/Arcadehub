// MiniMilitiaGame.js - Complete 2D Side-Scrolling Combat Shooter with Single Player & Multiplayer
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
    this.playType = 'single'; // 'single' | 'online' | 'local'
    this.gameMode = 'timed'; // 'timed' (5-Min Deathmatch) or 'survival' (5 Chances)
    this.playerLives = 5;
    this.maxLives = 5;

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
    this.timer = 300; // 5:00 match timer (seconds)
    this.highScore = parseInt(localStorage.getItem('minimilitia_high_score') || '0', 10);
    this.notification = null;
    this.notificationTimer = 0;

    // Performance
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsUpdate = Date.now();

    // Camera
    this.cameraX = 0;
    this.cameraY = 0;

    // Player 1 State
    this.player = {
      name: this.playerName,
      x: 350,
      y: 500,
      width: 50,
      height: 70,
      velocityX: 0,
      velocityY: 0,
      speed: 4.8,
      gravity: 0.75,
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

    // Opponent Player (used in Online 1v1 and Local 2-Player modes)
    this.opponentPlayer = {
      name: 'Player 2',
      x: 1450,
      y: 450,
      width: 50,
      height: 70,
      velocityX: 0,
      velocityY: 0,
      speed: 4.8,
      gravity: 0.75,
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
      gunAngle: Math.PI,
      lastShotTime: 0,
      walkFrame: 0,
      walkTimer: 0,
      onGround: false
    };

    // Bots / Opponents for Single Player
    this.bots = [
      new MiniMilitiaBot('bot_alpha', 'Sgt. Viper', 850, 400),
      new MiniMilitiaBot('bot_bravo', 'Col. Hunter', 1450, 450)
    ];

    // Bullets and Particles
    this.bullets = [];
    this.particles = [];

    // Aim position in world space
    this.aimX = 640;
    this.aimY = 360;

    // Player 1 input state
    this.keys = {
      left: false,
      right: false,
      up: false,
      crouch: false
    };
    this.isShooting = false;
    this.lastShootAttempt = 0;

    // Player 2 local input state
    this.keysP2 = {
      left: false,
      right: false,
      up: false,
      crouch: false,
      shoot: false
    };
    this.lastP2ShootAttempt = 0;

    this.initDOM();
    this.initEvents();
    this.setupNetworkHandlers();
    this.renderer = new MiniMilitiaRenderer(this.canvas);
    this.handleResize();
    this.attemptAutoLandscape();
    this.checkOrientation();

    // Initial camera centered on player
    const { baseW } = this.getBaseViewport();
    this.cameraX = Math.max(0, Math.min(this.player.x + this.player.width / 2 - baseW / 2, Math.max(0, this.physics.worldWidth - baseW)));

    this.isRunning = true;
    this.lastTime = Date.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
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
              <span class="mm-modal-badge">2D COMBAT OUTPOST</span>
              <h1 class="mm-modal-title">MINI MILITIA</h1>
              <p class="mm-modal-subtitle">Jetpack airborne combat, 360° AK-47 ballistics, and tactical shootouts.</p>
            </div>

            <!-- Mode Selection Tabs -->
            <div class="mm-type-tabs">
              <button class="mm-type-tab ${this.playType === 'single' ? 'active' : ''}" id="mm-tab-single" data-tab="single">
                🎮 SINGLE PLAYER
              </button>
              <button class="mm-type-tab ${this.playType === 'online' ? 'active' : ''}" id="mm-tab-online" data-tab="online">
                🌐 ONLINE 1v1
              </button>
              <button class="mm-type-tab ${this.playType === 'local' ? 'active' : ''}" id="mm-tab-local" data-tab="local">
                ⚔️ LOCAL 2P
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
                START SINGLE PLAYER
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
                  <div class="mm-online-card-desc">Create a private battle room and share the room code or invite link.</div>
                  <button id="mm-host-room-btn" class="mm-btn-action mm-btn-host">
                    CREATE ROOM
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

              <!-- Host Waiting Room Box -->
              <div class="mm-room-box" id="mm-room-waiting-box" style="display: none;">
                <div class="mm-room-code-tag">ROOM CODE</div>
                <div class="mm-room-code-val" id="mm-display-room-code">----</div>
                <div class="mm-room-status">
                  <span class="mm-pulse-dot"></span>
                  <span id="mm-waiting-status-text">Waiting for opponent to connect...</span>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 4px;">
                  <button id="mm-copy-link-btn" class="mm-btn-copy">📋 Copy Invite Link</button>
                  <button id="mm-cancel-host-btn" class="mm-btn-copy" style="background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4);">Cancel</button>
                </div>
              </div>

              <div id="mm-online-status" style="font-size: 11px; min-height: 16px; margin-bottom: 6px; font-weight: 700; color: #59b8eb;"></div>
            </div>

            <!-- PANEL 3: Local 2-Player -->
            <div class="mm-tab-panel ${this.playType === 'local' ? 'active' : ''}" id="mm-panel-local">
              <div class="mm-local-guide-box">
                <div>
                  <span class="mm-player-role-badge badge-p1">PLAYER 1 (BLUE)</span>
                  <div class="mm-role-controls">
                    <div><span class="mm-guide-key">W A S D</span> Fly & Move</div>
                    <div><span class="mm-guide-key">F / Click</span> Fire AK-47</div>
                    <div><span class="mm-guide-key">R</span> Reload</div>
                  </div>
                </div>
                <div>
                  <span class="mm-player-role-badge badge-p2">PLAYER 2 (RED)</span>
                  <div class="mm-role-controls">
                    <div><span class="mm-guide-key">Arrows</span> Fly & Move</div>
                    <div><span class="mm-guide-key">Enter / L</span> Fire AK-47</div>
                    <div><span class="mm-guide-key">Shift</span> Reload</div>
                  </div>
                </div>
              </div>

              <button id="mm-start-local-btn" class="mm-start-btn">
                START 2-PLAYER BATTLE
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </button>
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

            <div class="mm-gameover-stats">
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
            <div class="mm-phone-anim">
              <div class="mm-phone-silhouette">
                <div class="mm-phone-screen-inner"></div>
              </div>
              <div class="mm-rotate-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
              </div>
            </div>
            <span class="mm-modal-badge">MOBILE & TABLET MODE</span>
            <h2 class="mm-rotate-title">ROTATE TO LANDSCAPE</h2>
            <p class="mm-rotate-subtitle">Mini Militia is designed for horizontal play. Please hold your phone or tablet horizontally to start fighting.</p>
            <button id="mm-rotate-btn" class="mm-start-btn">
              PLAY HORIZONTALLY
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="1"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#mm-canvas');
    this.canvasContainer = this.container.querySelector('#mm-canvas-container');
  }

  initEvents() {
    // Navigation Back to Hub
    this.container.querySelector('#mm-back-btn')?.addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    this.container.querySelector('#mm-lobby-btn')?.addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    // Sound toggle
    const soundBtn = this.container.querySelector('#mm-sound-btn');
    soundBtn?.addEventListener('click', () => {
      const muted = soundManager.toggleMute();
      if (muted) {
        this.audio.stopJetpack();
        soundBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
      } else {
        soundBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>';
      }
    });

    // Fullscreen toggle
    this.container.querySelector('#mm-fullscreen-btn')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        this.container.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });

    // Tab Switching: Single Player vs Online 1v1 vs Local 2P
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

    // START LOCAL 2P button
    this.container.querySelector('#mm-start-local-btn')?.addEventListener('click', () => {
      soundManager.playClick();
      this.startMatch('local');
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
        if (statusEl) {
          statusEl.textContent = 'Please enter a valid 4-letter room code!';
          statusEl.style.color = '#ef4444';
        }
      }
    });

    // Online Multiplayer: Copy Invite Link Button
    this.container.querySelector('#mm-copy-link-btn')?.addEventListener('click', () => {
      soundManager.playClick();
      this.copyInviteLink();
    });

    // Online Multiplayer: Cancel Host Button
    this.container.querySelector('#mm-cancel-host-btn')?.addEventListener('click', () => {
      soundManager.playClick();
      this.network.destroy();
      const choiceView = this.container.querySelector('#mm-online-choice-view');
      const waitingBox = this.container.querySelector('#mm-room-waiting-box');
      if (choiceView) choiceView.style.display = 'grid';
      if (waitingBox) waitingBox.style.display = 'none';
      const statusEl = this.container.querySelector('#mm-online-status');
      if (statusEl) statusEl.textContent = '';
    });

    // PLAY AGAIN button
    this.container.querySelector('#mm-playagain-btn')?.addEventListener('click', () => {
      soundManager.playClick();
      if (this.playType === 'online' && this.network.isConnected) {
        this.network.sendMatchEvent('restart');
      }
      this.startMatch(this.playType);
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
    this.network.onConnected = ({ isHost, roomCode }) => {
      this.isOnlineHost = isHost;
      this.roomCode = roomCode;
      this.opponentName = this.network.opponentName || 'Opponent';
      this.opponentPlayer.name = this.opponentName;
      this.showNotification(`⚔️ OPPONENT CONNECTED: ${this.opponentName.toUpperCase()}!`);
      soundManager.playClick();

      const waitingStatus = this.container.querySelector('#mm-waiting-status-text');
      if (waitingStatus) {
        waitingStatus.textContent = 'Opponent connected! Launching duel...';
      }

      setTimeout(() => {
        this.startMatch('online');
      }, 600);
    };

    this.network.onOpponentState = (state) => {
      if (!this.opponentPlayer) return;
      this.opponentPlayer.x = state.x;
      this.opponentPlayer.y = state.y;
      this.opponentPlayer.velocityX = state.vx;
      this.opponentPlayer.velocityY = state.vy;
      this.opponentPlayer.gunAngle = state.gunAngle;
      this.opponentPlayer.isUsingJetpack = state.isUsingJetpack;
      this.opponentPlayer.isCrouching = state.isCrouching;
      this.opponentPlayer.walkFrame = state.walkFrame;
      this.opponentPlayer.health = state.health;
      this.opponentPlayer.isDead = state.isDead;
      this.opponentPlayer.respawnTimer = state.respawnTimer;
      this.opponentPlayer.lastShotTime = state.lastShotTime;

      // Spawn jetpack thruster particles for opponent
      if (state.isUsingJetpack) {
        const cx = state.x + this.opponentPlayer.width / 2;
        const by = state.y + this.opponentPlayer.height;
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

    this.network.onOpponentShoot = (bulletData) => {
      this.audio.playShoot(0.65);
      this.bullets.push({
        id: bulletData.id || Math.random().toString(36).substring(2),
        x: bulletData.x,
        y: bulletData.y,
        angle: bulletData.angle,
        speed: bulletData.speed || 16,
        velocityX: Math.cos(bulletData.angle) * (bulletData.speed || 16),
        velocityY: Math.sin(bulletData.angle) * (bulletData.speed || 16),
        ownerId: 'opponent',
        damage: bulletData.damage || 10,
        createdAt: Date.now(),
        trail: [{ x: bulletData.x, y: bulletData.y }]
      });
    };

    this.network.onOpponentHit = (data) => {
      if (this.opponentPlayer) {
        this.opponentPlayer.health = Math.max(0, this.opponentPlayer.health - (data.damage || 10));
        this.audio.playHit();
      }
    };

    this.network.onMatchEvent = (event, payload) => {
      if (event === 'kill') {
        this.playerScore++;
        this.showNotification(`YOU ELIMINATED ${this.opponentName.toUpperCase()}! (+1)`);
        soundManager.playClick();
      } else if (event === 'restart') {
        this.startMatch('online');
      }
    };

    this.network.onDisconnect = () => {
      this.showNotification('⚠️ OPPONENT DISCONNECTED');
      if (this.gameState === 'playing') {
        setTimeout(() => {
          this.endGame('OPPONENT LEFT THE MATCH');
        }, 1500);
      }
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

  createOnlineRoom() {
    const statusEl = this.container.querySelector('#mm-online-status');
    const choiceView = this.container.querySelector('#mm-online-choice-view');
    const waitingBox = this.container.querySelector('#mm-room-waiting-box');
    const codeDisplay = this.container.querySelector('#mm-display-room-code');

    if (statusEl) {
      statusEl.textContent = 'Initializing secure P2P room...';
      statusEl.style.color = '#59b8eb';
    }

    this.network.createRoom(
      this.playerName,
      (code) => {
        this.roomCode = code;
        if (codeDisplay) codeDisplay.textContent = code;
        if (choiceView) choiceView.style.display = 'none';
        if (waitingBox) waitingBox.style.display = 'flex';
        if (statusEl) {
          statusEl.textContent = 'Room created! Share room code with your opponent.';
          statusEl.style.color = '#22c55e';
        }
      },
      (err) => {
        if (statusEl) {
          statusEl.textContent = `Failed to create room: ${err.message || 'Check connection'}`;
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
        if (statusEl) {
          statusEl.textContent = 'Connected! Joining battle arena...';
          statusEl.style.color = '#22c55e';
        }
      },
      (err) => {
        if (statusEl) {
          statusEl.textContent = `Could not join room ${code.toUpperCase()}. Ensure host has room open.`;
          statusEl.style.color = '#ef4444';
        }
      }
    );
  }

  copyInviteLink() {
    if (!this.roomCode) return;
    const origin = window.location.origin;
    const path = window.location.pathname;
    const inviteUrl = `${origin}${path}#minimilitia?room=${this.roomCode}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        this.showNotification('📋 INVITE LINK COPIED TO CLIPBOARD!');
        const copyBtn = this.container.querySelector('#mm-copy-link-btn');
        if (copyBtn) copyBtn.textContent = '✓ Copied!';
        setTimeout(() => {
          if (copyBtn) copyBtn.textContent = '📋 Copy Invite Link';
        }, 2500);
      }).catch(() => {
        prompt('Copy this invite link:', inviteUrl);
      });
    } else {
      prompt('Copy this invite link:', inviteUrl);
    }
  }

  startMatch(playType = 'single') {
    this.playType = playType;
    this.gameState = 'playing';
    this.playerScore = 0;
    this.opponentScore = 0;
    this.timer = 300; // 5:00 minutes
    this.playerLives = this.maxLives;
    this.bullets = [];
    this.particles = [];

    // Reset Player 1 position & state
    const p1SpawnX = this.playType === 'online' && !this.isOnlineHost ? 1450 : 350;
    const p1SpawnY = this.playType === 'online' && !this.isOnlineHost ? 450 : 500;

    this.player.x = p1SpawnX;
    this.player.y = p1SpawnY;
    this.player.velocityX = 0;
    this.player.velocityY = 0;
    this.player.health = 100;
    this.player.jetpackFuel = 100;
    this.player.ammo = this.player.maxAmmo;
    this.player.isReloading = false;
    this.player.isDead = false;
    this.player.name = this.playerName;
    this.player.spawnProtection = Date.now() + 2500;

    // Reset Opponent / Player 2 State
    const p2SpawnX = this.playType === 'online' && !this.isOnlineHost ? 350 : 1450;
    const p2SpawnY = this.playType === 'online' && !this.isOnlineHost ? 500 : 450;

    this.opponentPlayer.x = p2SpawnX;
    this.opponentPlayer.y = p2SpawnY;
    this.opponentPlayer.velocityX = 0;
    this.opponentPlayer.velocityY = 0;
    this.opponentPlayer.health = 100;
    this.opponentPlayer.jetpackFuel = 100;
    this.opponentPlayer.ammo = 25;
    this.opponentPlayer.isDead = false;
    this.opponentPlayer.isReloading = false;
    this.opponentPlayer.name = this.playType === 'online' ? this.opponentName : 'Player 2';
    this.opponentPlayer.spawnProtection = Date.now() + 2500;

    // Immediately snap camera to player
    const { baseW } = this.getBaseViewport();
    this.cameraX = Math.max(0, Math.min(this.player.x + this.player.width / 2 - baseW / 2, Math.max(0, this.physics.worldWidth - baseW)));
    this.cameraY = 0;
    this.aimX = this.player.x + this.player.width / 2 + 120;
    this.aimY = this.player.y + this.player.height / 2;

    // Reset bots for single player mode
    if (this.playType === 'single') {
      this.bots = [
        new MiniMilitiaBot('bot_alpha', 'Sgt. Viper', 850, 400),
        new MiniMilitiaBot('bot_bravo', 'Col. Hunter', 1450, 450)
      ];
    } else {
      this.bots = [];
    }

    // Hide start & game over modals
    const startOverlay = this.container.querySelector('#mm-start-overlay');
    const gameOverOverlay = this.container.querySelector('#mm-gameover-overlay');
    if (startOverlay) startOverlay.style.display = 'none';
    if (gameOverOverlay) gameOverOverlay.style.display = 'none';

    if (this.playType === 'online') {
      this.showNotification(`⚔️ 1v1 ONLINE DUEL • FIGHT ${this.opponentName.toUpperCase()}!`);
    } else if (this.playType === 'local') {
      this.showNotification('⚔️ LOCAL 2-PLAYER BATTLE • ENGAGE!');
    } else {
      this.showNotification(this.gameMode === 'survival' ? 'SURVIVAL MODE (5 CHANCES) • FIGHT!' : 'TIMED DEATHMATCH • 5:00 ON THE CLOCK!');
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
      leftBase.style.opacity = '0.7';
      this.keys.left = false;
      this.keys.right = false;
      this.keys.up = false;
      this.keys.crouch = false;
    };
    leftZone?.addEventListener('touchend', resetLeft);
    leftZone?.addEventListener('touchcancel', resetLeft);

    // Right Touch Joystick (Aim & Auto-Fire)
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

      // Aim weapon in world space
      this.player.gunAngle = angle;
      const aimDist = 200;
      this.aimX = (this.player.x + this.player.width / 2) + Math.cos(angle) * aimDist;
      this.aimY = (this.player.y + this.player.height / 2) + Math.sin(angle) * aimDist;

      // Auto-fire while aiming with joystick
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
      rightBase.style.opacity = '0.7';
      this.isShooting = false;
    };
    rightZone?.addEventListener('touchend', resetRight);
    rightZone?.addEventListener('touchcancel', resetRight);
  }

  handleKeyDown(e) {
    // Player 1 controls (WASD, R, F)
    if (e.key === 'a' || e.key === 'A') {
      this.keys.left = true;
    }
    if (e.key === 'd' || e.key === 'D') {
      this.keys.right = true;
    }
    if (e.key === 'w' || e.key === 'W' || e.key === ' ') {
      this.keys.up = true;
    }
    if (e.key === 's' || e.key === 'S') {
      this.keys.crouch = true;
    }
    if (e.key === 'r' || e.key === 'R') {
      this.reload();
    }
    if (e.key === 'f' || e.key === 'F') {
      this.isShooting = true;
    }

    // In single player or online, Arrow Keys also move Player 1 if user prefers
    if (this.playType !== 'local') {
      if (e.key === 'ArrowLeft') this.keys.left = true;
      if (e.key === 'ArrowRight') this.keys.right = true;
      if (e.key === 'ArrowUp') this.keys.up = true;
      if (e.key === 'ArrowDown') this.keys.crouch = true;
    } else {
      // In Local 2-Player mode, Arrow Keys strictly control Player 2
      if (e.key === 'ArrowLeft') this.keysP2.left = true;
      if (e.key === 'ArrowRight') this.keysP2.right = true;
      if (e.key === 'ArrowUp') this.keysP2.up = true;
      if (e.key === 'ArrowDown') this.keysP2.crouch = true;
      if (e.key === 'Enter' || e.key === 'l' || e.key === 'L') {
        this.keysP2.shoot = true;
      }
      if (e.key === 'Shift' || e.key === 'p' || e.key === 'P') {
        this.reloadP2();
      }
    }
  }

  handleKeyUp(e) {
    if (e.key === 'a' || e.key === 'A') {
      this.keys.left = false;
    }
    if (e.key === 'd' || e.key === 'D') {
      this.keys.right = false;
    }
    if (e.key === 'w' || e.key === 'W' || e.key === ' ') {
      this.keys.up = false;
    }
    if (e.key === 's' || e.key === 'S') {
      this.keys.crouch = false;
    }
    if (e.key === 'f' || e.key === 'F') {
      this.isShooting = false;
    }

    if (this.playType !== 'local') {
      if (e.key === 'ArrowLeft') this.keys.left = false;
      if (e.key === 'ArrowRight') this.keys.right = false;
      if (e.key === 'ArrowUp') this.keys.up = false;
      if (e.key === 'ArrowDown') this.keys.crouch = false;
    } else {
      if (e.key === 'ArrowLeft') this.keysP2.left = false;
      if (e.key === 'ArrowRight') this.keysP2.right = false;
      if (e.key === 'ArrowUp') this.keysP2.up = false;
      if (e.key === 'ArrowDown') this.keysP2.crouch = false;
      if (e.key === 'Enter' || e.key === 'l' || e.key === 'L') {
        this.keysP2.shoot = false;
      }
    }
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

    // Convert screen coordinates to world coordinates
    this.aimX = canvasMouseX + this.cameraX;
    this.aimY = canvasMouseY + this.cameraY;

    // Calculate gun angle for Player 1
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;
    this.player.gunAngle = Math.atan2(this.aimY - playerCenterY, this.aimX - playerCenterX);
  }

  handleMouseDown(e) {
    if (e.button === 0 && this.gameState === 'playing') {
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

  reloadP2() {
    if (this.opponentPlayer.isReloading || this.opponentPlayer.ammo === this.opponentPlayer.maxAmmo) return;

    this.opponentPlayer.isReloading = true;
    this.opponentPlayer.reloadTimer = Date.now() + 3500;
    this.audio.playReload();
    this.showNotification('PLAYER 2 RELOADING AK-47...');
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
    } catch (e) {}
  }

  checkOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const rotateOverlay = this.container.querySelector('#mm-rotate-overlay');
    if (rotateOverlay) {
      if (isPortrait) {
        rotateOverlay.classList.add('active');
        if (this.audio) this.audio.stopJetpack();
      } else {
        rotateOverlay.classList.remove('active');
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

    // Calculate bullet spawn at gun muzzle
    const centerX = this.player.x + this.player.width / 2;
    const centerY = this.player.y + this.player.height / 2;
    const spread = (Math.random() - 0.5) * 0.08;
    const angle = this.player.gunAngle + spread;
    const gunLength = 34;

    const bulletX = centerX + Math.cos(angle) * gunLength;
    const bulletY = centerY + Math.sin(angle) * gunLength;

    const bullet = {
      id: Math.random().toString(36).substring(2),
      x: bulletX,
      y: bulletY,
      angle: angle,
      speed: 16,
      velocityX: Math.cos(angle) * 16,
      velocityY: Math.sin(angle) * 16,
      ownerId: 'player',
      damage: 10,
      createdAt: now,
      trail: [{ x: bulletX, y: bulletY }]
    };

    this.bullets.push(bullet);

    // Broadcast bullet in online multiplayer
    if (this.playType === 'online' && this.network.isConnected) {
      this.network.sendShoot(bullet);
    }

    if (this.player.ammo === 0) {
      this.reload();
    }
  }

  shootP2() {
    if (this.opponentPlayer.isDead || this.opponentPlayer.isReloading || this.gameState !== 'playing') return;

    if (this.opponentPlayer.ammo <= 0) {
      this.reloadP2();
      return;
    }

    const now = Date.now();
    if (now - this.lastP2ShootAttempt < 110) return;
    this.lastP2ShootAttempt = now;

    this.opponentPlayer.ammo--;
    this.opponentPlayer.lastShotTime = now;
    this.audio.playShoot(0.8);

    const centerX = this.opponentPlayer.x + this.opponentPlayer.width / 2;
    const centerY = this.opponentPlayer.y + this.opponentPlayer.height / 2;
    const spread = (Math.random() - 0.5) * 0.08;
    const angle = this.opponentPlayer.gunAngle + spread;
    const gunLength = 34;

    const bulletX = centerX + Math.cos(angle) * gunLength;
    const bulletY = centerY + Math.sin(angle) * gunLength;

    this.bullets.push({
      id: Math.random().toString(36).substring(2),
      x: bulletX,
      y: bulletY,
      angle: angle,
      speed: 16,
      velocityX: Math.cos(angle) * 16,
      velocityY: Math.sin(angle) * 16,
      ownerId: 'opponent',
      damage: 10,
      createdAt: now,
      trail: [{ x: bulletX, y: bulletY }]
    });

    if (this.opponentPlayer.ammo === 0) {
      this.reloadP2();
    }
  }

  loop() {
    if (!this.isRunning) return;

    const now = Date.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // FPS calculation
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    if (this.gameState === 'playing') {
      // Match Timer countdown
      this.timer = Math.max(0, this.timer - dt);
      if (this.timer <= 0) {
        this.endGame();
      }

      // Update Player 1
      this.updatePlayer(dt, now);

      // Update Player 2 in Local mode
      if (this.playType === 'local') {
        this.updateOpponentPlayerLocal(dt, now);
      }

      // Update Bullets & Environment
      this.updateBullets(now);
      this.updateParticles(dt);

      // Update Bots in Single Player
      if (this.playType === 'single') {
        this.updateBots(now);
      }

      // Update Camera Tracking
      this.updateCamera();
    }

    // Notification clear
    if (this.notification && now > this.notificationTimer) {
      this.notification = null;
    }

    // Render current frame
    this.renderer.render({
      playType: this.playType,
      playerName: this.playerName,
      opponentName: this.playType === 'online' ? this.opponentName : (this.playType === 'local' ? 'Player 2' : 'Bots'),
      roomCode: this.roomCode,
      player: this.player,
      remotePlayers: (this.playType === 'online' || this.playType === 'local') ? [this.opponentPlayer] : [],
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

    // Reload check
    if (this.player.isReloading && now > this.player.reloadTimer) {
      this.player.ammo = this.player.maxAmmo;
      this.player.isReloading = false;
      this.showNotification('AK-47 LOADED (25/25)');
    }

    // Horizontal Movement
    this.player.velocityX = 0;
    if (this.keys.left) this.player.velocityX = -this.player.speed;
    if (this.keys.right) this.player.velocityX = this.player.speed;

    // Jetpack Logic
    if (this.keys.up && this.player.jetpackFuel > 0) {
      this.player.isUsingJetpack = true;
      this.player.velocityY = Math.max(this.player.velocityY - 0.52, -5.4);
      this.player.jetpackFuel = Math.max(0, this.player.jetpackFuel - 0.45);
      this.audio.startJetpack();

      // Emit Jetpack Thruster Particles
      const centerX = this.player.x + this.player.width / 2;
      const bottomY = this.player.y + this.player.height;
      for (let i = 0; i < 2; i++) {
        this.particles.push({
          x: centerX + (Math.random() - 0.5) * 14,
          y: bottomY,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 2.5 + Math.random() * 2.5,
          size: 3 + Math.random() * 3,
          color: Math.random() > 0.4 ? '#ff9900' : '#ffff00',
          life: 0.35,
          maxLife: 0.35
        });
      }
    } else {
      this.player.isUsingJetpack = false;
      this.audio.stopJetpack();
      this.player.velocityY += this.player.gravity;

      // Fuel Regen
      if (this.player.jetpackFuel < 100) {
        this.player.jetpackFuel = Math.min(100, this.player.jetpackFuel + 0.4);
      }
    }

    // Crouching
    this.player.isCrouching = this.keys.crouch;
    this.player.height = this.player.isCrouching ? 50 : 70;

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

    // Ground Level
    const groundLvl = this.physics.getGroundLevel(this.player.x);
    if (this.player.y + this.player.height >= groundLvl) {
      this.player.y = groundLvl - this.player.height;
      this.player.velocityY = 0;
      this.player.onGround = true;
    } else {
      this.player.onGround = false;
    }

    // Walk animation frame update
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

  updateOpponentPlayerLocal(dt, now) {
    const opp = this.opponentPlayer;
    if (opp.isDead) {
      if (now > opp.respawnTimer) {
        this.respawnOpponentLocal();
      }
      return;
    }

    // P2 Shooting
    if (this.keysP2.shoot) {
      this.shootP2();
    }

    // P2 Reload
    if (opp.isReloading && now > opp.reloadTimer) {
      opp.ammo = opp.maxAmmo;
      opp.isReloading = false;
      this.showNotification('PLAYER 2 RELOADED (25/25)');
    }

    // P2 Horizontal Movement
    opp.velocityX = 0;
    if (this.keysP2.left) opp.velocityX = -opp.speed;
    if (this.keysP2.right) opp.velocityX = opp.speed;

    // P2 Aim Angle towards Player 1
    const p1CenterX = this.player.x + this.player.width / 2;
    const p1CenterY = this.player.y + this.player.height / 2;
    const oppCenterX = opp.x + opp.width / 2;
    const oppCenterY = opp.y + opp.height / 2;
    opp.gunAngle = Math.atan2(p1CenterY - oppCenterY, p1CenterX - oppCenterX);

    // P2 Jetpack
    if (this.keysP2.up && opp.jetpackFuel > 0) {
      opp.isUsingJetpack = true;
      opp.velocityY = Math.max(opp.velocityY - 0.52, -5.4);
      opp.jetpackFuel = Math.max(0, opp.jetpackFuel - 0.45);

      const centerX = opp.x + opp.width / 2;
      const bottomY = opp.y + opp.height;
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
      opp.isUsingJetpack = false;
      opp.velocityY += opp.gravity;
      if (opp.jetpackFuel < 100) {
        opp.jetpackFuel = Math.min(100, opp.jetpackFuel + 0.4);
      }
    }

    // P2 Crouch
    opp.isCrouching = this.keysP2.crouch;
    opp.height = opp.isCrouching ? 50 : 70;

    // P2 Collisions
    if (!this.physics.checkCollisionOnX(opp.x, opp.y, opp.width, opp.height, opp.velocityX)) {
      opp.x += opp.velocityX;
    } else {
      opp.velocityX = 0;
    }

    if (!this.physics.checkCollisionOnY(opp.x, opp.y, opp.width, opp.height, opp.velocityY)) {
      opp.y += opp.velocityY;
    } else {
      if (opp.velocityY > 0) opp.onGround = true;
      opp.velocityY = 0;
    }

    const groundLvl = this.physics.getGroundLevel(opp.x);
    if (opp.y + opp.height >= groundLvl) {
      opp.y = groundLvl - opp.height;
      opp.velocityY = 0;
      opp.onGround = true;
    } else {
      opp.onGround = false;
    }

    // P2 Walk Animation
    if (Math.abs(opp.velocityX) > 0.5) {
      opp.walkTimer += 16;
      if (opp.walkTimer > 90) {
        opp.walkTimer = 0;
        opp.walkFrame = (opp.walkFrame + 1) % 4;
      }
    } else {
      opp.walkFrame = 0;
    }
  }

  updateBullets(now) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.velocityX;
      b.y += b.velocityY;

      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 5) b.trail.shift();

      // Environment collision (obstacles and ground)
      if (this.physics.checkBulletCollision(b.x, b.y)) {
        this.spawnImpactSparks(b.x, b.y, '#ffd700');
        this.bullets.splice(i, 1);
        continue;
      }

      // Check hit against Player 1
      if (b.ownerId !== 'player' && !this.player.isDead) {
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

      // Check hit against OpponentPlayer (in Online or Local 2P mode)
      if ((this.playType === 'online' || this.playType === 'local') && b.ownerId !== 'opponent' && !this.opponentPlayer.isDead) {
        if (
          b.x >= this.opponentPlayer.x &&
          b.x <= this.opponentPlayer.x + this.opponentPlayer.width &&
          b.y >= this.opponentPlayer.y &&
          b.y <= this.opponentPlayer.y + this.opponentPlayer.height
        ) {
          this.spawnImpactSparks(b.x, b.y, '#ef4444');
          this.audio.playHit();

          if (this.playType === 'local') {
            this.takeOpponentDamageLocal(b.damage);
          }
          this.bullets.splice(i, 1);
          continue;
        }
      }

      // Check hit against bots (in Single Player mode)
      if (this.playType === 'single') {
        let hitBot = false;
        for (const bot of this.bots) {
          if (b.ownerId !== bot.id && !bot.isDead) {
            if (
              b.x >= bot.x &&
              b.x <= bot.x + bot.width &&
              b.y >= bot.y &&
              b.y <= bot.y + bot.height
            ) {
              this.spawnImpactSparks(b.x, b.y, '#ff4444');
              bot.takeDamage(b.damage);
              this.audio.playHit();

              if (bot.isDead) {
                this.playerScore++;
                this.showNotification(`ELIMINATED ${bot.name.toUpperCase()}! (+1)`);
                if (this.playerScore > this.highScore) {
                  this.highScore = this.playerScore;
                  localStorage.setItem('minimilitia_high_score', this.highScore);
                }
              }

              this.bullets.splice(i, 1);
              hitBot = true;
              break;
            }
          }
        }
        if (hitBot) continue;
      }

      // Lifetime timeout (4 seconds)
      if (now - b.createdAt > 4000) {
        this.bullets.splice(i, 1);
      }
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

  updateBots(now) {
    for (const bot of this.bots) {
      bot.update(this.physics, this.player, now, (bulletData) => {
        this.audio.playShoot(0.35); // Distant gunshot sound
        this.bullets.push({
          id: Math.random().toString(36).substring(2),
          x: bulletData.x,
          y: bulletData.y,
          angle: bulletData.angle,
          speed: 15,
          velocityX: Math.cos(bulletData.angle) * 15,
          velocityY: Math.sin(bulletData.angle) * 15,
          ownerId: bulletData.ownerId,
          damage: bulletData.damage,
          createdAt: now,
          trail: [{ x: bulletData.x, y: bulletData.y }]
        });
      });
    }
  }

  updateCamera() {
    const { baseW } = this.getBaseViewport();

    if (this.playType === 'local') {
      // In Local 2P, camera smoothly frames midpoint between both players
      const midX = (this.player.x + this.opponentPlayer.x) / 2;
      const targetCamX = midX - baseW / 2;
      this.cameraX += (targetCamX - this.cameraX) * 0.12;
    } else {
      // In Single Player & Online, camera centers on local player
      const targetCamX = this.player.x + this.player.width / 2 - baseW / 2;
      this.cameraX += (targetCamX - this.cameraX) * 0.12;
    }

    // Clamp within world bounds
    this.cameraX = Math.max(0, Math.min(this.cameraX, Math.max(0, this.physics.worldWidth - baseW)));
    this.cameraY = 0;
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
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.4
      });
    }
  }

  takePlayerDamage(damage, attacker) {
    if (this.player.isDead) return;
    if (this.player.spawnProtection && Date.now() < this.player.spawnProtection) return;

    this.player.health = Math.max(0, this.player.health - damage);
    this.audio.playHit();

    // Inform opponent in online match
    if (this.playType === 'online' && this.network.isConnected) {
      this.network.sendHit(damage, 'player');
    }

    if (this.player.health <= 0) {
      this.player.isDead = true;
      this.opponentScore++;
      this.audio.playExplosion();

      // Tell opponent in online match
      if (this.playType === 'online' && this.network.isConnected) {
        this.network.sendMatchEvent('kill', {
          killer: this.opponentName,
          victim: this.playerName
        });
      }

      // Check survival mode lives/chances
      if (this.playType === 'single' && this.gameMode === 'survival') {
        this.playerLives--;
        if (this.playerLives <= 0) {
          this.endGame('OUT OF LIVES! MISSION FAILED');
          return;
        }
      }

      this.player.respawnTimer = Date.now() + 3000;
      const killerName = (this.playType === 'online' || this.playType === 'local') ? this.opponentName : 'ENEMY';
      this.showNotification(`ELIMINATED BY ${killerName.toUpperCase()}! RESPAWNING...`);

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

  takeOpponentDamageLocal(damage) {
    const opp = this.opponentPlayer;
    if (opp.isDead) return;
    if (opp.spawnProtection && Date.now() < opp.spawnProtection) return;

    opp.health = Math.max(0, opp.health - damage);
    this.audio.playHit();

    if (opp.health <= 0) {
      opp.isDead = true;
      this.playerScore++;
      this.audio.playExplosion();
      opp.respawnTimer = Date.now() + 3000;
      this.showNotification(`PLAYER 1 ELIMINATED PLAYER 2! (+1)`);

      const centerX = opp.x + opp.width / 2;
      const centerY = opp.y + opp.height / 2;
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
    const spawn = this.physics.getSafeSpawn();
    this.player.x = spawn.x;
    this.player.y = spawn.y;
    this.player.velocityX = 0;
    this.player.velocityY = 0;
    this.player.health = 100;
    this.player.jetpackFuel = 100;
    this.player.ammo = this.player.maxAmmo;
    this.player.isReloading = false;
    this.player.isDead = false;
    this.player.spawnProtection = Date.now() + 2000; // 2s spawn invulnerability aura

    // Snap camera directly to player
    const { baseW } = this.getBaseViewport();
    this.cameraX = Math.max(0, Math.min(this.player.x + this.player.width / 2 - baseW / 2, Math.max(0, this.physics.worldWidth - baseW)));
    this.aimX = this.player.x + this.player.width / 2 + 100;
    this.aimY = this.player.y + this.player.height / 2;

    this.showNotification('RESPAWNED & PROTECTED!');
  }

  respawnOpponentLocal() {
    const spawn = this.physics.getSafeSpawn();
    this.opponentPlayer.x = spawn.x;
    this.opponentPlayer.y = spawn.y;
    this.opponentPlayer.velocityX = 0;
    this.opponentPlayer.velocityY = 0;
    this.opponentPlayer.health = 100;
    this.opponentPlayer.jetpackFuel = 100;
    this.opponentPlayer.ammo = 25;
    this.opponentPlayer.isReloading = false;
    this.opponentPlayer.isDead = false;
    this.opponentPlayer.spawnProtection = Date.now() + 2000;

    this.showNotification('PLAYER 2 RESPAWNED!');
  }

  endGame(customReason) {
    this.gameState = 'gameover';
    this.audio.stopJetpack();

    const titleEl = this.container.querySelector('#mm-gameover-title');
    const descEl = this.container.querySelector('#mm-gameover-desc');
    const playerStatEl = this.container.querySelector('#mm-stat-player');
    const enemyStatEl = this.container.querySelector('#mm-stat-enemy');
    const p1LabelEl = this.container.querySelector('#mm-stat-lbl-p1');
    const p2LabelEl = this.container.querySelector('#mm-stat-lbl-p2');
    const overlayEl = this.container.querySelector('#mm-gameover-overlay');

    if (p1LabelEl) p1LabelEl.textContent = (this.playType === 'local' ? 'PLAYER 1' : 'YOUR KILLS');
    if (p2LabelEl) p2LabelEl.textContent = (this.playType === 'local' ? 'PLAYER 2' : (this.playType === 'online' ? this.opponentName.toUpperCase() : 'ENEMY KILLS'));

    if (customReason) {
      if (titleEl) titleEl.textContent = 'MATCH OVER';
      if (descEl) descEl.textContent = customReason;
    } else if (this.playerScore > this.opponentScore) {
      if (titleEl) titleEl.textContent = '🏆 VICTORY!';
      if (descEl) descEl.textContent = `${this.player.name || 'Blue Soldier'} has dominated the battlefield!`;
    } else if (this.playerScore < this.opponentScore) {
      if (titleEl) titleEl.textContent = '💀 DEFEAT!';
      if (descEl) descEl.textContent = `${this.opponentPlayer.name || 'Red Soldier'} took victory!`;
    } else {
      if (titleEl) titleEl.textContent = '🤝 STALEMATE!';
      if (descEl) descEl.textContent = 'Both combatants tied in glory.';
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
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.removeEventListener('change', this.onOrientationChange);
    }
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
  }
}
