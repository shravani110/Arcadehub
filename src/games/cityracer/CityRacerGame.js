// CityRacerGame.js - Master 3D Night City Highway Racer Game Controller
// Fixes inverted controls, eliminates cone reflection mesh, adds true 3D graphics & suspension animation,
// features responsive mobile touch controls, seamless Play Again restarts, and crash invulnerability.
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { createMonsterPoliceCar, TrafficManager } from './CityRacerVehicles.js';
import { CityRacerWorld } from './CityRacerWorld.js';
import { CityRacerAudio } from './CityRacerAudio.js';
import { soundManager } from '../../sound/SoundManager.js';

export class CityRacerGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    // Subsystems
    this.audio = new CityRacerAudio();

    // Player State
    // Initial position in right/center lane (Lane X = -3.5, which is screen right of yellow line)
    this.playerX = -3.5;
    this.playerTargetX = -3.5;
    this.playerZ = 0;
    this.speedKmh = 92;
    this.maxNormalSpeed = 185;
    this.nitroMaxSpeed = 245;
    this.minSpeed = 35;

    this.nitroEnergy = 100;
    this.isNitro = false;

    // Health, Invulnerability & Scoring
    this.shields = 3;
    this.invulnerableTimer = 0;
    this.score = 0;
    this.distanceMeters = 0;
    this.nearMissCount = 0;
    this.comboMultiplier = 1;
    this.lastNearMissTime = 0;

    this.gameState = 'playing';
    this.cameraMode = 'chase';
    this.camShake = 0;

    // Inputs
    this.inputs = {
      left: false,
      right: false,
      forward: false,
      backward: false,
      nitro: false,
    };

    // Records
    this.highScore = parseInt(localStorage.getItem('cityracer_high_score')) || 0;
    this.bestDistance = parseInt(localStorage.getItem('cityracer_best_distance')) || 0;

    // Lifecycle
    this.animId = null;
    this.lastTime = performance.now();
    this.isMuted = soundManager.isMuted();

    this.initDOM();
    this.initThree();
    this.initWorld();
    this.initPlayer();
    this.initEvents();

    this.audio.init();
    this.audio.setMuted(this.isMuted);

    this.animId = requestAnimationFrame(this.loop.bind(this));
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="cityracer-wrapper select-none">
        <!-- 3D Canvas Layer -->
        <div id="cityracer-webgl-container" class="cityracer-canvas"></div>

        <!-- Top Navigation Bar -->
        <div class="cityracer-top-bar">
          <button class="icon-btn" id="btn-cityracer-back" title="Back to Lobby">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          <!-- High Score Record Badge -->
          <div class="cityracer-record-badge">
            <span class="badge-label">RECORD</span>
            <span class="badge-value" id="hud-high-score">${this.highScore.toLocaleString()} PTS</span>
          </div>

          <!-- Top Action Controls -->
          <div class="top-controls">
            <button class="icon-btn" id="btn-cityracer-cam" title="Toggle Camera (C)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
            <button class="icon-btn" id="btn-cityracer-sound" title="Toggle Sound">
              ${this.isMuted 
                ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
                : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>'}
            </button>
          </div>
        </div>

        <!-- Telemetry & Score HUD -->
        <div class="cityracer-hud">
          <!-- Left: Speedometer & Nitro Gauge -->
          <div class="hud-card speed-card">
            <div class="speed-value-row">
              <span class="speed-digits" id="hud-speed">92</span>
              <span class="speed-unit">KM/H</span>
            </div>
            <!-- Nitro / Siren Energy Bar -->
            <div class="nitro-bar-track" title="Nitro / Police Siren">
              <div class="nitro-bar-fill" id="hud-nitro-fill"></div>
            </div>
            <div class="nitro-label">
              <span>🚨 NOS</span>
              <span id="hud-nitro-val">100%</span>
            </div>
          </div>

          <!-- Right: Distance & Score Card -->
          <div class="hud-card stats-card">
            <div class="score-display">
              <span class="stat-tag">SCORE</span>
              <span class="stat-main" id="hud-score">0</span>
            </div>
            <div class="distance-display">
              <span class="stat-tag">DISTANCE</span>
              <span class="stat-sub" id="hud-dist">0 m</span>
            </div>
            <!-- Shields Integrity -->
            <div class="shield-row">
              <span class="shield-tag">SHIELD</span>
              <div class="shield-pips" id="hud-shields">
                <span class="shield-pip active"></span>
                <span class="shield-pip active"></span>
                <span class="shield-pip active"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Near-Miss Floating Notification Area -->
        <div class="near-miss-container" id="near-miss-box"></div>

        <!-- Desktop Controls Hint Bar (Shown on desktop with mouse only) -->
        <div class="cityracer-desktop-hints" id="desktop-hints">
          <span><kbd>A/D</kbd> or <kbd>←/→</kbd> Steer Lanes</span>
          <span><kbd>W/↑</kbd> Gas</span>
          <span><kbd>S/↓</kbd> Brake</span>
          <span><kbd>Shift</kbd> Siren NOS</span>
          <span><kbd>C</kbd> Camera</span>
        </div>

        <!-- Mobile Touch Controls Layer (Responsive, Ergonomic Thumb Controls) -->
        <div class="cityracer-mobile-controls" id="mobile-controls">
          <!-- Left Thumb: Steering Rocker Buttons -->
          <div class="touch-steer-group">
            <button class="touch-ctrl-btn steer-btn" id="touch-left" aria-label="Steer Left">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M15 19l-7-7 7-7v14z"/></svg>
            </button>
            <button class="touch-ctrl-btn steer-btn" id="touch-right" aria-label="Steer Right">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M9 5l7 7-7 7V5z"/></svg>
            </button>
          </div>

          <!-- Right Thumb: Pedal & NOS Cluster -->
          <div class="touch-pedal-group">
            <button class="touch-ctrl-btn siren-btn" id="touch-nitro" aria-label="Police Siren Nitro">
              🚨 NOS
            </button>
            <div class="touch-pedal-row">
              <button class="touch-ctrl-btn brake-pedal" id="touch-brake" aria-label="Brake">
                BRAKE
              </button>
              <button class="touch-ctrl-btn gas-pedal" id="touch-gas" aria-label="Accelerate">
                GAS
              </button>
            </div>
          </div>
        </div>

        <!-- Game Over Modal -->
        <div class="cityracer-modal-overlay hidden" id="game-over-modal">
          <div class="modal-card">
            <h2 class="modal-title">💥 HIGHWAY CRASH!</h2>
            <p class="modal-subtitle">Your Monster Police Interceptor took heavy damage!</p>
            <div class="modal-stats-grid">
              <div class="mstat-box">
                <span class="mstat-label">FINAL SCORE</span>
                <span class="mstat-value" id="modal-final-score">0</span>
              </div>
              <div class="mstat-box">
                <span class="mstat-label">DISTANCE</span>
                <span class="mstat-value" id="modal-final-dist">0 m</span>
              </div>
              <div class="mstat-box">
                <span class="mstat-label">NEAR MISSES</span>
                <span class="mstat-value" id="modal-final-misses">0</span>
              </div>
              <div class="mstat-box">
                <span class="mstat-label">BEST RECORD</span>
                <span class="mstat-value" id="modal-final-record">0</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="modal-btn btn-restart" id="btn-modal-restart">Play Again 🏎️</button>
              <button class="modal-btn btn-exit" id="btn-modal-exit">Arcade Lobby</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvasContainer = this.container.querySelector('#cityracer-webgl-container');
    this.hudSpeed = this.container.querySelector('#hud-speed');
    this.hudNitroFill = this.container.querySelector('#hud-nitro-fill');
    this.hudNitroVal = this.container.querySelector('#hud-nitro-val');
    this.hudScore = this.container.querySelector('#hud-score');
    this.hudDist = this.container.querySelector('#hud-dist');
    this.hudShields = this.container.querySelector('#hud-shields');
    this.nearMissBox = this.container.querySelector('#near-miss-box');
  }

  initThree() {
    const width = this.canvasContainer.clientWidth || window.innerWidth;
    const height = this.canvasContainer.clientHeight || window.innerHeight;

    // 1. Scene with Rich Night City Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#070913');
    this.scene.fog = new THREE.Fog('#070913', 65, 340);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 750);
    this.camera.position.set(-3.5, 3.8, -7.5);

    // 3. Renderer with locked DPR for performance & soft shadows
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
    this.renderer.toneMappingExposure = 1.25;

    this.canvasContainer.appendChild(this.renderer.domElement);

    // 4. Dynamic Lighting System
    // Ambient Sky Fill
    const hemiLight = new THREE.HemisphereLight('#93c5fd', '#1e293b', 0.65);
    this.scene.add(hemiLight);

    // Key Follow Sun/Moon Light: Dynamically moves with player so car is always beautifully illuminated in 3D!
    this.sunLight = new THREE.DirectionalLight('#ffffff', 1.85);
    this.sunLight.position.set(20, 60, -25);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.left = -28;
    this.sunLight.shadow.camera.right = 28;
    this.sunLight.shadow.camera.top = 28;
    this.sunLight.shadow.camera.bottom = -28;
    this.sunLight.shadow.bias = -0.0001;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
  }

  initWorld() {
    this.world = new CityRacerWorld(this.scene);
    this.traffic = new TrafficManager(this.scene);
  }

  initPlayer() {
    this.playerCar = createMonsterPoliceCar();
    this.playerCar.mesh.position.set(this.playerX, 0, this.playerZ);
    this.scene.add(this.playerCar.mesh);

    this.camTargetPos = new THREE.Vector3();
    this.camLookTarget = new THREE.Vector3();
  }

  initEvents() {
    // Keyboard Controls
    this.handleKeyDown = (e) => {
      this.audio.resume();
      switch (e.code) {
        case 'KeyA': case 'ArrowLeft': this.inputs.left = true; break;
        case 'KeyD': case 'ArrowRight': this.inputs.right = true; break;
        case 'KeyW': case 'ArrowUp': this.inputs.forward = true; break;
        case 'KeyS': case 'ArrowDown': this.inputs.backward = true; break;
        case 'ShiftLeft': case 'ShiftRight': case 'Space': this.inputs.nitro = true; break;
        case 'KeyC': this.toggleCamera(); break;
      }
    };

    this.handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyA': case 'ArrowLeft': this.inputs.left = false; break;
        case 'KeyD': case 'ArrowRight': this.inputs.right = false; break;
        case 'KeyW': case 'ArrowUp': this.inputs.forward = false; break;
        case 'KeyS': case 'ArrowDown': this.inputs.backward = false; break;
        case 'ShiftLeft': case 'ShiftRight': case 'Space': this.inputs.nitro = false; break;
      }
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Responsive Canvas Resize
    this.handleResize = () => {
      if (!this.renderer || !this.camera || !this.canvasContainer) return;
      const w = this.canvasContainer.clientWidth || window.innerWidth;
      const h = this.canvasContainer.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', this.handleResize);

    // Top Bar Buttons
    this.container.querySelector('#btn-cityracer-back').addEventListener('click', () => {
      this.destroy();
      this.onExit();
    });

    this.container.querySelector('#btn-cityracer-cam').addEventListener('click', () => {
      this.toggleCamera();
    });

    this.container.querySelector('#btn-cityracer-sound').addEventListener('click', (e) => {
      e.stopPropagation();
      this.isMuted = !this.isMuted;
      this.audio.setMuted(this.isMuted);
      this.container.querySelector('#btn-cityracer-sound').innerHTML = this.isMuted
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>';
    });

    // Mobile Touch & Pointer Buttons (Supports Touch & Mouse)
    const bindButton = (id, key) => {
      const btn = this.container.querySelector(id);
      if (!btn) return;

      const press = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.audio.resume();
        this.inputs[key] = true;
        btn.classList.add('pressed');
      };

      const release = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.inputs[key] = false;
        btn.classList.remove('pressed');
      };

      btn.addEventListener('pointerdown', press);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
      btn.addEventListener('pointerleave', release);

      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend', release, { passive: false });
      btn.addEventListener('touchcancel', release, { passive: false });
    };

    bindButton('#touch-left', 'left');
    bindButton('#touch-right', 'right');
    bindButton('#touch-gas', 'forward');
    bindButton('#touch-brake', 'backward');
    bindButton('#touch-nitro', 'nitro');

    // Direct Touch Canvas Drag Steering (Swipe horizontally anywhere on the road to steer)
    let isDraggingCanvas = false;
    let lastTouchX = 0;

    this.handleCanvasPointerDown = (e) => {
      if (
        e.target.closest('.cityracer-top-bar') ||
        e.target.closest('.cityracer-hud') ||
        e.target.closest('.touch-ctrl-btn') ||
        e.target.closest('.modal-card')
      ) return;
      isDraggingCanvas = true;
      lastTouchX = e.clientX;
      this.audio.resume();
    };

    this.handleCanvasPointerMove = (e) => {
      if (!isDraggingCanvas) return;
      const dx = e.clientX - lastTouchX;
      lastTouchX = e.clientX;
      // In our camera perspective, moving screen right is -X, screen left is +X
      const deltaX = (dx / (window.innerWidth || 400)) * 18.0;
      this.playerTargetX = Math.max(-11.5, Math.min(11.5, this.playerTargetX - deltaX));
    };

    this.handleCanvasPointerUp = () => {
      isDraggingCanvas = false;
    };

    this.canvasContainer.addEventListener('pointerdown', this.handleCanvasPointerDown);
    window.addEventListener('pointermove', this.handleCanvasPointerMove);
    window.addEventListener('pointerup', this.handleCanvasPointerUp);
    window.addEventListener('pointercancel', this.handleCanvasPointerUp);

    // Modal Actions
    this.container.querySelector('#btn-modal-restart').addEventListener('click', () => {
      this.restartGame();
    });

    this.container.querySelector('#btn-modal-exit').addEventListener('click', () => {
      this.destroy();
      this.onExit();
    });
  }

  toggleCamera() {
    this.cameraMode = this.cameraMode === 'chase' ? 'hood' : 'chase';
  }

  showNearMissBanner() {
    const el = document.createElement('div');
    el.className = 'near-miss-pill';
    el.innerHTML = `<span>🔥 NEAR MISS!</span> <small>+${150 * this.comboMultiplier}</small>`;
    this.nearMissBox.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 1200);
  }

  handleCrash(rivalCar) {
    if (this.invulnerableTimer > 0) return; // Shield grace period active

    this.shields--;
    this.invulnerableTimer = 1.8; // 1.8 seconds crash recovery invulnerability
    this.camShake = 0.45;
    this.audio.playCrash();

    // Knock rival car forward & aside so vehicles don't get stuck into each other
    if (rivalCar && rivalCar.mesh) {
      rivalCar.mesh.position.z += 9;
      rivalCar.speedKmh = this.speedKmh + 25;
      const pushX = (rivalCar.mesh.position.x >= this.playerX) ? 1.8 : -1.8;
      rivalCar.mesh.position.x = Math.max(-10.5, Math.min(10.5, rivalCar.mesh.position.x + pushX));
    }

    // Moderate speed recoil
    this.speedKmh = Math.max(45, this.speedKmh * 0.7);

    const pips = this.container.querySelectorAll('.shield-pip');
    pips.forEach((pip, idx) => {
      if (idx >= this.shields) pip.classList.remove('active');
    });

    if (this.shields <= 0) {
      this.gameState = 'gameover';
      this.playerCar.mesh.visible = true;
      this.audio.update({ speedKmh: 0, isAccelerating: false, isBraking: false, isSiren: false });

      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('cityracer_high_score', this.highScore.toString());
      }
      if (this.distanceMeters > this.bestDistance) {
        this.bestDistance = this.distanceMeters;
        localStorage.setItem('cityracer_best_distance', this.bestDistance.toString());
      }

      this.container.querySelector('#modal-final-score').textContent = this.score.toLocaleString();
      this.container.querySelector('#modal-final-dist').textContent = `${this.distanceMeters} m`;
      this.container.querySelector('#modal-final-misses').textContent = this.nearMissCount;
      this.container.querySelector('#modal-final-record').textContent = this.highScore.toLocaleString();

      this.container.querySelector('#game-over-modal').classList.remove('hidden');

      if (this.score >= this.highScore && this.score > 800) {
        confetti({ particleCount: 75, spread: 65 });
      }
    }
  }

  restartGame() {
    // 1. Cancel any active animation frame
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    // 2. Reset player state
    this.shields = 3;
    this.score = 0;
    this.distanceMeters = 0;
    this.nearMissCount = 0;
    this.comboMultiplier = 1;
    this.speedKmh = 92;
    this.nitroEnergy = 100;
    this.playerX = -3.5;
    this.playerTargetX = -3.5;
    this.playerZ = 0;
    this.invulnerableTimer = 1.0; // 1s grace period on restart
    this.camShake = 0;
    this.gameState = 'playing';

    // 3. Clear all input states
    this.inputs = {
      left: false,
      right: false,
      forward: false,
      backward: false,
      nitro: false,
    };

    // 4. Reset player mesh transform and visibility
    if (this.playerCar && this.playerCar.mesh) {
      this.playerCar.mesh.position.set(this.playerX, 0, this.playerZ);
      this.playerCar.mesh.rotation.set(0, 0, 0);
      this.playerCar.chassis.rotation.set(0, 0, 0);
      this.playerCar.chassis.position.set(0, 0, 0);
      this.playerCar.mesh.visible = true;
    }

    // 5. Reset camera to starting chase position
    this.camera.position.set(-3.5, 3.8, -7.5);
    this.camera.lookAt(-3.5, 1.35, 16);

    // 6. Reset Traffic & World
    this.traffic.reset();
    this.world.reset();

    // 7. Reset HUD
    const pips = this.container.querySelectorAll('.shield-pip');
    pips.forEach((pip) => pip.classList.add('active'));

    this.hudSpeed.textContent = '92';
    this.hudScore.textContent = '0';
    this.hudDist.textContent = '0 m';
    this.hudNitroFill.style.width = '100%';
    this.hudNitroVal.textContent = '100%';

    this.container.querySelector('#game-over-modal').classList.add('hidden');

    // 8. Re-prime audio
    this.audio.resume();
    this.audio.update({ speedKmh: 92, isAccelerating: false, isBraking: false, isSiren: false });

    // 9. Re-initialize clock and START the animation loop!
    this.lastTime = performance.now();
    this.animId = requestAnimationFrame(this.loop.bind(this));
  }

  updateCamera(delta) {
    const speedRatio = Math.min(this.speedKmh / 220, 1.0);

    if (this.cameraMode === 'hood') {
      // 1st Person Cockpit View
      this.camTargetPos.set(this.playerX, 1.45, this.playerZ + 1.1);
      this.camLookTarget.set(this.playerX, 1.35, this.playerZ + 25.0);
    } else {
      // Dynamic Third-Person Chase Camera:
      // Perfectly framed behind the monster car without any obstructions
      const camDist = 7.4 + speedRatio * 1.6;
      const camHeight = 3.6 - speedRatio * 0.2;

      this.camTargetPos.set(
        this.playerX * 0.88, // Subtle horizontal lag
        camHeight,
        this.playerZ - camDist
      );

      this.camLookTarget.set(
        this.playerX,
        1.35,
        this.playerZ + 16.0 + speedRatio * 8.0
      );
    }

    if (this.camShake > 0) {
      this.camTargetPos.x += (Math.random() - 0.5) * this.camShake;
      this.camTargetPos.y += (Math.random() - 0.5) * this.camShake;
      this.camShake = Math.max(0, this.camShake - delta * 3.5);
    }

    const dampFactor = 1.0 - Math.pow(0.001, delta);
    this.camera.position.lerp(this.camTargetPos, dampFactor);
    this.camera.lookAt(this.camLookTarget);

    const targetFov = (this.cameraMode === 'hood' ? 66 : 53) + (this.isNitro ? 12 : speedRatio * 8);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 4);
    this.camera.updateProjectionMatrix();
  }

  loop(timestamp) {
    if (this.gameState === 'gameover') return;

    // Capped dt prevents physics explosion on browser frame drops
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.033);
    this.lastTime = timestamp;

    // --- 0. Invulnerability Flash Animation ---
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
      this.playerCar.mesh.visible = Math.floor(this.invulnerableTimer * 12) % 2 === 0;
    } else {
      this.playerCar.mesh.visible = true;
    }

    // --- 1. Vehicle Steering & Horizontal Position (CORRECTED NON-INVERTED CONTROLS) ---
    // In this Three.js camera perspective (camera at -Z looking towards +Z):
    // Screen RIGHT is towards -X!
    // Screen LEFT is towards +X!
    const steerSpeed = 16.5;

    // Pressing RIGHT Arrow / D / Touch-Right moves car to SCREEN RIGHT (-X)
    if (this.inputs.right) {
      this.playerTargetX -= steerSpeed * dt;
    }
    // Pressing LEFT Arrow / A / Touch-Left moves car to SCREEN LEFT (+X)
    if (this.inputs.left) {
      this.playerTargetX += steerSpeed * dt;
    }

    // Clamp within highway boundaries (4 traffic lanes + shoulders)
    this.playerTargetX = Math.max(-11.5, Math.min(11.5, this.playerTargetX));

    // Smooth horizontal position interpolation
    this.playerX = THREE.MathUtils.lerp(this.playerX, this.playerTargetX, dt * 14);

    // 3D Chassis Steering Yaw and Body Roll
    const deltaSteer = this.playerTargetX - this.playerX;
    // When steering right (deltaSteer < 0), nose turns right and chassis rolls right!
    this.playerCar.mesh.rotation.y = deltaSteer * 0.08;
    this.playerCar.mesh.rotation.z = deltaSteer * 0.12;

    // --- 2. 3D Suspension Physics & Animation ---
    const speedRatio = Math.min(this.speedKmh / 220, 1.0);
    // Road vibration bobbing
    const suspensionBob = Math.sin(timestamp * 0.035) * 0.02 * speedRatio;

    // Acceleration Squat & Braking Dive Pitch
    let pitchTilt = 0;
    if (this.inputs.forward || this.isNitro) {
      pitchTilt = this.isNitro ? -0.045 : -0.025; // Rear squats down
    } else if (this.inputs.backward) {
      pitchTilt = 0.04; // Nose dives forward
    }
    this.playerCar.chassis.rotation.x = THREE.MathUtils.lerp(this.playerCar.chassis.rotation.x, pitchTilt, dt * 8);
    this.playerCar.chassis.position.y = suspensionBob;

    // --- 3. Vehicle Speed, Nitro & Braking ---
    this.isNitro = this.inputs.nitro && this.nitroEnergy > 0;

    let targetMaxSpeed = this.maxNormalSpeed;
    if (this.isNitro) {
      targetMaxSpeed = this.nitroMaxSpeed;
      this.nitroEnergy = Math.max(0, this.nitroEnergy - dt * 28);
      this.camShake = Math.max(this.camShake, 0.08);

      // Animate 3D Dual Nitro Flame Jets from Exhausts!
      this.playerCar.flameMat.opacity = 0.75 + Math.random() * 0.25;
      const flameScale = 1.0 + Math.random() * 0.4;
      this.playerCar.leftFlame.scale.set(flameScale, flameScale, flameScale);
      this.playerCar.rightFlame.scale.set(flameScale, flameScale, flameScale);
    } else {
      this.nitroEnergy = Math.min(100, this.nitroEnergy + dt * 8);
      this.playerCar.flameMat.opacity = 0.0;
    }

    if (this.inputs.forward || this.isNitro) {
      const accelRate = this.isNitro ? 65 : 35;
      this.speedKmh = Math.min(targetMaxSpeed, this.speedKmh + accelRate * dt);
    } else if (this.inputs.backward) {
      this.speedKmh = Math.max(this.minSpeed, this.speedKmh - 55 * dt);
    } else {
      this.speedKmh = THREE.MathUtils.lerp(this.speedKmh, 95, dt * 0.4);
    }

    // --- 4. Forward Movement Along Highway ---
    const speedMps = (this.speedKmh * 1000) / 3600;
    this.playerZ += speedMps * dt;
    this.distanceMeters = Math.floor(this.playerZ);

    const pointsPerSec = Math.floor((this.speedKmh / 10) * this.comboMultiplier);
    this.score += Math.floor(pointsPerSec * dt * 8);

    // Update Player Car World Position
    this.playerCar.mesh.position.set(this.playerX, 0, this.playerZ);

    // Spin Monster Truck Wheels in 3D
    const wheelSpin = (speedMps / 0.62) * dt;
    this.playerCar.wheels.forEach((w) => {
      w.rotation.x += wheelSpin;
    });

    // Flashing Police Rooftop Strobe Lights
    const sirenTime = timestamp * 0.009;
    const isBlueActive = Math.sin(sirenTime) > 0;
    this.playerCar.blueMat.color.set(isBlueActive ? '#38bdf8' : '#0369a1');
    this.playerCar.redMat.color.set(!isBlueActive ? '#ef4444' : '#991b1b');
    this.playerCar.sirenPointLight.color.set(isBlueActive ? '#38bdf8' : '#ef4444');
    this.playerCar.sirenPointLight.intensity = this.isNitro ? 3.5 : 1.4;

    // --- 5. Dynamic Key Follow Light (Keeps Car Gleaming in Full 3D) ---
    this.sunLight.position.set(this.playerX + 22, 55, this.playerZ - 20);
    this.sunLight.target.position.set(this.playerX, 0, this.playerZ + 15);
    this.sunLight.target.updateMatrixWorld();

    // --- 6. Update World Chunks & Traffic AI ---
    this.world.update(this.playerZ);
    this.traffic.update(this.playerZ, this.speedKmh, dt);

    // --- 7. Collisions & Near-Misses ---
    const interactions = this.traffic.checkPlayerInteractions(this.playerCar.mesh.position);
    if (interactions.collision) {
      this.handleCrash(interactions.collision);
    } else if (interactions.nearMiss) {
      this.nearMissCount++;
      this.comboMultiplier = Math.min(5, this.comboMultiplier + 1);
      this.lastNearMissTime = timestamp;
      this.score += 150 * this.comboMultiplier;
      this.audio.playNearMiss();
      this.showNearMissBanner();
    }

    if (timestamp - this.lastNearMissTime > 4000 && this.comboMultiplier > 1) {
      this.comboMultiplier = 1;
    }

    // --- 8. Dynamic Camera & Audio ---
    this.updateCamera(dt);

    this.audio.update({
      speedKmh: this.speedKmh,
      isAccelerating: this.inputs.forward || this.isNitro,
      isBraking: this.inputs.backward,
      isSiren: this.isNitro,
      isSkidding: Math.abs(deltaSteer) > 1.2,
    });

    // --- 9. Update HUD ---
    this.hudSpeed.textContent = Math.round(this.speedKmh);
    this.hudScore.textContent = this.score.toLocaleString();
    this.hudDist.textContent = `${this.distanceMeters.toLocaleString()} m`;
    this.hudNitroFill.style.width = `${this.nitroEnergy}%`;
    this.hudNitroVal.textContent = `${Math.round(this.nitroEnergy)}%`;

    // --- 10. Render 3D Scene ---
    this.renderer.render(this.scene, this.camera);

    this.animId = requestAnimationFrame(this.loop.bind(this));
  }

  destroy() {
    this.gameState = 'gameover';
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);

    if (this.canvasContainer) {
      this.canvasContainer.removeEventListener('pointerdown', this.handleCanvasPointerDown);
    }
    window.removeEventListener('pointermove', this.handleCanvasPointerMove);
    window.removeEventListener('pointerup', this.handleCanvasPointerUp);
    window.removeEventListener('pointercancel', this.handleCanvasPointerUp);

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
