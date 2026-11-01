// TiffinRunRenderer.js - High-End Animated 3D Perspective Renderer for Tiffin Run

export class TiffinRunRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  // Exact 3D perspective projection
  proj(z) {
    const s = 2.6;
    return s / (s + Math.max(0, z));
  }

  render(state, effects) {
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;

    ctx.clearRect(0, 0, W, H);

    const horizonY = H * 0.31;
    // Responsive track width: dynamic on mobile, capped for optimal perspective focus on tablet & desktop
    const roadHalfWidth = Math.min(W * 0.40, 240);

    // 1. Atmosphere - Deep Warm Sunrise Skyline
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#100703');
    skyGrad.addColorStop(0.45, '#2c1406');
    skyGrad.addColorStop(0.85, '#5c2b0d');
    skyGrad.addColorStop(1, '#823e12');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, horizonY);

    // Dynamic Sunrise Volumetric Sunbeams
    ctx.save();
    const sunCenterX = W / 2;
    const sunCenterY = horizonY;
    const beamCount = 10;
    const beamRot = state.runT * 0.08;
    for (let b = 0; b < beamCount; b++) {
      const angle = beamRot + (b / beamCount) * Math.PI;
      const beamGrad = ctx.createRadialGradient(sunCenterX, sunCenterY, 10, sunCenterX, sunCenterY, W * 0.6);
      beamGrad.addColorStop(0, 'rgba(255, 183, 3, 0.22)');
      beamGrad.addColorStop(0.5, 'rgba(235, 94, 20, 0.08)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(sunCenterX, sunCenterY);
      ctx.arc(sunCenterX, sunCenterY, W * 0.6, angle - 0.12, angle + 0.12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Silhouetted Mumbai Heritage Skyline on Horizon (Parallax)
    this.drawSkyline(ctx, W, horizonY, state.scrolled * 0.05);

    // Warm radial sun glow on the horizon
    const sunGrad = ctx.createRadialGradient(W / 2, horizonY, 8, W / 2, horizonY, W * 0.52);
    sunGrad.addColorStop(0, 'rgba(255, 195, 80, 0.65)');
    sunGrad.addColorStop(0.35, 'rgba(235, 94, 20, 0.3)');
    sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, W, horizonY);

    // 2. 3D Perspective Road
    const roadGrad = ctx.createLinearGradient(0, horizonY, 0, H);
    roadGrad.addColorStop(0, '#4a2c14');
    roadGrad.addColorStop(0.3, '#321c0b');
    roadGrad.addColorStop(1, '#1a0e05');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, horizonY, W, H - horizonY);

    // Coordinate mapping functions
    const getX = (lane, z) => W / 2 + (lane - 1) * roadHalfWidth * this.proj(z);
    const getY = (z) => horizonY + (H * 0.92 - horizonY) * this.proj(z);

    // Perspective Kerbs (Left and Right Yellow/Black Mumbai Street Curbs)
    for (let side of [-1, 1]) {
      ctx.save();
      for (let i = 0; i < 22; i++) {
        const z1 = i * 2.2 - (state.scrolled % 2.2);
        const z2 = z1 + 2.2;
        if (z2 < 0.2 || z1 > 42) continue;
        const p1 = this.proj(Math.max(0.2, z1));
        const p2 = this.proj(Math.max(0.2, z2));
        const y1 = getY(Math.max(0.2, z1));
        const y2 = getY(Math.max(0.2, z2));
        const x1 = W / 2 + side * (roadHalfWidth * 1.52) * p1;
        const x2 = W / 2 + side * (roadHalfWidth * 1.52) * p2;
        const curbW1 = 14 * p1;
        const curbW2 = 14 * p2;

        ctx.fillStyle = (i % 2 === 0) ? '#ffb703' : '#1a1008';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x2 + side * curbW2, y2);
        ctx.lineTo(x1 + side * curbW1, y1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 4 Perspective Lane Dividers (3 Lanes)
    ctx.strokeStyle = 'rgba(255, 214, 138, 0.22)';
    ctx.lineWidth = 2.2;
    for (let i = 0; i <= 3; i++) {
      const bottomX = W / 2 + (i - 1.5) * (roadHalfWidth * 2) / 3;
      const topX = W / 2 + (bottomX - W / 2) * 0.05;
      ctx.beginPath();
      ctx.moveTo(topX, horizonY);
      ctx.lineTo(bottomX, H);
      ctx.stroke();
    }

    // Moving Cobblestone Perspective Tiles with Speed Motion
    for (let i = 0; i < 28; i++) {
      const z = i * 2.8 - (state.scrolled % 2.8);
      if (z < 0.2 || z > 42) continue;
      const py = getY(z);
      const pScale = this.proj(z);

      ctx.globalAlpha = 0.26 * pScale;
      ctx.strokeStyle = '#ffd68a';
      ctx.lineWidth = Math.max(1.5, 3.5 * pScale);
      ctx.beginPath();
      ctx.moveTo(W / 2 - roadHalfWidth * 1.48 * pScale, py);
      ctx.lineTo(W / 2 + roadHalfWidth * 1.48 * pScale, py);
      ctx.stroke();

      // Staggered Cobblestone Cross-lines
      const stepW = (roadHalfWidth * 2.96 * pScale) / 8;
      const startX = W / 2 - roadHalfWidth * 1.48 * pScale;
      const offset = (i % 2) * (stepW * 0.5);
      for (let c = 1; c < 8; c++) {
        const cx = startX + c * stepW + offset;
        if (cx < startX || cx > startX + stepW * 8) continue;
        ctx.beginPath();
        ctx.moveTo(cx, py);
        ctx.lineTo(cx + (cx - W / 2) * 0.04, py + 12 * pScale);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1.0;

    // Perspective Speed Streaks (Warp speed feel at higher velocity)
    if (state.speed > 7) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 214, 138, 0.15)';
      ctx.lineWidth = 1.2;
      for (let s = 0; s < 6; s++) {
        const z = ((s * 7 - state.scrolled * 2) % 36 + 36) % 36;
        if (z < 1 || z > 30) continue;
        const pScale = this.proj(z);
        const sx = W / 2 + (Math.sin(s * 99) * roadHalfWidth * 1.3) * pScale;
        const sy = getY(z);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (sx - W / 2) * 0.1, sy + 30 * pScale);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Render Objects in Depth Order (Far to Near)
    const renderList = [];

    // Obstacles (Chai Puddles & Spice Sacks)
    for (const obs of state.obstacles) {
      const z = obs.z - state.scrolled;
      if (z < -1 || z > 42) continue;
      const cx = getX(obs.lane, Math.max(0.1, z));
      const cy = getY(Math.max(0.1, z));
      const scale = this.proj(z);

      renderList.push({
        z,
        draw: () => this.drawObstacle(ctx, obs, cx, cy, scale, state.runT)
      });
    }

    // Idlis (Steamed & 24K Gold)
    for (const idli of state.idlis) {
      if (idli.taken) continue;
      const z = idli.z - state.scrolled;
      if (z < -1 || z > 42) continue;
      const cx = getX(idli.lane, Math.max(0.1, z));
      const cy = getY(Math.max(0.1, z));
      const scale = this.proj(z);

      renderList.push({
        z,
        draw: () => this.drawIdli(ctx, idli, cx, cy, scale, state.runT)
      });
    }

    // The Runner Character (at fixed z = 0.4)
    const playerZ = 0.4;
    const playerX = getX(state.laneT, playerZ);
    const playerBaseY = getY(playerZ);

    renderList.push({
      z: playerZ,
      draw: () => this.drawRunner(ctx, state, playerX, playerBaseY, this.proj(playerZ))
    });

    // Sort Far-to-Near and Draw
    renderList.sort((a, b) => b.z - a.z);
    for (const item of renderList) {
      item.draw();
    }

    // 4. Floating Particles, Dust Puffs & Popups
    effects.render(ctx);

    // 5. Authentic Canvas Progress Bar matching London Cafe
    const progress = Math.min(1.0, Math.max(0, state.scrolled / state.goal));
    const barX = W * 0.12;
    const barY = H * 0.07;
    const barW = W * 0.76;
    const barH = 8;

    // Track
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    this.drawRoundedRect(ctx, barX, barY, barW, barH, 4);
    ctx.fill();

    // Fill
    if (progress > 0) {
      const pGrad = ctx.createLinearGradient(barX, 0, barX + barW * progress, 0);
      pGrad.addColorStop(0, '#f77f00');
      pGrad.addColorStop(1, '#ffb703');
      ctx.fillStyle = pGrad;
      this.drawRoundedRect(ctx, barX, barY, barW * progress, barH, 4);
      ctx.fill();

      // Leading glint bead
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(barX + barW * progress, barY + barH / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Percentage Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${Math.round(progress * 100)}%`, W / 2, barY + barH + 6);

    // Red Damage Flash
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255, 60, 40, ${state.flash * 0.32})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  drawSkyline(ctx, W, horizonY, offset) {
    ctx.save();
    ctx.fillStyle = '#1c0a03';
    ctx.globalAlpha = 0.85;

    // Mumbai Gateway Arch & Vintage Colonial Towers Silhouette
    const archW = 46;
    const archH = 28;
    const archX = ((W * 0.5 - offset * 40) % (W + 200) + W + 200) % (W + 200) - 100;

    // Gateway Arch
    ctx.fillRect(archX - archW / 2, horizonY - archH, archW, archH);
    ctx.beginPath();
    ctx.arc(archX, horizonY - archH * 0.45, archW * 0.28, Math.PI, 0);
    ctx.fill();

    // Clocktower & Minarets
    for (let i = 0; i < 5; i++) {
      const tx = ((i * 180 - offset * 30) % (W + 300) + W + 300) % (W + 300) - 150;
      const th = 18 + (i % 3) * 12;
      ctx.fillRect(tx - 8, horizonY - th, 16, th);
      // Tower spire
      ctx.beginPath();
      ctx.moveTo(tx - 8, horizonY - th);
      ctx.lineTo(tx, horizonY - th - 10);
      ctx.lineTo(tx + 8, horizonY - th);
      ctx.closePath();
      ctx.fill();

      // Silhouetted Coconut Palm Tree
      const px = tx + 45;
      const ph = 22;
      ctx.fillRect(px - 1.5, horizonY - ph, 3, ph);
      ctx.beginPath();
      ctx.arc(px, horizonY - ph, 11, Math.PI * 0.8, Math.PI * 2.2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawObstacle(ctx, obs, x, y, scale, time) {
    ctx.save();

    if (obs.kind === 'puddle') {
      // Masala Chai Puddle with Animated Ripples & Steam
      const pw = 52 * scale;
      const ph = 14 * scale;

      // Dark tea puddle outer edge
      ctx.fillStyle = '#4a250a';
      ctx.beginPath();
      ctx.ellipse(x, y, pw, ph, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden amber chai liquid sheen
      const teaGrad = ctx.createRadialGradient(x, y - 2 * scale, 2, x, y, pw * 0.8);
      teaGrad.addColorStop(0, '#e89c4a');
      teaGrad.addColorStop(0.5, '#ab5e1a');
      teaGrad.addColorStop(1, '#66320a');
      ctx.fillStyle = teaGrad;
      ctx.beginPath();
      ctx.ellipse(x, y - 2 * scale, pw * 0.82, ph * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();

      // Animated Dynamic Ripples
      const ripPhase = (time * 2.5) % 1;
      ctx.strokeStyle = 'rgba(255, 214, 150, 0.45)';
      ctx.lineWidth = Math.max(1, 1.6 * scale);
      ctx.beginPath();
      ctx.ellipse(x, y - 2 * scale, pw * 0.35 + ripPhase * pw * 0.45, ph * 0.35 + ripPhase * ph * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Spilled Terracotta Kulhad cup
      const kx = x - pw * 0.62;
      const ky = y - ph * 0.35;
      const kGrad = ctx.createLinearGradient(kx - 10 * scale, ky - 6 * scale, kx + 10 * scale, ky + 6 * scale);
      kGrad.addColorStop(0, '#cf6a3b');
      kGrad.addColorStop(0.6, '#b05324');
      kGrad.addColorStop(1, '#7a310c');
      ctx.fillStyle = kGrad;
      ctx.beginPath();
      ctx.ellipse(kx, ky, 9 * scale, 5 * scale, 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Kulhad inner dark rim
      ctx.fillStyle = '#4d1e08';
      ctx.beginPath();
      ctx.ellipse(kx + 2 * scale, ky - 1 * scale, 4.5 * scale, 2.5 * scale, 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Rising Animated Steam Wisps (Parametric Bézier curves)
      ctx.strokeStyle = 'rgba(255, 240, 220, 0.42)';
      ctx.lineWidth = Math.max(1, 2.0 * scale);
      ctx.lineCap = 'round';
      for (let s = 0; s < 3; s++) {
        const sx = x + (s - 1) * 14 * scale;
        const wave = Math.sin(time * 4.5 + s * 2.2) * 5 * scale;
        const wave2 = Math.cos(time * 3.8 + s * 1.8) * 6 * scale;
        ctx.beginPath();
        ctx.moveTo(sx, y - 4 * scale);
        ctx.quadraticCurveTo(sx + wave, y - 18 * scale, sx + wave2, y - 36 * scale);
        ctx.stroke();
      }
    } else {
      // Spice Gunny Sack with Fiery Chillies & Emitting Spices
      const sw = 62 * scale;
      const sh = 78 * scale;

      // Sack contact shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(x, y, sw * 0.58, 11 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Burlap sack body with textured woven gradient
      const sackGrad = ctx.createLinearGradient(x - sw / 2, y - sh, x + sw / 2, y);
      sackGrad.addColorStop(0, '#a67240');
      sackGrad.addColorStop(0.45, '#845427');
      sackGrad.addColorStop(0.85, '#613a17');
      sackGrad.addColorStop(1, '#44260b');
      ctx.fillStyle = sackGrad;
      this.drawRoundedRect(ctx, x - sw / 2, y - sh, sw, sh, 10 * scale);
      ctx.fill();

      ctx.strokeStyle = '#3d2009';
      ctx.lineWidth = Math.max(1.5, 3.2 * scale);
      ctx.stroke();

      // Hemp tie rope around neck
      ctx.strokeStyle = '#f5d696';
      ctx.lineWidth = Math.max(2, 4 * scale);
      ctx.beginPath();
      ctx.moveTo(x - sw * 0.42, y - sh * 0.82);
      ctx.lineTo(x + sw * 0.42, y - sh * 0.82);
      ctx.stroke();

      // Frayed rope ends
      ctx.strokeStyle = '#d6b26d';
      ctx.lineWidth = Math.max(1.5, 2.5 * scale);
      ctx.beginPath();
      ctx.moveTo(x + sw * 0.28, y - sh * 0.82);
      ctx.lineTo(x + sw * 0.48, y - sh * 0.72);
      ctx.moveTo(x + sw * 0.28, y - sh * 0.82);
      ctx.lineTo(x + sw * 0.44, y - sh * 0.90);
      ctx.stroke();

      // Emitting Red Chilli Powder Specks from the sack neck
      ctx.fillStyle = 'rgba(239, 71, 111, 0.75)';
      for (let p = 0; p < 4; p++) {
        const pPhase = (time * 3 + p * 0.6) % 1;
        const px = x + Math.sin(p * 2.3 + time * 2) * sw * 0.35;
        const py = (y - sh * 0.85) - pPhase * 28 * scale;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1, 2.4 * scale * (1 - pPhase * 0.5)), 0, Math.PI * 2);
        ctx.fill();
      }

      // Red chilli pepper graphic
      ctx.font = `${Math.max(12, 28 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌶️', x, y - sh * 0.44);
    }

    ctx.restore();
  }

  drawIdli(ctx, idli, x, y, scale, time) {
    ctx.save();

    const ir = (idli.gold ? 17 : 13) * scale;
    const floatY = y - ir + Math.sin(time * 6 + x) * 4 * scale;

    if (idli.gold) {
      // 24K Golden Idli Rotating Sunburst Flares
      const flareCount = 8;
      const flareRot = time * 2;
      ctx.save();
      ctx.translate(x, floatY);
      ctx.rotate(flareRot);
      ctx.strokeStyle = 'rgba(255, 214, 100, 0.35)';
      ctx.lineWidth = Math.max(1, 2 * scale);
      for (let f = 0; f < flareCount; f++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(ir * 2.6, 0);
        ctx.stroke();
        ctx.rotate((Math.PI * 2) / flareCount);
      }
      ctx.restore();

      // Radiant Golden Bloom Corona
      const aura = ctx.createRadialGradient(x, floatY, ir * 0.2, x, floatY, ir * 2.8);
      aura.addColorStop(0, 'rgba(255, 230, 130, 0.95)');
      aura.addColorStop(0.4, 'rgba(255, 175, 40, 0.5)');
      aura.addColorStop(1, 'rgba(251, 140, 0, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(x, floatY, ir * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Golden Idli Body (Deep 24K Gold Shimmer)
      const gGrad = ctx.createRadialGradient(x - ir * 0.35, floatY - ir * 0.35, 2, x, floatY, ir * 1.3);
      gGrad.addColorStop(0, '#fffbe6');
      gGrad.addColorStop(0.3, '#ffd460');
      gGrad.addColorStop(0.75, '#e08f0a');
      gGrad.addColorStop(1, '#9e5e04');
      ctx.fillStyle = gGrad;
      ctx.beginPath();
      ctx.ellipse(x, floatY, ir * 1.3, ir * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#b87805';
      ctx.lineWidth = Math.max(1.5, 2.6 * scale);
      ctx.stroke();

      // Twinkling Starlight Flare
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.max(10, 16 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✨', x + ir * 0.75, floatY - ir * 0.65);
    } else {
      // Steamed South Indian White Idli on Fresh Cut Banana Leaf
      // Banana leaf plate
      const leafW = ir * 1.6;
      const leafH = ir * 0.7;
      const leafGrad = ctx.createLinearGradient(x - leafW, floatY + ir * 0.7, x + leafW, floatY + ir * 0.7);
      leafGrad.addColorStop(0, '#1e5922');
      leafGrad.addColorStop(0.5, '#3c8c40');
      leafGrad.addColorStop(1, '#1b4f1f');
      ctx.fillStyle = leafGrad;
      ctx.beginPath();
      ctx.ellipse(x, floatY + ir * 0.75, leafW, leafH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Leaf central rib
      ctx.strokeStyle = '#5cb85c';
      ctx.lineWidth = Math.max(1, 1.5 * scale);
      ctx.beginPath();
      ctx.moveTo(x - leafW * 0.85, floatY + ir * 0.75);
      ctx.lineTo(x + leafW * 0.85, floatY + ir * 0.75);
      ctx.stroke();

      // Fluffy White Idli Body with Steamed Texture
      const wGrad = ctx.createRadialGradient(x - ir * 0.3, floatY - ir * 0.35, 2, x, floatY, ir * 1.25);
      wGrad.addColorStop(0, '#ffffff');
      wGrad.addColorStop(0.5, '#fbf8f0');
      wGrad.addColorStop(1, '#d8cfbe');
      ctx.fillStyle = wGrad;
      ctx.beginPath();
      ctx.ellipse(x, floatY, ir * 1.25, ir * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#b5a794';
      ctx.lineWidth = Math.max(1, 1.8 * scale);
      ctx.stroke();

      // Garnish: Mustard seeds and curry leaf fleck
      ctx.fillStyle = '#142912';
      ctx.beginPath();
      ctx.arc(x - 3 * scale, floatY - 2 * scale, 1.6 * scale, 0, Math.PI * 2);
      ctx.arc(x + 4 * scale, floatY + 1 * scale, 1.4 * scale, 0, Math.PI * 2);
      ctx.arc(x - 1 * scale, floatY + 3 * scale, 1.2 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2d6a2f';
      ctx.beginPath();
      ctx.ellipse(x + 2 * scale, floatY - 3 * scale, 2.8 * scale, 1.4 * scale, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawRunner(ctx, state, x, baseY, scale) {
    const isJumping = state.jumpY > 0;
    const jumpOffset = state.jumpY * scale;
    const squash = state.squashY || 1.0;
    const bob = isJumping ? 0 : Math.sin(state.runT * 18) * 4 * scale;
    const y = baseY - jumpOffset - bob;

    // Dynamic ground contact shadow (shrinks and diffuses when jumping)
    const shadowScale = Math.max(0.2, 1 - jumpOffset / 260);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.48 * shadowScale})`;
    ctx.beginPath();
    ctx.ellipse(x, baseY + 6 * scale, 36 * scale * shadowScale, 10 * scale * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Invulnerability blink
    if (state.invuln > 0 && Math.floor(state.invuln * 14) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(x, y);

    // Elastic banking angle when switching lanes
    const laneTilt = (state.lane - state.laneT) * 0.22;
    ctx.rotate(laneTilt);

    // Squash & Stretch Transform around ground foot anchor
    ctx.scale(1 / Math.sqrt(squash), squash);

    // 1. Animated Running Legs (Kinematic 2-Joint Thigh & Calf + Mojari Footwear)
    const legPhase = state.runT * 18;
    const legStride = isJumping ? 0.4 : Math.sin(legPhase) * 0.85;

    for (let leg = -1; leg <= 1; leg += 2) {
      const angle = leg === 1 ? legStride : -legStride;
      const hipX = leg * 9 * scale;
      const hipY = -24 * scale;
      const kneeX = hipX + Math.sin(angle) * 12 * scale;
      const kneeY = hipY + Math.cos(angle) * 14 * scale;
      const footX = kneeX + Math.sin(angle * 1.3) * 12 * scale;
      const footY = kneeY + Math.cos(angle * 1.3) * 12 * scale;

      // Leg Kurta Pajama / Trousers
      ctx.strokeStyle = '#f4ebd9';
      ctx.lineWidth = Math.max(3, 6 * scale);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(footX, footY);
      ctx.stroke();

      // Traditional Leather Mojari / Chappal Shoe
      ctx.fillStyle = '#6e3c15';
      ctx.beginPath();
      ctx.ellipse(footX + (leg === 1 ? 3 : -3) * scale, footY + 1 * scale, 6 * scale, 3 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. White Nehru Kurta Torso with Fabric Folds
    const torsoW = 26 * scale;
    const torsoH = 32 * scale;
    const torsoY = -56 * scale;
    const kGrad = ctx.createLinearGradient(-torsoW / 2, torsoY, torsoW / 2, torsoY + torsoH);
    kGrad.addColorStop(0, '#ffffff');
    kGrad.addColorStop(0.5, '#f5efe3');
    kGrad.addColorStop(1, '#ded5c5');
    ctx.fillStyle = kGrad;
    this.drawRoundedRect(ctx, -torsoW / 2, torsoY, torsoW, torsoH, 6 * scale);
    ctx.fill();

    ctx.strokeStyle = '#c2b6a0';
    ctx.lineWidth = Math.max(1, 1.8 * scale);
    ctx.stroke();

    // Kurta collar button placket
    ctx.strokeStyle = '#a89880';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.beginPath();
    ctx.moveTo(0, torsoY);
    ctx.lineTo(0, torsoY + 16 * scale);
    ctx.stroke();

    // 3. 3-Tier Gleaming Brass Tiffin Carrier Stack (with Organic Inertial Sway)
    const tiffinSway = state.tiffinTilt || 0;
    const tiffinW = 34 * scale;
    const tiffinH = 14 * scale;
    const brassPalette = ['#d4a835', '#fed068', '#c29528'];

    for (let t = 0; t < 3; t++) {
      // Each tier sways with progressive inertia lag
      const tierSway = tiffinSway * (0.65 + t * 0.45);
      const ty = -32 * scale - t * 15 * scale;

      ctx.save();
      ctx.translate(0, ty + tiffinH / 2);
      ctx.rotate(tierSway);
      ctx.translate(0, -tiffinH / 2);

      // Curved Brass Cylinder Shading
      const bGrad = ctx.createLinearGradient(-tiffinW / 2, 0, tiffinW / 2, 0);
      bGrad.addColorStop(0, '#8c6815');
      bGrad.addColorStop(0.25, '#c99c2e');
      bGrad.addColorStop(0.55, '#ffea9f');
      bGrad.addColorStop(0.8, brassPalette[t]);
      bGrad.addColorStop(1, '#694d0c');
      ctx.fillStyle = bGrad;
      this.drawRoundedRect(ctx, -tiffinW / 2, 0, tiffinW, tiffinH, 5 * scale);
      ctx.fill();

      ctx.strokeStyle = '#573d05';
      ctx.lineWidth = Math.max(1, 2 * scale);
      ctx.stroke();

      // Middle latch seam & metallic rivets
      ctx.fillStyle = '#fff0b3';
      ctx.fillRect(-tiffinW / 2 + 3 * scale, tiffinH * 0.45, tiffinW - 6 * scale, 1.6 * scale);

      ctx.fillStyle = '#4a3304';
      ctx.beginPath();
      ctx.arc(-tiffinW / 2 + 5 * scale, tiffinH * 0.5, 1.5 * scale, 0, Math.PI * 2);
      ctx.arc(tiffinW / 2 - 5 * scale, tiffinH * 0.5, 1.5 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Brass Arch Carry Handle & Lock Rods
    ctx.save();
    const handleSway = tiffinSway * 1.6;
    ctx.translate(0, -78 * scale);
    ctx.rotate(handleSway);

    ctx.strokeStyle = '#997319';
    ctx.lineWidth = Math.max(2, 3.8 * scale);
    ctx.beginPath();
    ctx.arc(0, 0, 10 * scale, Math.PI, 0);
    ctx.stroke();

    // Top Wooden / Brass Grip
    ctx.fillStyle = '#613b16';
    this.drawRoundedRect(ctx, -6 * scale, -13 * scale, 12 * scale, 4 * scale, 2 * scale);
    ctx.fill();
    ctx.restore();

    // 4. Arms Gripping the Brass Carry Handle
    ctx.strokeStyle = '#e6b98d';
    ctx.lineWidth = Math.max(2, 5 * scale);
    ctx.lineCap = 'round';
    // Left Arm
    ctx.beginPath();
    ctx.moveTo(-11 * scale, -50 * scale);
    ctx.lineTo(-14 * scale, -66 * scale);
    ctx.lineTo(-4 * scale, -76 * scale);
    ctx.stroke();
    // Right Arm
    ctx.beginPath();
    ctx.moveTo(11 * scale, -50 * scale);
    ctx.lineTo(14 * scale, -66 * scale);
    ctx.lineTo(4 * scale, -76 * scale);
    ctx.stroke();

    // 5. Runner Head & Saffron / Red Gandhi Topi
    // Neck
    ctx.fillStyle = '#d9a779';
    ctx.fillRect(-4 * scale, -65 * scale, 8 * scale, 8 * scale);

    // Head / Face with Skin Tone
    ctx.fillStyle = '#f0c299';
    ctx.beginPath();
    ctx.arc(0, -70 * scale, 9.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Dabbawala Mustache
    ctx.fillStyle = '#3a200e';
    ctx.beginPath();
    ctx.ellipse(0, -68 * scale, 5 * scale, 2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red Gandhi Cap / Topi with authentic fold & shadow
    ctx.fillStyle = '#c72323';
    ctx.beginPath();
    ctx.ellipse(0, -76 * scale, 10.5 * scale, 6.5 * scale, 0, Math.PI, 0);
    ctx.fill();

    // Topi highlight fold
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = Math.max(1, 1.8 * scale);
    ctx.beginPath();
    ctx.moveTo(-8 * scale, -76 * scale);
    ctx.quadraticCurveTo(0, -82 * scale, 8 * scale, -76 * scale);
    ctx.stroke();

    ctx.restore();
  }

  drawRoundedRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
