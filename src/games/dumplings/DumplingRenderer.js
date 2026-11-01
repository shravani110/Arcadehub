// DumplingRenderer.js - Canvas 2D graphics with woven bamboo background & kawaii squishy dumplings

export class DumplingRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1;
    this.bambooPattern = null;
    this.initPatterns();
  }

  initPatterns() {
    try {
      const patCanvas = document.createElement('canvas');
      patCanvas.width = 48;
      patCanvas.height = 48;
      const pctx = patCanvas.getContext('2d');

      pctx.fillStyle = '#dfaf68';
      pctx.fillRect(0, 0, 48, 48);

      pctx.lineWidth = 2.5;
      for (let x = -48; x < 96; x += 12) {
        // Forward diagonal
        pctx.beginPath();
        pctx.moveTo(x, 0);
        pctx.lineTo(x + 24, 24);
        pctx.strokeStyle = '#c69550';
        pctx.stroke();

        // Reverse diagonal
        pctx.beginPath();
        pctx.moveTo(x + 24, 24);
        pctx.lineTo(x, 48);
        pctx.strokeStyle = '#d9a65f';
        pctx.stroke();

        // Dark seam
        pctx.beginPath();
        pctx.moveTo(x + 12, 0);
        pctx.lineTo(x + 36, 24);
        pctx.strokeStyle = '#a46e2e';
        pctx.lineWidth = 1;
        pctx.stroke();
      }

      this.bambooPattern = this.ctx.createPattern(patCanvas, 'repeat');
    } catch (e) {
      console.warn('Pattern init fallback:', e);
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(300, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(300, Math.floor(rect.height * dpr));
    this.scale = dpr;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Draw scenic tree/garden background and container box
  drawBackground(dangerY, containerRect, isDangerWarning = false) {
    const ctx = this.ctx;
    const w = this.canvas.width / this.scale;
    const h = this.canvas.height / this.scale;
    const time = performance.now() * 0.001;

    ctx.save();

    // 1. Serene Zen Garden / Bamboo Forest Ambient Sky Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0.0, '#102219');
    skyGrad.addColorStop(0.35, '#1e3c2c');
    skyGrad.addColorStop(0.70, '#2d5440');
    skyGrad.addColorStop(1.0, '#182b21');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Warm atmospheric sunbeams / morning glow
    const glowGrad = ctx.createRadialGradient(w * 0.5, h * 0.25, 20, w * 0.5, h * 0.35, w * 0.7);
    glowGrad.addColorStop(0, 'rgba(255, 240, 180, 0.16)');
    glowGrad.addColorStop(0.5, 'rgba(160, 220, 160, 0.05)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);

    // Distant misty bamboo hills & forest silhouette
    this.drawDistantTrees(ctx, w, h);

    // Foreground Bamboo Trees & Foliage flanking both sides
    this.drawBambooTrees(ctx, w, h, time);

    // Floating zen leaves in the ambient breeze
    this.drawFloatingLeaves(ctx, w, h, time);

    // 2. Wooden Table / Tea Terrace Base (where the container rests)
    const tableTopY = containerRect.y + containerRect.height - 2;
    const tableH = h - tableTopY;
    const tableGrad = ctx.createLinearGradient(0, tableTopY, 0, h);
    tableGrad.addColorStop(0, '#3e2415');
    tableGrad.addColorStop(0.15, '#2b170c');
    tableGrad.addColorStop(0.65, '#1c0e07');
    tableGrad.addColorStop(1, '#0f0703');
    ctx.fillStyle = tableGrad;
    ctx.fillRect(0, tableTopY, w, tableH);

    // Table top bevel highlight line
    ctx.fillStyle = 'rgba(255, 205, 150, 0.25)';
    ctx.fillRect(0, tableTopY, w, 2);

    // 3. Realistic Steamer Basket Contact Shadow on table
    const boxX = containerRect.x;
    const boxY = containerRect.y;
    const boxW = containerRect.width;
    const boxH = containerRect.height;
    const rimThickness = 14;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(boxX + boxW * 0.5, boxY + boxH + 8, boxW * 0.56, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. STEAMER BASKET INTERIOR (Lined with authentic dim-sum woven mesh & parchment)
    ctx.save();
    ctx.beginPath();
    // Rounded bottom for authentic cylindrical steamer appearance
    const cornerR = 24;
    ctx.moveTo(boxX, boxY);
    ctx.lineTo(boxX + boxW, boxY);
    ctx.lineTo(boxX + boxW, boxY + boxH - cornerR);
    ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - cornerR, boxY + boxH);
    ctx.lineTo(boxX + cornerR, boxY + boxH);
    ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - cornerR);
    ctx.closePath();
    ctx.clip();

    // Steamer basket interior background
    if (this.bambooPattern) {
      ctx.fillStyle = this.bambooPattern;
      ctx.fillRect(boxX, boxY, boxW, boxH);
    } else {
      ctx.fillStyle = '#dfaf68';
      ctx.fillRect(boxX, boxY, boxW, boxH);
    }

    // Inner Depth Ambient Occlusion Vignette
    const innerGradL = ctx.createLinearGradient(boxX, boxY, boxX + 28, boxY);
    innerGradL.addColorStop(0, 'rgba(40, 20, 10, 0.35)');
    innerGradL.addColorStop(1, 'rgba(40, 20, 10, 0)');
    ctx.fillStyle = innerGradL;
    ctx.fillRect(boxX, boxY, 28, boxH);

    const innerGradR = ctx.createLinearGradient(boxX + boxW, boxY, boxX + boxW - 28, boxY);
    innerGradR.addColorStop(0, 'rgba(40, 20, 10, 0.35)');
    innerGradR.addColorStop(1, 'rgba(40, 20, 10, 0)');
    ctx.fillStyle = innerGradR;
    ctx.fillRect(boxX + boxW - 28, boxY, 28, boxH);

    const innerGradB = ctx.createLinearGradient(boxX, boxY + boxH, boxX, boxY + boxH - 36);
    innerGradB.addColorStop(0, 'rgba(40, 20, 10, 0.42)');
    innerGradB.addColorStop(1, 'rgba(40, 20, 10, 0)');
    ctx.fillStyle = innerGradB;
    ctx.fillRect(boxX, boxY + boxH - 36, boxW, 36);
    ctx.restore();

    // 5. AUTHENTIC BAMBOO STEAMER BASKET EXTERIOR & HOOP RINGS
    const leftWallX = boxX - rimThickness;
    const rightWallX = boxX + boxW;
    const outerW = boxW + rimThickness * 2;
    const floorY = boxY + boxH;

    // A. Left & Right Curved Bamboo Steamer Ear Handles
    ctx.save();
    ctx.fillStyle = '#b58238';
    ctx.strokeStyle = '#6d4514';
    ctx.lineWidth = 2.5;

    // Left Handle
    ctx.beginPath();
    ctx.roundRect(boxX - 22, boxY + boxH * 0.38, 12, 42, 6);
    ctx.fill();
    ctx.stroke();
    // Brass rivet on left handle
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(boxX - 16, boxY + boxH * 0.38 + 10, 2.5, 0, Math.PI * 2);
    ctx.arc(boxX - 16, boxY + boxH * 0.38 + 32, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Right Handle
    ctx.fillStyle = '#b58238';
    ctx.beginPath();
    ctx.roundRect(boxX + boxW + 10, boxY + boxH * 0.38, 12, 42, 6);
    ctx.fill();
    ctx.stroke();
    // Brass rivet on right handle
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(boxX + boxW + 16, boxY + boxH * 0.38 + 10, 2.5, 0, Math.PI * 2);
    ctx.arc(boxX + boxW + 16, boxY + boxH * 0.38 + 32, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // B. Left Steamer Wall (Warm Bamboo Bentwood)
    this.drawWoodBeam(ctx, leftWallX, boxY - 8, rimThickness, boxH + rimThickness + 8, '#d5a864', '#84501b');
    // Right Steamer Wall
    this.drawWoodBeam(ctx, rightWallX, boxY - 8, rimThickness, boxH + rimThickness + 8, '#d5a864', '#84501b');
    // Steamer Floor Base (Solid Bamboo Base resting on table)
    this.drawWoodBeam(ctx, leftWallX - 2, floorY, outerW + 4, rimThickness + 2, '#c99650', '#744212');

    // C. Steamer Wall Top Rounded Bamboo Caps
    this.drawWoodCap(ctx, leftWallX, boxY - 8, rimThickness);
    this.drawWoodCap(ctx, rightWallX, boxY - 8, rimThickness);

    // D. Outer Horizontal Bamboo Bentwood Hoop Bands (On Outer Wall Flanks & Base Only - Never Obscuring Dumplings)
    // 1. Top Outer Flank Hoops
    this.drawWoodBeam(ctx, leftWallX - 3, boxY - 8, rimThickness + 3, 10, '#e8be78', '#946022');
    this.drawWoodBeam(ctx, rightWallX, boxY - 8, rimThickness + 3, 10, '#e8be78', '#946022');
    // 2. Middle Outer Flank Hoops
    this.drawWoodBeam(ctx, leftWallX - 2, boxY + boxH * 0.48, rimThickness + 2, 9, '#d9a962', '#86521a');
    this.drawWoodBeam(ctx, rightWallX, boxY + boxH * 0.48, rimThickness + 2, 9, '#d9a962', '#86521a');
    // 3. Bottom Outer Base Hoop Band
    this.drawWoodBeam(ctx, leftWallX - 3, floorY - 6, outerW + 6, 10, '#cc984f', '#784414');

    // Metallic Brass Binding Studs on the hoops
    ctx.fillStyle = '#d4af37';
    for (const studY of [boxY - 3, boxY + boxH * 0.48 + 4, floorY - 1]) {
      ctx.beginPath();
      ctx.arc(leftWallX + 4, studY, 2.5, 0, Math.PI * 2);
      ctx.arc(rightWallX + rimThickness - 4, studY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Dotted Danger Steam Line across top of steamer basket
    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 3;

    if (isDangerWarning) {
      const pulseAlpha = 0.5 + Math.sin(Date.now() * 0.015) * 0.5;
      ctx.strokeStyle = `rgba(255, 50, 50, ${pulseAlpha})`;
      ctx.shadowColor = '#ff2222';
      ctx.shadowBlur = 8;
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 3;
    }

    ctx.beginPath();
    ctx.moveTo(boxX + 4, dangerY);
    ctx.lineTo(boxX + boxW - 4, dangerY);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  drawDistantTrees(ctx, w, h) {
    ctx.save();
    // Misty forest silhouettes
    ctx.fillStyle = 'rgba(20, 48, 34, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    for (let x = 0; x <= w; x += 30) {
      const hillY = h * 0.58 + Math.sin(x * 0.012) * 24 + Math.cos(x * 0.025) * 12;
      ctx.lineTo(x, hillY);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawBambooTrees(ctx, w, h, time) {
    ctx.save();

    // Bamboo stalks config [x, width, swayPhase, tilt]
    const stalks = [
      { x: w * 0.04, w: 14, phase: 0.0, color: '#3d6c4e' },
      { x: w * 0.09, w: 10, phase: 1.2, color: '#2f573d' },
      { x: w * 0.92, w: 13, phase: 2.1, color: '#3a6649' },
      { x: w * 0.96, w: 9,  phase: 3.5, color: '#2a4f37' }
    ];

    stalks.forEach((stalk) => {
      const sway = Math.sin(time * 1.4 + stalk.phase) * 6;
      ctx.save();
      ctx.translate(stalk.x, h);
      ctx.rotate((sway * Math.PI) / 1800);

      // Stalk trunk
      ctx.fillStyle = stalk.color;
      ctx.fillRect(-stalk.w * 0.5, -h, stalk.w, h);

      // Bamboo nodes/segments
      ctx.strokeStyle = '#1e3827';
      ctx.lineWidth = 3;
      for (let y = -40; y > -h; y -= 65) {
        ctx.beginPath();
        ctx.moveTo(-stalk.w * 0.6, y);
        ctx.lineTo(stalk.w * 0.6, y);
        ctx.stroke();

        // Bamboo leaves sprouting from nodes
        const leafSide = Math.sin(y * 99) > 0 ? 1 : -1;
        this.drawBambooLeafCluster(ctx, leafSide * stalk.w * 0.5, y, leafSide, time);
      }
      ctx.restore();
    });

    ctx.restore();
  }

  drawBambooLeafCluster(ctx, x, y, side, time) {
    ctx.save();
    ctx.translate(x, y);
    const leafSway = Math.sin(time * 2.2 + y) * 0.15;
    ctx.rotate(leafSway);

    const leafColors = ['#4e8760', '#5da575', '#3d6e4d'];
    const leafAngles = [-0.35, 0.0, 0.4];

    leafAngles.forEach((ang, i) => {
      ctx.save();
      ctx.rotate((side * (0.6 + ang)));
      ctx.fillStyle = leafColors[i % leafColors.length];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(16, -6, 36, 0);
      ctx.quadraticCurveTo(16, 6, 0, 0);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  drawFloatingLeaves(ctx, w, h, time) {
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const seed = i * 47.19;
      const lx = (w * 0.1 + (seed * 19 + time * 24) % w);
      const ly = (h * 0.05 + (seed * 31 + Math.sin(time * 0.8 + i) * 60 + time * 18) % (h * 0.8));
      const rot = time * 1.5 + i;

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      ctx.fillStyle = 'rgba(93, 165, 117, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  drawWoodCap(ctx, x, y, width) {
    ctx.save();
    ctx.fillStyle = '#d4a15b';
    ctx.beginPath();
    ctx.ellipse(x + width * 0.5, y, width * 0.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(70, 35, 10, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  drawWoodBeam(ctx, x, y, width, height, lightCol, darkCol) {
    ctx.save();
    const grad = ctx.createLinearGradient(x, y, x + width, y);
    grad.addColorStop(0, darkCol);
    grad.addColorStop(0.35, lightCol);
    grad.addColorStop(0.65, lightCol);
    grad.addColorStop(1, darkCol);

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = 'rgba(70, 35, 10, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
  }

  // Draw Kawaii Squishy Dumpling
  drawDumpling(x, y, tierData, angle = 0, squish = { x: 1, y: 1 }, blink = false) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(squish.x, squish.y);

    const r = tierData.radius;

    // 1. Drop shadow beneath dumpling
    ctx.beginPath();
    ctx.ellipse(0, r * 0.65, r * 0.85, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fill();

    // 2. Main Round Dumpling Body
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);

    const sphereGrad = ctx.createRadialGradient(-r * 0.32, -r * 0.36, r * 0.08, 0, 0, r * 1.05);
    sphereGrad.addColorStop(0, tierData.lightColor);
    sphereGrad.addColorStop(0.5, tierData.baseColor);
    sphereGrad.addColorStop(1, tierData.darkColor);
    ctx.fillStyle = sphereGrad;
    ctx.fill();

    // Outline
    ctx.lineWidth = Math.max(2, r * 0.05);
    ctx.strokeStyle = tierData.darkColor;
    ctx.stroke();

    // 3. Dumpling Pleated Top Knot Swirl (Traditional Steamed Bao)
    ctx.save();
    ctx.translate(0, -r * 0.78);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = tierData.lightColor;
    ctx.fill();
    ctx.strokeStyle = tierData.darkColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(Math.cos(a + 0.3) * r * 0.15, Math.sin(a + 0.3) * r * 0.15, Math.cos(a) * r * 0.26, Math.sin(a) * r * 0.26);
      ctx.stroke();
    }
    ctx.restore();

    // 4. Glitter / Starlight Flecks (matching Screenshot 3!)
    if (tierData.hasGlitter) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      const stars = [
        [-0.45, -0.3], [0.38, -0.42], [-0.55, 0.15], [0.52, 0.18],
        [-0.2, 0.45], [0.25, 0.48], [0.0, -0.55], [-0.35, 0.38]
      ];
      stars.forEach(([sx, sy]) => {
        const starSize = Math.max(1.5, r * 0.045);
        ctx.beginPath();
        ctx.arc(sx * r, sy * r, starSize, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 5. Crown if Imperial Tier
    if (tierData.hasCrown) {
      ctx.save();
      ctx.translate(0, -r * 0.95);
      ctx.fillStyle = '#ffcc00';
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-14, 6);
      ctx.lineTo(-18, -8);
      ctx.lineTo(-7, -2);
      ctx.lineTo(0, -12);
      ctx.lineTo(7, -2);
      ctx.lineTo(18, -8);
      ctx.lineTo(14, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 6. Kawaii Face (Blinking eyes, blushing cheeks, mouth)
    this.drawFace(ctx, r, tierData.face, blink);

    // 7. Specular Gloss Highlights
    ctx.beginPath();
    ctx.ellipse(-r * 0.38, -r * 0.4, r * 0.26, r * 0.16, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fill();

    ctx.restore();
  }

  drawFace(ctx, r, faceType, isBlinking) {
    const eyeOffsetX = r * 0.32;
    const eyeOffsetY = -r * 0.04;
    const eyeRadius = Math.max(2.5, r * 0.11);

    // Pink Rosy Blushing Cheeks
    ctx.fillStyle = 'rgba(255, 100, 130, 0.55)';
    ctx.beginPath();
    ctx.ellipse(-eyeOffsetX - 4, r * 0.12, r * 0.15, r * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(eyeOffsetX + 4, r * 0.12, r * 0.15, r * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    if (isBlinking) {
      ctx.strokeStyle = '#1b1b1b';
      ctx.lineWidth = Math.max(2, r * 0.06);
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.arc(-eyeOffsetX, eyeOffsetY + 2, eyeRadius, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(eyeOffsetX, eyeOffsetY + 2, eyeRadius, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#1e1b18';
      ctx.beginPath();
      ctx.ellipse(-eyeOffsetX, eyeOffsetY, eyeRadius, eyeRadius * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(eyeOffsetX, eyeOffsetY, eyeRadius, eyeRadius * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye White Sparkle Highlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-eyeOffsetX - eyeRadius * 0.3, eyeOffsetY - eyeRadius * 0.3, eyeRadius * 0.42, 0, Math.PI * 2);
      ctx.arc(eyeOffsetX - eyeRadius * 0.3, eyeOffsetY - eyeRadius * 0.3, eyeRadius * 0.42, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(-eyeOffsetX + eyeRadius * 0.3, eyeOffsetY + eyeRadius * 0.3, eyeRadius * 0.22, 0, Math.PI * 2);
      ctx.arc(eyeOffsetX + eyeRadius * 0.3, eyeOffsetY + eyeRadius * 0.3, eyeRadius * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cute smiling mouth
    ctx.strokeStyle = '#1e1b18';
    ctx.lineWidth = Math.max(1.8, r * 0.05);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, r * 0.14, r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  // Draw floating prompt banner "Tap to drop the Squishy Dumplings!" (from Screenshot 3)
  drawPromptBanner(centerX, y, opacity = 1) {
    if (opacity <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text1 = 'Tap to drop the';
    const text2 = 'Squishy Dumplings!';

    ctx.font = '800 22px "Fredoka", "Arial Rounded MT Bold", sans-serif';

    // White thick outline
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.lineJoin = 'round';
    ctx.strokeText(text1, centerX, y);
    ctx.strokeText(text2, centerX, y + 28);

    // Warm orange text
    ctx.fillStyle = '#ff6b00';
    ctx.fillText(text1, centerX, y);
    ctx.fillText(text2, centerX, y + 28);

    ctx.restore();
  }
}
