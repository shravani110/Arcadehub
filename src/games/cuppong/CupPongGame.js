// CupPongGame.js - 3D Cup Pong (Beer Pong) Arcade Game
// Full 3D simulation with Three.js, realistic swipe-to-throw physics, table bounces,
// plastic rim collisions, cup sink detection, Bot AI with difficulty slider, and 2-Player Pass & Play.
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { CupPongAudio } from './CupPongAudio.js';
import { soundManager } from '../../sound/SoundManager.js';

export class CupPongGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    // Subsystems
    this.audio = new CupPongAudio();
    this.isMuted = soundManager.isMuted();

    // Game Config & State
    this.gameMode = '1p'; // '1p' (vs Bot) or '2p' (Pass & Play)
    this.difficulty = 'medium'; // 'easy', 'medium', 'hard'
    this.state = 'setup'; // 'setup', 'playing', 'victory'
    this.turn = 'player'; // 'player' (Blue) or 'bot' (Red) / Player 2

    // Scores (Cups Sunk / Eliminated: 0 to 10)
    this.blueScore = 0; // Blue sunk red cups
    this.redScore = 0;  // Red sunk blue cups
    this.totalCups = 10;

    // Physics Ball State
    this.ball = null;
    this.ballState = 'idle'; // 'idle', 'aiming', 'flying', 'sunk', 'missed'
    this.ballPos = new THREE.Vector3();
    this.ballVel = new THREE.Vector3();
    this.gravity = -26.0;

    // Cup Racks
    this.redCups = [];  // Opponent cups at far side (+Z)
    this.blueCups = []; // Player cups at near side (-Z)

    // Touch / Swipe Aim State
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0, time: 0 };
    this.dragCurrent = { x: 0, y: 0 };

    // Camera Mode
    this.cameraMode = 'aim'; // 'aim' (behind ball) or 'table' (overview)

    // Lifecycle
    this.animId = null;
    this.lastTime = performance.now();

    this.initDOM();
    this.initThree();
    this.initTable();
    this.initCups();
    this.initBall();
    this.initEvents();

    this.audio.init();
    this.audio.setMuted(this.isMuted);

    this.animId = requestAnimationFrame(this.loop.bind(this));
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="cuppong-wrapper select-none">
        <!-- 3D Canvas Layer -->
        <div id="cuppong-canvas-container" class="cuppong-canvas-container"></div>

        <!-- Trajectory / Aim Overlay SVG -->
        <svg id="aim-guide-svg" class="aim-guide-overlay"></svg>

        <!-- ================= SCREEN 1: Setup & Difficulty Menu ================= -->
        <div class="cuppong-menu-screen" id="cuppong-menu">
          <!-- Top Bar -->
          <div class="menu-header-bar">
            <button class="menu-back-btn" id="btn-menu-back" title="Back to Arcade Lobby">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <h1 class="menu-title">CUP PONG</h1>
            <div class="menu-header-spacer"></div>
          </div>

          <!-- Instructions Card -->
          <div class="menu-instructions">
            <p>Swipe up to throw balls into cups!<br>Land in the cup to remove it. First to clear all your cups wins!</p>
          </div>

          <!-- Central Difficulty Adjuster -->
          <div class="menu-center-card">
            <!-- Animated Avatar Emoji Badge -->
            <div class="avatar-badge" id="avatar-badge">😏</div>

            <!-- Difficulty Label -->
            <span class="difficulty-label" id="difficulty-label">MEDIUM</span>

            <!-- Difficulty Track & Thumb -->
            <div class="difficulty-slider-track" id="difficulty-track">
              <div class="difficulty-fill" id="difficulty-fill" style="width: 66%; background: #f59e0b;"></div>
              <div class="difficulty-thumb" id="difficulty-thumb" style="left: 95px;"></div>
              <div class="difficulty-options">
                <button class="diff-step-btn" data-diff="easy">EASY</button>
                <button class="diff-step-btn active" data-diff="medium">MEDIUM</button>
                <button class="diff-step-btn" data-diff="hard">HARD</button>
              </div>
            </div>
            <span class="slider-hint">Drag or tap to adjust difficulty</span>

            <!-- Mode Selector (1P vs 2P) -->
            <div class="mode-toggle-group">
              <button class="mode-btn active" id="btn-mode-1p">VS BOT 🤖</button>
              <button class="mode-btn" id="btn-mode-2p">2 PLAYERS 👥</button>
            </div>
          </div>

          <!-- Bottom Play Button -->
          <div class="menu-bottom-actions">
            <button class="btn-menu-play" id="btn-menu-play">PLAY</button>
            <button class="btn-menu-help" id="btn-menu-sound" title="Toggle Sound">
              ${this.isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>

        <!-- ================= SCREEN 2: In-Game HUD Overlay ================= -->
        <div class="cuppong-hud-layer" id="cuppong-hud" style="display: none;">
          <!-- Top-Left: Opponent / Bot Score Capsule -->
          <div class="score-capsule opponent-score" id="hud-opponent-score" title="Cups Sunk by Blue">
            0
          </div>

          <!-- Bottom-Right: Player Score Capsule -->
          <div class="score-capsule player-score" id="hud-player-score" title="Cups Sunk by Red">
            0
          </div>

          <!-- Right: Circular Exit / Pause Button -->
          <button class="btn-cuppong-exit" id="btn-cuppong-pause" title="Exit / Pause">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          <!-- Top-Right: Camera Toggle Button -->
          <button class="btn-cuppong-cam" id="btn-cuppong-cam" title="Toggle Camera View">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
          </button>

          <!-- Turn Announcement Banner -->
          <div class="cuppong-turn-banner player-turn" id="turn-banner">
            YOUR TURN • SWIPE UP TO THROW
          </div>

          <!-- Hint Pill -->
          <div class="aim-hint-pill" id="aim-hint-pill">
            <span>👆 Swipe up to throw</span>
          </div>
        </div>

        <!-- ================= SCREEN 3: Victory / Game Over ================= -->
        <div class="cuppong-victory-screen hidden" id="cuppong-victory">
          <!-- Top Split (Blue) -->
          <div class="victory-split-top" id="victory-top">
            <div class="medal-circle medal-gold" id="medal-top">
              1
              <div class="medal-ribbon"><span></span><span></span></div>
            </div>
            <div class="victory-headline" id="victory-headline-top" style="display: none;">BLUE WINS!</div>
          </div>

          <!-- Bottom Split (Red) -->
          <div class="victory-split-bottom" id="victory-bottom">
            <div class="medal-circle medal-silver" id="medal-bottom">
              2
              <div class="medal-ribbon"><span></span><span></span></div>
            </div>
            <div class="victory-headline" id="victory-headline-bottom">RED WINS!</div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="victory-actions-bar">
            <button class="btn-victory-play" id="btn-victory-restart">PLAY AGAIN 🏓</button>
            <button class="btn-victory-lobby" id="btn-victory-lobby">LOBBY</button>
          </div>
        </div>

        <!-- ================= Pause / Confirmation Modal ================= -->
        <div class="cuppong-modal-overlay hidden" id="cuppong-pause-modal">
          <div class="modal-box">
            <h2 class="modal-title">PAUSED</h2>
            <p class="modal-text">First to sink all 10 cups wins the match!</p>
            <div class="modal-btns">
              <button class="btn-modal-action btn-modal-resume" id="btn-pause-resume">Resume Game</button>
              <button class="btn-modal-action btn-modal-restart" id="btn-pause-restart">Restart Match</button>
              <button class="btn-modal-action btn-modal-exit" id="btn-pause-exit">Exit to Lobby</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvasContainer = this.container.querySelector('#cuppong-canvas-container');
    this.aimSvg = this.container.querySelector('#aim-guide-svg');
    this.menuScreen = this.container.querySelector('#cuppong-menu');
    this.hudLayer = this.container.querySelector('#cuppong-hud');
    this.victoryScreen = this.container.querySelector('#cuppong-victory');
    this.pauseModal = this.container.querySelector('#cuppong-pause-modal');

    this.hudOpponentScore = this.container.querySelector('#hud-opponent-score');
    this.hudPlayerScore = this.container.querySelector('#hud-player-score');
    this.turnBanner = this.container.querySelector('#turn-banner');
    this.aimHintPill = this.container.querySelector('#aim-hint-pill');

    this.avatarBadge = this.container.querySelector('#avatar-badge');
    this.difficultyLabel = this.container.querySelector('#difficulty-label');
    this.difficultyFill = this.container.querySelector('#difficulty-fill');
    this.difficultyThumb = this.container.querySelector('#difficulty-thumb');
  }

  initThree() {
    const width = this.canvasContainer.clientWidth || window.innerWidth;
    const height = this.canvasContainer.clientHeight || window.innerHeight;

    // 1. Scene with Warm Room Lighting
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#38bdf8'); // Sky cyan or red room tone

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    this.camera.position.set(0, 4.4, -7.5);
    this.camTargetPos = new THREE.Vector3(0, 4.4, -7.5);
    this.camLookTarget = new THREE.Vector3(0, 0.6, 3.5);

    // 3. Renderer with locked DPR for smooth 60 FPS
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.canvasContainer.appendChild(this.renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.85);
    this.scene.add(ambientLight);

    this.mainLight = new THREE.DirectionalLight('#ffffff', 1.4);
    this.mainLight.position.set(5, 12, -4);
    this.mainLight.castShadow = true;
    this.mainLight.shadow.mapSize.width = 1024;
    this.mainLight.shadow.mapSize.height = 1024;
    this.mainLight.shadow.camera.left = -6;
    this.mainLight.shadow.camera.right = 6;
    this.mainLight.shadow.camera.top = 10;
    this.mainLight.shadow.camera.bottom = -10;
    this.mainLight.shadow.bias = -0.0005;
    this.scene.add(this.mainLight);
  }

  initTable() {
    this.tableGroup = new THREE.Group();

    // Table Dimensions
    const tableW = 4.8;
    const tableL = 14.0;
    const tableThick = 0.35;

    // 1. Table Top Surface (Tournament Green Laminate)
    const tableMat = new THREE.MeshStandardMaterial({
      color: '#0e8c4e', // Ping pong table green
      roughness: 0.35,
      metalness: 0.1,
    });
    const tableMesh = new THREE.Mesh(
      new THREE.BoxGeometry(tableW, tableThick, tableL),
      tableMat
    );
    tableMesh.position.set(0, -tableThick / 2, 0);
    tableMesh.receiveShadow = true;
    tableMesh.castShadow = true;
    this.tableGroup.add(tableMesh);

    // 2. White Perimeter Lines & Center Line
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });

    // Center Line
    const centerLine = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, tableL),
      whiteLineMat
    );
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, 0.005, 0);
    this.tableGroup.add(centerLine);

    // Outer Edge White Lines
    [-tableW / 2 + 0.05, tableW / 2 - 0.05].forEach((x) => {
      const edgeLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.08, tableL),
        whiteLineMat
      );
      edgeLine.rotation.x = -Math.PI / 2;
      edgeLine.position.set(x, 0.005, 0);
      this.tableGroup.add(edgeLine);
    });

    [-tableL / 2 + 0.05, tableL / 2 - 0.05].forEach((z) => {
      const endLine = new THREE.Mesh(
        new THREE.PlaneGeometry(tableW, 0.08),
        whiteLineMat
      );
      endLine.rotation.x = -Math.PI / 2;
      endLine.position.set(0, 0.005, z);
      this.tableGroup.add(endLine);
    });

    // 3. Table Legs
    const legMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.8, roughness: 0.3 });
    const legHeight = 3.6;
    const legX = tableW / 2 - 0.4;
    const legZ = tableL / 2 - 0.6;

    [
      [-legX, -legZ],
      [legX, -legZ],
      [-legX, legZ],
      [legX, legZ],
    ].forEach(([x, z]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, legHeight, 16),
        legMat
      );
      leg.position.set(x, -legHeight / 2 - tableThick, z);
      leg.castShadow = true;
      this.tableGroup.add(leg);
    });

    // 4. Floor Surface (Warm Wooden / Terracotta Aesthetic matching Screenshot 3 & 4)
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#d4976c', // Warm floor tone
      roughness: 0.8,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(45, 45),
      floorMat
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -legHeight - tableThick, 0);
    floor.receiveShadow = true;
    this.tableGroup.add(floor);

    this.scene.add(this.tableGroup);
  }

  createSoloCup(colorHex, isRed) {
    const cupGroup = new THREE.Group();

    // Solo Cup Dimensions: Height 0.85m, Top radius 0.36m, Base radius 0.26m
    const topRadius = 0.36;
    const baseRadius = 0.26;
    const cupHeight = 0.85;

    // 1. Exterior Colored Plastic Material
    const exteriorMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.25,
      metalness: 0.15,
    });

    // 2. Interior White Plastic Lining Material
    const interiorMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.4,
      metalness: 0.05,
    });

    // Outer Shell
    const outerCup = new THREE.Mesh(
      new THREE.CylinderGeometry(topRadius, baseRadius, cupHeight, 26, 1, true),
      exteriorMat
    );
    outerCup.position.set(0, cupHeight / 2, 0);
    outerCup.castShadow = true;
    outerCup.receiveShadow = true;
    cupGroup.add(outerCup);

    // Inner Shell (White interior)
    const innerCup = new THREE.Mesh(
      new THREE.CylinderGeometry(topRadius - 0.015, baseRadius - 0.015, cupHeight - 0.02, 26, 1, true),
      interiorMat
    );
    innerCup.position.set(0, cupHeight / 2 + 0.01, 0);
    cupGroup.add(innerCup);

    // Cup Bottom Disc
    const bottomDisc = new THREE.Mesh(
      new THREE.CircleGeometry(baseRadius - 0.01, 24),
      interiorMat
    );
    bottomDisc.rotation.x = -Math.PI / 2;
    bottomDisc.position.set(0, 0.02, 0);
    cupGroup.add(bottomDisc);

    // Liquid Surface inside Cup (Clear or Amber Water)
    const waterMat = new THREE.MeshStandardMaterial({
      color: isRed ? '#e2e8f0' : '#e2e8f0',
      roughness: 0.1,
      metalness: 0.8,
    });
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(baseRadius + 0.04, 24),
      waterMat
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, cupHeight * 0.45, 0);
    cupGroup.add(water);

    // Top Rim Lip (Torus Ring)
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(topRadius, 0.022, 10, 26),
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, cupHeight, 0);
    cupGroup.add(rim);

    return {
      group: cupGroup,
      topRadius,
      height: cupHeight,
      isSunk: false,
      isRed,
    };
  }

  initCups() {
    // Clear any existing cups
    this.redCups.forEach((c) => this.scene.remove(c.group));
    this.blueCups.forEach((c) => this.scene.remove(c.group));
    this.redCups = [];
    this.blueCups = [];

    // Standard 10-Cup Triangle Formation (1-2-3-4 rows)
    const cupSpacing = 0.74; // Center to center spacing
    const rowSpacing = 0.64;

    // 1. Red Cups (Opponent / Far side at +Z)
    // Pointing towards table center:
    // Row 1 (1 cup): closest to center
    // Row 4 (4 cups): furthest back
    const redBaseZ = 4.4;
    const redRows = [
      [0],                           // Row 1: 1 cup
      [-0.5, 0.5],                   // Row 2: 2 cups
      [-1.0, 0, 1.0],                // Row 3: 3 cups
      [-1.5, -0.5, 0.5, 1.5],        // Row 4: 4 cups
    ];

    redRows.forEach((row, rowIdx) => {
      const z = redBaseZ + rowIdx * rowSpacing;
      row.forEach((xFrac) => {
        const x = xFrac * cupSpacing;
        const cup = this.createSoloCup('#ef4444', true);
        cup.group.position.set(x, 0, z);
        cup.targetX = x;
        cup.targetZ = z;
        this.scene.add(cup.group);
        this.redCups.push(cup);
      });
    });

    // 2. Blue Cups (Player / Near side at -Z)
    // Pointing towards table center:
    // Row 1 (1 cup): closest to center
    // Row 4 (4 cups): furthest back
    const blueBaseZ = -4.4;
    const blueRows = [
      [0],                           // Row 1: 1 cup
      [-0.5, 0.5],                   // Row 2: 2 cups
      [-1.0, 0, 1.0],                // Row 3: 3 cups
      [-1.5, -0.5, 0.5, 1.5],        // Row 4: 4 cups
    ];

    blueRows.forEach((row, rowIdx) => {
      const z = blueBaseZ - rowIdx * rowSpacing;
      row.forEach((xFrac) => {
        const x = xFrac * cupSpacing;
        const cup = this.createSoloCup('#0284c7', false);
        cup.group.position.set(x, 0, z);
        cup.targetX = x;
        cup.targetZ = z;
        this.scene.add(cup.group);
        this.blueCups.push(cup);
      });
    });
  }

  initBall() {
    this.ballRadius = 0.14;
    const ballGeo = new THREE.SphereGeometry(this.ballRadius, 26, 26);
    const ballMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.35,
      metalness: 0.05,
    });

    this.ball = new THREE.Mesh(ballGeo, ballMat);
    this.ball.castShadow = true;
    this.scene.add(this.ball);

    // Ball Contact Shadow (Smooth oval shadow on table)
    const shadowMat = new THREE.MeshBasicMaterial({
      color: '#000000',
      transparent: true,
      opacity: 0.35,
    });
    this.ballShadow = new THREE.Mesh(
      new THREE.CircleGeometry(this.ballRadius * 1.1, 16),
      shadowMat
    );
    this.ballShadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.ballShadow);

    this.resetBallPosition();
  }

  resetBallPosition() {
    this.ballState = 'idle';
    this.ballVel.set(0, 0, 0);

    if (this.turn === 'player') {
      // Player sits at near side (-Z), throws towards +Z
      this.ballPos.set(0, this.ballRadius, -3.2);
    } else {
      // Bot / Player 2 sits at far side (+Z), throws towards -Z
      this.ballPos.set(0, this.ballRadius, 3.2);
    }

    this.ball.position.copy(this.ballPos);
    this.ballShadow.position.set(this.ballPos.x, 0.005, this.ballPos.z);
    this.ballShadow.scale.set(1, 1, 1);
  }

  initEvents() {
    // 1. Menu Screen UI Buttons
    this.container.querySelector('#btn-menu-back').addEventListener('click', () => {
      this.destroy();
      this.onExit();
    });

    this.container.querySelector('#btn-menu-sound').addEventListener('click', () => {
      this.isMuted = !this.isMuted;
      this.audio.setMuted(this.isMuted);
      this.container.querySelector('#btn-menu-sound').textContent = this.isMuted ? '🔇' : '🔊';
    });

    // Difficulty Step Buttons
    const diffButtons = this.container.querySelectorAll('.diff-step-btn');
    diffButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.setDifficulty(btn.dataset.diff);
      });
    });

    // Mode Toggle (1P vs 2P)
    this.container.querySelector('#btn-mode-1p').addEventListener('click', () => {
      this.gameMode = '1p';
      this.container.querySelector('#btn-mode-1p').classList.add('active');
      this.container.querySelector('#btn-mode-2p').classList.remove('active');
    });

    this.container.querySelector('#btn-mode-2p').addEventListener('click', () => {
      this.gameMode = '2p';
      this.container.querySelector('#btn-mode-2p').classList.add('active');
      this.container.querySelector('#btn-mode-1p').classList.remove('active');
    });

    // Menu Play Button
    this.container.querySelector('#btn-menu-play').addEventListener('click', () => {
      this.audio.playClick();
      this.startMatch();
    });

    // 2. In-Game HUD Controls
    this.container.querySelector('#btn-cuppong-pause').addEventListener('click', () => {
      this.audio.playClick();
      this.pauseModal.classList.remove('hidden');
    });

    this.container.querySelector('#btn-cuppong-cam').addEventListener('click', () => {
      this.cameraMode = this.cameraMode === 'aim' ? 'table' : 'aim';
    });

    // 3. Pause Modal Buttons
    this.container.querySelector('#btn-pause-resume').addEventListener('click', () => {
      this.pauseModal.classList.add('hidden');
    });

    this.container.querySelector('#btn-pause-restart').addEventListener('click', () => {
      this.pauseModal.classList.add('hidden');
      this.startMatch();
    });

    this.container.querySelector('#btn-pause-exit').addEventListener('click', () => {
      this.destroy();
      this.onExit();
    });

    // 4. Victory Screen Buttons
    this.container.querySelector('#btn-victory-restart').addEventListener('click', () => {
      this.startMatch();
    });

    this.container.querySelector('#btn-victory-lobby').addEventListener('click', () => {
      this.destroy();
      this.onExit();
    });

    // 5. Swipe to Throw Ball Touch / Pointer Gestures
    this.handlePointerDown = (e) => {
      if (this.state !== 'playing' || this.ballState !== 'idle') return;
      if (this.turn === 'bot' && this.gameMode === '1p') return;

      this.audio.resume();
      this.isDragging = true;
      this.dragStart.x = e.clientX;
      this.dragStart.y = e.clientY;
      this.dragStart.time = performance.now();
      this.dragCurrent.x = e.clientX;
      this.dragCurrent.y = e.clientY;
    };

    this.handlePointerMove = (e) => {
      if (!this.isDragging) return;
      this.dragCurrent.x = e.clientX;
      this.dragCurrent.y = e.clientY;
      this.drawAimGuide();
    };

    this.handlePointerUp = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.clearAimGuide();

      const deltaX = this.dragCurrent.x - this.dragStart.x;
      const deltaY = this.dragStart.y - this.dragCurrent.y; // Upwards is positive
      const elapsed = Math.max(0.04, (performance.now() - this.dragStart.time) / 1000);

      // Require a minimum upward flick distance of 28px
      if (deltaY > 28) {
        this.executePlayerThrow(deltaX, deltaY, elapsed);
      }
    };

    this.canvasContainer.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);

    // Window Resize
    this.handleResize = () => {
      if (!this.renderer || !this.camera || !this.canvasContainer) return;
      const w = this.canvasContainer.clientWidth || window.innerWidth;
      const h = this.canvasContainer.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', this.handleResize);
  }

  setDifficulty(diff) {
    this.difficulty = diff;
    const diffButtons = this.container.querySelectorAll('.diff-step-btn');
    diffButtons.forEach((b) => b.classList.toggle('active', b.dataset.diff === diff));

    if (diff === 'easy') {
      this.avatarBadge.textContent = '😊';
      this.avatarBadge.style.borderColor = '#10b981';
      this.difficultyLabel.textContent = 'EASY';
      this.difficultyLabel.style.color = '#10b981';
      this.difficultyFill.style.width = '33%';
      this.difficultyFill.style.background = '#10b981';
      this.difficultyThumb.style.left = '10px';
    } else if (diff === 'medium') {
      this.avatarBadge.textContent = '😏';
      this.avatarBadge.style.borderColor = '#f59e0b';
      this.difficultyLabel.textContent = 'MEDIUM';
      this.difficultyLabel.style.color = '#f59e0b';
      this.difficultyFill.style.width = '66%';
      this.difficultyFill.style.background = '#f59e0b';
      this.difficultyThumb.style.left = '95px';
    } else {
      this.avatarBadge.textContent = '😈';
      this.avatarBadge.style.borderColor = '#ef4444';
      this.difficultyLabel.textContent = 'HARD';
      this.difficultyLabel.style.color = '#ef4444';
      this.difficultyFill.style.width = '100%';
      this.difficultyFill.style.background = '#ef4444';
      this.difficultyThumb.style.left = '180px';
    }
  }

  startMatch() {
    this.state = 'playing';
    this.turn = 'player';
    this.blueScore = 0;
    this.redScore = 0;
    this.cameraMode = 'aim';

    this.menuScreen.classList.add('hidden');
    this.victoryScreen.classList.add('hidden');
    this.pauseModal.classList.add('hidden');
    this.hudLayer.style.display = 'block';

    this.hudOpponentScore.textContent = '0';
    this.hudPlayerScore.textContent = '0';

    this.initCups();
    this.resetBallPosition();
    this.updateTurnUI();
  }

  updateTurnUI() {
    if (this.turn === 'player') {
      this.turnBanner.className = 'cuppong-turn-banner player-turn';
      this.turnBanner.textContent = this.gameMode === '2p' ? 'PLAYER 1 (BLUE) • SWIPE UP' : 'YOUR TURN • SWIPE UP TO THROW';
      this.aimHintPill.style.display = 'flex';
      this.scene.background.set('#38bdf8');
    } else {
      this.turnBanner.className = 'cuppong-turn-banner bot-turn';
      this.turnBanner.textContent = this.gameMode === '2p' ? 'PLAYER 2 (RED) • SWIPE UP' : "BOT'S TURN";
      this.aimHintPill.style.display = 'none';
      this.scene.background.set('#ef4444');

      if (this.gameMode === '1p') {
        // Schedule Bot AI throw after realistic delay
        setTimeout(() => {
          if (this.state === 'playing' && this.turn === 'bot') {
            this.executeBotThrow();
          }
        }, 1100);
      }
    }
  }

  drawAimGuide() {
    const dx = this.dragCurrent.x - this.dragStart.x;
    const dy = this.dragStart.y - this.dragCurrent.y;
    if (dy < 10) {
      this.clearAimGuide();
      return;
    }

    const powerRatio = Math.min(dy / 250, 1.2);
    const angleRatio = dx / 150;

    // Draw glowing dashed trajectory line on SVG
    const startX = this.dragStart.x;
    const startY = this.dragStart.y;
    const endX = startX + angleRatio * 120;
    const endY = startY - powerRatio * 180;
    const midX = (startX + endX) / 2 + angleRatio * 30;
    const midY = endY - 40;

    this.aimSvg.innerHTML = `
      <defs>
        <linearGradient id="aimGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.95"/>
        </linearGradient>
      </defs>
      <path d="M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}"
            fill="none" stroke="url(#aimGrad)" stroke-width="6" stroke-linecap="round" stroke-dasharray="8,6"/>
      <circle cx="${endX}" cy="${endY}" r="10" fill="#38bdf8" opacity="0.9"/>
      <circle cx="${endX}" cy="${endY}" r="18" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.6"/>
    `;
  }

  clearAimGuide() {
    this.aimSvg.innerHTML = '';
  }

  executePlayerThrow(dragX, dragY, elapsed) {
    this.ballState = 'flying';
    this.audio.playThrow();

    // Invert trajectory if Player 2 is throwing from +Z towards -Z
    const dirZ = (this.turn === 'player') ? 1.0 : -1.0;

    // Swipe power tuning
    const power = Math.min(Math.max(dragY / 130, 0.7), 1.45);
    const speedRatio = Math.min(dragY / (elapsed * 450), 1.5);
    const combinedPower = (power * 0.65 + speedRatio * 0.35);

    // Calculated 3D Velocity
    const forwardSpeed = (15.5 + combinedPower * 4.2) * dirZ;
    const upwardSpeed = 8.5 + combinedPower * 3.4;
    const lateralSpeed = (dragX / 140) * 4.2 * dirZ;

    this.ballVel.set(lateralSpeed, upwardSpeed, forwardSpeed);
  }

  executeBotThrow() {
    if (this.state !== 'playing' || this.ballState !== 'idle') return;

    this.ballState = 'flying';
    this.audio.playThrow();

    // Select random active Blue cup as target
    const activeCups = this.blueCups.filter((c) => !c.isSunk);
    if (activeCups.length === 0) return;

    const targetCup = activeCups[Math.floor(Math.random() * activeCups.length)];
    const startPos = this.ballPos;

    // Calculate required parabolic trajectory to hit target cup
    const dx = targetCup.targetX - startPos.x;
    const dz = targetCup.targetZ - startPos.z; // negative (throwing towards -Z)
    const flightTime = 0.95; // seconds

    // Add error noise according to chosen difficulty
    let errorX = 0;
    let errorZ = 0;
    if (this.difficulty === 'easy') {
      // 40% hit rate, large spray
      errorX = (Math.random() - 0.5) * 0.95;
      errorZ = (Math.random() - 0.5) * 1.4;
    } else if (this.difficulty === 'medium') {
      // 65% hit rate, moderate spray
      errorX = (Math.random() - 0.5) * 0.38;
      errorZ = (Math.random() - 0.5) * 0.55;
    } else {
      // 85% hit rate, deadly accurate
      errorX = (Math.random() - 0.5) * 0.12;
      errorZ = (Math.random() - 0.5) * 0.15;
    }

    const vx = (dx + errorX) / flightTime;
    const vz = (dz + errorZ) / flightTime;
    // Parabolic height required: Y = Y0 + Vy*t + 0.5*g*t^2 = CupHeight
    const targetY = 0.85;
    const vy = (targetY - startPos.y - 0.5 * this.gravity * flightTime * flightTime) / flightTime;

    this.ballVel.set(vx, vy, vz);
  }

  handleCupSink(cup) {
    this.ballState = 'sunk';
    cup.isSunk = true;

    this.audio.playCupSink();
    this.audio.playScoreChime();

    // Confetti and celebratory floating toast
    if (this.turn === 'player') {
      this.blueScore++;
      this.hudOpponentScore.textContent = this.blueScore;
      confetti({ particleCount: 45, spread: 55, origin: { y: 0.4 } });
      this.showToast('+1 CUP SUNK! 🎯');
    } else {
      this.redScore++;
      this.hudPlayerScore.textContent = this.redScore;
      this.showToast('BOT SCORED! 💥');
    }

    // Animate cup sinking into table
    const origY = cup.group.position.y;
    let elapsed = 0;
    const sinkAnim = () => {
      elapsed += 0.04;
      cup.group.position.y = origY - elapsed * 1.5;
      cup.group.scale.multiplyScalar(0.96);
      if (elapsed < 0.6) {
        requestAnimationFrame(sinkAnim);
      } else {
        cup.group.visible = false;
      }
    };
    sinkAnim();

    // Check Match Win Condition
    if (this.blueScore >= this.totalCups) {
      setTimeout(() => this.triggerVictory('BLUE'), 900);
      return;
    }
    if (this.redScore >= this.totalCups) {
      setTimeout(() => this.triggerVictory('RED'), 900);
      return;
    }

    // Switch turn after celebration
    setTimeout(() => {
      this.switchTurn();
    }, 1400);
  }

  showToast(text) {
    const toast = document.createElement('div');
    toast.className = 'cup-sunk-toast';
    toast.textContent = text;
    this.container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 1200);
  }

  switchTurn() {
    this.turn = (this.turn === 'player') ? 'bot' : 'player';
    this.resetBallPosition();
    this.updateTurnUI();
  }

  triggerVictory(winnerColor) {
    this.state = 'victory';
    this.audio.playVictory();

    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });

    const headlineTop = this.container.querySelector('#victory-headline-top');
    const headlineBottom = this.container.querySelector('#victory-headline-bottom');
    const medalTop = this.container.querySelector('#medal-top');
    const medalBottom = this.container.querySelector('#medal-bottom');

    if (winnerColor === 'BLUE') {
      headlineTop.style.display = 'block';
      headlineTop.textContent = 'BLUE WINS!';
      headlineBottom.style.display = 'none';

      medalTop.className = 'medal-circle medal-gold';
      medalTop.innerHTML = '1<div class="medal-ribbon"><span></span><span></span></div>';
      medalBottom.className = 'medal-circle medal-silver';
      medalBottom.innerHTML = '2<div class="medal-ribbon"><span></span><span></span></div>';
    } else {
      headlineTop.style.display = 'none';
      headlineBottom.style.display = 'block';
      headlineBottom.textContent = 'RED WINS!';

      medalBottom.className = 'medal-circle medal-gold';
      medalBottom.innerHTML = '1<div class="medal-ribbon"><span></span><span></span></div>';
      medalTop.className = 'medal-circle medal-silver';
      medalTop.innerHTML = '2<div class="medal-ribbon"><span></span><span></span></div>';
    }

    this.victoryScreen.classList.remove('hidden');
    this.hudLayer.style.display = 'none';
  }

  updatePhysics(dt) {
    if (this.ballState !== 'flying') return;

    // Apply gravity
    this.ballVel.y += this.gravity * dt;

    // Update position
    this.ballPos.x += this.ballVel.x * dt;
    this.ballPos.y += this.ballVel.y * dt;
    this.ballPos.z += this.ballVel.z * dt;

    // Update Ball Shadow on Table
    const shadowY = Math.max(0.005, 0.005);
    const heightAboveTable = Math.max(0, this.ballPos.y - this.ballRadius);
    const shadowScale = Math.max(0.3, 1.0 - heightAboveTable * 0.15);
    this.ballShadow.position.set(this.ballPos.x, shadowY, this.ballPos.z);
    this.ballShadow.scale.set(shadowScale, shadowScale, shadowScale);

    // 1. Check Collision with Table (Table bounds: X in [-2.4, 2.4], Z in [-7, 7], Y = 0)
    if (
      this.ballPos.y <= this.ballRadius &&
      Math.abs(this.ballPos.x) <= 2.4 &&
      Math.abs(this.ballPos.z) <= 7.0 &&
      this.ballVel.y < 0
    ) {
      this.ballPos.y = this.ballRadius;
      this.ballVel.y = -this.ballVel.y * 0.65; // Elastic table restitution
      this.ballVel.x *= 0.88;
      this.ballVel.z *= 0.88;
      this.audio.playTableBounce(Math.abs(this.ballVel.y));
    }

    // 2. Check Collision with Target Cups
    // If Player's turn, target is Red Cups (+Z). If Bot's turn, target is Blue Cups (-Z).
    const targetRacks = (this.turn === 'player') ? this.redCups : this.blueCups;

    for (let i = 0; i < targetRacks.length; i++) {
      const cup = targetRacks[i];
      if (cup.isSunk) continue;

      const dx = this.ballPos.x - cup.targetX;
      const dz = this.ballPos.z - cup.targetZ;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Check Cup Top Opening Sink:
      // Ball enters top opening (Y between cup top and lip, moving downwards)
      if (dist < 0.28 && this.ballPos.y <= cup.height + 0.1 && this.ballPos.y >= cup.height * 0.35 && this.ballVel.y < 0) {
        this.handleCupSink(cup);
        return;
      }

      // Check Cup Rim Clink Collision (Rim radius ~ 0.36m):
      if (dist < 0.42 && dist >= 0.28 && Math.abs(this.ballPos.y - cup.height) < 0.18) {
        // Deflect off rim
        const nx = dx / (dist || 1);
        const nz = dz / (dist || 1);
        this.ballVel.x = nx * 3.5;
        this.ballVel.z = nz * 3.5;
        this.ballVel.y = Math.abs(this.ballVel.y) * 0.5;
        this.audio.playRimBounce();
      }
    }

    // 3. Ball Fell Below Table / Out of Bounds
    if (this.ballPos.y < -3.5 || Math.abs(this.ballPos.z) > 11.0 || Math.abs(this.ballPos.x) > 5.0) {
      this.ballState = 'missed';
      setTimeout(() => {
        if (this.state === 'playing') {
          this.switchTurn();
        }
      }, 750);
    }

    this.ball.position.copy(this.ballPos);
  }

  updateCamera(dt) {
    if (this.cameraMode === 'table') {
      // Wide Overview Camera (Showing full ping pong table)
      this.camTargetPos.set(0, 9.8, -9.5);
      this.camLookTarget.set(0, 0.4, 0.5);
    } else {
      // Dynamic Aim / Action Follow Camera
      if (this.turn === 'player') {
        if (this.ballState === 'flying') {
          // Follow ball slightly
          this.camTargetPos.set(
            this.ballPos.x * 0.4,
            Math.max(3.6, this.ballPos.y + 2.0),
            Math.min(2.0, this.ballPos.z - 4.5)
          );
          this.camLookTarget.set(this.ballPos.x * 0.5, 0.6, this.ballPos.z + 4.5);
        } else {
          // Framed neatly behind the player's shooting ball looking across at red cups
          this.camTargetPos.set(0, 4.4, -7.5);
          this.camLookTarget.set(0, 0.6, 3.5);
        }
      } else {
        // Bot's Turn (Far side looking at Blue cups)
        if (this.ballState === 'flying') {
          this.camTargetPos.set(
            this.ballPos.x * 0.4,
            Math.max(3.6, this.ballPos.y + 2.0),
            Math.max(-2.0, this.ballPos.z + 4.5)
          );
          this.camLookTarget.set(this.ballPos.x * 0.5, 0.6, this.ballPos.z - 4.5);
        } else {
          this.camTargetPos.set(0, 4.4, 7.5);
          this.camLookTarget.set(0, 0.6, -3.5);
        }
      }
    }

    const smoothFactor = 1.0 - Math.pow(0.001, dt);
    this.camera.position.lerp(this.camTargetPos, smoothFactor);
    this.camera.lookAt(this.camLookTarget);
  }

  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.033);
    this.lastTime = timestamp;

    this.updatePhysics(dt);
    this.updateCamera(dt);

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    this.animId = requestAnimationFrame(this.loop.bind(this));
  }

  destroy() {
    this.state = 'destroyed';
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
    window.removeEventListener('resize', this.handleResize);

    this.audio.destroy();

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }

    this.container.innerHTML = '';
  }
}
