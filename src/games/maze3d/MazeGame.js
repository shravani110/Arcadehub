// MazeGame.js - Three.js 3D Isometric Ball Maze Puzzle with 15 Solvable Levels
// Full maze visibility from start to finish with dynamic tracking
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { MAZE_LEVELS } from './MazeLevels.js';
import { soundManager } from '../../sound/SoundManager.js';

export class MazeGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    this.currentLevelIndex = 0;
    this.totalLevels = MAZE_LEVELS.length; // 15 levels
    this.gameState = 'playing';

    // Cell size and ball dimensions tuned for smooth navigation without wedging
    this.cellSize = 1.25;
    this.wallHeight = 0.85;
    this.ballRadius = 0.22;

    this.ballPos = new THREE.Vector3();
    this.ballVel = new THREE.Vector3();
    this.moveForce = 0.022;
    this.friction = 0.91;
    this.maxSpeed = 0.20;

    this.input = { up: false, down: false, left: false, right: false };

    this.walls = [];
    this.exitPos = new THREE.Vector3();
    this.startPos = new THREE.Vector3();

    this.mazeBounds = { width: 10, depth: 10 };

    this.initDOM();
    this.initThree();
    this.loadLevel(this.currentLevelIndex);
    this.initEvents();

    soundManager.startRollingLoop();
    this.animId = requestAnimationFrame(this.loop.bind(this));
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper maze-wrapper">
        <div id="maze-webgl-container"></div>

        <!-- Top Navigation Bar -->
        <div class="game-top-bar maze-top-bar">
          <button class="icon-btn" id="btn-maze-back" title="Back to Lobby">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          
          <div class="maze-level-badge" id="maze-level-text">LEVEL 1 / 15</div>

          <div class="top-controls">
            <button class="icon-btn" id="btn-maze-sound" title="Toggle Sound">
              <svg id="maze-sound-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>
            </button>
            <button class="icon-btn" id="btn-maze-restart" title="Restart Level">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            </button>
          </div>
        </div>

        <!-- Translucent D-Pad Controller matching Screenshot 2 -->
        <div class="dpad-container" id="dpad">
          <div class="dpad-disc">
            <button class="dpad-btn dpad-up" data-dir="up">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-7 8h14z"/></svg>
            </button>
            <button class="dpad-btn dpad-down" data-dir="down">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l7-8H5z"/></svg>
            </button>
            <button class="dpad-btn dpad-left" data-dir="left">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 12l8-7v14z"/></svg>
            </button>
            <button class="dpad-btn dpad-right" data-dir="right">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 12l-8 7V5z"/></svg>
            </button>
            <div class="dpad-center"></div>
          </div>
        </div>

        <!-- Level Complete Banner -->
        <div class="level-banner hidden" id="level-banner">
          <div class="banner-content">
            <h3 id="banner-title">LEVEL COMPLETE!</h3>
            <p id="banner-sub">Loading Next Maze...</p>
          </div>
        </div>

        <!-- All Levels Completed Victory Modal -->
        <div class="modal-overlay hidden" id="maze-victory-modal">
          <div class="modal-card">
            <h2 style="color: #2ecc71;">🏆 MAZE MASTER!</h2>
            <p>Incredible navigation! You completed all 15 labyrinths!</p>
            <div class="modal-stats">
              <div class="stat-item">
                <span class="stat-val">15 / 15</span>
                <span class="stat-lbl">MAZES SOLVED</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn btn-primary" id="btn-maze-play-again">Play Again</button>
              <button class="btn btn-secondary" id="btn-maze-hub">Back to Lobby</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.webglContainer = this.container.querySelector('#maze-webgl-container');
    this.levelBadge = this.container.querySelector('#maze-level-text');
    this.levelBanner = this.container.querySelector('#level-banner');
    this.victoryModal = this.container.querySelector('#maze-victory-modal');
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#000000'); // Pure black background matching user request

    const width = this.webglContainer.clientWidth || window.innerWidth;
    const height = this.webglContainer.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.webglContainer.appendChild(this.renderer.domElement);

    // Realistic directional & ambient lighting matching Screenshot 2
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff8ee, 1.35);
    dirLight.position.set(12, 24, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -16;
    dirLight.shadow.camera.right = 16;
    dirLight.shadow.camera.top = 16;
    dirLight.shadow.camera.bottom = -16;
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x7ac4ff, 0.35);
    fillLight.position.set(-10, 12, -10);
    this.scene.add(fillLight);

    this.mazeGroup = new THREE.Group();
    this.scene.add(this.mazeGroup);

    // Yellow 3D Sphere Player (matching Screenshot 2)
    const sphereGeo = new THREE.SphereGeometry(this.ballRadius, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      metalness: 0.15,
      roughness: 0.22,
      emissive: 0x332600
    });
    this.ballMesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.ballMesh.castShadow = true;
    this.scene.add(this.ballMesh);

    // Subtle equatorial stripe on ball so rolling rotation is clearly visible
    const seamGeo = new THREE.TorusGeometry(this.ballRadius * 0.99, 0.012, 8, 32);
    const seamMat = new THREE.MeshBasicMaterial({ color: 0xcc9900 });
    const seam = new THREE.Mesh(seamGeo, seamMat);
    seam.rotation.x = Math.PI / 2;
    this.ballMesh.add(seam);

    // Exit Portal Door
    this.createExitDoorMesh();
  }

  createExitDoorMesh() {
    this.portalGroup = new THREE.Group();

    // Luminous turquoise base ring
    const ringGeo = new THREE.RingGeometry(0.12, 0.45, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    this.portalGroup.add(ring);

    // Arched Doorway (matching Screenshot 2 portal)
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x00e5bc,
      metalness: 0.6,
      roughness: 0.2,
      emissive: 0x00897b
    });
    const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9), archMat);
    pillar1.position.set(-0.35, 0.45, 0);
    const pillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9), archMat);
    pillar2.position.set(0.35, 0.45, 0);
    const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.76), archMat);
    topBar.rotation.z = Math.PI / 2;
    topBar.position.set(0, 0.9, 0);
    this.portalGroup.add(pillar1, pillar2, topBar);

    // Shimmering energy plane
    const energyGeo = new THREE.PlaneGeometry(0.68, 0.85);
    const energyMat = new THREE.MeshBasicMaterial({
      color: 0x48ffdb,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    this.portalEnergy = new THREE.Mesh(energyGeo, energyMat);
    this.portalEnergy.position.set(0, 0.45, 0);
    this.portalGroup.add(this.portalEnergy);

    this.scene.add(this.portalGroup);
  }

  loadLevel(levelIndex) {
    this.currentLevelIndex = levelIndex;
    const levelData = MAZE_LEVELS[levelIndex];

    this.levelBadge.innerText = `LEVEL ${levelIndex + 1} / ${this.totalLevels}`;

    // Clear previous maze
    while (this.mazeGroup.children.length > 0) {
      const child = this.mazeGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      this.mazeGroup.remove(child);
    }
    this.walls = [];

    const grid = levelData.grid;
    const rows = grid.length;
    const cols = grid[0].length;
    const cs = this.cellSize;
    const wh = this.wallHeight;

    this.mazeBounds.width = cols * cs;
    this.mazeBounds.depth = rows * cs;

    const offsetX = (cols * cs) * 0.5 - cs * 0.5;
    const offsetZ = (rows * cs) * 0.5 - cs * 0.5;

    // Dark pedestal slab under floor
    const slabGeo = new THREE.BoxGeometry(cols * cs + 1.0, 0.4, rows * cs + 1.0);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x181820,
      roughness: 0.7,
      metalness: 0.2
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.set(0, -0.35, 0);
    slab.receiveShadow = true;
    this.mazeGroup.add(slab);

    // Green Flat Floor (matching Screenshot 2)
    const floorGeo = new THREE.BoxGeometry(cols * cs + 0.6, 0.2, rows * cs + 0.6);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x26ab3b,
      roughness: 0.6,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.1, 0);
    floor.receiveShadow = true;
    this.mazeGroup.add(floor);

    // Brown Raised Walls (matching Screenshot 2: deep warm brown clay/wood)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x6e311a,
      roughness: 0.55,
      metalness: 0.08
    });

    const boxGeo = new THREE.BoxGeometry(cs, wh, cs);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = grid[r][c];
        const wx = c * cs - offsetX;
        const wz = r * cs - offsetZ;

        if (val === 1) {
          const wallMesh = new THREE.Mesh(boxGeo, wallMat);
          wallMesh.position.set(wx, wh * 0.5, wz);
          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;
          this.mazeGroup.add(wallMesh);

          this.walls.push({
            minX: wx - cs * 0.5,
            maxX: wx + cs * 0.5,
            minZ: wz - cs * 0.5,
            maxZ: wz + cs * 0.5,
            cx: wx,
            cz: wz
          });
        } else if (val === 'S') {
          this.startPos.set(wx, this.ballRadius, wz);
          this.ballPos.copy(this.startPos);
          this.ballVel.set(0, 0, 0);
          this.ballMesh.position.copy(this.ballPos);
        } else if (val === 'E') {
          this.exitPos.set(wx, 0, wz);
          this.portalGroup.position.set(wx, 0, wz);
        }
      }
    }

    // Adjust camera to frame the ENTIRE puzzle cleanly on screen
    this.fitCameraToEntirePuzzle();
    this.gameState = 'playing';
  }

  // Ensures the ENTIRE maze puzzle is completely visible on screen and centered
  fitCameraToEntirePuzzle() {
    const width = this.webglContainer.clientWidth || window.innerWidth;
    const height = this.webglContainer.clientHeight || window.innerHeight;
    const aspect = width / height;

    const boardW = this.mazeBounds.width + 1.2;
    const boardD = this.mazeBounds.depth + 1.2;

    const vFovRad = (45 * Math.PI) / 180;
    const tanHalfFov = Math.tan(vFovRad / 2);

    // Frame the entire maze width horizontally
    const distH = (boardW * 0.58) / (tanHalfFov * aspect);
    // Frame vertically (leaving room above D-Pad on portrait mobile)
    const availFrac = aspect < 1.0 ? 0.65 : 0.85;
    const distV = (boardD * 0.68) / (tanHalfFov * availFrac);

    this.baseCamDist = Math.max(distH, distV, 14.0);

    // Position camera at comfortable high 3D isometric angle
    this.updateCameraTracking(true);
  }

  updateCameraTracking(instant = false) {
    const width = this.webglContainer.clientWidth || window.innerWidth;
    const height = this.webglContainer.clientHeight || window.innerHeight;
    const aspect = width / height;

    // Shift focus slightly along Z on portrait to center the puzzle cleanly above D-Pad
    const centerZ = aspect < 1.0 ? 0.9 : 0.0;
    const targetCamX = 0;
    const targetCamY = this.baseCamDist * 1.18;
    const targetCamZ = centerZ + this.baseCamDist * 0.72;

    if (instant) {
      this.camera.position.set(targetCamX, targetCamY, targetCamZ);
    } else {
      this.camera.position.x += (targetCamX - this.camera.position.x) * 0.1;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 0.1;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.1;
    }

    this.camera.lookAt(0, 0.1, centerZ);
  }

  initEvents() {
    this.boundResize = this.resize.bind(this);
    window.addEventListener('resize', this.boundResize);

    // Keyboard Controls
    this.boundKeyDown = (e) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.input.up = true;
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.input.down = true;
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.input.left = true;
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.input.right = true;
          e.preventDefault();
          break;
      }
    };

    this.boundKeyUp = (e) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.input.up = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.input.down = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.input.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.input.right = false;
          break;
      }
    };

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);

    // D-Pad Touch & Click Controls
    const dpadButtons = this.container.querySelectorAll('.dpad-btn');
    dpadButtons.forEach(btn => {
      const dir = btn.dataset.dir;

      const startPress = (e) => {
        e.preventDefault();
        soundManager.init();
        this.input[dir] = true;
        btn.classList.add('active');
      };

      const endPress = (e) => {
        e.preventDefault();
        this.input[dir] = false;
        btn.classList.remove('active');
      };

      btn.addEventListener('pointerdown', startPress);
      btn.addEventListener('pointerup', endPress);
      btn.addEventListener('pointercancel', endPress);
      btn.addEventListener('pointerleave', endPress);
    });

    // Touch Drag on Maze Canvas
    let touchStartX = 0;
    let touchStartY = 0;
    const canvas = this.renderer.domElement;

    canvas.addEventListener('touchstart', (e) => {
      soundManager.init();
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        const dist = Math.hypot(dx, dy);

        if (dist > 14) {
          this.input.right = dx > 18;
          this.input.left = dx < -18;
          this.input.down = dy > 18;
          this.input.up = dy < -18;
        }
      }
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      this.input.up = false;
      this.input.down = false;
      this.input.left = false;
      this.input.right = false;
    });

    // Top buttons
    this.container.querySelector('#btn-maze-back').addEventListener('click', () => {
      soundManager.playClick();
      this.destroy();
      this.onExit();
    });

    this.container.querySelector('#btn-maze-restart').addEventListener('click', () => {
      soundManager.playClick();
      this.loadLevel(this.currentLevelIndex);
    });

    this.container.querySelector('#btn-maze-sound').addEventListener('click', () => {
      const isMuted = soundManager.toggleMute();
      this.updateSoundBtn(isMuted);
    });

    this.container.querySelector('#btn-maze-play-again').addEventListener('click', () => {
      soundManager.playClick();
      this.victoryModal.classList.add('hidden');
      this.loadLevel(0);
    });

    this.container.querySelector('#btn-maze-hub').addEventListener('click', () => {
      soundManager.playClick();
      this.destroy();
      this.onExit();
    });
  }

  updateSoundBtn(isMuted) {
    const btn = this.container.querySelector('#maze-sound-icon');
    if (!btn) return;
    if (isMuted) {
      btn.innerHTML = `<path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>`;
    } else {
      btn.innerHTML = `<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/>`;
    }
  }

  resize() {
    const width = this.webglContainer.clientWidth || window.innerWidth;
    const height = this.webglContainer.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.fitCameraToEntirePuzzle();
  }

  updatePhysics() {
    if (this.gameState !== 'playing') return;

    let ax = 0;
    let az = 0;

    if (this.input.up) az -= this.moveForce;
    if (this.input.down) az += this.moveForce;
    if (this.input.left) ax -= this.moveForce;
    if (this.input.right) ax += this.moveForce;

    if (ax !== 0 && az !== 0) {
      ax *= 0.707;
      az *= 0.707;
    }

    this.ballVel.x += ax;
    this.ballVel.z += az;
    this.ballVel.x *= this.friction;
    this.ballVel.z *= this.friction;

    const speed = Math.hypot(this.ballVel.x, this.ballVel.z);
    if (speed > this.maxSpeed) {
      this.ballVel.x = (this.ballVel.x / speed) * this.maxSpeed;
      this.ballVel.z = (this.ballVel.z / speed) * this.maxSpeed;
    }

    soundManager.updateRollingSpeed(speed / this.maxSpeed);

    // Predict next X and Z with independent wall-sliding resolution
    let nextX = this.ballPos.x + this.ballVel.x;
    let nextZ = this.ballPos.z + this.ballVel.z;
    const r = this.ballRadius;

    // Resolve X collisions
    for (const w of this.walls) {
      if (
        nextX + r > w.minX &&
        nextX - r < w.maxX &&
        this.ballPos.z + r * 0.85 > w.minZ &&
        this.ballPos.z - r * 0.85 < w.maxZ
      ) {
        if (this.ballVel.x > 0) {
          nextX = w.minX - r;
          this.ballVel.x = 0;
        } else if (this.ballVel.x < 0) {
          nextX = w.maxX + r;
          this.ballVel.x = 0;
        }
      }
    }

    // Resolve Z collisions
    for (const w of this.walls) {
      if (
        nextX + r * 0.85 > w.minX &&
        nextX - r * 0.85 < w.maxX &&
        nextZ + r > w.minZ &&
        nextZ - r < w.maxZ
      ) {
        if (this.ballVel.z > 0) {
          nextZ = w.minZ - r;
          this.ballVel.z = 0;
        } else if (this.ballVel.z < 0) {
          nextZ = w.maxZ + r;
          this.ballVel.z = 0;
        }
      }
    }

    this.ballPos.x = nextX;
    this.ballPos.z = nextZ;
    this.ballMesh.position.copy(this.ballPos);

    // Sphere Rolling Rotation Physics
    const rollAngleX = this.ballVel.z / r;
    const rollAngleZ = -this.ballVel.x / r;
    this.ballMesh.rotation.x += rollAngleX;
    this.ballMesh.rotation.z += rollAngleZ;

    // Dynamic Camera Tracking from start to exit
    this.updateCameraTracking(false);

    // Check Trigger Zone for Exit Portal
    const distToExit = Math.hypot(this.ballPos.x - this.exitPos.x, this.ballPos.z - this.exitPos.z);
    if (distToExit < 0.65) {
      this.triggerLevelComplete();
    }
  }

  triggerLevelComplete() {
    this.gameState = 'transitioning';
    soundManager.stopRollingLoop();
    soundManager.playPortalWarp();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.55 }
    });

    const isLastLevel = this.currentLevelIndex >= this.totalLevels - 1;

    if (isLastLevel) {
      setTimeout(() => {
        this.victoryModal.classList.remove('hidden');
        soundManager.playVictory();
      }, 700);
    } else {
      this.levelBanner.classList.remove('hidden');
      this.container.querySelector('#banner-title').innerText = `LEVEL ${this.currentLevelIndex + 1} CLEARED!`;

      setTimeout(() => {
        this.levelBanner.classList.add('hidden');
        this.loadLevel(this.currentLevelIndex + 1);
        soundManager.startRollingLoop();
      }, 1300);
    }
  }

  loop() {
    try {
      this.updatePhysics();

      if (this.portalEnergy) {
        this.portalEnergy.material.opacity = 0.5 + Math.sin(Date.now() * 0.006) * 0.25;
        this.portalGroup.children[0].rotation.z += 0.02;
      }

      this.renderer.render(this.scene, this.camera);
    } catch (err) {
      console.error('Maze render loop error:', err);
    }

    this.animId = requestAnimationFrame(this.loop.bind(this));
  }

  destroy() {
    cancelAnimationFrame(this.animId);
    soundManager.stopRollingLoop();
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);

    if (this.renderer && this.renderer.domElement) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  }
}
