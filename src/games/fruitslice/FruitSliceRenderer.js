// FruitSliceRenderer.js - Authentic Sky-Blue Pastel Fruit Slice Frenzy Renderer
export class FruitSliceRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    this.splashParticles = [];
    this.floatingTexts = [];
    // Bokeh bubbles in background
    this.bokeh = this.generateBokeh();
  }

  generateBokeh() {
    const list = [];
    for (let i = 0; i < 20; i++) {
      list.push({
        xRatio: Math.random(),
        yRatio: Math.random(),
        radius: Math.random() * 28 + 12,
        alpha: Math.random() * 0.25 + 0.1,
        speed: Math.random() * 0.04 + 0.02
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

  spawnJuiceSplash(x, y, color) {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5.5 + 2.0;
      this.splashParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 2,
        color,
        alpha: 1.0
      });
    }
  }

  spawnFloatingText(text, x, y, color = '#ff7b00', fontSize = 26) {
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
    for (let i = this.splashParticles.length - 1; i >= 0; i--) {
      const p = this.splashParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.26;
      p.alpha -= 0.022;
      if (p.alpha <= 0) this.splashParticles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.018;
      ft.scale = Math.max(1.0, ft.scale - 0.015);
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }

    // Floating bokeh
    this.bokeh.forEach(b => {
      b.yRatio -= b.speed * dt;
      if (b.yRatio < -0.1) b.yRatio = 1.1;
    });
  }

  render(state) {
    const { fruits, slicedPieces, bladeTrail, bombFlash } = state;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Soft Sky-Blue Pastel Gradient Background with Bokeh
    this.renderPastelBackground(ctx, w, h);

    // 2. Sliced Tumbling Fruit Halves
    slicedPieces.forEach(piece => {
      this.renderFruitHalf(ctx, piece);
    });

    // 3. Whole Flying Fruits & Bombs
    fruits.forEach(fruit => {
      this.renderFruit(ctx, fruit);
    });

    // 4. Flying Juice Splashes
    this.renderSplashes(ctx);

    // 5. Glowing Katana Blade Trail
    this.renderBladeTrail(ctx, bladeTrail);

    // 6. Floating Score Texts
    this.renderFloatingTexts(ctx);

    // 7. Bomb Flash Screen Explosion
    if (bombFlash > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 235, 210, ${Math.min(1.0, bombFlash)})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  renderPastelBackground(ctx, w, h) {
    // Soft sky blue to mint pastel gradient matching snap_actual_fruitslice.png
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#c3f0f8');
    bgGrad.addColorStop(0.5, '#aae5f3');
    bgGrad.addColorStop(1, '#90d7ec');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Bokeh bubbles
    this.bokeh.forEach(b => {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha})`;
      ctx.beginPath();
      ctx.arc(b.xRatio * w, b.yRatio * h, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  renderFruit(ctx, fruit) {
    ctx.save();
    ctx.translate(fruit.x, fruit.y);
    ctx.rotate(fruit.rotation);

    if (fruit.isBomb) {
      this.drawBomb(ctx, fruit.radius);
    } else {
      this.drawFruitGraphic(ctx, fruit.type, fruit.radius);
    }

    ctx.restore();
  }

  drawBomb(ctx, r) {
    // Bomb Iron Sphere
    const sphereGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    sphereGrad.addColorStop(0, '#64748b');
    sphereGrad.addColorStop(0.6, '#1e293b');
    sphereGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Fuse cap & line
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-r * 0.22, -r - 5, r * 0.44, 6);

    ctx.beginPath();
    ctx.moveTo(0, -r - 5);
    ctx.quadraticCurveTo(r * 0.35, -r - 18, r * 0.15, -r - 24);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Sputtering spark
    const sparkX = r * 0.15 + (Math.random() - 0.5) * 6;
    const sparkY = -r - 24 + (Math.random() - 0.5) * 6;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 5 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();

    // Danger skull symbol
    ctx.fillStyle = '#ef4444';
    ctx.font = `900 ${r * 0.75}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☠', 0, 2);
  }

  drawFruitGraphic(ctx, type, r) {
    switch (type) {
      case 'watermelon': {
        // Green striped watermelon
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 4;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
          ctx.beginPath();
          ctx.arc(0, 0, r - 2, a, a + 0.45);
          ctx.stroke();
        }

        // Pale inner rind & red center
        ctx.fillStyle = '#dcfce7';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.76, 0, Math.PI * 2);
        ctx.fill();

        // Black seeds
        ctx.fillStyle = '#111827';
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * (r * 0.45), Math.sin(a) * (r * 0.45), 3, 1.8, a, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'orange': {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // White pith & segmented citrus pulp
        ctx.fillStyle = '#ffedd5';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.80, 0, Math.PI * 2);
        ctx.fill();

        // Segments
        ctx.strokeStyle = '#ffedd5';
        ctx.lineWidth = 2;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * (r * 0.80), Math.sin(a) * (r * 0.80));
          ctx.stroke();
        }

        // Green Leaf on top
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.9, r * 0.32, r * 0.16, 0.4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'apple': {
        // Shiny red apple body
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(-r * 0.25, 0, r * 0.75, 0, Math.PI * 2);
        ctx.arc(r * 0.25, 0, r * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // Stem & green leaf
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.7);
        ctx.lineTo(3, -r * 1.15);
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(8, -r * 1.05, r * 0.28, r * 0.14, 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'strawberry': {
        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Seeds
        ctx.fillStyle = '#fef08a';
        for (let x = -r * 0.6; x <= r * 0.6; x += 10) {
          for (let y = -r * 0.6; y <= r * 0.6; y += 10) {
            if (x * x + y * y < (r * 0.7) * (r * 0.7)) {
              ctx.beginPath();
              ctx.arc(x, y, 1.8, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Green calyx leaves
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.85);
        ctx.lineTo(-r * 0.5, -r * 0.4);
        ctx.lineTo(0, -r * 0.3);
        ctx.lineTo(r * 0.5, -r * 0.4);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'lemon': {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.1, r * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef9c3';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.9, r * 0.68, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.82, r * 0.60, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    // Specular shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.28, r * 0.15, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  renderFruitHalf(ctx, piece) {
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.rotation);

    ctx.beginPath();
    ctx.arc(0, 0, piece.radius + 2, piece.clipAngle, piece.clipAngle + Math.PI);
    ctx.closePath();
    ctx.clip();

    this.drawFruitGraphic(ctx, piece.type, piece.radius);
    ctx.restore();
  }

  renderBladeTrail(ctx, trail) {
    if (trail.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < trail.length; i++) {
      const p1 = trail[i - 1];
      const p2 = trail[i];
      const ageRatio = 1 - (p2.age / 0.22);
      if (ageRatio <= 0) continue;

      // Glowing Katana blade trail
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = `rgba(255, 123, 0, ${ageRatio * 0.5})`;
      ctx.lineWidth = 14 * ageRatio;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = `rgba(255, 255, 255, ${ageRatio * 0.95})`;
      ctx.lineWidth = 5 * ageRatio;
      ctx.stroke();
    }
    ctx.restore();
  }

  renderSplashes(ctx) {
    this.splashParticles.forEach(p => {
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
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }
}
