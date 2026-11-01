// SugarRushRenderer.js - High-End Neon Mithai Shop Rhythm Game Renderer

export const MITHAIS = [
  { name: 'Laddu', fill: '#f4a261', rim: '#c96f2e', color: '#ffd166', freq: 392 },
  { name: 'Barfi', fill: '#ef83a1', rim: '#b65877', color: '#f72585', freq: 494 },
  { name: 'Jalebi', fill: '#ffd166', rim: '#c9a227', color: '#ffbe0b', freq: 587 }
];

export class SugarRushRenderer {
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

    // 1. Cyber Mithai Lounge Neon Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#1c101c');
    bgGrad.addColorStop(0.5, '#120914');
    bgGrad.addColorStop(1, '#080309');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Ambient Magenta & Amber Pulse
    const pulseGlow = ctx.createRadialGradient(W / 2, H * 0.75, 20, W / 2, H * 0.75, W * 0.7);
    pulseGlow.addColorStop(0, 'rgba(239, 131, 161, 0.16)');
    pulseGlow.addColorStop(0.6, 'rgba(255, 209, 102, 0.05)');
    pulseGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pulseGlow;
    ctx.fillRect(0, 0, W, H);

    const strikeY = H * 0.78;
    const laneWidth = W / 3;

    // 2. 3 Conveyor Rails with Glowing Glass Borders
    for (let lane = 0; lane < 3; lane++) {
      const laneX = lane * laneWidth;
      const centerLaneX = laneX + laneWidth / 2;

      // Subtle translucent alternating conveyor track
      ctx.fillStyle = lane % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(laneX + 4, 0, laneWidth - 8, H);

      // Neon Divider Lines
      ctx.strokeStyle = 'rgba(239, 131, 161, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(laneX, 0);
      ctx.lineTo(laneX, H);
      ctx.stroke();

      // Conveyor rhythmic Chevron arrows scrolling downward
      ctx.strokeStyle = 'rgba(239, 131, 161, 0.07)';
      ctx.lineWidth = 2;
      const scrollOffset = (state.time * 240) % 80;
      for (let y = scrollOffset; y < H; y += 80) {
        ctx.beginPath();
        ctx.moveTo(centerLaneX - 18, y - 10);
        ctx.lineTo(centerLaneX, y);
        ctx.lineTo(centerLaneX + 18, y - 10);
        ctx.stroke();
      }
    }

    // Outer right boundary line
    ctx.strokeStyle = 'rgba(239, 131, 161, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W, 0);
    ctx.lineTo(W, H);
    ctx.stroke();

    // 3. Glowing Strike Line Zone Receptors
    for (let lane = 0; lane < 3; lane++) {
      const centerLaneX = (lane + 0.5) * laneWidth;
      const bounce = 1 + 0.05 * Math.sin(state.time * 8 + lane);
      const rx = 38 * bounce;
      const ry = 14 * bounce;

      // Glowing Receptor Base
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.beginPath();
      ctx.ellipse(centerLaneX, strikeY, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = MITHAIS[lane].color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = MITHAIS[lane].color;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Center crosshair dot
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(centerLaneX, strikeY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Expanding Hit Shockwaves
    for (const note of state.notes) {
      if (note.state === 1 && note.flash > 0) {
        const centerLaneX = (note.lane + 0.5) * laneWidth;
        const progress = 1 - note.flash;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${note.flash * 0.9})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = MITHAIS[note.lane].color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(centerLaneX, strikeY, 20 + progress * 32, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 5. Incoming Falling Mithais
    for (const note of state.notes) {
      if (note.state !== 2 && note.y > -50 && note.y < H + 50) {
        const centerLaneX = (note.lane + 0.5) * laneWidth;
        this.drawMithai(ctx, centerLaneX, note.y, note.lane);
      }
    }

    // 6. Hit FX Popups ("PERFECT!", "GOOD!")
    for (const fx of state.hitFx) {
      const centerLaneX = (fx.lane + 0.5) * laneWidth;
      const progress = 1 - fx.t / 0.3;
      const alpha = Math.max(0, fx.t / 0.3);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '900 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (fx.kind === 2) {
        ctx.fillStyle = '#ffd166';
        ctx.shadowColor = '#ffd166';
        ctx.shadowBlur = 12;
        ctx.fillText('PERFECT! ★', centerLaneX, strikeY - 48 - progress * 24);
      } else if (fx.kind === 1) {
        ctx.fillStyle = '#06d6a0';
        ctx.shadowColor = '#06d6a0';
        ctx.shadowBlur = 10;
        ctx.fillText('GOOD! ⚡', centerLaneX, strikeY - 48 - progress * 24);
      } else {
        ctx.fillStyle = '#ef476f';
        ctx.shadowColor = '#ef476f';
        ctx.shadowBlur = 8;
        ctx.fillText('MISS ✕', centerLaneX, strikeY - 48 - progress * 24);
      }
      ctx.restore();
    }

    // 7. Particle Bursts
    effects.render(ctx);

    // 8. Dynamic Combo Counter at Top Center
    if (state.combo >= 2) {
      ctx.save();
      const comboScale = 1 + Math.min(0.3, state.combo * 0.02);
      ctx.translate(W / 2, 42);
      ctx.scale(comboScale, comboScale);
      ctx.font = '900 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.shadowColor = '#f72585';
      ctx.shadowBlur = 14;
      ctx.fillText(`${state.combo}× COMBO! 🔥`, 0, 0);
      ctx.restore();
    }

    // Progress bar at bottom
    const totalNotes = state.notes.length || 1;
    const processedNotes = state.perfects + state.goods + state.misses;
    const progressPct = Math.min(100, Math.round((processedNotes / totalNotes) * 100));

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '700 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${progressPct}% COMPLETED · ${state.misses} / 5 MISSES`, W / 2, H - 12);
  }

  drawMithai(ctx, x, y, lane) {
    ctx.save();
    ctx.translate(x, y);

    if (lane === 0) {
      // 1. Motichoor Laddu (Spherical saffron boondi cluster with pistachio)
      const r = 18;
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, r + 4, r * 0.8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      const ladduGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
      ladduGrad.addColorStop(0, '#ffe066');
      ladduGrad.addColorStop(0.4, '#f48c06');
      ladduGrad.addColorStop(0.85, '#dc2f02');
      ladduGrad.addColorStop(1, '#9d0208');
      ctx.fillStyle = ladduGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Boondi beads
      ctx.fillStyle = 'rgba(255, 235, 150, 0.7)';
      for (const [bx, by] of [[-5, -5], [5, -4], [-3, 5], [4, 4], [0, 0]]) {
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pistachio speck
      ctx.fillStyle = '#52b788';
      ctx.beginPath();
      ctx.ellipse(4, -2, 2.5, 1.2, 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (lane === 1) {
      // 2. Kaju Katli / Barfi (Diamond with shimmering silver leaf Chandi Vark)
      const s = 15;
      ctx.rotate(Math.PI / 4);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.roundRect(-s + 2, -s + 2, s * 2, s * 2, 4);
      ctx.fill();

      // Diamond body
      const barfiGrad = ctx.createLinearGradient(-s, -s, s, s);
      barfiGrad.addColorStop(0, '#fde2e4');
      barfiGrad.addColorStop(0.5, '#eddcd2');
      barfiGrad.addColorStop(1, '#c5b3a3');
      ctx.fillStyle = barfiGrad;
      ctx.beginPath();
      ctx.roundRect(-s, -s, s * 2, s * 2, 4);
      ctx.fill();

      // Shimmering Silver Vark Foil overlay
      const varkGrad = ctx.createLinearGradient(-s, 0, s, 0);
      varkGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      varkGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
      varkGrad.addColorStop(1, 'rgba(220, 225, 230, 0.3)');
      ctx.fillStyle = varkGrad;
      ctx.beginPath();
      ctx.roundRect(-s + 3, -s + 3, s * 2 - 6, s * 2 - 6, 2);
      ctx.fill();

      ctx.strokeStyle = '#b65877';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(-s, -s, s * 2, s * 2, 4);
      ctx.stroke();
    } else {
      // 3. Crispy Golden Spiral Jalebi
      const r = 16;
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, r + 4, r * 0.8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Outer golden syrup ring
      ctx.strokeStyle = '#e85d04';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
      ctx.stroke();

      // Inner intersecting pretzel loops
      ctx.strokeStyle = '#ffba08';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(-3, -2, 6, 0, Math.PI * 2);
      ctx.arc(3, 2, 6, 0, Math.PI * 2);
      ctx.stroke();

      // Glossy syrup glaze highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, r - 3, Math.PI * 1.1, Math.PI * 1.6);
      ctx.stroke();
    }

    ctx.restore();
  }
}
