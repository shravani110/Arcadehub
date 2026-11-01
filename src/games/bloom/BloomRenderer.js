// BloomRenderer.js - Authentic Bloom Sort 4x4 Flower Pot Canvas Renderer
export class BloomRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // Flying petals during sort transfer animations
    this.flyingPetals = [];
    // Blooming burst particles
    this.bloomParticles = [];
    // Floating score popups
    this.floatingTexts = [];
    // Background decorative leaves
    this.leaves = this.generateDecorativeLeaves();
  }

  generateDecorativeLeaves() {
    const list = [];
    const count = 18;
    for (let i = 0; i < count; i++) {
      list.push({
        xRatio: Math.random(),
        yRatio: Math.random(),
        size: Math.random() * 16 + 18,
        angle: Math.random() * Math.PI * 2,
        color: Math.random() < 0.5 ? '#86efac' : '#4ade80'
      });
    }
    return list;
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  spawnFlyingPetal(fromX, fromY, toX, toY, color, onComplete) {
    this.flyingPetals.push({
      fromX, fromY,
      toX, toY,
      x: fromX, y: fromY,
      color,
      progress: 0,
      onComplete
    });
  }

  spawnBloomBurst(cx, cy, color) {
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2.5;
      this.bloomParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        radius: Math.random() * 7 + 4,
        color: color,
        alpha: 1.0,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2
      });
    }
  }

  spawnFloatingText(text, x, y, color = '#ffffff', fontSize = 28) {
    this.floatingTexts.push({
      text,
      x, y,
      vy: -1.6,
      alpha: 1.0,
      scale: 1.3,
      color,
      fontSize
    });
  }

  updateAnimations(dt) {
    // Flying petals
    for (let i = this.flyingPetals.length - 1; i >= 0; i--) {
      const fp = this.flyingPetals[i];
      fp.progress += dt * 3.5; // reaches target in ~300ms
      if (fp.progress >= 1.0) {
        if (fp.onComplete) fp.onComplete();
        this.flyingPetals.splice(i, 1);
      } else {
        const ease = fp.progress * (2 - fp.progress);
        fp.x = fp.fromX + (fp.toX - fp.fromX) * ease;
        fp.y = fp.fromY + (fp.toY - fp.fromY) * ease - Math.sin(fp.progress * Math.PI) * 20;
      }
    }

    // Bloom burst confetti
    for (let i = this.bloomParticles.length - 1; i >= 0; i--) {
      const p = this.bloomParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.vx *= 0.96;
      p.rotation += p.vRot;
      p.alpha -= 0.02;
      if (p.alpha <= 0) {
        this.bloomParticles.splice(i, 1);
      }
    }

    // Floating text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.018;
      ft.scale = Math.max(1.0, ft.scale - 0.015);
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(state) {
    const {
      grid,
      gridBounds,
      dockPot,
      dockBounds,
      hoverCell,
      activeTool
    } = state;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Garden Green Wooden Plank Background
    this.renderGardenBackground(ctx, w, h);

    // 2. 4x4 Terracotta Planter Tray & Checkerboard Tiles
    this.renderBoard(ctx, gridBounds, hoverCell, activeTool);

    // 3. Flower Pots & Petals on Board
    this.renderPots(ctx, grid, gridBounds);

    // 4. Flying Petals Sorting Animation
    this.renderFlyingPetals(ctx);

    // 5. Dock Slot & Next Flower Pot
    this.renderDock(ctx, dockPot, dockBounds);

    // 6. Confetti & Text
    this.renderParticles(ctx);
    this.renderFloatingTexts(ctx);
  }

  renderGardenBackground(ctx, w, h) {
    // Rich garden grass green
    const bgGrad = ctx.createRadialGradient(w / 2, h * 0.4, 20, w / 2, h * 0.5, w * 0.85);
    bgGrad.addColorStop(0, '#589e68');
    bgGrad.addColorStop(0.6, '#438253');
    bgGrad.addColorStop(1, '#2f603c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle wooden plank lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 2;
    for (let y = 0; y < h; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Scattered decorative leaves
    this.leaves.forEach(leaf => {
      ctx.save();
      ctx.translate(leaf.xRatio * w, leaf.yRatio * h);
      ctx.rotate(leaf.angle);
      ctx.fillStyle = leaf.color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, leaf.size, leaf.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Cute blue watering can illustration at top-left
    this.renderWateringCan(ctx, 40, h * 0.12);
  }

  renderWateringCan(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Can body
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spout
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(34, -12);
    ctx.stroke();

    // Spout rose (orange)
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(36, -13, 6, 8, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Handle (orange)
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-16, -4, 12, Math.PI * 0.5, Math.PI * 1.8);
    ctx.stroke();

    ctx.restore();
  }

  renderBoard(ctx, bounds, hoverCell, activeTool) {
    const { left, top, size, cellSize, gap } = bounds;

    // Rounded Terracotta/Clay Planter Tray Frame
    ctx.save();
    ctx.fillStyle = '#c85a2b';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
    this.roundRect(ctx, left - 14, top - 14, size + 28, size + 28, 22);
    ctx.fill();

    // Tray Rim Highlight & Inner Shadow
    ctx.strokeStyle = '#e27140';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();

    // Inner tray bed
    ctx.fillStyle = '#a6441b';
    this.roundRect(ctx, left - 4, top - 4, size + 8, size + 8, 14);
    ctx.fill();

    // 4x4 Tiles (Warm Tan Checkerboard)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const x = left + c * (cellSize + gap);
        const y = top + r * (cellSize + gap);

        const isLight = (r + c) % 2 === 0;
        ctx.fillStyle = isLight ? '#fbe5be' : '#f2d4a2';

        const isHovered = hoverCell && hoverCell.row === r && hoverCell.col === c;
        if (isHovered) {
          ctx.fillStyle = activeTool ? '#fecdd3' : '#dcfce7';
        }

        this.roundRect(ctx, x, y, cellSize, cellSize, 10);
        ctx.fill();

        // Subtle tile seam border
        ctx.strokeStyle = 'rgba(166, 68, 27, 0.25)';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, x, y, cellSize, cellSize, 10);
        ctx.stroke();
      }
    }
  }

  renderPots(ctx, grid, bounds) {
    const { left, top, cellSize, gap } = bounds;

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const pot = grid[r][c];
        if (pot) {
          const cx = left + c * (cellSize + gap) + cellSize / 2;
          const cy = top + r * (cellSize + gap) + cellSize / 2;
          this.renderFlowerPot(ctx, cx, cy, cellSize * 0.44, pot.color, pot.petals);
        }
      }
    }
  }

  renderFlowerPot(ctx, cx, cy, potRadius, color, petalCount) {
    ctx.save();
    ctx.translate(cx, cy);

    // Pot Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, potRadius * 0.35, potRadius * 1.05, potRadius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Terracotta Pot Base
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(0, 0, potRadius, 0, Math.PI * 2);
    ctx.fill();

    // Pot Rim
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Inner Dark Soil
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(0, 0, potRadius * 0.82, 0, Math.PI * 2);
    ctx.fill();

    // Petals arranged in circular slots (total 6 petal positions)
    const totalPetalSlots = 6;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i * (Math.PI * 2) / totalPetalSlots) - Math.PI / 2;
      this.drawPetal(ctx, angle, potRadius * 0.58, potRadius * 0.42, color);
    }

    // Center Flower Core Pin (Grey/Blue center bead)
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, 0, potRadius * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-potRadius * 0.08, -potRadius * 0.08, potRadius * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawPetal(ctx, angle, distFromCenter, petalLength, color) {
    ctx.save();
    ctx.rotate(angle);

    const px = 0;
    const py = -distFromCenter;

    // Petal drop/ellipse
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(px, py, petalLength * 0.48, petalLength * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Petal highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(px - 1, py - 2, petalLength * 0.22, petalLength * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderFlyingPetals(ctx) {
    this.flyingPetals.forEach(fp => {
      ctx.save();
      ctx.translate(fp.x, fp.y);
      ctx.fillStyle = fp.color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 16, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  renderDock(ctx, dockPot, bounds) {
    const { cx, cy, width, height } = bounds;

    // Rounded Green Dock Slot (matching Snapchat Lens)
    ctx.save();
    ctx.fillStyle = '#2f683e';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    this.roundRect(ctx, cx - width / 2, cy - height / 2, width, height, height / 2);
    ctx.fill();

    // Slot inner glow
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2.5;
    this.roundRect(ctx, cx - width / 2, cy - height / 2, width, height, height / 2);
    ctx.stroke();
    ctx.restore();

    // Render Dock Pot inside slot
    if (dockPot) {
      this.renderFlowerPot(ctx, cx, cy, height * 0.42, dockPot.color, dockPot.petals);
    }
  }

  renderParticles(ctx) {
    this.bloomParticles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.radius, p.radius * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  renderFloatingTexts(ctx) {
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `900 ${ft.fontSize * ft.scale}px "Fredoka", "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
