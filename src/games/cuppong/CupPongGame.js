// CupPongGame.js - Master 3D Mobile Cup Pong Arcade Game
// Features 1-Player (vs Bot), 2-Player, and 3-Player modes, authentic 3D Solo cups with
// ribbed rings and rim wobble physics, clear mobile ball framing, and one-shot swipe hint.
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { CupPongAudio } from './CupPongAudio.js';
import { soundManager } from '../../sound/SoundManager.js';

export class CupPongGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    // Audio Subsystem
    this.audio = new CupPongAudio();
    this.isMuted = soundManager.isMuted();

    // Game Config & Modes ('1p', '2p', '3p')
    this.gameMode = '1p'; // '1p' (vs Bot), '2p', or '3p'
    this.difficulty = 'medium'; // 'easy', 'medium', 'hard'
    this.state = 'setup'; // 'setup', 'playing', 'victory'

    // Turn Tracking:
    // In '1p': 'p1' (Blue) -> 'bot' (Red)
    // In '2p': 'p1' (Blue) -> 'p2' (Red)
    // In '3p': 'p1' (Blue) -> 'p2' (Red) -> 'p3' (Green)
    this.currentTurn = 'p1';
    this.turnOrder = ['p1', 'bot'];

    // Scores
    this.p1Score = 0; // Blue
    this.p2Score = 0; // Red / Bot
    this.p3Score = 0; // Green (for 3-Player mode)
    this.totalCups = 10;

    // Reminder pill flag (shown ONLY at start)
    this.hasDismissedHint = false;
    this.hintTimer = null;

    // Physics Ball State
    this.ball = null;
    this.ballState = 'idle'; // 'idle', 'aiming', 'flying', 'sunk', 'missed'
    this.ballPos = new THREE.Vector3();
    this.ballVel = new THREE.Vector3();
    this.gravity = -26.0;

    // Cup Arrays
    this.activeCups = [];
    this.waterParticles = [];

    // Touch & Swipe Controls
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0, time: 0 };
    this.dragCurrent = { x: 0, y: 0 };

    // Camera Configuration
    this.cameraMode = 'aim'; // 'aim' or 'table'
    this.camTargetPos = new THREE.Vector3();
    this.camLookTarget = new THREE.Vector3();

    // Clock
    this.animId = null;
    this.lastTime = performance.now();

    this.initDOM();
    this.initThree();
    this.initTable();
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
            <button class="menu-back-btn" id="btn-menu-back" title="Back to Lobby">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <h1 class="menu-title">CUP PONG</h1>
            <div class="menu-header-spacer"></div>
          </div>

          <!-- Instructions Card -->
          <div class="menu-instructions">
            <p>Swipe up to throw balls into cups!<br>Land in the cup to remove it. First to clear all cups wins!</p>
          </div>

          <!-- Central Difficulty & Mode Adjuster -->
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

            <!-- Mode Selector (1P vs 2P vs 3P) -->
            <div class="mode-toggle-group">
              <button class="mode-btn active" id="btn-mode-1p">1 PLAYER 🤖</button>
              <button class="mode-btn" id="btn-mode-2p">2 PLAYERS 👥</button>
              <button class="mode-btn" id="btn-mode-3p">3 PLAYERS 🏆</button>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="menu-bottom-actions">
            <button class="btn-menu-play" id="btn-menu-play">PLAY</button>
            <button class="btn-menu-help" id="btn-menu-sound" title="Toggle Sound">
              ${this.isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>

        <!-- ================= SCREEN 2: In-Game HUD Overlay ================= -->
        <div class="cuppong-hud-layer" id="cuppong-hud" style="display: none;">
          <!-- 1P & 2P Score Capsules -->
          <div class="score-capsule opponent-score" id="hud-opponent-score" title="Cups Sunk by Player 1">
            0
          </div>
          <div class="score-capsule player-score" id="hud-player-score" title="Cups Sunk by Opponent">
            0
          </div>

          <!-- 3-Player Scoreboard (Shown only in 3-Player Mode) -->
          <div class="three-player-scoreboard" id="hud-3p-board" style="display: none;">
            <div class="p-score-pill p1 active-turn" id="pill-p1">P1: <span id="val-p1">0</span></div>
            <div class="p-score-pill p2" id="pill-p2">P2: <span id="val-p2">0</span></div>
            <div class="p-score-pill p3" id="pill-p3">P3: <span id="val-p3">0</span></div>
          </div>

          <!-- Exit / Pause Button (Circular X) -->
          <button class="btn-cuppong-exit" id="btn-cuppong-pause" title="Pause / Exit">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          <!-- Turn Announcement Banner -->
          <div class="cuppong-turn-banner p1-turn" id="turn-banner">
            PLAYER 1 (BLUE) • SWIPE UP
          </div>

          <!-- Reminder Hint Pill (Shown ONLY at match start) -->
          <div class="aim-hint-pill" id="aim-hint-pill">
            <span>👆 Swipe up to throw</span>
          </div>
        </div>

        <!-- ================= SCREEN 3: Victory Screen ================= -->
        <div class="cuppong-victory-screen hidden" id="cuppong-victory">
          <!-- Split Background Sections -->
          <div class="victory-split-top" id="victory-top">
            <div class="medal-circle medal-gold" id="medal-top">
              1
              <div class="medal-ribbon"><span></span><span></span></div>
            </div>
            <div class="victory-headline" id="victory-headline-top">PLAYER 1 WINS!</div>
          </div>

          <div class="victory-split-mid" id="victory-mid" style="display: none;">
            <div class="medal-circle medal-silver" id="medal-mid">
              2
              <div class="medal-ribbon"><span></span><span></span></div>
            </div>
            <div class="victory-headline" id="victory-headline-mid">PLAYER 2</div>
          </div>

          <div class="victory-split-bottom" id="victory-bottom">
            <div class="medal-circle medal-silver" id="medal-bottom">
              2
              <div class="medal-ribbon"><span></span><span></span></div>
            </div>
            <div class="victory-headline" id="victory-headline-bottom">PLAYER 2</div>
          </div>

          <!-- Action Buttons -->
          <div class="victory-actions-bar">
            <button class="btn-victory-play" id="btn-victory-restart">PLAY AGAIN 🏓</button>
            <button class="btn-victory-lobby" id="btn-victory-lobby">LOBBY</button>
          </div>
        </div>

        <!-- ================= Pause Modal ================= -->
        <div class="cuppong-modal-overlay hidden" id="cuppong-pause-modal">
          <div class="modal-box">
            <h2 class="modal-title">PAUSED</h2>
            <p class="modal-text">First to clear all target cups wins the match!</p>
            <div class="modal-btns">
              <button class="btn-modal-action btn-modal-resume" id="btn-pause-resume">Resume Match</button>
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
    this.hud3pBoard = this.container.querySelector('#hud-3p-board');
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

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#38bdf8'); // Sky Cyan

    // Adaptive Camera: Mobile Portrait uses wider FOV 62 for clear ball and cup framing
    const isMobile = width < height;
    const fov = isMobile ? 62 : 48;
    this.camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100);

    // Initial Camera Positioning tuned for mobile
    this.camera.position.set(0, 2.9, -5.6);
    this.camTargetPos.set(0, 2.9, -5.6);
    this.camLookTarget.set(0, 0.45, 2.2);
    this.camera.lookAt(this.camLookTarget);

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
    this.renderer.toneMappingExposure = 1.2;

    this.canvasContainer.appendChild(this.renderer.domElement);

    // Warm Stadium & Room Lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.9);
    this.scene.add(ambientLight);

    this.mainLight = new THREE.DirectionalLight('#ffffff', 1.5);
    this.mainLight.position.set(4, 12, -2);
    this.mainLight.castShadow = true;
    this.mainLight.shadow.mapSize.width = 1024;
    this.mainLight.shadow.mapSize.height = 1024;
    this.mainLight.shadow.camera.left = -5;
    this.mainLight.shadow.camera.right = 5;
    this.mainLight.shadow.camera.top = 9;
    this.mainLight.shadow.camera.bottom = -9;
    this.mainLight.shadow.bias = -0.0005;
    this.scene.add(this.mainLight);
  }

  initTable() {
    this.tableGroup = new THREE.Group();

    const tableW = 4.6;
    const tableL = 13.5;
    const tableThick = 0.32;

    // Green Tournament Laminate Top Surface
    const tableMat = new THREE.MeshStandardMaterial({
      color: '#0e8c4e',
      roughness: 0.3,
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

    // White Center Divider Line & Perimeter Lines
    const lineMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });

    const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.08, tableL), lineMat);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, 0.005, 0);
    this.tableGroup.add(centerLine);

    [-tableW / 2 + 0.05, tableW / 2 - 0.05].forEach((x) => {
      const edgeLine = new THREE.Mesh(new THREE.PlaneGeometry(0.08, tableL), lineMat);
      edgeLine.rotation.x = -Math.PI / 2;
      edgeLine.position.set(x, 0.005, 0);
      this.tableGroup.add(edgeLine);
    });

    [-tableL / 2 + 0.05, tableL / 2 - 0.05].forEach((z) => {
      const endLine = new THREE.Mesh(new THREE.PlaneGeometry(tableW, 0.08), lineMat);
      endLine.rotation.x = -Math.PI / 2;
      endLine.position.set(0, 0.005, z);
      this.tableGroup.add(endLine);
    });

    // Metallic Table Legs
    const legMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.85, roughness: 0.2 });
    const legHeight = 3.6;
    const legX = tableW / 2 - 0.35;
    const legZ = tableL / 2 - 0.55;

    [
      [-legX, -legZ],
      [legX, -legZ],
      [-legX, legZ],
      [legX, legZ],
    ].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, legHeight, 16), legMat);
      leg.position.set(x, -legHeight / 2 - tableThick, z);
      this.tableGroup.add(leg);
    });

    // Warm Terracotta Floor
    const floorMat = new THREE.MeshStandardMaterial({ color: '#d4976c', roughness: 0.85 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -legHeight - tableThick, 0);
    floor.receiveShadow = true;
    this.tableGroup.add(floor);

    this.scene.add(this.tableGroup);
  }

  /**
   * Creates a high-fidelity 3D Solo Cup with realistic segmented horizontal ridges,
   * glossy exterior plastic, white interior lining, and dynamic wobble physics.
   */
  createSoloCup(colorHex, isRed) {
    const cupGroup = new THREE.Group();

    const topRadius = 0.36;
    const baseRadius = 0.26;
    const cupHeight = 0.85;

    // Exterior Glossy Plastic Material
    const exteriorMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.22,
      metalness: 0.18,
    });

    // Interior White Plastic Lining
    const interiorMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.35,
      metalness: 0.05,
    });

    // 1. Lower Cone Section
    const lowerGeo = new THREE.CylinderGeometry(baseRadius + 0.03, baseRadius, 0.32, 24, 1, true);
    const lowerMesh = new THREE.Mesh(lowerGeo, exteriorMat);
    lowerMesh.position.set(0, 0.16, 0);
    lowerMesh.castShadow = true;
    cupGroup.add(lowerMesh);

    // 2. Ribbed Mid Grip Rings (Classic 3 Solo Cup Indented Horizontal Bands)
    const ringMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35, metalness: 0.1 });
    [0.34, 0.44, 0.54].forEach((yRing) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(baseRadius + 0.045, 0.014, 8, 24), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, yRing, 0);
      cupGroup.add(ring);
    });

    // 3. Upper Flared Cone Section
    const upperGeo = new THREE.CylinderGeometry(topRadius, baseRadius + 0.04, 0.53, 24, 1, true);
    const upperMesh = new THREE.Mesh(upperGeo, exteriorMat);
    upperMesh.position.set(0, 0.585, 0);
    upperMesh.castShadow = true;
    cupGroup.add(upperMesh);

    // 4. White Interior Shell
    const innerGeo = new THREE.CylinderGeometry(topRadius - 0.015, baseRadius - 0.015, cupHeight - 0.02, 24, 1, true);
    const innerMesh = new THREE.Mesh(innerGeo, interiorMat);
    innerMesh.position.set(0, cupHeight / 2 + 0.01, 0);
    cupGroup.add(innerMesh);

    // 5. Cup Bottom Disc
    const bottomDisc = new THREE.Mesh(new THREE.CircleGeometry(baseRadius - 0.01, 20), interiorMat);
    bottomDisc.rotation.x = -Math.PI / 2;
    bottomDisc.position.set(0, 0.02, 0);
    cupGroup.add(bottomDisc);

    // 6. Water Liquid Surface
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(baseRadius + 0.035, 20),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.1, metalness: 0.7 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, cupHeight * 0.42, 0);
    cupGroup.add(water);

    // 7. Rolled Lip Rim Ring
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(topRadius, 0.022, 10, 26),
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.25 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, cupHeight, 0);
    cupGroup.add(rim);

    return {
      group: cupGroup,
      topRadius,
      height: cupHeight,
      isSunk: false,
      colorHex,
      // Spring wobble physics parameters
      wobbleX: 0,
      wobbleZ: 0,
      wobbleVelX: 0,
      wobbleVelZ: 0,
    };
  }

  initCups() {
    this.activeCups.forEach((c) => this.scene.remove(c.group));
    this.activeCups = [];

    const cupSpacing = 0.74;
    const rowSpacing = 0.64;

    if (this.gameMode === '3p') {
      // 3-Player Tournament Cup Layout:
      // 10 Central Target Cups in pyramid formation at +Z (Z from 4.0 to 6.2)
      const redBaseZ = 4.2;
      const rows = [
        [0],
        [-0.5, 0.5],
        [-1.0, 0, 1.0],
        [-1.5, -0.5, 0.5, 1.5],
      ];

      const cupColors = ['#ef4444', '#0284c7', '#059669']; // Tri-color cups

      rows.forEach((row, rowIdx) => {
        const z = redBaseZ + rowIdx * rowSpacing;
        row.forEach((xFrac, cIdx) => {
          const x = xFrac * cupSpacing;
          const color = cupColors[(rowIdx + cIdx) % cupColors.length];
          const cup = this.createSoloCup(color, color === '#ef4444');
          cup.group.position.set(x, 0, z);
          cup.targetX = x;
          cup.targetZ = z;
          this.scene.add(cup.group);
          this.activeCups.push(cup);
        });
      });
    } else {
      // Standard 1P / 2P: 10 Target Cups at Far Side (+Z)
      const redBaseZ = 4.2;
      const rows = [
        [0],
        [-0.5, 0.5],
        [-1.0, 0, 1.0],
        [-1.5, -0.5, 0.5, 1.5],
      ];

      rows.forEach((row, rowIdx) => {
        const z = redBaseZ + rowIdx * rowSpacing;
        row.forEach((xFrac) => {
          const x = xFrac * cupSpacing;
          const cup = this.createSoloCup('#ef4444', true);
          cup.group.position.set(x, 0, z);
          cup.targetX = x;
          cup.targetZ = z;
          this.scene.add(cup.group);
          this.activeCups.push(cup);
        });
      });
    }
  }

  initBall() {
    this.ballRadius = 0.15; // Prominent, clearly visible ping pong ball

    const ballGeo = new THREE.SphereGeometry(this.ballRadius, 28, 28);
    const ballMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.3,
      metalness: 0.05,
    });

    this.ball = new THREE.Mesh(ballGeo, ballMat);
    this.ball.castShadow = true;
    this.scene.add(this.ball);

    // Ball Soft Contact Shadow on Table
    const shadowMat = new THREE.MeshBasicMaterial({
      color: '#000000',
      transparent: true,
      opacity: 0.35,
    });
    this.ballShadow = new THREE.Mesh(new THREE.CircleGeometry(this.ballRadius * 1.15, 18), shadowMat);
    this.ballShadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.ballShadow);

    // Glowing Touch Ring Indicator around Ball (Pulses on mobile when idle)
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.45,
    });
    this.ballRing = new THREE.Mesh(new THREE.RingGeometry(this.ballRadius * 1.5, this.ballRadius * 1.85, 24), ringMat);
    this.ballRing.rotation.x = -Math.PI / 2;
    this.scene.add(this.ballRing);

    this.resetBallPosition();
  }

  resetBallPosition() {
    this.ballState = 'idle';
    this.ballVel.set(0, 0, 0);

    // Positioned at Z = -2.2, which puts it at ~15% from the screen bottom on mobile!
    this.ballPos.set(0, this.ballRadius, -2.2);

    this.ball.position.copy(this.ballPos);
    this.ballShadow.position.set(this.ballPos.x, 0.005, this.ballPos.z);
    this.ballShadow.scale.set(1, 1, 1);
    this.ballRing.position.set(this.ballPos.x, 0.006, this.ballPos.z);
    this.ballRing.visible = true;
  }

  initEvents() {
    // 1. Menu Buttons
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
      btn.addEventListener('click', () => {
        this.setDifficulty(btn.dataset.diff);
      });
    });

    // Mode Buttons (1P, 2P, 3P)
    const setMode = (mode) => {
      this.gameMode = mode;
      ['1p', '2p', '3p'].forEach((m) => {
        this.container.querySelector(`#btn-mode-${m}`).classList.toggle('active', m === mode);
      });
    };

    this.container.querySelector('#btn-mode-1p').addEventListener('click', () => setMode('1p'));
    this.container.querySelector('#btn-mode-2p').addEventListener('click', () => setMode('2p'));
    this.container.querySelector('#btn-mode-3p').addEventListener('click', () => setMode('3p'));

    // Menu Play Button
    this.container.querySelector('#btn-menu-play').addEventListener('click', () => {
      this.audio.playClick();
      this.startMatch();
    });

    // 2. HUD Pause Button
    this.container.querySelector('#btn-cuppong-pause').addEventListener('click', () => {
      this.audio.playClick();
      this.pauseModal.classList.remove('hidden');
    });

    // 3. Pause Modal Actions
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

    // 4. Victory Buttons
    this.container.querySelector('#btn-victory-restart').addEventListener('click', () => {
      this.startMatch();
    });

    this.container.querySelector('#btn-victory-lobby').addEventListener('click', () => {
      this.destroy();
      this.onExit();
    });

    // 5. Mobile Touch & Swipe Gestures
    this.handlePointerDown = (e) => {
      if (this.state !== 'playing' || this.ballState !== 'idle') return;
      if (this.currentTurn === 'bot' && this.gameMode === '1p') return;

      // Dismiss reminder pill on first touch
      this.dismissHintPill();

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
      const deltaY = this.dragStart.y - this.dragCurrent.y; // Upward swipe is positive
      const elapsed = Math.max(0.04, (performance.now() - this.dragStart.time) / 1000);

      // Require a minimum upward swipe of 24px
      if (deltaY > 24) {
        this.executeThrow(deltaX, deltaY, elapsed);
      }
    };

    this.canvasContainer.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    window.addEventListener('pointermove', this.handlePointerMove, { passive: false });
    window.addEventListener('pointerup', this.handlePointerUp, { passive: false });
    window.addEventListener('pointercancel', this.handlePointerUp, { passive: false });

    // Responsive Canvas Resize
    this.handleResize = () => {
      if (!this.renderer || !this.camera || !this.canvasContainer) return;
      const w = this.canvasContainer.clientWidth || window.innerWidth;
      const h = this.canvasContainer.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.fov = (w < h) ? 62 : 48; // Wider vertical FOV on tall mobile portrait
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
    this.currentTurn = 'p1';
    this.p1Score = 0;
    this.p2Score = 0;
    this.p3Score = 0;
    this.hasDismissedHint = false;

    // Turn order setup
    if (this.gameMode === '1p') {
      this.turnOrder = ['p1', 'bot'];
    } else if (this.gameMode === '2p') {
      this.turnOrder = ['p1', 'p2'];
    } else {
      this.turnOrder = ['p1', 'p2', 'p3'];
    }

    this.menuScreen.classList.add('hidden');
    this.victoryScreen.classList.add('hidden');
    this.pauseModal.classList.add('hidden');
    this.hudLayer.style.display = 'block';

    // Toggle Scoreboards (2-Player capsules vs 3-Player header board)
    if (this.gameMode === '3p') {
      this.hudOpponentScore.style.display = 'none';
      this.hudPlayerScore.style.display = 'none';
      this.hud3pBoard.style.display = 'flex';
      this.container.querySelector('#val-p1').textContent = '0';
      this.container.querySelector('#val-p2').textContent = '0';
      this.container.querySelector('#val-p3').textContent = '0';
    } else {
      this.hudOpponentScore.style.display = 'flex';
      this.hudPlayerScore.style.display = 'flex';
      this.hud3pBoard.style.display = 'none';
      this.hudOpponentScore.textContent = '0';
      this.hudPlayerScore.textContent = '0';
    }

    this.initCups();
    this.resetBallPosition();
    this.updateTurnUI();

    // Show swipe reminder ONLY at start, auto-fading after 2.5 seconds
    this.aimHintPill.style.display = 'flex';
    this.aimHintPill.classList.remove('fade-out');
    if (this.hintTimer) clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => {
      this.dismissHintPill();
    }, 2500);
  }

  dismissHintPill() {
    if (this.hasDismissedHint) return;
    this.hasDismissedHint = true;
    if (this.aimHintPill) {
      this.aimHintPill.classList.add('fade-out');
      setTimeout(() => {
        if (this.aimHintPill) this.aimHintPill.style.display = 'none';
      }, 400);
    }
  }

  updateTurnUI() {
    const banner = this.turnBanner;
    banner.className = 'cuppong-turn-banner';

    if (this.gameMode === '3p') {
      ['p1', 'p2', 'p3'].forEach((p) => {
        this.container.querySelector(`#pill-${p}`).classList.toggle('active-turn', this.currentTurn === p);
      });

      if (this.currentTurn === 'p1') {
        banner.classList.add('p1-turn');
        banner.textContent = 'PLAYER 1 (BLUE) • SWIPE UP';
        this.scene.background.set('#38bdf8');
      } else if (this.currentTurn === 'p2') {
        banner.classList.add('p2-turn');
        banner.textContent = 'PLAYER 2 (RED) • SWIPE UP';
        this.scene.background.set('#ef4444');
      } else {
        banner.classList.add('p3-turn');
        banner.textContent = 'PLAYER 3 (GREEN) • SWIPE UP';
        this.scene.background.set('#10b981');
      }
    } else {
      if (this.currentTurn === 'p1') {
        banner.classList.add('p1-turn');
        banner.textContent = this.gameMode === '2p' ? 'PLAYER 1 (BLUE) • SWIPE UP' : 'YOUR TURN • SWIPE UP TO THROW';
        this.scene.background.set('#38bdf8');
      } else {
        banner.classList.add('p2-turn');
        banner.textContent = this.gameMode === '2p' ? 'PLAYER 2 (RED) • SWIPE UP' : "BOT'S TURN";
        this.scene.background.set('#ef4444');

        if (this.gameMode === '1p') {
          setTimeout(() => {
            if (this.state === 'playing' && this.currentTurn === 'bot') {
              this.executeBotThrow();
            }
          }, 1100);
        }
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

    const powerRatio = Math.min(dy / 240, 1.3);
    const angleRatio = dx / 140;

    const startX = this.dragStart.x;
    const startY = this.dragStart.y;
    const endX = startX + angleRatio * 110;
    const endY = startY - powerRatio * 170;
    const midX = (startX + endX) / 2 + angleRatio * 25;
    const midY = endY - 35;

    this.aimSvg.innerHTML = `
      <defs>
        <linearGradient id="aimGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.95"/>
        </linearGradient>
      </defs>
      <path d="M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}"
            fill="none" stroke="url(#aimGrad)" stroke-width="6" stroke-linecap="round" stroke-dasharray="8,6"/>
      <circle cx="${endX}" cy="${endY}" r="9" fill="#38bdf8" opacity="0.9"/>
      <circle cx="${endX}" cy="${endY}" r="16" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.5"/>
    `;
  }

  clearAimGuide() {
    this.aimSvg.innerHTML = '';
  }

  executeThrow(dragX, dragY, elapsed) {
    this.ballState = 'flying';
    this.ballRing.visible = false;
    this.audio.playThrow();

    const power = Math.min(Math.max(dragY / 125, 0.72), 1.4);
    const speedRatio = Math.min(dragY / (elapsed * 450), 1.5);
    const combinedPower = power * 0.65 + speedRatio * 0.35;

    // Mobile calibrated velocity (throws forward from Z = -2.2 towards cups at Z = +4.5 to +6.5)
    const forwardSpeed = 15.2 + combinedPower * 4.4;
    const upwardSpeed = 8.2 + combinedPower * 3.2;
    const lateralSpeed = (dragX / 130) * 3.8;

    this.ballVel.set(lateralSpeed, upwardSpeed, forwardSpeed);
  }

  executeBotThrow() {
    if (this.state !== 'playing' || this.ballState !== 'idle') return;

    this.ballState = 'flying';
    this.ballRing.visible = false;
    this.audio.playThrow();

    const active = this.activeCups.filter((c) => !c.isSunk);
    if (active.length === 0) return;

    const targetCup = active[Math.floor(Math.random() * active.length)];
    const startPos = this.ballPos;

    const dx = targetCup.targetX - startPos.x;
    const dz = targetCup.targetZ - startPos.z;
    const flightTime = 0.95;

    let errorX = 0;
    let errorZ = 0;
    if (this.difficulty === 'easy') {
      errorX = (Math.random() - 0.5) * 0.9;
      errorZ = (Math.random() - 0.5) * 1.3;
    } else if (this.difficulty === 'medium') {
      errorX = (Math.random() - 0.5) * 0.35;
      errorZ = (Math.random() - 0.5) * 0.5;
    } else {
      errorX = (Math.random() - 0.5) * 0.1;
      errorZ = (Math.random() - 0.5) * 0.12;
    }

    const vx = (dx + errorX) / flightTime;
    const vz = (dz + errorZ) / flightTime;
    const targetY = 0.85;
    const vy = (targetY - startPos.y - 0.5 * this.gravity * flightTime * flightTime) / flightTime;

    this.ballVel.set(vx, vy, vz);
  }

  handleCupSink(cup) {
    this.ballState = 'sunk';
    cup.isSunk = true;

    this.audio.playCupSink();
    this.audio.playScoreChime();

    // Spawn 3D Water Droplet Splash Particles
    this.spawnWaterSplash(cup.group.position);

    // Update Scores based on active turn
    if (this.gameMode === '3p') {
      if (this.currentTurn === 'p1') {
        this.p1Score++;
        this.container.querySelector('#val-p1').textContent = this.p1Score;
        this.showToast('PLAYER 1 SCORED! 🎯');
      } else if (this.currentTurn === 'p2') {
        this.p2Score++;
        this.container.querySelector('#val-p2').textContent = this.p2Score;
        this.showToast('PLAYER 2 SCORED! 🔥');
      } else {
        this.p3Score++;
        this.container.querySelector('#val-p3').textContent = this.p3Score;
        this.showToast('PLAYER 3 SCORED! ⚡');
      }
    } else {
      if (this.currentTurn === 'p1') {
        this.p1Score++;
        this.hudOpponentScore.textContent = this.p1Score;
        this.showToast('+1 CUP SUNK! 🎯');
      } else {
        this.p2Score++;
        this.hudPlayerScore.textContent = this.p2Score;
        this.showToast('BOT SCORED! 💥');
      }
    }

    confetti({ particleCount: 45, spread: 55, origin: { y: 0.45 } });

    // 3D Sinking & Scale-Pop Animation for the Cup
    const origY = cup.group.position.y;
    let elapsed = 0;
    const sinkAnim = () => {
      elapsed += 0.04;
      cup.group.position.y = origY - elapsed * 1.6;
      cup.group.scale.multiplyScalar(0.95);
      if (elapsed < 0.65) {
        requestAnimationFrame(sinkAnim);
      } else {
        cup.group.visible = false;
      }
    };
    sinkAnim();

    // Check Victory Condition
    const remainingCups = this.activeCups.filter((c) => !c.isSunk).length;
    if (remainingCups === 0) {
      setTimeout(() => this.triggerVictory(), 850);
      return;
    }

    setTimeout(() => {
      this.switchTurn();
    }, 1350);
  }

  spawnWaterSplash(pos) {
    const particleCount = 14;
    const geo = new THREE.SphereGeometry(0.045, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.85 });

    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.position.set(pos.x, pos.y + 0.85, pos.z);
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 1.2 + Math.random() * 1.5;
      p.velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        3.5 + Math.random() * 2.5,
        Math.sin(angle) * speed
      );
      this.scene.add(p);
      this.waterParticles.push(p);
    }
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
    const idx = this.turnOrder.indexOf(this.currentTurn);
    const nextIdx = (idx + 1) % this.turnOrder.length;
    this.currentTurn = this.turnOrder[nextIdx];

    this.resetBallPosition();
    this.updateTurnUI();
  }

  triggerVictory() {
    this.state = 'victory';
    this.audio.playVictory();

    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });

    const victoryTop = this.container.querySelector('#victory-top');
    const victoryMid = this.container.querySelector('#victory-mid');
    const victoryBottom = this.container.querySelector('#victory-bottom');

    const headlineTop = this.container.querySelector('#victory-headline-top');
    const headlineMid = this.container.querySelector('#victory-headline-mid');
    const headlineBottom = this.container.querySelector('#victory-headline-bottom');

    const medalTop = this.container.querySelector('#medal-top');
    const medalMid = this.container.querySelector('#medal-mid');
    const medalBottom = this.container.querySelector('#medal-bottom');

    if (this.gameMode === '3p') {
      // 3-Player Ranked Podium
      victoryMid.style.display = 'flex';

      const players = [
        { name: 'PLAYER 1', score: this.p1Score, color: '#38bdf8' },
        { name: 'PLAYER 2', score: this.p2Score, color: '#ef4444' },
        { name: 'PLAYER 3', score: this.p3Score, color: '#10b981' },
      ];
      players.sort((a, b) => b.score - a.score);

      // Gold 1st
      victoryTop.style.background = players[0].color;
      headlineTop.textContent = `${players[0].name} WINS! (${players[0].score} pts)`;
      medalTop.className = 'medal-circle medal-gold';
      medalTop.innerHTML = '1<div class="medal-ribbon"><span></span><span></span></div>';

      // Silver 2nd
      victoryMid.style.background = players[1].color;
      headlineMid.textContent = `2ND: ${players[1].name} (${players[1].score} pts)`;
      medalMid.className = 'medal-circle medal-silver';
      medalMid.innerHTML = '2<div class="medal-ribbon"><span></span><span></span></div>';

      // Bronze 3rd
      victoryBottom.style.background = players[2].color;
      headlineBottom.textContent = `3RD: ${players[2].name} (${players[2].score} pts)`;
      medalBottom.className = 'medal-circle medal-bronze';
      medalBottom.innerHTML = '3<div class="medal-ribbon"><span></span><span></span></div>';
    } else {
      // 1P or 2P Match Winner
      victoryMid.style.display = 'none';

      if (this.p1Score >= this.p2Score) {
        victoryTop.style.background = '#38bdf8';
        headlineTop.textContent = 'BLUE WINS!';
        medalTop.className = 'medal-circle medal-gold';
        medalTop.innerHTML = '1<div class="medal-ribbon"><span></span><span></span></div>';

        victoryBottom.style.background = '#ef4444';
        headlineBottom.textContent = 'RED (RUNNER UP)';
        medalBottom.className = 'medal-circle medal-silver';
        medalBottom.innerHTML = '2<div class="medal-ribbon"><span></span><span></span></div>';
      } else {
        victoryTop.style.background = '#ef4444';
        headlineTop.textContent = 'RED WINS!';
        medalTop.className = 'medal-circle medal-gold';
        medalTop.innerHTML = '1<div class="medal-ribbon"><span></span><span></span></div>';

        victoryBottom.style.background = '#38bdf8';
        headlineBottom.textContent = 'BLUE (RUNNER UP)';
        medalBottom.className = 'medal-circle medal-silver';
        medalBottom.innerHTML = '2<div class="medal-ribbon"><span></span><span></span></div>';
      }
    }

    this.victoryScreen.classList.remove('hidden');
    this.hudLayer.style.display = 'none';
  }

  updatePhysics(dt) {
    // 1. Update 3D Water Droplet Splash Particles
    for (let i = this.waterParticles.length - 1; i >= 0; i--) {
      const p = this.waterParticles[i];
      p.velocity.y += -22.0 * dt;
      p.position.addScaledVector(p.velocity, dt);
      p.scale.multiplyScalar(0.96);
      if (p.position.y < 0.1 || p.scale.x < 0.05) {
        this.scene.remove(p);
        this.waterParticles.splice(i, 1);
      }
    }

    // 2. Update 3D Cup Wobble Spring Physics (Simulates flexible plastic cup rim hit reaction)
    for (let i = 0; i < this.activeCups.length; i++) {
      const cup = this.activeCups[i];
      if (cup.isSunk) continue;

      if (cup.wobbleX !== 0 || cup.wobbleZ !== 0 || cup.wobbleVelX !== 0 || cup.wobbleVelZ !== 0) {
        cup.wobbleVelX += (-cup.wobbleX * 35.0 - cup.wobbleVelX * 7.5) * dt;
        cup.wobbleVelZ += (-cup.wobbleZ * 35.0 - cup.wobbleVelZ * 7.5) * dt;
        cup.wobbleX += cup.wobbleVelX * dt;
        cup.wobbleZ += cup.wobbleVelZ * dt;

        cup.group.rotation.x = cup.wobbleX;
        cup.group.rotation.z = cup.wobbleZ;

        if (Math.abs(cup.wobbleX) < 0.005 && Math.abs(cup.wobbleVelX) < 0.01) {
          cup.wobbleX = 0;
          cup.wobbleVelX = 0;
          cup.group.rotation.x = 0;
        }
        if (Math.abs(cup.wobbleZ) < 0.005 && Math.abs(cup.wobbleVelZ) < 0.01) {
          cup.wobbleZ = 0;
          cup.wobbleVelZ = 0;
          cup.group.rotation.z = 0;
        }
      }
    }

    if (this.ballState !== 'flying') return;

    // Apply gravity
    this.ballVel.y += this.gravity * dt;

    // Advance position
    this.ballPos.x += this.ballVel.x * dt;
    this.ballPos.y += this.ballVel.y * dt;
    this.ballPos.z += this.ballVel.z * dt;

    // Update Contact Shadow
    const heightAboveTable = Math.max(0, this.ballPos.y - this.ballRadius);
    const shadowScale = Math.max(0.3, 1.0 - heightAboveTable * 0.16);
    this.ballShadow.position.set(this.ballPos.x, 0.005, this.ballPos.z);
    this.ballShadow.scale.set(shadowScale, shadowScale, shadowScale);

    // Collision with Table (Table bounds: X in [-2.3, 2.3], Z in [-6.7, 6.7], Y = 0)
    if (
      this.ballPos.y <= this.ballRadius &&
      Math.abs(this.ballPos.x) <= 2.3 &&
      Math.abs(this.ballPos.z) <= 6.7 &&
      this.ballVel.y < 0
    ) {
      this.ballPos.y = this.ballRadius;
      this.ballVel.y = -this.ballVel.y * 0.65;
      this.ballVel.x *= 0.88;
      this.ballVel.z *= 0.88;
      this.audio.playTableBounce(Math.abs(this.ballVel.y));
    }

    // Collision with Target Cups
    for (let i = 0; i < this.activeCups.length; i++) {
      const cup = this.activeCups[i];
      if (cup.isSunk) continue;

      const dx = this.ballPos.x - cup.targetX;
      const dz = this.ballPos.z - cup.targetZ;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // 1. Successful Cup Opening Sink:
      if (dist < 0.28 && this.ballPos.y <= cup.height + 0.12 && this.ballPos.y >= cup.height * 0.35 && this.ballVel.y < 0) {
        this.handleCupSink(cup);
        return;
      }

      // 2. Cup Plastic Rim Clink Collision & 3D Wobble Impulse:
      if (dist < 0.42 && dist >= 0.28 && Math.abs(this.ballPos.y - cup.height) < 0.18) {
        const nx = dx / (dist || 1);
        const nz = dz / (dist || 1);
        this.ballVel.x = nx * 3.6;
        this.ballVel.z = nz * 3.6;
        this.ballVel.y = Math.abs(this.ballVel.y) * 0.52;

        // Give 3D tilt impulse to cup
        cup.wobbleVelX += -nz * 4.5;
        cup.wobbleVelZ += nx * 4.5;

        this.audio.playRimBounce();
      }
    }

    // Ball Out of Bounds / Fell off Table
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
    const isMobile = this.camera.aspect < 1.0;

    if (this.cameraMode === 'table') {
      // Table Overview
      this.camTargetPos.set(0, 9.8, -9.5);
      this.camLookTarget.set(0, 0.4, 0.5);
    } else {
      // Dynamic Mobile Aim Camera:
      // Perfectly balances ball in lower 15% and cups in upper half
      if (this.ballState === 'flying') {
        this.camTargetPos.set(
          this.ballPos.x * 0.35,
          Math.max(2.8, this.ballPos.y + 1.8),
          Math.min(1.8, this.ballPos.z - 4.2)
        );
        this.camLookTarget.set(this.ballPos.x * 0.45, 0.5, this.ballPos.z + 4.2);
      } else {
        const camHeight = isMobile ? 2.9 : 3.4;
        const camZ = isMobile ? -5.6 : -6.8;
        this.camTargetPos.set(0, camHeight, camZ);
        this.camLookTarget.set(0, 0.45, 2.2);
      }
    }

    const smoothFactor = 1.0 - Math.pow(0.001, dt);
    this.camera.position.lerp(this.camTargetPos, smoothFactor);
    this.camera.lookAt(this.camLookTarget);
  }

  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.033);
    this.lastTime = timestamp;

    // Idle Pulse on Ball Touch Ring
    if (this.ballState === 'idle' && this.ballRing) {
      const pulse = 1.0 + Math.sin(timestamp * 0.006) * 0.12;
      this.ballRing.scale.set(pulse, pulse, pulse);
    }

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

    if (this.hintTimer) {
      clearTimeout(this.hintTimer);
      this.hintTimer = null;
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
