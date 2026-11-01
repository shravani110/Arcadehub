// BlockBlastRenderer.js - Authentic Snapchat AR Block Blast Card & 3D Blocks Renderer
export class BlockBlastRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // Line clear blast fireworks
    this.particles = [];
    // Floating score popups
    this.floatingTexts = [];
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  spawnClearParticles(x, y, color) {
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2.5;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3.5 + 2,
        color,
        alpha: 1.0
      });
    }
  }

  spawnFloatingText(text, x, y, color = '#38bdf8', fontSize = 24) {
    this.floatingTexts.push({
      text, x, y,
      vy: -1.6,
      alpha: 1.0,
      scale: 1.3,
      color,
      fontSize
    });
  }

  updateAnimations(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.alpha -= 0.024;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.018;
      ft.scale = Math.max(1.0, ft.scale - 0.015);
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  render(state) {
    const {
      grid,
      gridBounds,
      dockPieces,
      dockBounds,
      draggedPiece,
      ghostPosition,
      isValidGhost,
      score,
      highScore
    } = state;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Camera / Blurred Outdoor AR Background
    this.renderARBackground(ctx, w, h);

    // 2. Main Snapchat AR Card (Floating Navy Card with 👑 Crown & Score)
    this.renderMainCard(ctx, gridBounds, dockBounds, score, highScore);

    // 3. 8x8 Grid Cell Slots
    this.renderGridSlots(ctx, gridBounds);

    // 4. Ghost Placement Preview
    if (draggedPiece && ghostPosition && isValidGhost) {
      this.renderGhost(ctx, draggedPiece.shape, ghostPosition, gridBounds);
    }

    // 5. Placed Board Blocks
    this.renderPlacedBlocks(ctx, grid, gridBounds);

    // 6. Dock Compartments & Pieces
    this.renderDock(ctx, dockPieces, dockBounds, draggedPiece);

    // 7. Dragged Piece Under Finger
    if (draggedPiece) {
      this.renderDraggedPiece(ctx, draggedPiece);
    }

    // 8. Blast Fireworks & Texts
    this.renderParticles(ctx);
    this.renderFloatingTexts(ctx);
  }

  renderARBackground(ctx, w, h) {
    // Soft blurred garden/outdoor atmospheric background matching Snapchat camera filter
    const bgGrad = ctx.createRadialGradient(w / 2, h * 0.3, 30, w / 2, h * 0.5, w * 0.85);
    bgGrad.addColorStop(0, '#1a2438');
    bgGrad.addColorStop(0.5, '#0e1526');
    bgGrad.addColorStop(1, '#070a14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
  }

  renderMainCard(ctx, gridBounds, dockBounds, score, highScore) {
    const cardX = gridBounds.left - 16;
    const cardY = gridBounds.cardY !== undefined ? gridBounds.cardY : (gridBounds.top - 68);
    const cardW = gridBounds.size + 32;
    const cardH = dockBounds.top + dockBounds.height - cardY + 16;

    ctx.save();
    // Dark sleek navy card with subtle vertical gradient
    const cardGrad = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
    cardGrad.addColorStop(0, '#111b30');
    cardGrad.addColorStop(0.5, '#0d1527');
    cardGrad.addColorStop(1, '#090e1c');
    ctx.fillStyle = cardGrad;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 14;
    this.roundRect(ctx, cardX, cardY, cardW, cardH, 24);
    ctx.fill();

    // Card border with subtle glowing edge
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, cardX, cardY, cardW, cardH, 24);
    ctx.stroke();

    // 👑 Crown High Score on Top-Left
    ctx.font = '900 17px "Fredoka", "Inter", sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'left';
    ctx.fillText('👑 ' + highScore, cardX + 20, cardY + 38);

    // Big White Current Score on Top Center
    ctx.font = '900 38px "Fredoka", "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(score.toString(), cardX + cardW / 2, cardY + 44);

    ctx.restore();
  }

  renderGridSlots(ctx, bounds) {
    const { left, top, cellSize, gap } = bounds;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const x = left + c * (cellSize + gap);
        const y = top + r * (cellSize + gap);

        ctx.fillStyle = '#1e293b';
        this.roundRect(ctx, x, y, cellSize, cellSize, 8);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, cellSize, cellSize, 8);
        ctx.stroke();
      }
    }
  }

  renderGhost(ctx, shape, pos, bounds) {
    const { left, top, cellSize, gap } = bounds;
    ctx.save();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) {
          const gr = pos.row + r;
          const gc = pos.col + c;
          if (gr >= 0 && gr < 8 && gc >= 0 && gc < 8) {
            const x = left + gc * (cellSize + gap);
            const y = top + gr * (cellSize + gap);
            this.roundRect(ctx, x, y, cellSize, cellSize, 8);
            ctx.fill();
            ctx.stroke();
          }
        }
      }
    }
    ctx.restore();
  }

  renderPlacedBlocks(ctx, grid, bounds) {
    const { left, top, cellSize, gap } = bounds;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = grid[r][c];
        if (cell) {
          const x = left + c * (cellSize + gap);
          const y = top + r * (cellSize + gap);
          this.renderBlockCube(ctx, x, y, cellSize, cell.color);
        }
      }
    }
  }

  renderBlockCube(ctx, x, y, size, color) {
    ctx.save();

    // Soft drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.roundRect(ctx, x, y + 3, size, size, 8);
    ctx.fill();

    // Base cube
    ctx.fillStyle = color;
    this.roundRect(ctx, x, y, size, size, 8);
    ctx.fill();

    // 3D Glass Bevel Highlight on Top Half
    const highlight = ctx.createLinearGradient(x, y, x, y + size * 0.5);
    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    highlight.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
    ctx.fillStyle = highlight;
    this.roundRect(ctx, x + 2, y + 2, size - 4, size * 0.45, 6);
    ctx.fill();

    // Outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.2;
    this.roundRect(ctx, x, y, size, size, 8);
    ctx.stroke();

    ctx.restore();
  }

  renderDock(ctx, dockPieces, dockBounds, draggedPiece) {
    const { top, height, slotWidth, left, totalWidth } = dockBounds;

    // Render 3 distinct rounded square dock compartments (matching snap_actual_blockblast.png)
    for (let i = 0; i < 3; i++) {
      const sx = left + i * slotWidth;
      const slotBoxSize = Math.min(slotWidth * 0.88, height * 0.95);
      const bx = sx + (slotWidth - slotBoxSize) / 2;
      const by = top + (height - slotBoxSize) / 2;

      ctx.fillStyle = '#162035';
      this.roundRect(ctx, bx, by, slotBoxSize, slotBoxSize, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, bx, by, slotBoxSize, slotBoxSize, 14);
      ctx.stroke();

      // Render Dock piece inside
      const piece = dockPieces[i];
      if (piece && (!draggedPiece || draggedPiece.index !== i)) {
        const rows = piece.shape.length;
        const cols = piece.shape[0].length;
        const miniCell = slotBoxSize / Math.max(rows, cols, 3.2);

        const totalW = cols * miniCell;
        const totalH = rows * miniCell;
        const startX = bx + (slotBoxSize - totalW) / 2;
        const startY = by + (slotBoxSize - totalH) / 2;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (piece.shape[r][c] === 1) {
              this.renderBlockCube(ctx, startX + c * miniCell, startY + r * miniCell, miniCell - 2, piece.color);
            }
          }
        }
      }
    }
  }

  renderDraggedPiece(ctx, draggedPiece) {
    const { currentX, currentY, shape, color, cellSize } = draggedPiece;
    const rows = shape.length;
    const cols = shape[0].length;

    const totalW = cols * cellSize;
    const totalH = rows * cellSize;
    const startX = currentX - totalW / 2;
    const startY = currentY - totalH - 24;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shape[r][c] === 1) {
          this.renderBlockCube(ctx, startX + c * cellSize, startY + r * cellSize, cellSize - 2, color);
        }
      }
    }
  }

  renderParticles(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
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
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
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
