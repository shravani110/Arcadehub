// MasalaMemoryRenderer.js - High-End Brass Masala Dabba & Glowing Spices Renderer

export const SPICES = [
  { name: 'Haldi', fill: '#e9b44c', light: '#ffdf7a', dark: '#996e19', freq: 262, desc: 'Turmeric' },
  { name: 'Mirchi', fill: '#c94f2a', light: '#ff6b42', dark: '#7a250b', freq: 330, desc: 'Chilli' },
  { name: 'Pudina', fill: '#52965e', light: '#86cd92', dark: '#2e5e37', freq: 392, desc: 'Mint' },
  { name: 'Kesar', fill: '#e07a5f', light: '#ffa38c', dark: '#943820', freq: 440, desc: 'Saffron' },
  { name: 'Jamun', fill: '#7d6ba3', light: '#ac98d8', dark: '#443468', freq: 523, desc: 'Berry' },
  { name: 'Imli', fill: '#b08954', light: '#dcaf74', dark: '#6e4c20', freq: 587, desc: 'Tamarind' }
];

export class MasalaMemoryRenderer {
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

    // 1. Atmosphere - Deep Warm Indian Kitchen Amber Wood & Flickering Candlelight
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#1c130d');
    bgGrad.addColorStop(0.5, '#120b07');
    bgGrad.addColorStop(1, '#090503');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    const candleFlicker = Math.sin((state.candleTime || 0) * 8) * 0.03 + Math.cos((state.candleTime || 0) * 13) * 0.02;

    // Warm radial candlelight aura
    const warmGlow = ctx.createRadialGradient(W / 2, H * 0.46, 20, W / 2, H * 0.46, W * 0.72);
    warmGlow.addColorStop(0, `rgba(235, 170, 90, ${0.18 + candleFlicker})`);
    warmGlow.addColorStop(0.5, `rgba(150, 90, 50, ${0.08 + candleFlicker * 0.5})`);
    warmGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = warmGlow;
    ctx.fillRect(0, 0, W, H);

    const cx = state.cx || W / 2;
    const cy = state.cy || H / 2 + 10;
    const r = state.r || Math.min(W, H) * 0.31;

    // 2. Hammered Brass Masala Dabba (Container)
    this.drawMasalaDabbaContainer(ctx, cx, cy, r, state);

    // 3. Expanding Brass Ripple Shockwaves
    if (state.ripples && state.ripples.length > 0) {
      ctx.save();
      for (const rip of state.ripples) {
        ctx.strokeStyle = rip.color || '#ffd97d';
        ctx.lineWidth = Math.max(1.5, 3.5 * (1 - rip.r / rip.maxR));
        ctx.globalAlpha = rip.alpha;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Six Recessed Spice Bowls (with Spring Scale Depression & Volumetric Light)
    for (let i = 0; i < SPICES.length; i++) {
      const angle = (i / SPICES.length) * Math.PI * 2 - Math.PI / 2;
      const bx = cx + Math.cos(angle) * r;
      const by = cy + Math.sin(angle) * r;
      const isLit = state.lit === i;
      const scale = (state.bowlScales ? state.bowlScales[i] : 1.0) * (isLit ? 1.06 : 1.0);
      const bowlRadius = r * 0.32 * scale;

      this.drawSpiceBowl(ctx, bx, by, bowlRadius, SPICES[i], isLit, state.litT || 0);
    }

    // 5. Center Brass Medallion with Round & Turn Status
    this.drawCenterMedallion(ctx, cx, cy, r * 0.36, state);

    // 6. Sequence Progress Indicator Beads (Input Phase)
    if (state.phase === 'input' && state.seq) {
      const total = state.seq.length;
      const beadSpacing = Math.min(18, (W * 0.7) / Math.max(1, total));
      const totalWidth = (total - 1) * beadSpacing;
      const startX = cx - totalWidth / 2;
      const beadY = cy + r + 46;

      ctx.save();
      for (let t = 0; t < total; t++) {
        const bx = startX + t * beadSpacing;
        const isCompleted = t < state.inputIdx;
        const isCurrent = t === state.inputIdx;

        // Glowing halo for current step
        if (isCurrent) {
          const halo = ctx.createRadialGradient(bx, beadY, 2, bx, beadY, 14);
          halo.addColorStop(0, 'rgba(255, 209, 102, 0.7)');
          halo.addColorStop(1, 'rgba(255, 209, 102, 0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(bx, beadY, 14, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = isCompleted ? '#48cae4' : isCurrent ? '#ffd166' : 'rgba(255, 255, 255, 0.22)';
        ctx.beginPath();
        ctx.arc(bx, beadY, isCurrent ? 5.5 : 4, 0, Math.PI * 2);
        ctx.fill();

        if (isCompleted || isCurrent) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 7. Particle Wisps & Bursts
    effects.render(ctx);

    // 8. Error Shake Flash
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(230, 57, 70, ${state.flash * 0.32})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  drawMasalaDabbaContainer(ctx, cx, cy, r, state) {
    ctx.save();

    const dabbaRadius = r + 42;

    // Deep Outer Contact Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.arc(cx, cy + 10, dabbaRadius, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Lathe-Turned Brass Rim
    const rimGrad = ctx.createLinearGradient(cx - dabbaRadius, cy - dabbaRadius, cx + dabbaRadius, cy + dabbaRadius);
    rimGrad.addColorStop(0, '#78551e');
    rimGrad.addColorStop(0.2, '#c99e44');
    rimGrad.addColorStop(0.45, '#ffe596');
    rimGrad.addColorStop(0.7, '#9e7428');
    rimGrad.addColorStop(1, '#573c11');
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, dabbaRadius, 0, Math.PI * 2);
    ctx.fill();

    // Dynamic Specular Light Sweep on the Brass Rim
    const shineAngle = state.shineAngle || 0;
    const sx = cx + Math.cos(shineAngle) * (dabbaRadius - 6);
    const sy = cy + Math.sin(shineAngle) * (dabbaRadius - 6);
    const shineGrad = ctx.createRadialGradient(sx, sy, 2, sx, sy, 50);
    shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    shineGrad.addColorStop(0.5, 'rgba(255, 225, 140, 0.25)');
    shineGrad.addColorStop(1, 'rgba(255, 225, 140, 0)');
    ctx.fillStyle = shineGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, dabbaRadius, 0, Math.PI * 2);
    ctx.fill();

    // Authentic Hammered Dimple Texture on Brass Rim
    ctx.fillStyle = 'rgba(70, 45, 12, 0.25)';
    const dimpleCount = 36;
    for (let d = 0; d < dimpleCount; d++) {
      const da = (d / dimpleCount) * Math.PI * 2;
      const dx = cx + Math.cos(da) * (dabbaRadius - 6);
      const dy = cy + Math.sin(da) * (dabbaRadius - 6);
      ctx.beginPath();
      ctx.arc(dx, dy, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Inner Polished Bronze Dabba Basin
    const basinGrad = ctx.createRadialGradient(cx, cy, r * 0.15, cx, cy, dabbaRadius - 8);
    basinGrad.addColorStop(0, '#2e1f14');
    basinGrad.addColorStop(0.65, '#1e130c');
    basinGrad.addColorStop(1, '#110a06');
    ctx.fillStyle = basinGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, dabbaRadius - 8, 0, Math.PI * 2);
    ctx.fill();

    // Ornate Engraved Filigree Ring Pattern
    ctx.strokeStyle = 'rgba(224, 164, 88, 0.4)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, r + 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(255, 214, 138, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 20, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawSpiceBowl(ctx, bx, by, br, spice, isLit, litProgress) {
    ctx.save();

    // 1. Upward Conical Volumetric Light Beam when Lit
    if (isLit) {
      const beamGrad = ctx.createRadialGradient(bx, by, br * 0.2, bx, by, br * 2.5);
      beamGrad.addColorStop(0, spice.light);
      beamGrad.addColorStop(0.4, spice.fill);
      beamGrad.addColorStop(0.8, 'rgba(255, 220, 150, 0.12)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = beamGrad;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(bx, by, br * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // 2. Bowl Recessed Shadow & Katori Rim
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(bx, by + 4, br + 4, 0, Math.PI * 2);
    ctx.fill();

    // Brass Katori Outer Bevel Rim
    const bowlRimGrad = ctx.createLinearGradient(bx - br, by - br, bx + br, by + br);
    bowlRimGrad.addColorStop(0, isLit ? '#fff1b8' : '#8c6520');
    bowlRimGrad.addColorStop(0.4, isLit ? '#ffffff' : '#ffd670');
    bowlRimGrad.addColorStop(0.8, isLit ? '#ffe28a' : '#aa7d28');
    bowlRimGrad.addColorStop(1, isLit ? '#e0b852' : '#5c4010');
    ctx.fillStyle = bowlRimGrad;
    ctx.beginPath();
    ctx.arc(bx, by, br + 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Inner Katori Basin Lip Shadow
    ctx.fillStyle = '#1c120a';
    ctx.beginPath();
    ctx.arc(bx, by, br + 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 3. Textured Spice Powder Mound (3D Convex Granular Texture)
    const spiceGrad = ctx.createRadialGradient(bx - br * 0.25, by - br * 0.25, 2, bx, by, br);
    spiceGrad.addColorStop(0, isLit ? spice.light : spice.fill);
    spiceGrad.addColorStop(0.65, spice.fill);
    spiceGrad.addColorStop(1, spice.dark);
    ctx.fillStyle = spiceGrad;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();

    // Granular Texture Flecks on Spice Mound
    ctx.fillStyle = isLit ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.28)';
    const flecks = [
      [-br * 0.35, -br * 0.25, 2.2],
      [br * 0.32, -br * 0.15, 2.0],
      [-br * 0.15, br * 0.35, 2.4],
      [br * 0.25, br * 0.28, 1.8],
      [0, -br * 0.4, 1.6],
      [-br * 0.38, br * 0.15, 1.9],
      [br * 0.15, -br * 0.35, 2.1]
    ];
    for (const [ox, oy, s] of flecks) {
      ctx.beginPath();
      ctx.arc(bx + ox, by + oy, s, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Glowing Neon Stroke & Bloom on Lit Bowl
    if (isLit) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.2;
      ctx.shadowColor = spice.light;
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.stroke();

      // Outer secondary neon ring
      ctx.strokeStyle = spice.light;
      ctx.lineWidth = 2.0;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(bx, by, br + 5, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 5. Spice Label & Botanical Subtitle (Bold High-Contrast Typography)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 8;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const titleSize = Math.max(12, Math.floor(br * 0.38));
    ctx.font = `900 ${titleSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = isLit ? '#ffffff' : '#fdf6e2';
    ctx.fillText(spice.name.toUpperCase(), bx, by - (br > 26 ? 3 : 0));

    if (br > 26) {
      ctx.font = `700 ${Math.max(9, Math.floor(br * 0.20))}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = isLit ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 230, 180, 0.75)';
      ctx.fillText(spice.desc.toUpperCase(), bx, by + titleSize * 0.72);
    }
    ctx.restore();

    ctx.restore();
  }

  drawCenterMedallion(ctx, cx, cy, mr, state) {
    ctx.save();

    const scale = state.medallionScale || 1.0;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Medallion Outer Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.arc(0, 4, mr, 0, Math.PI * 2);
    ctx.fill();

    // Central Brass Medallion Body
    const medGrad = ctx.createLinearGradient(-mr, -mr, mr, mr);
    medGrad.addColorStop(0, '#664514');
    medGrad.addColorStop(0.3, '#c99134');
    medGrad.addColorStop(0.55, '#ffe596');
    medGrad.addColorStop(0.8, '#a67220');
    medGrad.addColorStop(1, '#4f320b');
    ctx.fillStyle = medGrad;
    ctx.beginPath();
    ctx.arc(0, 0, mr, 0, Math.PI * 2);
    ctx.fill();

    // Engraved Sunburst Rune Rays
    ctx.strokeStyle = 'rgba(255, 235, 160, 0.35)';
    ctx.lineWidth = 1.4;
    const rayCount = 12;
    for (let r = 0; r < rayCount; r++) {
      const a = (r / rayCount) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (mr * 0.65), Math.sin(a) * (mr * 0.65));
      ctx.lineTo(Math.cos(a) * (mr * 0.92), Math.sin(a) * (mr * 0.92));
      ctx.stroke();
    }

    // Dark Inset Center Dial
    const dialGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, mr - 4);
    dialGrad.addColorStop(0, '#22160d');
    dialGrad.addColorStop(0.8, '#140c07');
    dialGrad.addColorStop(1, '#0c0704');
    ctx.fillStyle = dialGrad;
    ctx.beginPath();
    ctx.arc(0, 0, mr - 4, 0, Math.PI * 2);
    ctx.fill();

    // Round Counter (Large Golden Numerals)
    ctx.font = `900 ${Math.floor(mr * 0.46)}px system-ui, sans-serif`;
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.fillText(`${state.round} / 12`, 0, -mr * 0.22);

    // Status message with contextual colors
    let statusText = 'WATCH…';
    let statusColor = '#e0a458';
    if (state.phase === 'input') {
      statusText = 'YOUR TURN';
      statusColor = '#48cae4';
    } else if (state.phase === 'oops') {
      statusText = 'WRONG!';
      statusColor = '#ef476f';
    }

    ctx.font = `800 ${Math.floor(mr * 0.24)}px system-ui, sans-serif`;
    ctx.fillStyle = statusColor;
    ctx.fillText(statusText, 0, mr * 0.32);

    ctx.restore();
  }
}
