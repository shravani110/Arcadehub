// MiniMilitiaPhysics.js - Authoritative physics engine for 2D combat
export class MiniMilitiaPhysics {
  constructor() {
    this.baseWidth = 1280;
    this.baseHeight = 720;
    this.worldWidth = 720 * 3; // 2160 pixels
    this.worldHeight = 720;
    this.groundLevel = 620; // 720 - 100

    // Complete obstacle platforms matching reference layout with left & right bridges
    this.obstacles = [
      // Left Section Bridges & Platforms
      { x: 0, y: this.baseHeight - 320, width: 140, height: 45 },    // Far left wall bridge
      { x: 80, y: this.baseHeight - 160, width: 110, height: 45 },   // Left low bridge
      { x: 220, y: this.baseHeight - 280, width: 120, height: 45 },  // Left mid bridge
      
      // Center Section Bridges & Platforms
      { x: 550, y: this.baseHeight - 160, width: 110, height: 45 },  // Center low bridge
      { x: 720, y: this.baseHeight - 290, width: 120, height: 45 },  // Center mid bridge
      { x: 920, y: this.baseHeight - 400, width: 120, height: 45 },  // Center elevated platform
      
      // Right Section Bridges & Platforms
      { x: 1250, y: this.baseHeight - 280, width: 120, height: 45 }, // Right mid bridge
      { x: 1450, y: this.baseHeight - 160, width: 110, height: 45 }, // Right low bridge
      { x: 1650, y: this.baseHeight - 320, width: 120, height: 45 }, // Right elevated bridge
      { x: 1850, y: this.baseHeight - 240, width: 140, height: 45 }, // Right coconut tree bridge
      { x: 2020, y: this.baseHeight - 340, width: 140, height: 45 }  // Far right wall bridge
    ];
  }

  getGroundLevel(x) {
    // Solid ground/basement across the entire 2160 world so no tree floats
    return this.groundLevel;
  }

  checkCollisionOnX(x, y, width, height, velocityX) {
    const nextX = x + velocityX;

    // World boundaries
    if (nextX < 0 || nextX + width > this.worldWidth) {
      return true;
    }

    // Obstacle platforms
    for (const obs of this.obstacles) {
      if (
        nextX < obs.x + obs.width &&
        nextX + width > obs.x &&
        y < obs.y + obs.height &&
        y + height > obs.y
      ) {
        return true;
      }
    }

    return false;
  }

  checkCollisionOnY(x, y, width, height, velocityY) {
    const nextY = y + velocityY;

    // World ceiling
    if (nextY < 0) {
      return true;
    }

    // Obstacle platforms
    for (const obs of this.obstacles) {
      if (
        x < obs.x + obs.width &&
        x + width > obs.x &&
        nextY < obs.y + obs.height &&
        nextY + height > obs.y
      ) {
        return true;
      }
    }

    return false;
  }

  checkBulletCollision(x, y) {
    // Solid ground across the entire world
    if (y >= this.groundLevel) {
      return true;
    }

    // World boundaries
    if (x < 0 || x > this.worldWidth || y < 0 || y > this.worldHeight) {
      return true;
    }

    // Obstacle platforms
    for (const obs of this.obstacles) {
      if (
        x >= obs.x &&
        x <= obs.x + obs.width &&
        y >= obs.y &&
        y <= obs.y + obs.height
      ) {
        return true;
      }
    }

    return false;
  }

  getSafeSpawn() {
    // Safe spawn locations distributed across platforms
    const options = [
      { x: 240, y: this.baseHeight - 360 },
      { x: 560, y: this.baseHeight - 240 },
      { x: 740, y: this.baseHeight - 370 },
      { x: 1260, y: this.baseHeight - 360 },
      { x: 1660, y: this.baseHeight - 400 }
    ];
    return options[Math.floor(Math.random() * options.length)];
  }
}
