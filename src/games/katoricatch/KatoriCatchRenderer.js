// KatoriCatchRenderer.js - High-End Metallic Thali & Katori Renderer

export class KatoriCatchRenderer {
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

    // 1. Atmosphere - Deep Slate Teal Dining Ambient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0c1a17');
    bgGrad.addColorStop(0.45, '#07120f');
    bgGrad.addColorStop(1, '#040907');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle ambient teal back-lighting
    const glow = ctx.createRadialGradient(W / 2, H * 0.42, 20, W / 2, H * 0.42, W * 0.68);
    glow.addColorStop(0, 'rgba(131, 197, 190, 0.16)');
    glow.addColorStop(0.55, 'rgba(0, 109, 119, 0.06)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Speed tier indicator dots in background
    ctx.save();
    ctx.fillStyle = 'rgba(131, 197, 190, 0.35)';
    ctx.font = '800 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    let speedPills = 'VELOCITY ' + '●'.repeat(Math.min(5, state.speedTier));
    ctx.fillText(speedPills, W / 2, H * 0.08);
    ctx.restore();

    // 2. Kitchen Floor Base
    const floorH = 28;
    const floorY = H - floorH;
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, H);
    floorGrad.addColorStop(0, '#152420');
    floorGrad.addColorStop(1, '#0a1210');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, W, floorH);

    ctx.fillStyle = '#83c5be';
    ctx.globalAlpha = 0.45;
    ctx.fillRect(0, floorY, W, 2);
    ctx.globalAlpha = 1.0;

    // 3. Render Expanding Shockwaves
    if (state.shockwaves && state.shockwaves.length > 0) {
      ctx.save();
      for (const sw of state.shockwaves) {
        ctx.strokeStyle = sw.gold ? '#ffd166' : '#83c5be';
        ctx.lineWidth = Math.max(1.5, 3.5 * (1 - sw.r / sw.maxR));
        ctx.globalAlpha = sw.alpha;
        ctx.beginPath();
        ctx.ellipse(sw.x, sw.y, sw.r, sw.r * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Render Falling Katoris (with 3D Gyroscopic Tumbling)
    for (const k of state.katoris) {
      this.drawKatori(ctx, k.x, k.y, k.gold, k.vx, k.vy, k.tumblePhase || 0);
    }

    // 5. Render Stainless Steel Thali Platter
    const thaliBaseY = H - 128;
    const thaliY = thaliBaseY + (state.thaliRecoilY || 0);
    const vibration = (state.thaliWobble || 0) * Math.sin((state.ambientGlowT || 0) * 45) * 0.015;
    const currentTilt = (state.thaliTilt || 0) + vibration;

    this.drawThali(ctx, state.thaliX, thaliY, currentTilt, W, state);

    // 6. Render Particle Bursts, Sparks & Popups
    effects.render(ctx);

    // 7. Red Danger Flash
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(239, 71, 111, ${state.flash * 0.32})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  drawThali(ctx, x, y, tilt = 0, canvasW = 400, state = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);

    const rw = 74;
    const rh = 21;

    // Dynamic light shift offset based on x position across screen
    const normX = (x / Math.max(1, canvasW)) * 2 - 1; // -1 to +1
    const lightShift = normX * rw * 0.45;

    // Soft drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
    ctx.beginPath();
    ctx.ellipse(0, rh + 14, rw * 0.95, rh * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();

    // Combo Aura when streak is high (3x+)
    if (state.combo >= 3) {
      const comboAura = ctx.createRadialGradient(0, 0, rw * 0.5, 0, 0, rw * 1.35);
      const auraColor = state.combo >= 10 ? 'rgba(255, 107, 107, ' : state.combo >= 5 ? 'rgba(255, 209, 102, ' : 'rgba(131, 197, 190, ';
      comboAura.addColorStop(0, `${auraColor}0.35)`);
      comboAura.addColorStop(0.6, `${auraColor}0.15)`);
      comboAura.addColorStop(1, `${auraColor}0)`);
      ctx.fillStyle = comboAura;
      ctx.beginPath();
      ctx.ellipse(0, 0, rw * 1.35, rh * 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Thali Outer Rim Lower Depth Lip
    const rimBaseGrad = ctx.createLinearGradient(-rw, 0, rw, 0);
    rimBaseGrad.addColorStop(0, '#434d56');
    rimBaseGrad.addColorStop(0.3, '#7d8a96');
    rimBaseGrad.addColorStop(0.5, '#353e45');
    rimBaseGrad.addColorStop(0.8, '#9aa7b3');
    rimBaseGrad.addColorStop(1, '#434d56');
    ctx.fillStyle = rimBaseGrad;
    ctx.beginPath();
    ctx.ellipse(0, 10, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thali Main Concave Face (Mirror Chrome Anisotropic Gradient with Dynamic Specular Glint)
    const faceGrad = ctx.createLinearGradient(-rw + lightShift, -rh, rw + lightShift, rh);
    faceGrad.addColorStop(0, '#66747f');
    faceGrad.addColorStop(0.2, '#cdd6dc');
    faceGrad.addColorStop(0.45, '#ffffff');
    faceGrad.addColorStop(0.7, '#9eaab4');
    faceGrad.addColorStop(1, '#5d6a74');
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();

    // Polished Chrome Rim Border Stroke
    ctx.strokeStyle = '#f2f7fa';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // Concentric Lathe Grooves (Signature Indian Stainless Steel Circular Brushed Finish)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, rw * 0.82, rh * 0.82, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(60, 75, 85, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, rw * 0.60, rh * 0.60, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, rw * 0.42, rh * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Dead-Centre Perfect Bank Target Zone (Pulsing Concentric Bullseye Rings)
    const pulsePhase = Math.sin((state.ambientGlowT || 0) * 6) * 0.15;
    const targetAura = ctx.createRadialGradient(0, 0, 2, 0, 0, 36);
    targetAura.addColorStop(0, `rgba(131, 197, 190, ${0.65 + pulsePhase})`);
    targetAura.addColorStop(0.7, `rgba(131, 197, 190, ${0.20 + pulsePhase * 0.5})`);
    targetAura.addColorStop(1, 'rgba(131, 197, 190, 0)');
    ctx.fillStyle = targetAura;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(131, 197, 190, 0.95)';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 11, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tiny Center Precision Reticle Pin
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawKatori(ctx, x, y, isGold, vx, vy, tumblePhase = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Dynamic tilt wobble based on horizontal velocity and gyroscopic tumble
    const lateralTilt = Math.max(-0.4, Math.min(0.4, vx * 0.0025));
    ctx.rotate(lateralTilt);

    const r = 16.5;
    // 3D Gyroscopic tumbling: vertical foreshortening oscillation
    const tumbleCos = Math.cos(tumblePhase);
    const rimH = Math.max(3.5, Math.abs(tumbleCos) * 7.5);
    const isUpright = tumbleCos >= 0;

    if (isGold) {
      // 24K Golden Katori Rotating Sunburst Aura
      const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 34);
      aura.addColorStop(0, 'rgba(255, 214, 100, 0.9)');
      aura.addColorStop(0.5, 'rgba(244, 162, 97, 0.35)');
      aura.addColorStop(1, 'rgba(244, 162, 97, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Star Flares
      ctx.save();
      ctx.rotate(tumblePhase * 1.5);
      ctx.strokeStyle = 'rgba(255, 230, 140, 0.4)';
      ctx.lineWidth = 1.6;
      for (let f = 0; f < 4; f++) {
        ctx.beginPath();
        ctx.moveTo(-24, 0);
        ctx.lineTo(24, 0);
        ctx.stroke();
        ctx.rotate(Math.PI / 4);
      }
      ctx.restore();
    }

    // Dynamic Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, r + 4, r * 0.85, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hemispherical Bowl Body (3D Metallic Depth)
    const bowlGrad = ctx.createLinearGradient(-r, 0, r, r);
    if (isGold) {
      bowlGrad.addColorStop(0, '#f9c74f');
      bowlGrad.addColorStop(0.35, '#ffd166');
      bowlGrad.addColorStop(0.7, '#c9933b');
      bowlGrad.addColorStop(1, '#825515');
    } else {
      bowlGrad.addColorStop(0, '#8e9aa5');
      bowlGrad.addColorStop(0.35, '#dbe2e8');
      bowlGrad.addColorStop(0.75, '#5d6974');
      bowlGrad.addColorStop(1, '#3d464f');
    }
    ctx.fillStyle = bowlGrad;
    ctx.beginPath();
    if (isUpright) {
      ctx.arc(0, 0, r, 0, Math.PI);
    } else {
      ctx.arc(0, 0, r, Math.PI, Math.PI * 2);
    }
    ctx.fill();

    // Metallic Specular Rim Ring
    const rimGrad = ctx.createLinearGradient(-r, 0, r, 0);
    if (isGold) {
      rimGrad.addColorStop(0, '#ffe89e');
      rimGrad.addColorStop(0.5, '#ffffff');
      rimGrad.addColorStop(1, '#d89c38');
    } else {
      rimGrad.addColorStop(0, '#bcc7cf');
      rimGrad.addColorStop(0.5, '#ffffff');
      rimGrad.addColorStop(1, '#7e8c97');
    }
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, rimH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner Concave Bowl Hollow (when facing upright)
    if (isUpright) {
      const innerGrad = ctx.createRadialGradient(0, -1, 1, 0, 0, r * 0.8);
      if (isGold) {
        innerGrad.addColorStop(0, '#fff4cc');
        innerGrad.addColorStop(0.5, '#c9933b');
        innerGrad.addColorStop(1, '#7a4d0f');
      } else {
        innerGrad.addColorStop(0, '#dbe4eb');
        innerGrad.addColorStop(0.6, '#6b7985');
        innerGrad.addColorStop(1, '#3b454d');
      }
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.82, rimH * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Specular Glint Spot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.38, -1, 4.5, 1.8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
