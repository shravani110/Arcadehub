// MiniMilitiaBot.js - Intelligent Combat AI Opponent
export class MiniMilitiaBot {
  constructor(id, name, startX, startY) {
    this.id = id;
    this.name = name;
    this.x = startX;
    this.y = startY;
    this.width = 50;
    this.height = 70;

    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = 3.6;
    this.gravity = 0.75;
    this.onGround = false;

    this.health = 100;
    this.isDead = false;
    this.respawnTimer = 0;

    this.jetpackFuel = 100;
    this.isUsingJetpack = false;

    this.ammo = 25;
    this.maxAmmo = 25;
    this.isReloading = false;
    this.reloadTimer = 0;

    this.gunAngle = Math.PI;
    this.lastShotTime = 0;
    this.burstCount = 0;
    this.burstCooldown = 0;
    this.decisionTimer = 0;
    this.targetAction = 'patrol';

    // Animation state
    this.walkFrame = 0;
    this.walkTimer = 0;
  }

  update(physics, targetPlayer, currentTime, onBotShoot) {
    if (this.isDead) {
      if (currentTime > this.respawnTimer) {
        this.respawn(physics);
      }
      return;
    }

    // Handle reload
    if (this.isReloading) {
      if (currentTime > this.reloadTimer) {
        this.ammo = this.maxAmmo;
        this.isReloading = false;
      }
    } else if (this.ammo <= 0) {
      this.isReloading = true;
      this.reloadTimer = currentTime + 3500;
    }

    // AI Decision Making (every 200ms)
    this.decisionTimer += 16;
    if (this.decisionTimer > 200) {
      this.decisionTimer = 0;
      this.evaluateTactics(targetPlayer);
    }

    // Execute Tactics
    this.executeMovement(physics, targetPlayer);

    // Aim & Shooting
    if (!targetPlayer.isDead) {
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      const targetCenterX = targetPlayer.x + targetPlayer.width / 2;
      const targetCenterY = targetPlayer.y + targetPlayer.height / 2;

      const directAngle = Math.atan2(targetCenterY - centerY, targetCenterX - centerX);
      // Smooth aim adjustment with minor natural inaccuracy
      const aimSpread = (Math.sin(currentTime * 0.005) * 0.08);
      this.gunAngle = directAngle + aimSpread;

      const dist = Math.hypot(targetCenterX - centerX, targetCenterY - centerY);

      // Shoot in tactical bursts if in range (< 850px) and not reloading
      if (dist < 850 && !this.isReloading && this.ammo > 0) {
        if (currentTime > this.burstCooldown && currentTime - this.lastShotTime > 140) {
          this.shoot(onBotShoot, currentTime);
          this.burstCount++;
          if (this.burstCount >= 3 + Math.floor(Math.random() * 3)) {
            this.burstCount = 0;
            this.burstCooldown = currentTime + 600 + Math.random() * 600;
          }
        }
      }
    }

    // Jetpack fuel regeneration
    if (!this.isUsingJetpack && this.jetpackFuel < 100) {
      this.jetpackFuel = Math.min(100, this.jetpackFuel + 0.35);
    }

    // Walking animation cycle
    if (Math.abs(this.velocityX) > 0.5) {
      this.walkTimer += 16;
      if (this.walkTimer > 100) {
        this.walkTimer = 0;
        this.walkFrame = (this.walkFrame + 1) % 4;
      }
    } else {
      this.walkFrame = 0;
    }
  }

  evaluateTactics(player) {
    if (player.isDead) {
      this.targetAction = 'patrol';
      return;
    }

    const dist = Math.hypot(player.x - this.x, player.y - this.y);

    if (this.health < 30 || this.isReloading) {
      // Retreat / evasive jetpack flight
      this.targetAction = 'retreat';
    } else if (dist > 500) {
      this.targetAction = 'approach';
    } else if (dist < 180) {
      this.targetAction = 'backstep';
    } else {
      this.targetAction = 'strafe';
    }
  }

  executeMovement(physics, player) {
    let desiredVelX = 0;
    let wantsJetpack = false;

    const diffX = player.x - this.x;
    const diffY = player.y - this.y;

    switch (this.targetAction) {
      case 'approach':
        desiredVelX = diffX > 0 ? this.speed : -this.speed;
        if (diffY < -40 || (Math.abs(diffX) > 100 && this.onGround && Math.random() < 0.08)) {
          wantsJetpack = true;
        }
        break;

      case 'retreat':
        desiredVelX = diffX > 0 ? -this.speed : this.speed;
        wantsJetpack = true; // Fly away to higher ground
        break;

      case 'backstep':
        desiredVelX = diffX > 0 ? -this.speed : this.speed;
        break;

      case 'strafe':
        // Jiggle strafe back and forth
        desiredVelX = Math.sin(Date.now() * 0.003) > 0 ? this.speed : -this.speed;
        if (diffY < -60) wantsJetpack = true;
        break;

      case 'patrol':
      default:
        desiredVelX = Math.sin(Date.now() * 0.001) > 0 ? this.speed * 0.7 : -this.speed * 0.7;
        break;
    }

    // Avoid running off cliff into abyss (x > 1800)
    if (this.x > 1750 && desiredVelX > 0) {
      desiredVelX = -this.speed;
    }
    if (this.x < 80 && desiredVelX < 0) {
      desiredVelX = this.speed;
    }

    this.velocityX = desiredVelX;

    // Jetpack physics
    if (wantsJetpack && this.jetpackFuel > 10) {
      this.isUsingJetpack = true;
      this.velocityY = Math.max(this.velocityY - 0.42, -4.5);
      this.jetpackFuel = Math.max(0, this.jetpackFuel - 0.38);
    } else {
      this.isUsingJetpack = false;
      this.velocityY += this.gravity;
    }

    // Collision detection on X
    if (!physics.checkCollisionOnX(this.x, this.y, this.width, this.height, this.velocityX)) {
      this.x += this.velocityX;
    } else {
      // Hit a wall: jump/jetpack over it!
      this.velocityX = 0;
      if (this.jetpackFuel > 15) {
        this.velocityY = -4.0;
        this.isUsingJetpack = true;
      }
    }

    // Collision detection on Y
    if (!physics.checkCollisionOnY(this.x, this.y, this.width, this.height, this.velocityY)) {
      this.y += this.velocityY;
    } else {
      if (this.velocityY > 0) {
        this.onGround = true;
      }
      this.velocityY = 0;
    }

    // Ground level physics
    const groundLvl = physics.getGroundLevel(this.x);
    if (this.y + this.height >= groundLvl) {
      this.y = groundLvl - this.height;
      this.velocityY = 0;
      this.onGround = true;
    } else if (this.y + this.height >= 720) {
      // Fell into abyss!
      this.takeDamage(100);
    } else {
      this.onGround = false;
    }
  }

  shoot(onBotShoot, currentTime) {
    if (this.ammo <= 0 || this.isReloading) return;

    this.ammo--;
    this.lastShotTime = currentTime;

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const gunLength = 32;

    const spawnX = centerX + Math.cos(this.gunAngle) * gunLength;
    const spawnY = centerY + Math.sin(this.gunAngle) * gunLength;

    onBotShoot({
      x: spawnX,
      y: spawnY,
      angle: this.gunAngle,
      ownerId: this.id,
      damage: 10
    });
  }

  takeDamage(amount) {
    if (this.isDead) return;

    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.isDead = true;
      this.respawnTimer = Date.now() + 3000;
    }
  }

  respawn(physics) {
    const spawn = physics.getSafeSpawn();
    this.x = spawn.x;
    this.y = spawn.y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.health = 100;
    this.jetpackFuel = 100;
    this.ammo = this.maxAmmo;
    this.isReloading = false;
    this.isDead = false;
  }
}
