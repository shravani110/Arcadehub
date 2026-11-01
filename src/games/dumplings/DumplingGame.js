// DumplingGame.js - Suika-style Physics Merging Game with Squishy Dumplings
import Matter from 'matter-js';
import confetti from 'canvas-confetti';
import { DUMPLING_TIERS } from './DumplingTiers.js';
import { DumplingRenderer } from './DumplingRenderer.js';
import { soundManager } from '../../sound/SoundManager.js';

const { Engine, World, Bodies, Composite, Events } = Matter;

export class DumplingGame {
  constructor(containerEl, onExit) {
    this.container = containerEl;
    this.onExit = onExit;

    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('dumpling_high_score') || '0', 10);
    this.gameState = 'playing';

    this.currentTierIndex = 0; // Tier 1: Cosmic Blue Sparkle (matching Screenshot 3)
    this.nextTierIndex = 0;
    this.aimX = 0;
    this.canDrop = true;
    this.dropCooldown = 0;
    this.hasDroppedFirst = false;

    this.dumplings = [];
    this.particles = [];
    this.mergingPairs = new Set();

    this.dangerTimer = 0;
    this.isDangerWarning = false;

    this.initDOM();
    this.initPhysics();
    this.initEvents();
    this.resize();

    this.animId = requestAnimationFrame(this.loop.bind(this));
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper dumpling-wrapper">
        <canvas id="dumpling-canvas"></canvas>

        <!-- Top Navigation Bar -->
        <div class="game-top-bar dumpling-top-bar">
          <button class="icon-btn" id="btn-dumpling-back" title="Back to Lobby">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          
          <div class="dumpling-score-board">
            <div class="score-card">
              <span class="score-lbl">SCORE</span>
              <span class="score-val" id="dumpling-score">0</span>
            </div>
            <div class="score-card">
              <span class="score-lbl">BEST</span>
              <span class="score-val" id="dumpling-best">${this.highScore}</span>
            </div>
          </div>

          <div class="top-controls">
            <button class="icon-btn" id="btn-dumpling-sound" title="Toggle Sound">
              <svg id="dumpling-sound-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>
            </button>
            <button class="icon-btn" id="btn-dumpling-restart" title="Restart Game">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            </button>
          </div>
        </div>

        <!-- Next Dumpling Indicator -->
        <div class="next-dumpling-preview">
          <span class="next-lbl">NEXT</span>
          <div class="next-bubble" id="next-bubble"></div>
        </div>

        <!-- Game Over Modal Overlay -->
        <div class="modal-overlay hidden" id="dumpling-modal">
          <div class="modal-card">
            <h2 id="dumpling-modal-title">Basket Overflowed!</h2>
            <p>Your squishy dumplings piled up past the steam line!</p>
            <div class="modal-stats">
              <div class="stat-item">
                <span class="stat-val" id="final-dumpling-score">0</span>
                <span class="stat-lbl">FINAL SCORE</span>
              </div>
              <div class="stat-item">
                <span class="stat-val" id="final-dumpling-best">${this.highScore}</span>
                <span class="stat-lbl">BEST SCORE</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn btn-primary" id="btn-dumpling-modal-restart">Play Again</button>
              <button class="btn btn-secondary" id="btn-dumpling-modal-hub">Back to Lobby</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#dumpling-canvas');
    this.renderer = new DumplingRenderer(this.canvas);
    this.scoreEl = this.container.querySelector('#dumpling-score');
    this.bestEl = this.container.querySelector('#dumpling-best');
    this.modal = this.container.querySelector('#dumpling-modal');
    this.finalScoreEl = this.container.querySelector('#final-dumpling-score');
    this.finalBestEl = this.container.querySelector('#final-dumpling-best');
    this.nextBubble = this.container.querySelector('#next-bubble');

    this.prepareNextQueue();
  }

  initPhysics() {
    this.engine = Engine.create({
      gravity: { x: 0, y: 1.25, scale: 0.001 }
    });
    this.world = this.engine.world;

    this.containerRect = { x: 0, y: 0, width: 0, height: 0 };
    this.dangerY = 0;

    Events.on(this.engine, 'collisionStart', (evt) => {
      const pairs = evt.pairs;
      for (const pair of pairs) {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        if (
          bodyA.isDumpling &&
          bodyB.isDumpling &&
          bodyA.dumplingTier === bodyB.dumplingTier &&
          !this.mergingPairs.has(bodyA.id) &&
          !this.mergingPairs.has(bodyB.id)
        ) {
          this.handleMerge(bodyA, bodyB);
        } else if (bodyA.isDumpling && bodyB.isDumpling) {
          const relSpeed = Math.hypot(
            bodyA.velocity.x - bodyB.velocity.x,
            bodyA.velocity.y - bodyB.velocity.y
          );
          if (relSpeed > 0.8) {
            soundManager.playDumplingBounce(relSpeed);
          }
        }
      }
    });
  }

  setupContainerPhysics() {
    if (this.wallLeft) Composite.remove(this.world, this.wallLeft);
    if (this.wallRight) Composite.remove(this.world, this.wallRight);
    if (this.wallBottom) Composite.remove(this.world, this.wallBottom);

    const r = this.containerRect;
    const thickness = 50;

    this.wallLeft = Bodies.rectangle(r.x - thickness * 0.5, r.y + r.height * 0.5, thickness, r.height + 200, {
      isStatic: true,
      friction: 0.12,
      restitution: 0.25
    });

    this.wallRight = Bodies.rectangle(r.x + r.width + thickness * 0.5, r.y + r.height * 0.5, thickness, r.height + 200, {
      isStatic: true,
      friction: 0.12,
      restitution: 0.25
    });

    this.wallBottom = Bodies.rectangle(r.x + r.width * 0.5, r.y + r.height + thickness * 0.5, r.width + 100, thickness, {
      isStatic: true,
      friction: 0.22,
      restitution: 0.2
    });

    World.add(this.world, [this.wallLeft, this.wallRight, this.wallBottom]);
  }

  prepareNextQueue() {
    this.currentTierIndex = this.nextTierIndex || 0;
    const rand = Math.random();
    this.nextTierIndex = rand < 0.5 ? 0 : rand < 0.85 ? 1 : 2;

    const nextTier = DUMPLING_TIERS[this.nextTierIndex];
    if (this.nextBubble) {
      this.nextBubble.style.background = `radial-gradient(circle at 35% 35%, ${nextTier.lightColor}, ${nextTier.baseColor})`;
    }
  }

  initEvents() {
    this.boundResize = this.resize.bind(this);
    window.addEventListener('resize', this.boundResize);

    const updateAim = (clientX) => {
      const rect = this.canvas.getBoundingClientRect();
      const rawX = clientX - rect.left;
      const curTier = DUMPLING_TIERS[this.currentTierIndex];
      const minX = this.containerRect.x + curTier.radius + 6;
      const maxX = this.containerRect.x + this.containerRect.width - curTier.radius - 6;

      this.aimX = Math.max(minX, Math.min(maxX, rawX));
    };

    this.canvas.addEventListener('pointermove', (e) => {
      updateAim(e.clientX);
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || e.target.closest('.modal-card')) return;
      soundManager.init();
      updateAim(e.clientX);
      this.dropCurrentDumpling();
    });

    this.container.querySelector('#btn-dumpling-back').addEventListener('click', () => {
      soundManager.playClick();
      this.destroy();
      this.onExit();
    });

    this.container.querySelector('#btn-dumpling-restart').addEventListener('click', () => {
      soundManager.playClick();
      this.restart();
    });

    this.container.querySelector('#btn-dumpling-sound').addEventListener('click', () => {
      const isMuted = soundManager.toggleMute();
      this.updateSoundBtn(isMuted);
    });

    this.container.querySelector('#btn-dumpling-modal-restart').addEventListener('click', () => {
      soundManager.playClick();
      this.restart();
    });

    this.container.querySelector('#btn-dumpling-modal-hub').addEventListener('click', () => {
      soundManager.playClick();
      this.destroy();
      this.onExit();
    });
  }

  updateSoundBtn(isMuted) {
    const btn = this.container.querySelector('#dumpling-sound-icon');
    if (!btn) return;
    if (isMuted) {
      btn.innerHTML = `<path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>`;
    } else {
      btn.innerHTML = `<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/>`;
    }
  }

  resize() {
    this.renderer.resize();
    const w = this.canvas.width / this.renderer.scale;
    const h = this.canvas.height / this.renderer.scale;

    // Responsive container bounds - compact, authentic Dim Sum Steamer Basket size
    const isMobile = w < 480;
    const maxBasketW = Math.min(300, w * (isMobile ? 0.78 : 0.72));
    const maxBasketH = Math.min(300, Math.max(240, h * 0.35));
    const basketWidth = Math.max(isMobile ? 260 : 270, maxBasketW);
    const basketHeight = Math.max(isMobile ? 260 : 270, maxBasketH);

    const basketX = (w - basketWidth) * 0.5;
    const basketY = h - basketHeight - (isMobile ? 42 : 55);

    this.containerRect = {
      x: basketX,
      y: basketY,
      width: basketWidth,
      height: basketHeight
    };

    this.dangerY = basketY + (isMobile ? 24 : 28);
    this.aimX = basketX + basketWidth * 0.5;

    this.setupContainerPhysics();
  }

  dropCurrentDumpling() {
    if (!this.canDrop || this.gameState !== 'playing') return;

    this.hasDroppedFirst = true;
    this.canDrop = false;
    this.dropCooldown = 26;

    const curTier = DUMPLING_TIERS[this.currentTierIndex];
    soundManager.playDumplingDrop();

    const dropY = this.dangerY - 45;
    const body = Bodies.circle(this.aimX, dropY, curTier.radius, {
      friction: 0.15,
      frictionAir: 0.001,
      restitution: 0.28,
      density: 0.0025
    });

    body.isDumpling = true;
    body.dumplingTier = curTier.tier;

    const dumplingData = {
      body: body,
      tierData: curTier,
      squish: { x: 1, y: 1 },
      squishVel: { x: 0, y: 0 },
      blinkTimer: Math.random() * 120 + 60,
      isBlinking: false
    };

    this.dumplings.push(dumplingData);
    World.add(this.world, body);

    this.prepareNextQueue();
  }

  handleMerge(bodyA, bodyB) {
    this.mergingPairs.add(bodyA.id);
    this.mergingPairs.add(bodyB.id);

    const tier = bodyA.dumplingTier;
    const midX = (bodyA.position.x + bodyB.position.x) * 0.5;
    const midY = (bodyA.position.y + bodyB.position.y) * 0.5;

    soundManager.playDumplingMerge(tier);
    this.createMergeParticles(midX, midY, DUMPLING_TIERS[tier - 1]);

    const earnedPoints = DUMPLING_TIERS[tier - 1].points;
    this.score += earnedPoints;
    this.scoreEl.innerText = this.score;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.bestEl.innerText = this.highScore;
      localStorage.setItem('dumpling_high_score', this.highScore);
    }

    this.dumplings = this.dumplings.filter(d => d.body !== bodyA && d.body !== bodyB);
    Composite.remove(this.world, bodyA);
    Composite.remove(this.world, bodyB);

    if (tier < DUMPLING_TIERS.length) {
      const nextTier = DUMPLING_TIERS[tier];
      const nextBody = Bodies.circle(midX, midY, nextTier.radius, {
        friction: 0.15,
        frictionAir: 0.001,
        restitution: 0.32,
        density: 0.0028
      });

      nextBody.isDumpling = true;
      nextBody.dumplingTier = nextTier.tier;

      const newDumpling = {
        body: nextBody,
        tierData: nextTier,
        squish: { x: 1.35, y: 0.7 },
        squishVel: { x: 0, y: 0 },
        blinkTimer: 80,
        isBlinking: false
      };

      this.dumplings.push(newDumpling);
      World.add(this.world, nextBody);

      if (nextTier.tier >= 9) {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    }
  }

  createMergeParticles(x, y, tierData) {
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const speed = Math.random() * 4.5 + 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius: Math.random() * 4 + 3,
        color: i % 2 === 0 ? tierData.lightColor : '#ffffff',
        alpha: 1,
        life: 28
      });
    }
  }

  updatePhysics() {
    Engine.update(this.engine, 1000 / 60);

    if (this.dropCooldown > 0) {
      this.dropCooldown--;
      if (this.dropCooldown <= 0) {
        this.canDrop = true;
      }
    }

    let anyAboveDanger = false;
    for (const d of this.dumplings) {
      d.squish.x += d.squishVel.x;
      d.squish.y += d.squishVel.y;
      d.squishVel.x += (1.0 - d.squish.x) * 0.22 - d.squishVel.x * 0.28;
      d.squishVel.y += (1.0 - d.squish.y) * 0.22 - d.squishVel.y * 0.28;

      d.blinkTimer--;
      if (d.blinkTimer <= 0) {
        if (!d.isBlinking) {
          d.isBlinking = true;
          d.blinkTimer = 10;
        } else {
          d.isBlinking = false;
          d.blinkTimer = Math.random() * 150 + 90;
        }
      }

      const speed = Math.hypot(d.body.velocity.x, d.body.velocity.y);
      if (this.hasDroppedFirst && d.body.position.y - d.tierData.radius < this.dangerY && speed < 0.35) {
        anyAboveDanger = true;
      }
    }

    if (anyAboveDanger) {
      this.dangerTimer++;
      this.isDangerWarning = true;
      if (this.dangerTimer % 35 === 0) {
        soundManager.playDangerBeep();
      }
      if (this.dangerTimer > 160) {
        this.triggerGameOver();
      }
    } else {
      this.dangerTimer = Math.max(0, this.dangerTimer - 2);
      this.isDangerWarning = false;
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.alpha -= 1 / p.life;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  triggerGameOver() {
    if (this.gameState === 'gameover') return;
    this.gameState = 'gameover';
    soundManager.playGameOver();

    setTimeout(() => {
      this.finalScoreEl.innerText = this.score;
      this.finalBestEl.innerText = this.highScore;
      this.modal.classList.remove('hidden');
    }, 600);
  }

  restart() {
    this.modal.classList.add('hidden');
    for (const d of this.dumplings) {
      Composite.remove(this.world, d.body);
    }
    this.dumplings = [];
    this.particles = [];
    this.mergingPairs.clear();
    this.score = 0;
    this.scoreEl.innerText = '0';
    this.gameState = 'playing';
    this.canDrop = true;
    this.dropCooldown = 0;
    this.dangerTimer = 0;
    this.isDangerWarning = false;
    this.hasDroppedFirst = false;

    this.prepareNextQueue();
  }

  loop() {
    try {
      if (this.gameState === 'playing') {
        this.updatePhysics();
      }

      const renderer = this.renderer;
      const ctx = renderer.ctx;

      renderer.clear();
      ctx.save();
      ctx.scale(renderer.scale, renderer.scale);

      // 1. Draw Woven Bamboo Background & Container Walls
      renderer.drawBackground(this.dangerY, this.containerRect, this.isDangerWarning);

      // 2. Draw Floating Instruction Banner if player hasn't dropped yet (Screenshot 3)
      if (!this.hasDroppedFirst) {
        renderer.drawPromptBanner(this.containerRect.x + this.containerRect.width * 0.5, this.dangerY + 90);
      }

      // 3. Draw Preview Dumpling at Dropper Spawner Top
      if (this.canDrop && this.gameState === 'playing') {
        const curTier = DUMPLING_TIERS[this.currentTierIndex];
        const previewY = this.dangerY - 45;

        ctx.save();
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.aimX, previewY + curTier.radius);
        ctx.lineTo(this.aimX, this.containerRect.y + this.containerRect.height);
        ctx.stroke();
        ctx.restore();

        renderer.drawDumpling(this.aimX, previewY, curTier, 0, { x: 1, y: 1 });
      }

      // 4. Draw All Stacked Dumplings in Basket
      for (const d of this.dumplings) {
        const pos = d.body.position;
        const angle = d.body.angle;
        renderer.drawDumpling(pos.x, pos.y, d.tierData, angle, d.squish, d.isBlinking);
      }

      // 5. Draw Merge Burst Particles
      for (const p of this.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    } catch (err) {
      console.error('Dumpling render error:', err);
    }

    this.animId = requestAnimationFrame(this.loop.bind(this));
  }

  destroy() {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.boundResize);
    Engine.clear(this.engine);
  }
}
