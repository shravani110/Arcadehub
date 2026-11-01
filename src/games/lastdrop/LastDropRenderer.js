// LastDropRenderer.js - Authentic Watermelon Tap & Surface Tension Showdown
// Complete Full 3D Watermelon, Tap Apparatus, Cyber Robot Arm & Human Hand

export class LastDropRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // Kinematic states for smooth hand animations
    this.robotReach = 0.0;
    this.humanReach = 0.0;
    this.tapRotation = 0.0;
    this.time = 0.0;

    // Preload authentic game assets
    this.images = {
      robotArm: new Image(),
      humanHand: new Image(),
      fullWatermelon: new Image(),
      faucet: new Image(),
      table: new Image()
    };
    this.images.robotArm.src = '/assets/lastdrop/robot_arm.png';
    this.images.humanHand.src = '/assets/lastdrop/human_hand.png';
    this.images.fullWatermelon.src = '/assets/lastdrop/full_watermelon.png';
    this.images.faucet.src = '/assets/lastdrop/faucet.png';
    this.images.table.src = '/assets/lastdrop/table.png';
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  render(state) {
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;
    const dt = 0.016;
    this.time += dt;

    ctx.clearRect(0, 0, W, H);

    // 1. Pure Pitch Black Background (as seen in screenshot)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    // Proportional anchors matching reference screenshot (459 x 1024 coordinate space)
    const refW = 459;
    const refH = 1024;
    const scale = Math.min(W / refW, H / refH);
    const offsetX = (W - refW * scale) / 2;
    const offsetY = (H - refH * scale) / 2;

    const tableTopY = offsetY + 670 * scale;
    const tableH = 180 * scale;

    // Turn & Pour kinematics
    const isPlayerTurn = state.turn === 'player1';
    const isPouring = state.isPouring && !state.isSpilling;

    // Kinematic reach towards tap handle
    const targetRobotReach = (!isPlayerTurn && isPouring) ? 1.0 : 0.0;
    const targetHumanReach = (isPlayerTurn && isPouring) ? 1.0 : 0.0;

    this.robotReach += (targetRobotReach - this.robotReach) * 0.24;
    this.humanReach += (targetHumanReach - this.humanReach) * 0.24;

    if (isPouring) {
      this.tapRotation += 0.35;
    }

    // 2. Wooden Table (Horizontal Wood Grain Planks, rounded bottom corners, black area below)
    this.drawTable(ctx, W, tableTopY, tableH, scale);

    const wmCenterX = offsetX + 105 * scale;

    // 3. Green Connecting Pipe & Faucet Tap Apparatus (rendered into watermelon socket)
    const appPos = this.drawPipeAndTap(ctx, wmCenterX, offsetX, offsetY, scale, isPouring);

    // 4. Complete Full 3D Watermelon (Both halves visible on table, 3D animated jiggle/breathing)
    this.drawFullWatermelon(ctx, wmCenterX, tableTopY, scale, isPouring);

    // 5. Glass Tumbler & Watermelon Juice (Directly underneath the spout)
    const glassPos = this.drawGlassAndJuice(ctx, appPos.spoutX, offsetY, scale, tableTopY, state);

    // 6. Liquid Stream (flowing from spout into glass when pouring)
    if (isPouring) {
      this.drawLiquidStream(ctx, appPos.spoutX, appPos.spoutY, glassPos.currentJuiceY);
    }

    // 7. Robot Cyber Arm (poised on left near tap handle)
    this.drawRobotArm(ctx, offsetX, offsetY, scale, appPos.handleX, this.robotReach);

    // 8. Human Hand (poised on right near tap handle)
    this.drawHumanHand(ctx, W, offsetX, offsetY, scale, appPos.handleX, this.humanReach);
  }

  drawTable(ctx, W, tableTopY, tableH, scale) {
    ctx.save();
    const cornerR = 24 * scale;

    // Clip to rounded table shape (flat top, rounded bottom corners)
    ctx.beginPath();
    ctx.moveTo(0, tableTopY);
    ctx.lineTo(W, tableTopY);
    ctx.lineTo(W, tableTopY + tableH - cornerR);
    ctx.quadraticCurveTo(W, tableTopY + tableH, W - cornerR, tableTopY + tableH);
    ctx.lineTo(cornerR, tableTopY + tableH);
    ctx.quadraticCurveTo(0, tableTopY + tableH, 0, tableTopY + tableH - cornerR);
    ctx.closePath();
    ctx.clip();

    if (this.images.table.complete && this.images.table.naturalWidth > 0) {
      const tw = this.images.table.naturalWidth;
      const th = this.images.table.naturalHeight;
      const numTiles = Math.ceil(W / tw);
      for (let i = 0; i < numTiles; i++) {
        ctx.drawImage(this.images.table, i * tw, tableTopY, tw, tableH);
      }
    } else {
      const woodGrad = ctx.createLinearGradient(0, tableTopY, 0, tableTopY + tableH);
      woodGrad.addColorStop(0.0, '#4a2511');
      woodGrad.addColorStop(0.35, '#3b1d0c');
      woodGrad.addColorStop(0.75, '#2c1407');
      woodGrad.addColorStop(1.0, '#1c0a02');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(0, tableTopY, W, tableH);
    }

    // Top table rim subtle bevel highlight
    ctx.fillStyle = 'rgba(255, 195, 150, 0.15)';
    ctx.fillRect(0, tableTopY, W, 2);
    ctx.restore();
  }

  drawFullWatermelon(ctx, wmCenterX, tableTopY, scale, isPouring) {
    ctx.save();

    // 3D Animation: subtle ambient breathing wobble + active pumping vibration when pouring
    const idleFloat = Math.sin(this.time * 2.2) * 1.2 * scale;
    const pumpJiggleX = isPouring ? (Math.random() - 0.5) * 1.5 * scale : 0;
    const pumpJiggleY = isPouring ? Math.sin(this.time * 30) * 1.4 * scale : 0;

    const posX = wmCenterX + pumpJiggleX;
    const posY = tableTopY + idleFloat + pumpJiggleY;

    // 1. Realistic 3D Table Contact Shadow underneath the full watermelon
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.ellipse(posX, tableTopY + 4 * scale, 76 * scale, 14 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Full Watermelon Sprite (Both left and right halves visible)
    const w = 182 * scale;
    const h = 205 * scale;
    const drawX = posX - (91 * scale);
    const drawY = posY - (172 * scale);

    if (this.images.fullWatermelon.complete && this.images.fullWatermelon.naturalWidth > 0) {
      ctx.drawImage(this.images.fullWatermelon, drawX, drawY, w, h);
    }

    // 3. Subtle 3D Spherical Specular Gloss overlay
    const glossGrad = ctx.createRadialGradient(
      posX - 30 * scale, drawY + 80 * scale, 5 * scale,
      posX - 30 * scale, drawY + 80 * scale, 65 * scale
    );
    glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
    glossGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.04)');
    glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = glossGrad;
    ctx.beginPath();
    ctx.ellipse(posX - 25 * scale, drawY + 95 * scale, 45 * scale, 45 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawPipeAndTap(ctx, wmCenterX, offsetX, offsetY, scale, isPouring) {
    ctx.save();

    const pipeTopY = offsetY + 345 * scale;
    const pipeBotY = offsetY + 560 * scale;
    const pipeThickness = 24 * scale;
    const halfThick = pipeThickness / 2;

    const faucetX = offsetX + 215 * scale;
    const faucetY = offsetY + 290 * scale;
    const faucetW = 126 * scale;
    const faucetH = 160 * scale;

    const spoutX = faucetX + 106 * scale; // = offsetX + 321 * scale
    const spoutY = faucetY + 110 * scale; // = offsetY + 400 * scale
    const handleX = faucetX + 68 * scale;  // = offsetX + 283 * scale
    const handleY = faucetY + 11 * scale;  // = offsetY + 301 * scale

    // 1. Vertical Green Pipe emerging from center of the full watermelon
    const vGrad = ctx.createLinearGradient(wmCenterX - halfThick, 0, wmCenterX + halfThick, 0);
    vGrad.addColorStop(0.0, '#00751a');
    vGrad.addColorStop(0.25, '#009624');
    vGrad.addColorStop(0.45, '#69f0ae'); // 3D specular highlight line
    vGrad.addColorStop(0.70, '#00e626');
    vGrad.addColorStop(1.0, '#004d1a');

    ctx.fillStyle = vGrad;
    ctx.fillRect(wmCenterX - halfThick, pipeTopY, pipeThickness, pipeBotY - pipeTopY);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.4 * scale;
    ctx.beginPath();
    ctx.moveTo(wmCenterX - halfThick, pipeTopY);
    ctx.lineTo(wmCenterX - halfThick, pipeBotY);
    ctx.moveTo(wmCenterX + halfThick, pipeTopY);
    ctx.lineTo(wmCenterX + halfThick, pipeBotY);
    ctx.stroke();

    // 2. 90-Degree Elbow & Horizontal Pipe to Faucet
    const hGrad = ctx.createLinearGradient(0, pipeTopY, 0, pipeTopY + pipeThickness);
    hGrad.addColorStop(0.0, '#00751a');
    hGrad.addColorStop(0.30, '#69f0ae');
    hGrad.addColorStop(0.65, '#00e626');
    hGrad.addColorStop(1.0, '#004d1a');

    ctx.fillStyle = hGrad;
    ctx.fillRect(wmCenterX - halfThick, pipeTopY, faucetX - (wmCenterX - halfThick) + 10 * scale, pipeThickness);

    ctx.beginPath();
    ctx.moveTo(wmCenterX - halfThick, pipeTopY);
    ctx.lineTo(faucetX + 5 * scale, pipeTopY);
    ctx.moveTo(wmCenterX + halfThick, pipeTopY + pipeThickness);
    ctx.lineTo(faucetX + 5 * scale, pipeTopY + pipeThickness);
    ctx.stroke();

    // Corner outline
    ctx.beginPath();
    ctx.moveTo(wmCenterX - halfThick, pipeTopY);
    ctx.lineTo(wmCenterX - halfThick, pipeTopY + pipeThickness);
    ctx.stroke();

    // Specular highlight line along top of horizontal pipe
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1.8 * scale;
    ctx.beginPath();
    ctx.moveTo(wmCenterX + 5 * scale, pipeTopY + 5 * scale);
    ctx.lineTo(faucetX, pipeTopY + 5 * scale);
    ctx.stroke();

    // 3. Faucet Sprite (Collar, Valve Body, Curved Spout)
    if (this.images.faucet.complete && this.images.faucet.naturalWidth > 0) {
      ctx.drawImage(this.images.faucet, faucetX, faucetY, faucetW, faucetH);
    }

    // 4. Dynamic Rotating T-Handle (spins when pouring)
    if (isPouring) {
      const handleW = 32 * scale;
      const handleH = 7 * scale;

      ctx.save();
      ctx.translate(handleX, handleY);
      ctx.rotate(this.tapRotation);

      ctx.fillStyle = '#00e626';
      ctx.beginPath();
      ctx.roundRect(-handleW / 2, -handleH / 2, handleW, handleH, handleH / 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.2 * scale;
      ctx.stroke();

      ctx.fillStyle = '#69f0ae';
      ctx.beginPath();
      ctx.arc(0, 0, 3.2 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    return { spoutX, spoutY, handleX, handleY };
  }

  drawGlassAndJuice(ctx, glassX, offsetY, scale, tableTopY, state) {
    ctx.save();

    const topRimY = offsetY + 563 * scale;
    const bottomY = offsetY + 712 * scale;
    const glassH = bottomY - topRimY;
    const halfTopW = (78 * scale) / 2;
    const halfBotW = (52 * scale) / 2;
    const rimRy = 7.5 * scale;

    // 1. Table drop shadow underneath glass
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.ellipse(glassX, bottomY + 3 * scale, halfBotW * 1.3, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Watermelon Juice Liquid Body (Empty when fillRatio <= 0.001)
    const fillRatio = state.fillRatio !== undefined ? state.fillRatio : 0.0;
    const maxLiquidH = glassH - 16 * scale;
    const currentLiquidH = maxLiquidH * Math.min(1.0, fillRatio);
    const juiceTopY = bottomY - 10 * scale - currentLiquidH;

    if (fillRatio > 0.001) {
      const hNorm = Math.min(1.0, currentLiquidH / maxLiquidH);
      const currentHalfW = halfBotW + (halfTopW - halfBotW) * hNorm;

      ctx.save();
      // Clip liquid strictly to glass interior
      ctx.beginPath();
      ctx.moveTo(glassX - halfTopW + 2 * scale, topRimY);
      ctx.lineTo(glassX + halfTopW - 2 * scale, topRimY);
      ctx.lineTo(glassX + halfBotW - 2 * scale, bottomY - 8 * scale);
      ctx.lineTo(glassX - halfBotW + 2 * scale, bottomY - 8 * scale);
      ctx.closePath();
      ctx.clip();

      // Liquid Gradient (vibrant pink/magenta watermelon juice)
      const juiceGrad = ctx.createLinearGradient(glassX - currentHalfW, 0, glassX + currentHalfW, 0);
      juiceGrad.addColorStop(0.0, '#e11d48');
      juiceGrad.addColorStop(0.25, '#ea5b79');
      juiceGrad.addColorStop(0.7, '#f43f5e');
      juiceGrad.addColorStop(1.0, '#be123c');
      ctx.fillStyle = juiceGrad;

      // Fill trapezoid
      ctx.beginPath();
      ctx.moveTo(glassX - currentHalfW, juiceTopY);
      ctx.lineTo(glassX + currentHalfW, juiceTopY);
      ctx.lineTo(glassX + halfBotW, bottomY - 8 * scale);
      ctx.lineTo(glassX - halfBotW, bottomY - 8 * scale);
      ctx.closePath();
      ctx.fill();

      // Surface Tension Meniscus Top
      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath();
      if (fillRatio >= 0.95) {
        const bulge = Math.min(14 * scale, (fillRatio - 0.95) * 100 * scale);
        const wobble = Math.sin(this.time * 16) * 1.2 * scale;
        ctx.moveTo(glassX - currentHalfW, juiceTopY);
        ctx.quadraticCurveTo(glassX, juiceTopY - bulge + wobble, glassX + currentHalfW, juiceTopY);
        ctx.quadraticCurveTo(glassX, juiceTopY + currentHalfW * 0.22, glassX - currentHalfW, juiceTopY);
      } else {
        ctx.ellipse(glassX, juiceTopY, currentHalfW, currentHalfW * 0.18, 0, 0, Math.PI * 2);
      }
      ctx.fill();

      // Watermelon seeds floating inside the juice
      ctx.fillStyle = 'rgba(17, 24, 39, 0.85)';
      const seedOffsets = [
        [-12, -20], [10, -35], [-4, -60], [8, -80], [-8, -100]
      ];
      for (const [sx, sy] of seedOffsets) {
        const seedY = bottomY - 14 * scale + sy * scale;
        if (seedY > juiceTopY + 8 * scale && seedY < bottomY - 12 * scale) {
          ctx.beginPath();
          ctx.ellipse(glassX + sx * scale, seedY, 2.4 * scale, 1.4 * scale, 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // 3. Spill Cascades (when surface tension breaks)
    if (state.isSpilling) {
      const sp = state.spillProgress || 0.6;
      ctx.fillStyle = '#ea5b79';

      // Left waterfall cascade
      ctx.beginPath();
      ctx.moveTo(glassX - halfTopW, topRimY);
      ctx.lineTo(glassX - halfTopW + 4 * scale, topRimY);
      ctx.lineTo(glassX - halfBotW + 3 * scale, topRimY + glassH * sp);
      ctx.lineTo(glassX - halfBotW - 2 * scale, topRimY + glassH * sp);
      ctx.closePath();
      ctx.fill();

      // Right waterfall cascade
      ctx.beginPath();
      ctx.moveTo(glassX + halfTopW - 4 * scale, topRimY);
      ctx.lineTo(glassX + halfTopW, topRimY);
      ctx.lineTo(glassX + halfBotW + 2 * scale, topRimY + glassH * sp);
      ctx.lineTo(glassX + halfBotW - 3 * scale, topRimY + glassH * sp);
      ctx.closePath();
      ctx.fill();

      // Table puddle
      const poolW = (24 + sp * 55) * scale;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.ellipse(glassX, bottomY + 4 * scale, poolW, 7 * sp * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Glass Tumbler Body (Translucent cyan glass + highlights)
    const glassGrad = ctx.createLinearGradient(glassX - halfTopW, 0, glassX + halfTopW, 0);
    glassGrad.addColorStop(0.0, 'rgba(186, 230, 253, 0.32)');
    glassGrad.addColorStop(0.2, 'rgba(224, 242, 254, 0.16)');
    glassGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
    glassGrad.addColorStop(0.8, 'rgba(224, 242, 254, 0.16)');
    glassGrad.addColorStop(1.0, 'rgba(186, 230, 253, 0.32)');

    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.moveTo(glassX - halfTopW, topRimY);
    ctx.lineTo(glassX + halfTopW, topRimY);
    ctx.lineTo(glassX + halfBotW, bottomY);
    ctx.lineTo(glassX - halfBotW, bottomY);
    ctx.closePath();
    ctx.fill();

    // Solid Glass Bottom Foot / Base Bevel
    const baseH = 10 * scale;
    ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
    ctx.beginPath();
    ctx.moveTo(glassX - halfBotW + 2 * scale, bottomY - baseH);
    ctx.lineTo(glassX + halfBotW - 2 * scale, bottomY - baseH);
    ctx.lineTo(glassX + halfBotW, bottomY);
    ctx.lineTo(glassX - halfBotW, bottomY);
    ctx.closePath();
    ctx.fill();

    // Soft cyan glass wall outline
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.moveTo(glassX - halfTopW, topRimY);
    ctx.lineTo(glassX - halfBotW, bottomY);
    ctx.lineTo(glassX + halfBotW, bottomY);
    ctx.lineTo(glassX + halfTopW, topRimY);
    ctx.stroke();

    // Glass Top Rim (Double Ellipse for wall thickness)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0 * scale;
    ctx.beginPath();
    ctx.ellipse(glassX, topRimY, halfTopW, rimRy, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(224, 242, 254, 0.55)';
    ctx.lineWidth = 1.0 * scale;
    ctx.beginPath();
    ctx.ellipse(glassX, topRimY, halfTopW - 2 * scale, rimRy - 1.2 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Vertical Specular Reflection Streak (Left wall highlight)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.lineWidth = 2.6 * scale;
    ctx.beginPath();
    ctx.moveTo(glassX - halfTopW * 0.76, topRimY + 12 * scale);
    ctx.lineTo(glassX - halfBotW * 0.76, bottomY - baseH);
    ctx.stroke();

    ctx.restore();

    return {
      currentJuiceY: fillRatio > 0.001 ? juiceTopY : (bottomY - 10 * scale)
    };
  }

  drawLiquidStream(ctx, spoutX, spoutY, targetY) {
    ctx.save();
    const streamGrad = ctx.createLinearGradient(spoutX - 4, 0, spoutX + 4, 0);
    streamGrad.addColorStop(0, '#f43f5e');
    streamGrad.addColorStop(0.4, '#fb7185');
    streamGrad.addColorStop(0.8, '#f43f5e');
    streamGrad.addColorStop(1, '#e11d48');

    ctx.fillStyle = streamGrad;
    ctx.beginPath();
    ctx.moveTo(spoutX - 3.5, spoutY);
    ctx.lineTo(spoutX + 3.5, spoutY);
    ctx.lineTo(spoutX + 4.5, targetY);
    ctx.lineTo(spoutX - 4.5, targetY);
    ctx.closePath();
    ctx.fill();

    // Splash ripples at contact surface
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.5;
    const ripR = 5 + (Math.sin(this.time * 24) + 1) * 3;
    ctx.beginPath();
    ctx.ellipse(spoutX, targetY, ripR, ripR * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawRobotArm(ctx, offsetX, offsetY, scale, handleX, reach) {
    ctx.save();
    const baseW = 205 * scale;
    const h = 108 * scale;
    const extension = reach * 55 * scale;
    const posY = offsetY + (225 + reach * 6) * scale;
    // Anchor to stage left on desktop/tablet, or screen left on mobile
    const posX = offsetX - (15 * (1 - reach)) * scale;

    if (this.images.robotArm.complete && this.images.robotArm.naturalWidth > 0) {
      ctx.drawImage(this.images.robotArm, posX, posY, baseW + extension, h);
    }
    ctx.restore();
  }

  drawHumanHand(ctx, W, offsetX, offsetY, scale, handleX, reach) {
    ctx.save();
    const baseW = 111 * scale;
    const h = 108 * scale;
    const extension = reach * 65 * scale;
    const posY = offsetY + (238 + reach * 6) * scale;
    // Anchor to stage right on desktop/tablet, or screen right on mobile
    const stageRight = offsetX + 430 * scale;
    const posX = (stageRight - baseW) - extension + (15 * (1 - reach)) * scale;

    if (this.images.humanHand.complete && this.images.humanHand.naturalWidth > 0) {
      ctx.drawImage(this.images.humanHand, posX, posY, baseW + extension, h);
    }
    ctx.restore();
  }

  trigger3DSpill() {
    // Handled in render via isSpilling
  }

  destroy() {
    // Cleanup
  }
}
