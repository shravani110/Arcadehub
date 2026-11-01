// LadduLauncherRenderer.js - High-End Demolition Physics & Glass Renderer

export class LadduLauncherRenderer {
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

  render(state, effects) {
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;

    ctx.clearRect(0, 0, W, H);

    // 1. Atmosphere - Sweet Workshop Vintage Ambient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#1c2214');
    bgGrad.addColorStop(0.5, '#13180c');
    bgGrad.addColorStop(1, '#0c1007');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Warm soft lantern rays in background
    const lightGlow = ctx.createRadialGradient(W * 0.75, H * 0.35, 20, W * 0.75, H * 0.35, W * 0.6);
    lightGlow.addColorStop(0, 'rgba(255, 209, 102, 0.12)');
    lightGlow.addColorStop(0.6, 'rgba(239, 131, 84, 0.05)');
    lightGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lightGlow;
    ctx.fillRect(0, 0, W, H);

    // Subtle kitchen background shelf guidelines
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.07)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (i / 4.4) * H);
      ctx.lineTo(W, (i / 4.4) * H);
      ctx.stroke();
    }

    // 2. Heavy Rustic Wooden Ground Floor
    const floorY = H - 90;
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, H);
    floorGrad.addColorStop(0, '#2d3521');
    floorGrad.addColorStop(0.08, '#3d472d');
    floorGrad.addColorStop(1, '#1a1f13');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, W, 90);

    // Polished brass edge trim atop floor
    ctx.fillStyle = '#b38d38';
    ctx.fillRect(0, floorY, W, 4);
    ctx.fillStyle = 'rgba(255, 235, 150, 0.6)';
    ctx.fillRect(0, floorY, W, 1);

    // 3. Wooden Obstacle Blocks & Shelves
    for (const b of state.blocks) {
      const bx = W * b.x;
      const by = H * b.y;
      const bw = W * b.w;
      const bh = H * b.h;
      this.drawWoodenBlock(ctx, bx, by, bw, bh);
    }

    // 4. Gulab Jamun Jars
    for (const jar of state.jars) {
      if (!jar.broken) {
        this.drawGulabJamunJar(ctx, jar.x, jar.y, jar.r, jar.vx);
      }
    }

    // Slingshot Base Position
    const slingX = W * 0.12;
    const slingBaseY = H - 150;
    const slingPouchY = slingBaseY - 28;

    // 5. Back Rubber Elastic Band (drawn behind slingshot post)
    if (state.aiming && state.laddus > 0 && (!state.flying || !state.flying.live)) {
      ctx.save();
      ctx.strokeStyle = '#5a3d24';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(slingX - 12, slingPouchY - 8);
      ctx.lineTo(state.aimX, state.aimY);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Realistic Carved Wood Slingshot Post
    this.drawSlingshot(ctx, slingX, slingBaseY);

    // 7. Aim Trajectory Arc & Dots
    if (state.aiming && state.laddus > 0 && (!state.flying || !state.flying.live)) {
      const dx = slingX - state.aimX;
      const dy = slingPouchY - state.aimY;
      const pullDist = Math.hypot(dx, dy);
      const power = Math.min(1, pullDist / 170);

      if (pullDist > 10) {
        let simX = slingX;
        let simY = slingPouchY;
        let simVx = dx * 4.4 * power;
        let simVy = dy * 4.4 * power;

        ctx.save();
        for (let i = 0; i < 32; i++) {
          simVy += 850 * 0.03;
          simX += simVx * 0.03;
          simY += simVy * 0.03;

          if (simY > H - 85 || simX > W + 20) break;

          const dotAlpha = Math.max(0.2, 0.9 - (i / 32) * 0.7);
          ctx.fillStyle = `rgba(255, 209, 102, ${dotAlpha})`;
          ctx.beginPath();
          ctx.arc(simX, simY, 2.5 + (i % 3 === 0 ? 1 : 0), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Front Rubber Elastic Band + Leather Pouch + Held Laddu
      ctx.save();
      ctx.strokeStyle = '#8a5c36';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(slingX + 12, slingPouchY - 8);
      ctx.lineTo(state.aimX, state.aimY);
      ctx.stroke();

      // Leather Sling Pouch
      ctx.fillStyle = '#3a2010';
      ctx.beginPath();
      ctx.arc(state.aimX, state.aimY, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Laddu being pulled
      this.drawMotichoorLaddu(ctx, state.aimX, state.aimY, 13, 0);
    } else if ((!state.flying || !state.flying.live) && state.laddus > 0) {
      // Resting Laddu in slingshot
      this.drawMotichoorLaddu(ctx, slingX, slingPouchY, 13, 0);
    }

    // 8. Flying Shot Laddu
    if (state.flying && state.flying.live) {
      this.drawMotichoorLaddu(ctx, state.flying.x, state.flying.y, 14, performance.now() * 0.008);
    }

    // 9. Particle Bursts & Floating Pops
    effects.render(ctx);

    // 10. Ammunition Tray (Bottom Left)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 209, 102, 0.8)';
    ctx.font = '700 12px sans-serif';
    ctx.fillText('AMMO:', 24, H - 24);
    for (let i = 0; i < state.laddus; i++) {
      this.drawMotichoorLaddu(ctx, 80 + i * 26, H - 28, 10, 0);
    }
    ctx.restore();
  }

  drawSlingshot(ctx, x, y) {
    ctx.save();
    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 42, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden Stem
    const stemGrad = ctx.createLinearGradient(x - 8, y, x + 8, y);
    stemGrad.addColorStop(0, '#754b2c');
    stemGrad.addColorStop(0.5, '#a36d41');
    stemGrad.addColorStop(1, '#53341d');

    ctx.strokeStyle = stemGrad;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y + 40);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Left & Right Y-Prongs
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - 12, y - 14, x - 15, y - 36);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 12, y - 14, x + 15, y - 36);
    ctx.stroke();

    // Brass bands at prong tips
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(x - 18, y - 38, 7, 5);
    ctx.fillRect(x + 11, y - 38, 7, 5);
    ctx.restore();
  }

  drawWoodenBlock(ctx, x, y, w, h) {
    ctx.save();
    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x + 3, y + 3, w, h);

    // Wood Plank
    const woodGrad = ctx.createLinearGradient(x, y, x, y + h);
    woodGrad.addColorStop(0, '#9a7542');
    woodGrad.addColorStop(0.3, '#b88f58');
    woodGrad.addColorStop(0.8, '#825f32');
    woodGrad.addColorStop(1, '#5f4422');
    ctx.fillStyle = woodGrad;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();

    // Wood bevel edge
    ctx.strokeStyle = '#4a3417';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Polished top highlight
    ctx.fillStyle = 'rgba(255, 235, 180, 0.35)';
    ctx.fillRect(x + 2, y + 1, w - 4, 2);

    // Wood Grain lines
    ctx.strokeStyle = 'rgba(60, 35, 10, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h * 0.45);
    ctx.lineTo(x + w - 4, y + h * 0.45);
    ctx.moveTo(x + 8, y + h * 0.75);
    ctx.lineTo(x + w - 8, y + h * 0.75);
    ctx.stroke();

    ctx.restore();
  }

  drawGulabJamunJar(ctx, x, y, r, vx) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(vx * 0.001);

    const w = r * 2.2;
    const h = r * 2.4;

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, h / 2 + 2, r * 1.1, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Jar Body Glass Silhouette
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 6);
    ctx.clip();

    // Translucent Warm Rose-Cardamom Syrup Fluid
    const syrupGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    syrupGrad.addColorStop(0, 'rgba(255, 175, 64, 0.55)');
    syrupGrad.addColorStop(0.4, 'rgba(209, 107, 31, 0.75)');
    syrupGrad.addColorStop(1, 'rgba(138, 56, 12, 0.9)');
    ctx.fillStyle = syrupGrad;
    ctx.fillRect(-w / 2, -h / 2 + 4, w, h - 4);

    // Submerged Dark Roasted Gulab Jamuns inside
    // Jamun 1 (Center bottom)
    const jamun1Grad = ctx.createRadialGradient(-2, 4, 1, 0, 5, r * 0.52);
    jamun1Grad.addColorStop(0, '#854117');
    jamun1Grad.addColorStop(0.6, '#4f2109');
    jamun1Grad.addColorStop(1, '#260d03');
    ctx.fillStyle = jamun1Grad;
    ctx.beginPath();
    ctx.arc(0, 5, r * 0.52, 0, Math.PI * 2);
    ctx.fill();

    // Jamun 2 (Top slightly right)
    const jamun2Grad = ctx.createRadialGradient(r * 0.3 - 2, -r * 0.3 - 2, 1, r * 0.3, -r * 0.3, r * 0.44);
    jamun2Grad.addColorStop(0, '#9c4e1c');
    jamun2Grad.addColorStop(0.6, '#5a270c');
    jamun2Grad.addColorStop(1, '#2d1004');
    ctx.fillStyle = jamun2Grad;
    ctx.beginPath();
    ctx.arc(r * 0.3, -r * 0.3, r * 0.44, 0, Math.PI * 2);
    ctx.fill();

    // Glass Specular Vertical Highlights (Realistic reflection)
    const glassReflect = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    glassReflect.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    glassReflect.addColorStop(0.18, 'rgba(255, 255, 255, 0.6)');
    glassReflect.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
    glassReflect.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
    glassReflect.addColorStop(0.88, 'rgba(255, 255, 255, 0.25)');
    glassReflect.addColorStop(1, 'rgba(255, 255, 255, 0.4)');
    ctx.fillStyle = glassReflect;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    ctx.restore();

    // Glass Outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 6);
    ctx.stroke();

    // 2. Ornate Golden Brass Lid
    const lidW = w + 4;
    const lidH = 7;
    const lidY = -h / 2 - 3;
    const lidGrad = ctx.createLinearGradient(-lidW / 2, 0, lidW / 2, 0);
    lidGrad.addColorStop(0, '#c9933b');
    lidGrad.addColorStop(0.5, '#ffe17d');
    lidGrad.addColorStop(1, '#8f601b');
    ctx.fillStyle = lidGrad;
    ctx.beginPath();
    ctx.roundRect(-lidW / 2, lidY, lidW, lidH, 2);
    ctx.fill();
    ctx.strokeStyle = '#5a3b0e';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  drawMotichoorLaddu(ctx, x, y, r, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(1, 2, r, 0, Math.PI * 2);
    ctx.fill();

    // Spherical Saffron Motichoor Body
    const lGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 2, 0, 0, r);
    lGrad.addColorStop(0, '#ffe066');
    lGrad.addColorStop(0.35, '#f48c06');
    lGrad.addColorStop(0.85, '#dc2f02');
    lGrad.addColorStop(1, '#9d0208');
    ctx.fillStyle = lGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Textural Boondi Pearls (Tiny spheres cluster)
    ctx.fillStyle = 'rgba(255, 225, 120, 0.8)';
    const boondis = [
      [-r * 0.4, -r * 0.3, r * 0.2],
      [r * 0.2, -r * 0.4, r * 0.22],
      [-r * 0.2, r * 0.3, r * 0.18],
      [r * 0.35, r * 0.2, r * 0.2],
      [0, -r * 0.1, r * 0.22]
    ];
    for (const [bx, by, br] of boondis) {
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pistachio & Almond Flecks
    ctx.fillStyle = '#52b788';
    ctx.beginPath();
    ctx.ellipse(r * 0.15, -r * 0.15, 2.5, 1.2, 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.ellipse(-r * 0.25, r * 0.1, 2.2, 1, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
