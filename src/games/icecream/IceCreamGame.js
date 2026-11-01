// IceCreamGame.js - Physics-driven 2D Ice Cream Stacking Game
// Real solid ice cream stacking cleanly cup by cup on an authentic empty waffle cone.
import confetti from 'canvas-confetti';
import { IceCreamRenderer, ICE_CREAM_FLAVORS } from './IceCreamRenderer.js';
import { soundManager } from '../../sound/SoundManager.js';

export class IceCreamGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    this.targetScoops = 12;
    this.gameState = 'ready'; // ready, playing, won, lost

    this.spawnerX = 0;
    this.spawnerY = 70;
    this.spawnerSpeed = 2.4;
    this.spawnerDir = 1;
    this.isManualAim = false;
    this.currentFlavorIndex = 0;
    this.nextFlavor = ICE_CREAM_FLAVORS[0];

    // Stacked scoops array: starts completely EMPTY!
    this.stackedScoops = [];
    this.stackedCount = 0;

    // Active falling scoop
    this.fallingScoop = null;
    this.canDrop = true;
    this.dropCooldown = 0;

    this.conePos = { x: 0, y: 0, width: 175, height: 303 };
    this.coneAngle = 0;
    this.towerStability = 1.0;
    this.cameraOffsetY = 0;
    this.targetCameraY = 0;

    this.scoopDims = { width: 135, height: 105 };

    // Topple animation variables
    this.toppling = false;
    this.toppleVel = 0;
    this.toppleAngle = 0;

    this.initDOM();
    this.initEvents();
    this.resize();

    this.animId = requestAnimationFrame(this.loop.bind(this));
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper icecream-wrapper">
        <canvas id="icecream-canvas"></canvas>
        
        <!-- Top Navigation Bar -->
        <div class="game-top-bar">
          <button class="icon-btn" id="btn-back" title="Back to Lobby">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          
          <div class="flavor-indicator">
            <span class="flavor-dot" id="flavor-dot"></span>
            <span class="flavor-name" id="flavor-name">Belgian Dark Chocolate</span>
          </div>

          <div class="top-controls">
            <button class="icon-btn" id="btn-sound" title="Toggle Sound">
              <svg id="sound-icon-on" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>
            </button>
            <button class="icon-btn" id="btn-restart" title="Restart Game">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            </button>
          </div>
        </div>

        <!-- Tap anywhere instruction hint -->
        <div class="tap-hint" id="tap-hint">Tap where you want the scoop to drop!</div>

        <!-- Game Over / Victory Modal Overlay -->
        <div class="modal-overlay hidden" id="game-modal">
          <div class="modal-card">
            <h2 id="modal-title">Tower Toppled!</h2>
            <p id="modal-desc">You stacked 4 out of 12 scoops. Keep the tower balanced!</p>
            <div class="modal-stats">
              <div class="stat-item">
                <span class="stat-val" id="final-scoops">4/12</span>
                <span class="stat-lbl">SCOOPS</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn btn-primary" id="btn-modal-restart">Try Again</button>
              <button class="btn btn-secondary" id="btn-modal-hub">Back to Lobby</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#icecream-canvas');
    this.renderer = new IceCreamRenderer(this.canvas);

    this.modal = this.container.querySelector('#game-modal');
    this.modalTitle = this.container.querySelector('#modal-title');
    this.modalDesc = this.container.querySelector('#modal-desc');
    this.finalScoops = this.container.querySelector('#final-scoops');
    this.tapHint = this.container.querySelector('#tap-hint');
    this.flavorDot = this.container.querySelector('#flavor-dot');
    this.flavorName = this.container.querySelector('#flavor-name');

    if (this.flavorDot) this.flavorDot.style.background = this.nextFlavor.colorBase;
    if (this.flavorName) this.flavorName.innerText = this.nextFlavor.name;
  }

  initEvents() {
    this.boundResize = this.resize.bind(this);
    window.addEventListener('resize', this.boundResize);

    const getCanvasPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) / this.renderer.scale,
        y: (clientY - rect.top) / this.renderer.scale
      };
    };

    // When moving pointer/touch across screen: aim scoop horizontally
    const onPointerMove = (e) => {
      if (!this.canDrop || this.fallingScoop || (this.gameState !== 'ready' && this.gameState !== 'playing')) return;
      const pos = getCanvasPos(e);
      const w = this.canvas.width / this.renderer.scale;
      const maxReach = Math.min(w * 0.44, this.conePos.width * 1.25);
      this.spawnerX = Math.max(w * 0.5 - maxReach, Math.min(w * 0.5 + maxReach, pos.x));
      this.isManualAim = true;
    };

    // When tapping: drop scoop directly at tapped position!
    const onDropTrigger = (e) => {
      if (e.target.closest('button') || e.target.closest('.modal-card')) return;
      const pos = getCanvasPos(e);
      this.dropCurrentScoopAt(pos.x);
    };

    this.canvas.addEventListener('pointermove', onPointerMove);
    this.canvas.addEventListener('pointerdown', onDropTrigger);

    this.container.querySelector('#btn-back').addEventListener('click', () => {
      soundManager.playClick();
      this.destroy();
      this.onExit();
    });

    this.container.querySelector('#btn-restart').addEventListener('click', () => {
      soundManager.playClick();
      this.restart();
    });

    this.container.querySelector('#btn-sound').addEventListener('click', () => {
      const isMuted = soundManager.toggleMute();
      this.updateSoundBtn(isMuted);
    });

    this.container.querySelector('#btn-modal-restart').addEventListener('click', () => {
      soundManager.playClick();
      this.restart();
    });

    this.container.querySelector('#btn-modal-hub').addEventListener('click', () => {
      soundManager.playClick();
      this.destroy();
      this.onExit();
    });
  }

  updateSoundBtn(isMuted) {
    const btn = this.container.querySelector('#btn-sound');
    if (!btn) return;
    if (isMuted) {
      btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
    } else {
      btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>`;
    }
  }

  resize() {
    this.renderer.resize();
    const w = this.canvas.width / this.renderer.scale;
    const h = this.canvas.height / this.renderer.scale;

    // Mobile-responsive authentic 3D hand & cone dimensions (aspect ratio 1.73 = 277 / 160)
    const isMobile = w < 480;
    const handWidth = isMobile
      ? Math.min(195, Math.max(145, w * 0.42))
      : Math.min(225, Math.max(170, w * 0.36));
    const handHeight = handWidth * 1.73;

    this.conePos.x = w * 0.5;
    this.conePos.width = handWidth;
    this.conePos.height = handHeight;
    this.conePos.y = h - handHeight * 0.88; // Sits naturally at the bottom

    // Scoop dimensions proportional to cone opening (cone opening is 0.52 of handWidth)
    this.scoopDims.width = handWidth * 0.65;
    this.scoopDims.height = this.scoopDims.width * (122 / 157);

    this.spawnerY = Math.max(isMobile ? 56 : 68, Math.min(isMobile ? 78 : 95, h * 0.11));
    if (!this.isManualAim) {
      this.spawnerX = w * 0.5;
    }
  }

  dropCurrentScoopAt(targetX) {
    if (!this.canDrop || this.fallingScoop || (this.gameState !== 'ready' && this.gameState !== 'playing')) return;

    if (this.tapHint) {
      this.tapHint.style.opacity = '0';
    }
    this.gameState = 'playing';

    const w = this.canvas.width / this.renderer.scale;
    const maxReach = Math.min(w * 0.44, this.conePos.width * 1.25);
    const dropX = targetX !== undefined 
      ? Math.max(w * 0.5 - maxReach, Math.min(w * 0.5 + maxReach, targetX))
      : this.spawnerX;

    this.spawnerX = dropX;
    const flavor = this.nextFlavor;
    soundManager.playScoopDrop();

    this.fallingScoop = {
      x: dropX,
      y: this.spawnerY - this.cameraOffsetY,
      vy: 2.4,
      flavorId: flavor.id,
      missed: false,
      angle: 0,
      spin: 0
    };

    this.canDrop = false;
    this.dropCooldown = 28;

    // Advance to next flavor
    this.currentFlavorIndex = (this.currentFlavorIndex + 1) % ICE_CREAM_FLAVORS.length;
    this.nextFlavor = ICE_CREAM_FLAVORS[this.currentFlavorIndex];
    if (this.flavorDot) this.flavorDot.style.background = this.nextFlavor.colorBase;
    if (this.flavorName) this.flavorName.innerText = this.nextFlavor.name;
  }

  updatePhysics() {
    const w = this.canvas.width / this.renderer.scale;

    // 1. Spawner sweeping if user is not actively aiming with touch/mouse
    if (!this.isManualAim) {
      const spawnerHalfRange = Math.min(w * 0.28, this.conePos.width * 0.65);
      const minX = (w * 0.5) - spawnerHalfRange;
      const maxX = (w * 0.5) + spawnerHalfRange;

      this.spawnerX += this.spawnerSpeed * this.spawnerDir;
      if (this.spawnerX >= maxX) {
        this.spawnerX = maxX;
        this.spawnerDir = -1;
      } else if (this.spawnerX <= minX) {
        this.spawnerX = minX;
        this.spawnerDir = 1;
      }
    }

    if (this.dropCooldown > 0) {
      this.dropCooldown--;
      if (this.dropCooldown <= 0 && !this.fallingScoop) {
        this.canDrop = true;
      }
    }

    // Smooth camera tracking to keep the tower and drop zone perfectly framed
    if (this.stackedScoops.length > 0) {
      const topScoop = this.stackedScoops[this.stackedScoops.length - 1];
      const currentScreenY = topScoop.y + this.cameraOffsetY;
      const desiredScreenY = Math.max(this.spawnerY + this.scoopDims.height * 1.4, 220);
      if (currentScreenY < desiredScreenY) {
        this.targetCameraY = desiredScreenY - topScoop.y;
      } else {
        this.targetCameraY = 0;
      }
    } else {
      this.targetCameraY = 0;
    }
    this.cameraOffsetY += (this.targetCameraY - this.cameraOffsetY) * 0.08;

    // 2. Active falling scoop physics
    if (this.fallingScoop) {
      const fs = this.fallingScoop;
      fs.vy += 0.65; // Solid gravity
      fs.y += fs.vy;
      fs.x += fs.spin;
      fs.angle += fs.spin * 0.05;

      const h = this.canvas.height / this.renderer.scale;

      if (!fs.missed) {
        if (this.stackedScoops.length === 0) {
          // Landing into the EMPTY cone mouth!
          // Cone rim is at y = 12 / 277 * coneHeight
          const coneRimY = this.conePos.y + this.conePos.height * (12 / 277);
          // Scoop sits somewhat down inside the cone opening (resting snug in the mouth)
          const targetY = coneRimY + this.scoopDims.height * 0.16;
          const catchRadius = this.scoopDims.width * 0.66;

          if (fs.y >= targetY) {
            const dx = fs.x - this.conePos.x;
            if (Math.abs(dx) <= catchRadius) {
              // Placed directly where player tapped!
              this.landScoop(fs.x, targetY, fs.flavorId, dx);
            } else {
              // Missed cone opening!
              fs.missed = true;
              fs.spin = Math.sign(dx) * 2.8;
            }
          }
        } else {
          // Stacking on top of previous scoop cup by cup!
          const topScoop = this.stackedScoops[this.stackedScoops.length - 1];
          // Authentic cup-by-cup overlap
          const targetY = topScoop.y - this.scoopDims.height * 0.55;
          const catchRadius = this.scoopDims.width * 0.68;

          if (fs.y >= targetY) {
            const dx = fs.x - topScoop.x;
            if (Math.abs(dx) <= catchRadius) {
              // Placed directly where player tapped!
              this.landScoop(fs.x, targetY, fs.flavorId, fs.x - this.conePos.x);
            } else {
              // Missed the stack!
              fs.missed = true;
              fs.spin = Math.sign(dx) * 3.2;
            }
          }
        }
      }

      // Check if missed scoop fell off screen
      if (fs.y + this.cameraOffsetY > h + 120) {
        this.fallingScoop = null;
        this.triggerGameOver('fallen');
      }
    }

    // 3. Topple animation if tower collapsed
    if (this.toppling) {
      this.toppleVel += 0.012;
      this.toppleAngle += this.toppleVel;

      for (let i = 0; i < this.stackedScoops.length; i++) {
        const s = this.stackedScoops[i];
        s.y += (i + 1) * 3.5;
        s.x += Math.sign(this.toppleVel) * (i + 1) * 2.8;
      }
    }
  }

  landScoop(x, y, flavorId, offsetFromCenter) {
    this.fallingScoop = null;

    // Solid scoop placed onto stack at EXACT player-chosen X!
    this.stackedScoops.push({
      x: x,
      y: y,
      flavorId: flavorId,
      offset: offsetFromCenter
    });

    this.stackedCount = this.stackedScoops.length;
    soundManager.playCreamSplat(this.towerStability);

    // Calculate center of mass and dynamic tower tilt/twist driven by player placement
    let weightedOffset = 0;
    for (let i = 0; i < this.stackedScoops.length; i++) {
      const heightMultiplier = 1.0 + i * 0.18; // higher scoops have greater leverage
      weightedOffset += (this.stackedScoops[i].x - this.conePos.x) * heightMultiplier;
    }
    const avgOffset = weightedOffset / this.stackedScoops.length;
    const maxAllowedOffset = this.scoopDims.width * 0.62;
    const leanFactor = avgOffset / maxAllowedOffset;

    this.towerStability = Math.max(0, 1.0 - Math.min(1.0, Math.abs(leanFactor)));
    // Tower tilts based on the player's placements!
    this.coneAngle = leanFactor * 0.10;

    // Topple if player let the center of mass drift too far
    if (Math.abs(leanFactor) > 0.85) {
      soundManager.playTowerWobble();
    }
    if (Math.abs(leanFactor) > 1.35) {
      this.triggerTopple(leanFactor);
      return;
    }

    // Win condition: 12 scoops stacked!
    if (this.stackedCount >= this.targetScoops) {
      this.triggerWin();
    } else {
      this.canDrop = true;
    }
  }

  triggerTopple(leanFactor) {
    if (this.gameState === 'lost' || this.gameState === 'won') return;
    this.gameState = 'lost';
    this.toppling = true;
    this.toppleVel = Math.sign(leanFactor) * 0.05;
    soundManager.playTopple();

    setTimeout(() => {
      this.modalTitle.innerText = '💥 Tower Toppled!';
      this.modalTitle.style.color = '#e74c3c';
      this.modalDesc.innerText = 'The center of mass drifted too far and the delicious tower collapsed!';
      this.finalScoops.innerText = `${this.stackedCount} / ${this.targetScoops}`;
      this.modal.classList.remove('hidden');
    }, 900);
  }

  triggerGameOver(reason) {
    if (this.gameState === 'lost' || this.gameState === 'won') return;
    this.gameState = 'lost';
    soundManager.playTopple();

    setTimeout(() => {
      this.modalTitle.innerText = '🍦 Scoop Slipped Off!';
      this.modalTitle.style.color = '#e74c3c';
      this.modalDesc.innerText = 'The scoop missed the cone and splattered on the floor!';
      this.finalScoops.innerText = `${this.stackedCount} / ${this.targetScoops}`;
      this.modal.classList.remove('hidden');
    }, 800);
  }

  triggerWin() {
    this.gameState = 'won';
    soundManager.playVictory();

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      this.modalTitle.innerText = '🍦 Delicious Perfection!';
      this.modalTitle.style.color = '#2ecc71';
      this.modalDesc.innerText = 'You masterfully stacked all 12 scoops on the cone without toppling!';
      this.finalScoops.innerText = `12 / 12`;
      this.modal.classList.remove('hidden');
    }, 1200);
  }

  restart() {
    this.modal.classList.add('hidden');
    if (this.tapHint) this.tapHint.style.opacity = '1';

    this.stackedScoops = [];
    this.stackedCount = 0;
    this.fallingScoop = null;
    this.toppling = false;
    this.toppleVel = 0;
    this.toppleAngle = 0;
    this.cameraOffsetY = 0;
    this.targetCameraY = 0;

    this.gameState = 'ready';
    this.canDrop = true;
    this.dropCooldown = 0;
    this.towerStability = 1.0;
    this.coneAngle = 0;
    this.isManualAim = false;
    this.currentFlavorIndex = 0;
    this.nextFlavor = ICE_CREAM_FLAVORS[0];

    if (this.flavorDot) this.flavorDot.style.background = this.nextFlavor.colorBase;
    if (this.flavorName) this.flavorName.innerText = this.nextFlavor.name;
  }

  loop() {
    try {
      this.updatePhysics();

      this.renderer.clear();

      const ctx = this.renderer.ctx;
      ctx.save();
      ctx.scale(this.renderer.scale, this.renderer.scale);

      // World-space container with smooth vertical camera tracking
      ctx.save();
      ctx.translate(0, this.cameraOffsetY);

      // Physical tower sway: rotate cone & all scoops together from the hand grasp pivot
      const totalAngle = this.coneAngle + this.toppleAngle;
      const pivotX = this.conePos.x;
      const pivotY = this.conePos.y + this.conePos.height * 0.65;

      ctx.save();
      if (Math.abs(totalAngle) > 0.001) {
        ctx.translate(pivotX, pivotY);
        ctx.rotate(totalAngle);
        ctx.translate(-pivotX, -pivotY);
      }

      // 1. Draw Authentic Realistic 3D Hand and Empty Perfect Waffle Cone
      this.renderer.drawHandAndCone(
        this.conePos.x,
        this.conePos.y,
        this.conePos.width,
        this.conePos.height,
        0
      );

      // 2. Draw Stacked Ice Cream Scoops (Solid, cup by cup, with NO flat cuts)
      for (let i = 0; i < this.stackedScoops.length; i++) {
        const s = this.stackedScoops[i];
        this.renderer.drawScoop(
          s.x,
          s.y,
          this.scoopDims.width,
          this.scoopDims.height,
          s.flavorId,
          0
        );
      }

      ctx.restore(); // restore physical tower sway

      // 3. Draw Active Falling Scoop (if currently dropping)
      if (this.fallingScoop) {
        const fs = this.fallingScoop;
        this.renderer.drawScoop(
          fs.x,
          fs.y,
          this.scoopDims.width,
          this.scoopDims.height,
          fs.flavorId,
          fs.angle
        );
      }

      // 4. Draw Moving/Aiming Spawner at top
      if (this.canDrop && (this.gameState === 'ready' || this.gameState === 'playing')) {
        this.renderer.drawSpawner(
          this.spawnerX,
          this.spawnerY - this.cameraOffsetY,
          this.nextFlavor.id,
          this.scoopDims.width,
          this.scoopDims.height
        );
      }

      ctx.restore(); // restore camera offset

      // 5. Draw Live UI (always in fixed screen coordinates)
      this.renderer.drawUI(this.stackedCount, this.targetScoops, this.towerStability);

      ctx.restore(); // restore renderer scale
    } catch (err) {
      console.error('IceCream render error:', err);
    }

    this.animId = requestAnimationFrame(this.loop.bind(this));
  }

  destroy() {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.boundResize);
  }
}
