// IceCreamRenderer.js - Photorealistic rendering using authentic extracted reference artwork
// Features the realistic 3D hand, empty waffle cone with no DHIRU sleeve, and clean gourmet scoops

export class IceCreamRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1;

    this.imagesLoaded = false;
    this.assets = {
      handCone: null,
      flavors: {}
    };

    this.loadAssets();
  }

  loadAssets() {
    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    };

    const flavorIds = [
      'chocolate', 'strawberry', 'vanilla', 'pistachio',
      'mango', 'blueberry', 'matcha', 'caramel',
      'mint', 'cherry', 'cookies', 'cotton_candy'
    ];

    const promises = [
      loadImage('/assets/hand_cone.png').then(img => { this.assets.handCone = img; })
    ];

    flavorIds.forEach(id => {
      promises.push(
        loadImage(`/assets/flavors/${id}.png`).then(img => {
          this.assets.flavors[id] = img;
        })
      );
    });

    Promise.all(promises).then(() => {
      this.imagesLoaded = true;
    });
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(300, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(300, Math.floor(rect.height * dpr));
    this.scale = dpr;
  }

  clear() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Solid pitch black background matching Snapchat reference
    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 0, w, h);
  }

  // Draw the authentic 3D Hand holding the EMPTY waffle cone (no DHIRU sticker, perfect cone)
  drawHandAndCone(coneX, coneY, handWidth, handHeight, coneAngle = 0) {
    const ctx = this.ctx;
    ctx.save();
    if (Math.abs(coneAngle) > 0.001) {
      const pivotY = coneY + handHeight * 0.65;
      ctx.translate(coneX, pivotY);
      ctx.rotate(coneAngle);
      ctx.translate(-coneX, -pivotY);
    }

    if (this.assets.handCone && this.assets.handCone.complete) {
      // 0.58 aligns the cone opening center perfectly with coneX
      ctx.drawImage(
        this.assets.handCone,
        coneX - handWidth * 0.58,
        coneY,
        handWidth,
        handHeight
      );
    }

    ctx.restore();
  }

  // Draw clean, realistic ice cream scoop (matching Screenshot 1: sculpted dome, cream folds, ruffled bottom skirt)
  // Perfectly contoured with NO flat cuts or sliced borders
  drawScoop(x, y, scoopWidth, scoopHeight, flavorId, angle = 0, opacity = 1.0) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (opacity < 1.0) ctx.globalAlpha = opacity;

    const img = this.assets.flavors[flavorId] || this.assets.flavors['chocolate'];

    if (img && img.complete) {
      ctx.drawImage(
        img,
        -scoopWidth * 0.5,
        -scoopHeight * 0.52,
        scoopWidth,
        scoopHeight
      );
    } else {
      ctx.fillStyle = '#542d17';
      ctx.beginPath();
      ctx.arc(0, 0, scoopWidth * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw Spawner at the top (clean, NO dotted vertical line)
  drawSpawner(x, y, flavorId, scoopWidth, scoopHeight) {
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(x, y);

    // Realistic hovering scoop
    this.drawScoop(0, 0, scoopWidth, scoopHeight, flavorId, 0);

    // Gentle subtle drop arrow indicator
    const bounceY = Math.sin(Date.now() * 0.008) * 3;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, scoopHeight * 0.52 + 10 + bounceY);
    ctx.lineTo(-6, scoopHeight * 0.52 + 3 + bounceY);
    ctx.lineTo(6, scoopHeight * 0.52 + 3 + bounceY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Draw UI Header (Scoop count e.g. "2/12" matching screenshot 1, scaled for mobile)
  drawUI(currentCount, targetCount, stability = 1) {
    const ctx = this.ctx;
    const w = this.canvas.width / this.scale;
    const isMobile = w < 500;

    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    const rightX = w - (isMobile ? 14 : 24);
    const topY = isMobile ? 62 : 72;

    ctx.font = isMobile ? '900 28px "Inter", "Segoe UI", sans-serif' : '900 36px "Inter", "Segoe UI", sans-serif';

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillText(`${currentCount}/${targetCount}`, rightX + 1, topY + 1);

    // White foreground
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${currentCount}/${targetCount}`, rightX, topY);

    // Mini subtext "SCOOPS"
    ctx.font = isMobile ? '700 9px "Inter", sans-serif' : '700 11px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillText('SCOOPS', rightX, topY + (isMobile ? 32 : 40));

    // Balance meter bar
    if (currentCount > 0) {
      const barW = isMobile ? 80 : 105;
      const barH = isMobile ? 5 : 6;
      const barX = rightX - barW;
      const barY = topY + (isMobile ? 46 : 56);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(barX, barY, barW, barH);

      const stabClamped = Math.max(0, Math.min(1, stability));
      const fillW = barW * stabClamped;
      const stabColor = stabClamped > 0.6 ? '#2ecc71' : stabClamped > 0.3 ? '#f39c12' : '#e74c3c';

      ctx.fillStyle = stabColor;
      ctx.fillRect(barX, barY, fillW, barH);
    }

    ctx.restore();
  }
}

export const ICE_CREAM_FLAVORS = [
  { id: 'chocolate', name: 'Belgian Dark Chocolate', colorBase: '#542d17' },
  { id: 'strawberry', name: 'Wild Strawberry Bliss', colorBase: '#ea6687' },
  { id: 'vanilla', name: 'Bourbon Vanilla Bean', colorBase: '#f7ebd7' },
  { id: 'pistachio', name: 'Sicilia Pistachio Gelato', colorBase: '#a2d66d' },
  { id: 'mango', name: 'Alphonso Mango Sorbet', colorBase: '#fca311' },
  { id: 'blueberry', name: 'Blueberry Velvet Swirl', colorBase: '#737fdb' },
  { id: 'matcha', name: 'Kyoto Matcha Green', colorBase: '#84ab61' },
  { id: 'caramel', name: 'Salted Caramel Silk', colorBase: '#d68f38' },
  { id: 'mint', name: 'Mint Chip Royale', colorBase: '#67cda9' },
  { id: 'cherry', name: 'Black Cherry Truffle', colorBase: '#9b2450' },
  { id: 'cookies', name: 'Cookies & Cream Crunch', colorBase: '#e8e8e8' },
  { id: 'cotton_candy', name: 'Cotton Candy Sparkle', colorBase: '#85d9ec' }
];
