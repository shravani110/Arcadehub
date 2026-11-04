// MiniMilitiaRenderer.js - High-performance Outpost 2D Canvas Renderer
export class MiniMilitiaRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width || 1280;
    this.height = canvas.height || 720;

    // Load authentic assets
    this.images = {
      outpostMap: new Image(),
      playerSpriteRight: new Image(),
      playerSpriteLeft: new Image(),
      handWithGun: new Image(),
      handWithGunLeft: new Image(),
      ak47: new Image()
    };

    this.images.outpostMap.src = '/assets/minimilitia/outpost_map.jpg';
    this.images.playerSpriteRight.src = '/assets/minimilitia/sprite/character_sprite1_right.png';
    this.images.playerSpriteLeft.src = '/assets/minimilitia/sprite/character_sprite1_left.png';
    this.images.handWithGun.src = '/assets/minimilitia/sprite/hand_with_gun.png';
    this.images.handWithGunLeft.src = '/assets/minimilitia/sprite/hand_with_gun_left.png';
    this.images.ak47.src = '/assets/minimilitia/Ak-47.png';

    // Ambient floating dust particles in the catacombs
    this.dustParticles = Array.from({ length: 40 }, () => ({
      x: Math.random() * 2048,
      y: Math.random() * 1070,
      size: 1 + Math.random() * 2.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -0.2 - Math.random() * 0.4,
      opacity: 0.15 + Math.random() * 0.35
    }));
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

    // Calculate dynamic base viewport (base height 720, aspect-adjusted width)
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

    // Fill screen with dark Outpost cavern letterboxing
    ctx.fillStyle = '#0e0c0b';
    ctx.fillRect(0, 0, this.width, this.height);

    // Clip to game viewport
    ctx.save();
    ctx.beginPath();
    ctx.rect(viewOffsetX, viewOffsetY, viewW, viewH);
    ctx.clip();

    ctx.translate(viewOffsetX, viewOffsetY);
    ctx.scale(scale, scale);

    // 1. Atmosphere backdrop
    this.renderAtmosphere(ctx, baseW, baseH);

    // 2. Camera Transform for World Objects
    ctx.save();
    ctx.translate(-state.cameraX, -state.cameraY);

    // 3. Render Outpost Map Image
    this.renderOutpostMap(ctx, state.physics);

    // 4. Render Ambient Catacomb Dust Particles
    this.renderDust(ctx, state.physics);

    // 5. Render Particles (jetpack smoke, bullet sparks, blood hits)
    this.renderParticles(ctx, state.particles);

    // 6. Render Bullets
    this.renderBullets(ctx, state.bullets);

    // 7. Render Bots (Single Player)
    if (state.bots) {
      for (const bot of state.bots) {
        if (!bot.isDead) {
          this.renderBot(ctx, bot, state.time);
        } else {
          this.renderRespawnBeacon(ctx, bot, state.time, bot.color);
        }
      }
    }

    // 8. Render Remote Players (Online Multiplayer)
    if (state.remotePlayers) {
      for (const rp of state.remotePlayers) {
        if (!rp.isDead) {
          this.renderRemotePlayer(ctx, rp, state.time);
        } else {
          this.renderRespawnBeacon(ctx, rp, state.time, rp.color);
        }
      }
    }

    // 9. Render Main Player Soldier or Respawn Countdown
    if (!state.player.isDead) {
      this.renderPlayer(ctx, state.player, state.time, 1, '#3b82f6');
    } else {
      this.renderRespawnBeacon(ctx, state.player, state.time, '#3b82f6');
    }

    // 10. Render Aim Crosshair
    this.renderCrosshair(ctx, state.aimX, state.aimY);

    ctx.restore(); // Exit camera space

    // 11. Render Top HUD (in screen space)
    this.renderHUD(ctx, state, baseW, baseH);

    // 12. Render Notifications
    if (state.notification) {
      this.renderNotification(ctx, state.notification, baseW, baseH);
    }

    ctx.restore(); // Exit viewport clip
    ctx.restore(); // Exit DPR
  }

  renderAtmosphere(ctx, baseW, baseH) {
    // Dark volcanic night/cavern atmosphere matching Outpost
    const grad = ctx.createLinearGradient(0, 0, 0, baseH);
    grad.addColorStop(0, '#151311');
    grad.addColorStop(0.4, '#1b1816');
    grad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, baseW, baseH);
  }

  renderOutpostMap(ctx, physics) {
    const worldW = physics.worldWidth || 2048;
    const worldH = physics.worldHeight || 1070;

    if (this.images.outpostMap.complete && this.images.outpostMap.naturalWidth > 0) {
      ctx.drawImage(this.images.outpostMap, 0, 0, worldW, worldH);
    } else {
      // High-contrast fallback geometry
      ctx.fillStyle = '#2a2421';
      ctx.fillRect(0, 0, worldW, worldH);
      for (const obs of physics.obstacles) {
        ctx.fillStyle = obs.isSolid ? '#524a45' : '#738356';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      }
    }
  }

  renderDust(ctx, physics) {
    ctx.save();
    ctx.fillStyle = '#e8d8be';
    for (const d of this.dustParticles) {
      d.y += d.speedY;
      d.x += d.speedX;
      if (d.y < 50) d.y = physics.worldHeight - 50;
      if (d.x < 360) d.x = 1680;
      if (d.x > 1680) d.x = 360;

      ctx.globalAlpha = d.opacity;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderPlayer(ctx, player, time, slot = 1, color = '#3b82f6') {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    // Colored tactical combat aura at soldier's feet
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, player.height / 2 - 2, 22, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.restore();

    const facingLeft = player.gunAngle < -Math.PI / 2 || player.gunAngle > Math.PI / 2;
    if (facingLeft) {
      ctx.scale(-1, 1);
    }

    // 1. Character Sprite Sheet
    const spriteImg = this.images.playerSpriteRight;
    if (spriteImg.complete && spriteImg.naturalWidth > 0) {
      const spriteW = 380 / 4;
      const spriteH = 335 / 2 - 16;
      const yOffset = player.isUsingJetpack ? spriteH : 0;
      const xOffset = (player.walkFrame || 0) * spriteW;

      ctx.drawImage(
        spriteImg,
        xOffset, yOffset, spriteW, spriteH,
        -player.width / 2, -player.height / 2, player.width, player.height
      );
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    }

    // 2. AK-47 Weapon
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

    // Health Bar and Gamer Tag above player head with assigned player color
    this.renderMiniHealthBar(ctx, player.x, player.y - 18, player.width, player.health, player.name || null, color);
  }

  renderBot(ctx, bot, time) {
    this.renderPlayer(ctx, bot, time, 0, bot.color || '#ef4444');
  }

  renderRemotePlayer(ctx, rp, time) {
    this.renderPlayer(ctx, rp, time, rp.slot || 2, rp.color || '#ef4444');
  }

  renderMiniHealthBar(ctx, x, y, width, health, name, badgeColor = '#3b82f6') {
    const barW = 54;
    const barH = 5;
    const barX = x + width / 2 - barW / 2;
    const barY = y;

    // Gamer tag with soldier color badge
    if (name) {
      ctx.save();
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = badgeColor;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(name.toUpperCase(), barX + barW / 2, barY - 4);
      ctx.restore();
    }

    // Health bar track
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    // Health fill (Green -> Yellow -> Red)
    const ratio = Math.max(0, Math.min(1, health / 100));
    ctx.fillStyle = ratio > 0.5 ? '#22c55e' : (ratio > 0.25 ? '#eab308' : '#ef4444');
    ctx.fillRect(barX, barY, barW * ratio, barH);
  }

  renderRespawnBeacon(ctx, player, time, color = '#3b82f6') {
    const remaining = Math.max(1, Math.ceil(((player.respawnTimer || 0) - Date.now()) / 1000));
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    const pulse = (time * 0.005) % 1;
    ctx.beginPath();
    ctx.arc(0, 0, 16 + pulse * 45, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 1 - pulse;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText(`REVIVING IN ${remaining}s...`, 0, -player.height / 2 - 20);

    ctx.restore();
  }

  renderCrosshair(ctx, aimX, aimY) {
    const r = 9;
    ctx.save();
    ctx.strokeStyle = '#00ff44';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(aimX, aimY, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(aimX - r - 4, aimY);
    ctx.lineTo(aimX - 2, aimY);
    ctx.moveTo(aimX + 2, aimY);
    ctx.lineTo(aimX + r + 4, aimY);
    ctx.moveTo(aimX, aimY - r - 4);
    ctx.lineTo(aimX, aimY - 2);
    ctx.moveTo(aimX, aimY + 2);
    ctx.lineTo(aimX, aimY + r + 4);
    ctx.stroke();

    ctx.restore();
  }

  renderBullets(ctx, bullets) {
    if (!bullets) return;

    for (const b of bullets) {
      // Bullet tracer line
      if (b.trail && b.trail.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let i = 1; i < b.trail.length; i++) {
          ctx.lineTo(b.trail[i].x, b.trail[i].y);
        }
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = 'rgba(255, 235, 59, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // Yellow glowing bullet core
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      ctx.fillStyle = '#fff59d';
      ctx.fillRect(-6, -2, 12, 4);

      ctx.fillStyle = '#ff9800';
      ctx.fillRect(-8, -1, 4, 2);

      ctx.restore();
    }
  }

  renderParticles(ctx, particles) {
    if (!particles) return;

    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderHUD(ctx, state, baseW, baseH) {
    // 1. TOP LEFT: Weapon Status Card
    const cardW = 160;
    const cardH = 46;
    const cardX = 64;
    const cardY = 18;

    ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
    this.roundRect(ctx, cardX, cardY, cardW, cardH, 8, true, false);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, cardX, cardY, cardW, cardH, 8, false, true);

    if (this.images.ak47.complete && this.images.ak47.naturalWidth > 0) {
      ctx.drawImage(this.images.ak47, cardX + 8, cardY + 7, 90, 30);
    }

    ctx.fillStyle = state.player.isReloading ? '#f59e0b' : '#ffffff';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    if (state.player.isReloading) {
      ctx.fillText('RELOAD', cardX + cardW - 8, cardY + cardH / 2);
    } else {
      ctx.fillText(`${state.player.ammo} / ${state.player.maxAmmo}`, cardX + cardW - 8, cardY + cardH / 2 + 8);
    }

    // 2. TOP CENTER: Scoreboard & Match Timer for 1, 2, 3, or 4 Players
    const playerCount = state.playerCount || 2;
    const timerBoxW = 86;
    const timerBoxH = 38;
    const timerBoxX = baseW / 2 - timerBoxW / 2;
    const timerBoxY = 16;

    const min = Math.floor(state.timer / 60);
    const sec = Math.floor(state.timer % 60);
    const timeStr = `${min}:${sec < 10 ? '0' : ''}${sec}`;

    if (playerCount === 1) {
      // 1 PLAYER: Solo Practice HUD
      const soloW = 210;
      const soloH = 38;
      const soloX = baseW / 2 - soloW / 2;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      this.roundRect(ctx, soloX, timerBoxY, soloW, soloH, 8, true, false);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, soloX, timerBoxY, soloW, soloH, 8, false, true);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`OUTPOST SCOUT • ${timeStr}`, soloX + soloW / 2, timerBoxY + soloH / 2);
    } else if (playerCount === 2) {
      // 2 PLAYERS: Classic P1 Blue vs P2 Red
      const scoreBoxW = 75;
      const scoreBoxH = 36;
      const blueBoxX = baseW / 2 - 120;
      const blueBoxY = 18;
      const redBoxX = baseW / 2 + 45;
      const redBoxY = 18;

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

      ctx.fillStyle = '#0044ff';
      this.roundRect(ctx, blueBoxX, blueBoxY, scoreBoxW, scoreBoxH, 6, true, false);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(state.playerScore || 0, blueBoxX + scoreBoxW / 2, blueBoxY + scoreBoxH / 2);

      ctx.fillStyle = '#000000';
      this.roundRect(ctx, timerBoxX, timerBoxY, timerBoxW, timerBoxH, 6, true, false);
      ctx.fillStyle = state.timer <= 60 ? '#ef4444' : '#ffffff';
      ctx.font = 'bold 19px Arial';
      ctx.fillText(timeStr, timerBoxX + timerBoxW / 2, timerBoxY + timerBoxH / 2);

      ctx.fillStyle = '#e60000';
      this.roundRect(ctx, redBoxX, redBoxY, scoreBoxW, scoreBoxH, 6, true, false);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(state.opponentScore || 0, redBoxX + scoreBoxW / 2, redBoxY + scoreBoxH / 2);
    } else {
      // 3 or 4 PLAYERS: Free-For-All Outpost Leaderboard Bar
      const scores = state.scores || { 1: state.playerScore || 0, 2: 0, 3: 0, 4: 0 };
      const playersList = state.combatants || [
        { slot: 1, name: state.playerName || 'P1', color: '#3b82f6', score: scores[1] || 0 },
        { slot: 2, name: 'Sgt. Viper', color: '#ef4444', score: scores[2] || 0 },
        { slot: 3, name: 'Col. Hunter', color: '#22c55e', score: scores[3] || 0 },
        ...(playerCount === 4 ? [{ slot: 4, name: 'Major Steel', color: '#eab308', score: scores[4] || 0 }] : [])
      ];

      const barW = playerCount === 4 ? 380 : 310;
      const barH = 34;
      const barX = baseW / 2 - barW / 2;
      const barY = 16;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      this.roundRect(ctx, barX, barY, barW, barH, 8, true, false);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      this.roundRect(ctx, barX, barY, barW, barH, 8, false, true);

      const colW = barW / playersList.length;
      for (let i = 0; i < playersList.length; i++) {
        const p = playersList[i];
        const cx = barX + i * colW + colW / 2;

        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = p.color;
        ctx.fillText(`P${p.slot} [${p.score || 0}]`, cx, barY + 11);

        ctx.fillStyle = '#ffffff';
        ctx.font = '9px Arial';
        const truncatedName = (p.name || `P${p.slot}`).substring(0, 8);
        ctx.fillText(truncatedName, cx, barY + 23);
      }

      // Timer badge below leaderboard
      ctx.fillStyle = state.timer <= 60 ? '#ef4444' : 'rgba(255, 255, 255, 0.85)';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`⏱️ ${timeStr}`, baseW / 2, barY + barH + 4);
    }

    // Survival Mode Hearts (if applicable)
    if (state.lives !== undefined) {
      const maxL = state.maxLives || 5;
      let heartsStr = '';
      for (let i = 0; i < maxL; i++) {
        heartsStr += i < state.lives ? '❤️' : '🖤';
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`LIVES: ${heartsStr}`, baseW / 2, 70);
    }

    // 3. TOP RIGHT: Health & Jetpack Fuel Panel
    const statBoxW = 210;
    const statBoxH = 50;
    const statBoxX = baseW - statBoxW - 68;
    const statBoxY = 18;

    ctx.fillStyle = '#223348';
    this.roundRect(ctx, statBoxX, statBoxY, statBoxW, statBoxH, 4, true, false);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    this.roundRect(ctx, statBoxX, statBoxY, statBoxW, statBoxH, 4, false, true);

    const barW = 160;
    const barH = 12;
    const barX = statBoxX + 38;

    // Health Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(barX - 1, statBoxY + 8, barW + 2, barH);
    const healthRatio = Math.max(0, Math.min(1, state.player.health / 100));
    ctx.fillStyle = '#9b5de5';
    ctx.fillRect(barX, statBoxY + 9, barW * healthRatio, barH - 2);

    // Jetpack Fuel Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(barX - 1, statBoxY + 28, barW + 2, barH);
    const fuelRatio = Math.max(0, Math.min(1, state.player.jetpackFuel / 100));
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(barX, statBoxY + 29, barW * fuelRatio, barH - 2);

    // Heart and lightning icons
    ctx.font = '13px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❤️', statBoxX + 20, statBoxY + 14);
    ctx.fillText('⚡', statBoxX + 20, statBoxY + 34);
  }

  renderNotification(ctx, text, baseW, baseH) {
    ctx.save();
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textW = ctx.measureText(text).width + 36;
    const textH = 34;
    const textX = baseW / 2 - textW / 2;
    const textY = baseH * 0.46;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
    this.roundRect(ctx, textX, textY, textW, textH, 6, true, false);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, textX, textY, textW, textH, 6, false, true);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(text, baseW / 2, textY + textH / 2);
    ctx.restore();
  }

  roundRect(ctx, x, y, width, height, radius = 5, fill = true, stroke = false) {
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
