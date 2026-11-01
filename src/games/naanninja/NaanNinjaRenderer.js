// NaanNinjaRenderer.js - High-End Animated Food Ninja Slicing Renderer

export class NaanNinjaRenderer {
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

    // 1. Tandoor Kitchen Dark Slate Background with Warm Glow
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0a1610');
    bgGrad.addColorStop(0.6, '#060e0a');
    bgGrad.addColorStop(1, '#030805');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Warm radial tandoor oven heat glow at the bottom
    const ovenGlow = ctx.createRadialGradient(W / 2, H + 60, 20, W / 2, H + 60, H * 0.65);
    ovenGlow.addColorStop(0, 'rgba(255, 90, 20, 0.35)');
    ovenGlow.addColorStop(0.5, 'rgba(251, 86, 7, 0.12)');
    ovenGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = ovenGlow;
    ctx.fillRect(0, H * 0.35, W, H * 0.65);

    // Golden 2x score ambient tint
    if (state.score2x > 0) {
      ctx.fillStyle = 'rgba(255, 209, 102, 0.08)';
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Render Flying Halves (Sliced Ingredients)
    for (const h of state.halves) {
      ctx.save();
      const alpha = Math.max(0, 1.4 - h.age);
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rot);
      this.drawFoodItem(ctx, h.kind, h.side);
      ctx.restore();
    }
    ctx.globalAlpha = 1.0;

    // 3. Render Whole Flying Items
    for (const item of state.items) {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rot);
      this.drawFoodItem(ctx, item.kind, 0);
      ctx.restore();
    }

    // 4. Render Glowing Ninja Blade Slash Trail
    if (state.trail && state.trail.length > 1) {
      ctx.save();
      // Outer neon emerald glow
      ctx.strokeStyle = 'rgba(6, 214, 160, 0.45)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#06d6a0';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(state.trail[0].x, state.trail[0].y);
      for (let i = 1; i < state.trail.length; i++) {
        ctx.lineTo(state.trail[i].x, state.trail[i].y);
      }
      ctx.stroke();

      // Sharp white-hot blade core
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(state.trail[0].x, state.trail[0].y);
      for (let i = 1; i < state.trail.length; i++) {
        ctx.lineTo(state.trail[i].x, state.trail[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 5. Render Particle Bursts & Popups
    effects.render(ctx);

    // 6. Missed Food Indicators (3 strikes = lose 1 life)
    const currentMisses = state.misses % 3;
    const strikeY = H - 32;
    for (let i = 0; i < 3; i++) {
      const strikeX = 36 + i * 28;
      const isMissed = i < currentMisses;
      ctx.fillStyle = isMissed ? '#ef476f' : 'rgba(255, 255, 255, 0.18)';
      ctx.font = '800 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✕', strikeX, strikeY);
    }

    // Damage flash
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255, 60, 40, ${state.flash * 0.35})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  drawFoodItem(ctx, kind, side = 0) {
    // side: 0 = whole, -1 = left half, 1 = right half
    if (kind === 'naan' || kind === 'gold') {
      const isGold = kind === 'gold';
      const r = 32;

      if (isGold) {
        // Glowing sunburst aura for golden naan
        const aura = ctx.createRadialGradient(0, 0, 5, 0, 0, 50);
        aura.addColorStop(0, 'rgba(255, 209, 102, 0.85)');
        aura.addColorStop(0.6, 'rgba(251, 86, 7, 0.35)');
        aura.addColorStop(1, 'rgba(251, 86, 7, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      if (side !== 0) {
        ctx.beginPath();
        ctx.rect(side < 0 ? -r * 2 : 0, -r * 2, r * 2, r * 4);
        ctx.clip();
      }

      // Teardrop Naan Shape
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.3);
      ctx.bezierCurveTo(r * 0.9, -r * 0.6, r * 1.1, r * 0.6, 0, r * 1.2);
      ctx.bezierCurveTo(-r * 1.1, r * 0.6, -r * 0.9, -r * 0.6, 0, -r * 1.3);

      const nGrad = ctx.createRadialGradient(-4, -6, 2, 0, 0, r * 1.2);
      if (isGold) {
        nGrad.addColorStop(0, '#fff4cc');
        nGrad.addColorStop(0.4, '#ffd166');
        nGrad.addColorStop(1, '#d48b0c');
      } else {
        nGrad.addColorStop(0, '#fef9e7');
        nGrad.addColorStop(0.5, '#edd9ba');
        nGrad.addColorStop(1, '#b89467');
      }
      ctx.fillStyle = nGrad;
      ctx.fill();

      ctx.strokeStyle = isGold ? '#b87304' : '#8a6538';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Charred tandoor blister spots
      ctx.fillStyle = isGold ? 'rgba(255, 255, 255, 0.6)' : 'rgba(54, 30, 10, 0.65)';
      const blisters = [[-6, -12, 4], [8, -4, 5], [-5, 8, 4.5], [4, 16, 3.5], [-8, -2, 3]];
      blisters.forEach(([bx, by, br]) => {
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    } else if (kind === 'vada') {
      const r = 28;
      ctx.save();
      if (side !== 0) {
        ctx.beginPath();
        ctx.rect(side < 0 ? -r * 2 : 0, -r * 2, r * 2, r * 4);
        ctx.clip();
      }

      // Golden fried Medu Vada donut
      const vGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, r);
      vGrad.addColorStop(0, '#fcd385');
      vGrad.addColorStop(0.5, '#e08a28');
      vGrad.addColorStop(1, '#8f4a0a');
      ctx.fillStyle = vGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Center hole
      ctx.fillStyle = '#0a1610';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      // Crispy cracked crust highlights
      ctx.strokeStyle = '#5a2d04';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.stroke();

      // Curry leaf flecks
      ctx.fillStyle = '#225522';
      ctx.beginPath();
      ctx.ellipse(10, -8, 3, 1.5, 0.4, 0, Math.PI * 2);
      ctx.ellipse(-12, 6, 3.5, 1.8, -0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else if (kind === 'bomb') {
      const r = 24;
      // Spicy round chilli bomb
      const bGrad = ctx.createRadialGradient(-5, -5, 2, 0, 0, r);
      bGrad.addColorStop(0, '#4a4a4a');
      bGrad.addColorStop(0.4, '#242424');
      bGrad.addColorStop(1, '#0d0d0d');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#e63946';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Fiery Chilli icon
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌶️', 0, 1);

      // Fuse with spark
      ctx.strokeStyle = '#f4a261';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(8, -r - 10, 14, -r - 8);
      ctx.stroke();

      // Spark
      ctx.fillStyle = '#ffe24a';
      ctx.beginPath();
      ctx.arc(14, -r - 8, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'life') {
      // Golden glowing extra heart
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💖', 0, 0);
    }
  }
}
