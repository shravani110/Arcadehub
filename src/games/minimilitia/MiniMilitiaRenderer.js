// MiniMilitiaRenderer.js - High-End Canvas Renderer for Mini Militia
export class MiniMilitiaRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    this.images = {
      bg: new Image(),
      bg2: new Image(),
      surface: new Image(),
      tree: new Image(),
      grass: new Image(),
      sand: new Image(),
      bigStones: new Image(),
      playerSpriteRight: new Image(),
      playerSpriteLeft: new Image(),
      enemySpriteRight: new Image(),
      enemySpriteLeft: new Image(),
      handWithGun: new Image(),
      handWithGunLeft: new Image(),
      enemyGun: new Image(),
      enemyGunLeft: new Image(),
      ak47: new Image()
    };

    this.images.bg.src = '/assets/minimilitia/bg.jpeg';
    this.images.bg2.src = '/assets/minimilitia/bg2.jpeg';
    this.images.surface.src = '/assets/minimilitia/surface.png';
    this.images.tree.src = '/assets/minimilitia/sprite/tree.png';
    this.images.grass.src = '/assets/minimilitia/sprite/grass.png';
    this.images.sand.src = '/assets/minimilitia/sprite/sand.png';
    this.images.bigStones.src = '/assets/minimilitia/sprite/big_stones.png';
    this.images.playerSpriteRight.src = '/assets/minimilitia/sprite/character_sprite1_right.png';
    this.images.playerSpriteLeft.src = '/assets/minimilitia/sprite/character_sprite1_left.png';
    this.images.enemySpriteRight.src = '/assets/minimilitia/sprite/Enemy-1-right.png';
    this.images.enemySpriteLeft.src = '/assets/minimilitia/sprite/Enemy-1-left.png';
    this.images.handWithGun.src = '/assets/minimilitia/sprite/hand_with_gun.png';
    this.images.handWithGunLeft.src = '/assets/minimilitia/sprite/hand_with_gun_left.png';
    this.images.enemyGun.src = '/assets/minimilitia/sprite/enemy_gun.PNG';
    this.images.enemyGunLeft.src = '/assets/minimilitia/sprite/enemy_gun_left.PNG';
    this.images.ak47.src = '/assets/minimilitia/Ak-47.png';

    // Cloud positions for atmospheric depth
    this.clouds = [
      { x: 120, y: 80, s: 0.8, speed: 0.15 },
      { x: 620, y: 130, s: 1.1, speed: 0.18 },
      { x: 1100, y: 70, s: 0.9, speed: 0.14 },
      { x: 1650, y: 110, s: 1.2, speed: 0.2 }
    ];

    // Tree positions matching Kaushik's layout
    this.treePositions = [
      { x: 150 },
      { x: 400 },
      { x: 800 },
      { x: 1100 },
      { x: 1500 },
      { x: 1800 }
    ];
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
  }

  render(state) {
    const ctx = this.ctx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    ctx.save();
    ctx.scale(dpr, dpr);

    // Calculate view scale from dynamic base viewport.
    // Base height is 720. On widescreen mobile landscape displays (e.g. 18:9, 19.5:9, 20:9),
    // dynamically expand baseW up to the worldWidth (2160) so the game renders edge-to-edge
    // with ZERO black bars on left and right.
    const baseH = 720;
    const aspect = this.width / Math.max(1, this.height);
    const baseW = aspect >= (16 / 9) ? Math.min(2160, Math.round(baseH * aspect)) : 1280;
    const scale = Math.min(this.width / baseW, this.height / baseH);
    const viewW = baseW * scale;
    const viewH = baseH * scale;
    const viewOffsetX = (this.width - viewW) / 2;
    const viewOffsetY = (this.height - viewH) / 2;

    this.lastBaseW = baseW;
    this.lastScale = scale;
    this.lastViewOffsetX = viewOffsetX;
    this.lastViewOffsetY = viewOffsetY;

    // Fill screen black for any letterboxing
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.width, this.height);

    // Clip to game viewport
    ctx.save();
    ctx.beginPath();
    ctx.rect(viewOffsetX, viewOffsetY, viewW, viewH);
    ctx.clip();

    ctx.translate(viewOffsetX, viewOffsetY);
    ctx.scale(scale, scale);

    // 1. Render Sky & Background
    this.renderBackground(ctx, state.cameraX, baseW, baseH);

    // 2. Camera Transform for World Objects
    ctx.save();
    ctx.translate(-state.cameraX, -state.cameraY);

    // 3. Render Trees (in background layer)
    this.renderTrees(ctx, state.time);

    // 4. Render Ground Terrain (surface.png)
    this.renderGround(ctx, state.physics);

    // 5. Render Obstacle Platforms
    this.renderObstacles(ctx, state.physics.obstacles);

    // 6. Render Particles (jetpack smoke, bullet sparks, hits)
    this.renderParticles(ctx, state.particles);

    // 7. Render Bullets
    this.renderBullets(ctx, state.bullets);

    // 8. Render Bots / Opponents
    if (state.bots) {
      for (const bot of state.bots) {
        this.renderBot(ctx, bot, state.time);
      }
    }

    // 8b. Render Remote Players (Online Multiplayer or Local 2P)
    if (state.remotePlayers) {
      for (const rp of state.remotePlayers) {
        if (!rp.isDead) {
          this.renderBot(ctx, rp, state.time);
        } else {
          this.renderRespawnBeacon(ctx, rp, state.time);
        }
      }
    }

    // 9. Render Main Player Soldier or Respawn Countdown
    if (!state.player.isDead) {
      this.renderPlayer(ctx, state.player, state.time);
    } else {
      this.renderRespawnBeacon(ctx, state.player, state.time);
    }

    // 10. Render Aim Crosshair
    this.renderCrosshair(ctx, state.aimX, state.aimY);

    ctx.restore(); // Exit camera space

    // 11. Render Top HUD (in screen space)
    this.renderHUD(ctx, state, baseW, baseH);

    // 12. Render Notifications / Respawn Banner
    if (state.notification) {
      this.renderNotification(ctx, state.notification, baseW, baseH);
    }

    ctx.restore(); // Exit viewport clip
    ctx.restore(); // Exit DPR
  }

  renderBackground(ctx, cameraX, baseW, baseH) {
    // 1. Atmosphere Gradient Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, baseH);
    skyGrad.addColorStop(0, '#59b8eb');
    skyGrad.addColorStop(0.55, '#8fd2f4');
    skyGrad.addColorStop(0.75, '#b9e5f9');
    skyGrad.addColorStop(1, '#6db5b1');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, baseW, baseH);

    // 2. Seamless Distant Panoramic Jungle (Single continuous vista, NO tiling cuts or pasted seams)
    if (this.images.bg2.complete && this.images.bg2.naturalWidth > 0) {
      // Extra width gives subtle depth/parallax without ANY tiling seams
      const extraW = Math.max(260, Math.round((2160 - baseW) * 0.35));
      const bgW = baseW + extraW;
      const bgH = baseH;
      const maxScroll = Math.max(1, 2160 - baseW);
      const scrollRatio = Math.max(0, Math.min(1, cameraX / maxScroll));
      const paraX = -scrollRatio * extraW;

      ctx.drawImage(this.images.bg2, paraX, 0, bgW, bgH);
    }

    // 3. Floating atmospheric clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (const c of this.clouds) {
      const cloudX = ((c.x - cameraX * 0.25) % (baseW + 200) + (baseW + 200)) % (baseW + 200) - 100;
      ctx.beginPath();
      ctx.arc(cloudX, c.y, 22 * c.s, 0, Math.PI * 2);
      ctx.arc(cloudX + 22 * c.s, c.y - 10 * c.s, 26 * c.s, 0, Math.PI * 2);
      ctx.arc(cloudX + 46 * c.s, c.y, 20 * c.s, 0, Math.PI * 2);
      ctx.arc(cloudX + 24 * c.s, c.y + 6 * c.s, 18 * c.s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderTrees(ctx, time) {
    if (!this.images.tree.complete || this.images.tree.naturalWidth === 0) return;

    for (let i = 0; i < this.treePositions.length; i++) {
      const t = this.treePositions[i];
      const sway = Math.sin(time * 0.002 + i) * 0.025;

      ctx.save();
      ctx.translate(t.x + 150, 620); // Anchor at tree root on ground
      ctx.rotate(sway);
      ctx.drawImage(this.images.tree, -150, -380, 300, 390);
      ctx.restore();
    }
  }

  renderGround(ctx, physics) {
    const groundLevel = physics.groundLevel;
    const maxGroundX = physics.worldWidth; // 2160 pixels - full solid ground across all trees

    if (this.images.surface.complete && this.images.surface.naturalWidth > 0) {
      const surfW = this.images.surface.width;
      const surfH = this.images.surface.height;

      // Repeat surface.png across the ground up to maxGroundX with seamless overlap
      const step = Math.max(1, surfW - 2);
      for (let x = 0; x < maxGroundX; x += step) {
        const drawW = Math.min(surfW, maxGroundX - x);
        ctx.drawImage(
          this.images.surface,
          0, 0, drawW, surfH,
          x, groundLevel, drawW, surfH
        );
      }
    } else {
      // Fallback ground
      ctx.fillStyle = '#4a3b32';
      ctx.fillRect(0, groundLevel, maxGroundX, 150);
      ctx.fillStyle = '#5c9636';
      ctx.fillRect(0, groundLevel, maxGroundX, 18);
    }
  }

  renderObstacles(ctx, obstacles) {
    for (const obs of obstacles) {
      const halfH = obs.height / 2;

      // 1. Big stone backing / shadow
      if (this.images.bigStones.complete && this.images.bigStones.naturalWidth > 0) {
        ctx.drawImage(this.images.bigStones, obs.x, obs.y, obs.width, obs.height);
      }

      // 2. Sand base
      if (this.images.sand.complete && this.images.sand.naturalWidth > 0) {
        ctx.drawImage(this.images.sand, obs.x, obs.y + halfH - 8, obs.width, halfH + 8);
      } else {
        ctx.fillStyle = '#7a5c37';
        ctx.fillRect(obs.x, obs.y + halfH, obs.width, halfH);
      }

      // 3. Grass top
      if (this.images.grass.complete && this.images.grass.naturalWidth > 0) {
        ctx.drawImage(this.images.grass, obs.x, obs.y - 8, obs.width, halfH + 8);
      } else {
        ctx.fillStyle = '#6ab035';
        ctx.fillRect(obs.x, obs.y, obs.width, halfH);
      }

      // Platform border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
    }
  }

  renderPlayer(ctx, player, time) {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    const facingLeft = player.gunAngle < -Math.PI / 2 || player.gunAngle > Math.PI / 2;
    if (facingLeft) {
      ctx.scale(-1, 1);
    }

    // 1. Character Sprite Sheet
    const spriteImg = this.images.playerSpriteRight;
    if (spriteImg.complete && spriteImg.naturalWidth > 0) {
      const spriteW = 380 / 4; // 95
      const spriteH = 335 / 2 - 16; // 151.5

      // Jetpack flying row vs walking row
      const yOffset = player.isUsingJetpack ? spriteH : 0;
      const xOffset = (player.walkFrame || 0) * spriteW;

      ctx.drawImage(
        spriteImg,
        xOffset, yOffset, spriteW, spriteH,
        -player.width / 2, -player.height / 2, player.width, player.height
      );
    } else {
      // Fallback soldier rectangle
      ctx.fillStyle = '#1e88e5';
      ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    }

    // 2. Gun
    ctx.save();
    const gunOffsetX = facingLeft ? -16 : 16;
    const gunOffsetY = 2;

    if (facingLeft) {
      ctx.scale(1, -1);
    }

    ctx.rotate(player.gunAngle);

    const gunW = 46;
    const gunH = 20;

    if (this.images.handWithGun.complete && this.images.handWithGun.naturalWidth > 0) {
      ctx.drawImage(
        this.images.handWithGun,
        gunOffsetX - gunW / 2, gunOffsetY - gunH / 2, gunW, gunH
      );
    } else {
      ctx.fillStyle = '#222';
      ctx.fillRect(gunOffsetX - gunW / 2, gunOffsetY - gunH / 2, gunW, 8);
    }

    // Muzzle flash when firing
    if (Date.now() - (player.lastShotTime || 0) < 65) {
      ctx.fillStyle = '#fff475';
      ctx.beginPath();
      ctx.arc(gunOffsetX + gunW / 2 + 6, gunOffsetY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff7043';
      ctx.beginPath();
      ctx.arc(gunOffsetX + gunW / 2 + 10, gunOffsetY, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Spawn protection energy bubble
    if (player.spawnProtection && Date.now() < player.spawnProtection) {
      const shieldR = 36 + Math.sin(time * 0.012) * 3;
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.fillStyle = 'rgba(0, 255, 255, 0.18)';
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // Health Bar and Gamer Tag above player head
    this.renderMiniHealthBar(ctx, player.x, player.y - 18, player.width, player.health, player.name || null);
  }

  renderRespawnBeacon(ctx, player, time) {
    const remaining = Math.max(1, Math.ceil(((player.respawnTimer || 0) - Date.now()) / 1000));
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    // Glowing respawn pulse rings
    const pulse = (time * 0.005) % 1;
    ctx.beginPath();
    ctx.arc(0, 0, 16 + pulse * 45, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 255, 255, ${1 - pulse})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Holographic reviving silhouette
    ctx.fillStyle = 'rgba(0, 255, 255, 0.35)';
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);

    // Countdown Badge
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText(`REVIVING IN ${remaining}s...`, 0, -player.height / 2 - 20);

    ctx.restore();
  }

  renderBot(ctx, bot, time) {
    if (bot.isDead) return;

    ctx.save();
    ctx.translate(bot.x + bot.width / 2, bot.y + bot.height / 2);

    const facingLeft = bot.gunAngle < -Math.PI / 2 || bot.gunAngle > Math.PI / 2;
    if (facingLeft) {
      ctx.scale(-1, 1);
    }

    // 1. Opponent Sprite
    const spriteImg = this.images.playerSpriteRight;
    if (spriteImg.complete && spriteImg.naturalWidth > 0) {
      const spriteW = 380 / 4;
      const spriteH = 335 / 2 - 16;
      const yOffset = bot.isUsingJetpack ? spriteH : 0;
      const xOffset = (bot.walkFrame || 0) * spriteW;

      ctx.drawImage(
        spriteImg,
        xOffset, yOffset, spriteW, spriteH,
        -bot.width / 2, -bot.height / 2, bot.width, bot.height
      );
    } else {
      ctx.fillStyle = '#e53935';
      ctx.fillRect(-bot.width / 2, -bot.height / 2, bot.width, bot.height);
    }

    // 2. Bot Gun
    ctx.save();
    const gunOffsetX = facingLeft ? -16 : 16;
    const gunOffsetY = 2;

    if (facingLeft) {
      ctx.scale(1, -1);
    }

    ctx.rotate(bot.gunAngle);

    const gunW = 46;
    const gunH = 20;

    if (this.images.handWithGun.complete && this.images.handWithGun.naturalWidth > 0) {
      ctx.drawImage(
        this.images.handWithGun,
        gunOffsetX - gunW / 2, gunOffsetY - gunH / 2, gunW, gunH
      );
    } else {
      ctx.fillStyle = '#333';
      ctx.fillRect(gunOffsetX - gunW / 2, gunOffsetY - gunH / 2, gunW, 8);
    }

    // Bot Muzzle Flash
    if (Date.now() - (bot.lastShotTime || 0) < 65) {
      ctx.fillStyle = '#ffb300';
      ctx.beginPath();
      ctx.arc(gunOffsetX + gunW / 2 + 5, gunOffsetY, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();

    // Bot name badge & health bar
    this.renderMiniHealthBar(ctx, bot.x, bot.y - 18, bot.width, bot.health, bot.name);
  }

  renderMiniHealthBar(ctx, x, y, width, health, label = null) {
    const barW = width;
    const barH = 5;

    if (label) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + width / 2, y - 4);
    }

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x - 1, y - 1, barW + 2, barH + 2);

    // Health Fill
    const pct = Math.max(0, health / 100);
    ctx.fillStyle = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(x, y, barW * pct, barH);
  }

  renderBullets(ctx, bullets) {
    for (const bullet of bullets) {
      ctx.save();

      // Smoke trail points
      if (bullet.trail && bullet.trail.length > 1) {
        for (let i = 0; i < bullet.trail.length; i++) {
          const pt = bullet.trail[i];
          const alpha = (i / bullet.trail.length) * 0.35;
          ctx.fillStyle = `rgba(240, 240, 240, ${alpha})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.translate(bullet.x, bullet.y);
      ctx.rotate(bullet.angle);

      // Brass bullet body
      ctx.fillStyle = '#cd7f32';
      ctx.fillRect(-5, -2, 10, 4);

      // Glowing tip
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(5, 0, 2, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      // Subtle glow
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 4;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-5, -2, 11, 4);

      ctx.restore();
    }
  }

  renderParticles(ctx, particles) {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderCrosshair(ctx, aimX, aimY) {
    ctx.save();
    ctx.strokeStyle = '#00ff44';
    ctx.lineWidth = 2;

    const size = 12;

    // Horizontal segments
    ctx.beginPath();
    ctx.moveTo(aimX - size, aimY);
    ctx.lineTo(aimX - 4, aimY);
    ctx.moveTo(aimX + 4, aimY);
    ctx.lineTo(aimX + size, aimY);
    ctx.stroke();

    // Vertical segments
    ctx.beginPath();
    ctx.moveTo(aimX, aimY - size);
    ctx.lineTo(aimX, aimY - 4);
    ctx.moveTo(aimX, aimY + 4);
    ctx.lineTo(aimX, aimY + size);
    ctx.stroke();

    // Center point
    ctx.fillStyle = '#00ff44';
    ctx.beginPath();
    ctx.arc(aimX, aimY, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderHUD(ctx, state, baseW, baseH) {
    ctx.save();

    // 1. TOP LEFT: Weapon Card with AK-47 & Ammo Count
    const cardX = 68;
    const cardY = 18;
    const cardW = 180;
    const cardH = 44;

    // Semi-transparent dark background with white border (matching screenshot)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // AK-47 Weapon Sprite
    if (this.images.ak47.complete && this.images.ak47.naturalWidth > 0) {
      ctx.drawImage(this.images.ak47, cardX + 8, cardY + 6, 95, 32);
    }

    // Ammo Count text (e.g. "10 / 25")
    ctx.fillStyle = state.player.isReloading ? '#f59e0b' : '#ffffff';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    if (state.player.isReloading) {
      ctx.fillText('RELOADING', cardX + cardW - 8, cardY + cardH / 2);
    } else {
      ctx.fillText(`${state.player.ammo} / ${state.player.maxAmmo}`, cardX + cardW - 8, cardY + cardH / 2 + 10);
    }

    // 2. TOP CENTER: Scoreboard & Countdown Timer
    const scoreBoxW = 75;
    const scoreBoxH = 36;
    const blueBoxX = baseW / 2 - 120;
    const blueBoxY = 18;

    const timerBoxW = 86;
    const timerBoxH = 40;
    const timerBoxX = baseW / 2 - timerBoxW / 2;
    const timerBoxY = 16;

    const redBoxX = baseW / 2 + 45;
    const redBoxY = 18;

    // Multiplayer Names Tag
    if (state.playType === 'online' || state.playType === 'local') {
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#60a5fa';
      ctx.fillText((state.playerName || 'P1').toUpperCase(), blueBoxX + scoreBoxW / 2, blueBoxY - 7);
      ctx.fillStyle = '#f87171';
      ctx.fillText((state.opponentName || 'P2').toUpperCase(), redBoxX + scoreBoxW / 2, redBoxY - 7);

      if (state.roomCode) {
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`ROOM: ${state.roomCode}`, baseW / 2, timerBoxY + 40 + 14);
      }
    }

    // Blue Score Box (Left)
    ctx.fillStyle = '#0044ff';
    this.roundRect(ctx, blueBoxX, blueBoxY, scoreBoxW, scoreBoxH, 6, true, false);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.playerScore || 0, blueBoxX + scoreBoxW / 2, blueBoxY + scoreBoxH / 2);

    // Timer Box (Center)
    ctx.fillStyle = '#000000';
    this.roundRect(ctx, timerBoxX, timerBoxY, timerBoxW, timerBoxH, 6, true, false);

    const min = Math.floor(state.timer / 60);
    const sec = Math.floor(state.timer % 60);
    const timeStr = `${min}:${sec < 10 ? '0' : ''}${sec}`;

    ctx.fillStyle = state.timer <= 60 ? '#ef4444' : '#ffffff';
    ctx.font = 'bold 19px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeStr, timerBoxX + timerBoxW / 2, timerBoxY + timerBoxH / 2);

    // Red Score Box (Right)
    ctx.fillStyle = '#e60000';
    this.roundRect(ctx, redBoxX, redBoxY, scoreBoxW, scoreBoxH, 6, true, false);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.opponentScore || 0, redBoxX + scoreBoxW / 2, redBoxY + scoreBoxH / 2);

    // Survival Lives / Chances Indicator (if in chances mode)
    if (state.lives !== undefined) {
      const maxL = state.maxLives || 5;
      let heartsStr = '';
      for (let i = 0; i < maxL; i++) {
        heartsStr += i < state.lives ? '❤️' : '🖤';
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`CHANCES: ${heartsStr}`, baseW / 2, 70);
    }

    // 3. TOP RIGHT: Health & Jetpack Boost Panel
    const statBoxW = 210;
    const statBoxH = 50;
    const statBoxX = baseW - statBoxW - 68;
    const statBoxY = 18;

    // Enclosing white bounding box (matching screenshot)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(statBoxX, statBoxY, statBoxW, statBoxH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(statBoxX, statBoxY, statBoxW, statBoxH);

    // Health Bar (Pink/Purple with Heart Icon)
    const barX = statBoxX + 32;
    const barW = statBoxW - 42;
    const healthY = statBoxY + 8;
    const barH = 14;

    // Heart Icon
    ctx.fillStyle = '#ef4444';
    ctx.font = '13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('❤️', statBoxX + 16, healthY + 11);

    // Health Bar Background
    ctx.fillStyle = 'rgba(160, 32, 240, 0.25)';
    ctx.fillRect(barX, healthY, barW, barH);
    // Health Fill (Purple/Pink #A020F0 / #e024c3)
    const healthPct = Math.max(0, state.player.health / 100);
    ctx.fillStyle = '#A020F0';
    ctx.fillRect(barX, healthY, barW * healthPct, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, healthY, barW, barH);

    // Jetpack Boost Bar (Blue with Lightning/Plus Icon)
    const jetpackY = statBoxY + 28;

    // Boost Icon
    ctx.fillStyle = '#0099ff';
    ctx.font = 'bold 15px Arial';
    ctx.fillText('⚡', statBoxX + 16, jetpackY + 12);

    // Jetpack Bar Background
    ctx.fillStyle = 'rgba(0, 102, 255, 0.25)';
    ctx.fillRect(barX, jetpackY, barW, barH);
    // Jetpack Fill (Bright Blue)
    const jetpackPct = Math.max(0, state.player.jetpackFuel / 100);
    ctx.fillStyle = '#0066ff';
    ctx.fillRect(barX, jetpackY, barW * jetpackPct, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, jetpackY, barW, barH);

    // FPS Display underneath
    ctx.fillStyle = '#ffff00';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`FPS: ${state.fps || 60}`, statBoxX + statBoxW, statBoxY + statBoxH + 16);

    ctx.restore();
  }

  renderNotification(ctx, notif, baseW, baseH) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(baseW / 2 - 200, baseH / 2 - 25, 400, 50);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(baseW / 2 - 200, baseH / 2 - 25, 400, 50);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(notif, baseW / 2, baseH / 2);
    ctx.restore();
  }

  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}
