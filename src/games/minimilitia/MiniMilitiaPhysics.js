// MiniMilitiaPhysics.js - Authoritative physics engine for 2D Outpost combat
export class MiniMilitiaPhysics {
  constructor() {
    this.baseWidth = 1280;
    this.baseHeight = 720;
    this.worldWidth = 2048;
    this.worldHeight = 1070;
    this.groundLevel = 970;

    // Outpost map platforms, bunkers, castle structures and cavern ledges
    // Exactly aligned with public/assets/minimilitia/outpost_map.jpg (2048x1070 scale)
    this.obstacles = [
      // --- Top Fortress Castle ---
      { x: 800, y: 154, width: 480, height: 26, name: 'Castle Roof', isSolid: false },
      { x: 840, y: 180, width: 75, height: 95, name: 'Left Tower', isSolid: true },
      { x: 990, y: 236, width: 95, height: 28, name: 'Center Observation', isSolid: false },
      { x: 1160, y: 180, width: 75, height: 95, name: 'Right Tower', isSolid: true },
      { x: 795, y: 300, width: 175, height: 30, name: 'Left Castle Deck', isSolid: false },
      { x: 1105, y: 300, width: 175, height: 30, name: 'Right Castle Deck', isSolid: false },
      { x: 795, y: 395, width: 175, height: 35, name: 'Left Castle Floor', isSolid: false },
      { x: 1105, y: 395, width: 175, height: 35, name: 'Right Castle Floor', isSolid: false },
      { x: 960, y: 280, width: 18, height: 145, name: 'Left Chute Wall', isSolid: true },
      { x: 1095, y: 280, width: 18, height: 145, name: 'Right Chute Wall', isSolid: true },

      // --- Cavern Surface & Upper Outpost Bunkers ---
      { x: 480, y: 430, width: 315, height: 30, name: 'Left Surface', isSolid: false },
      { x: 1280, y: 430, width: 315, height: 30, name: 'Right Surface', isSolid: false },
      { x: 470, y: 335, width: 120, height: 25, name: 'Left Stalactite', isSolid: false },
      { x: 1475, y: 335, width: 120, height: 25, name: 'Right Stalactite', isSolid: false },
      { x: 390, y: 440, width: 170, height: 28, name: 'Upper Left Bunker Top', isSolid: false },
      { x: 400, y: 535, width: 145, height: 28, name: 'Upper Left Bunker Ledge', isSolid: false },
      { x: 1510, y: 440, width: 170, height: 28, name: 'Upper Right Bunker Top', isSolid: false },
      { x: 1525, y: 535, width: 145, height: 28, name: 'Upper Right Bunker Ledge', isSolid: false },

      // --- Mid Cavern Ledges & Bunkers ---
      { x: 550, y: 565, width: 185, height: 30, name: 'Mid Left Rock Ledge', isSolid: false },
      { x: 1340, y: 565, width: 185, height: 30, name: 'Mid Right Rock Ledge', isSolid: false },
      { x: 390, y: 655, width: 135, height: 24, name: 'Mid Left Bridge', isSolid: false },
      { x: 1545, y: 655, width: 135, height: 24, name: 'Mid Right Bridge', isSolid: false },
      { x: 480, y: 700, width: 160, height: 30, name: 'Mid Left Bunker', isSolid: false },
      { x: 1430, y: 700, width: 160, height: 30, name: 'Mid Right Bunker', isSolid: false },

      // --- Central Cavern Columns & The Center Island ---
      { x: 850, y: 520, width: 60, height: 75, name: 'Left Bracket', isSolid: true },
      { x: 1000, y: 470, width: 50, height: 40, name: 'Center Pedestal', isSolid: false },
      { x: 1140, y: 520, width: 60, height: 75, name: 'Right Bracket', isSolid: true },
      { x: 890, y: 595, width: 295, height: 42, name: 'Center Island Mound', isSolid: false },

      // --- Lower Catacombs, Trenches & Cavern Floor ---
      { x: 680, y: 670, width: 200, height: 30, name: 'Lower Left Ridge', isSolid: false },
      { x: 1195, y: 670, width: 200, height: 30, name: 'Lower Right Ridge', isSolid: false },
      { x: 860, y: 785, width: 355, height: 30, name: 'Trench Upper Tier', isSolid: false },
      { x: 990, y: 830, width: 95, height: 26, name: 'Trench Altar', isSolid: false },
      { x: 850, y: 885, width: 375, height: 32, name: 'Trench Lower Tier', isSolid: false },
      { x: 480, y: 795, width: 160, height: 30, name: 'Lower Left Bunker', isSolid: false },
      { x: 1430, y: 795, width: 160, height: 30, name: 'Lower Right Bunker', isSolid: false },
      { x: 570, y: 865, width: 125, height: 24, name: 'Lower Left Bridge', isSolid: false },
      { x: 1380, y: 865, width: 125, height: 24, name: 'Lower Right Bridge', isSolid: false },
      { x: 680, y: 920, width: 315, height: 40, name: 'Bottom Left Floor', isSolid: false },
      { x: 1080, y: 920, width: 315, height: 40, name: 'Bottom Right Floor', isSolid: false },
      { x: 400, y: 970, width: 1250, height: 60, name: 'Bedrock Floor', isSolid: true },

      // --- Outer Cavern Walls ---
      { x: 350, y: 420, width: 30, height: 550, name: 'Left Cavern Wall', isSolid: true },
      { x: 1690, y: 420, width: 30, height: 550, name: 'Right Cavern Wall', isSolid: true }
    ];
  }

  getGroundLevel(x) {
    return this.groundLevel;
  }

  checkCollisionOnX(x, y, width, height, velocityX) {
    const nextX = x + velocityX;

    // World horizontal boundaries
    if (nextX < 360 || nextX + width > 1700) {
      return true;
    }

    // Solid obstacle walls & pillars
    for (const obs of this.obstacles) {
      if (obs.isSolid) {
        if (
          nextX < obs.x + obs.width &&
          nextX + width > obs.x &&
          y < obs.y + obs.height &&
          y + height > obs.y
        ) {
          return true;
        }
      }
    }

    return false;
  }

  checkCollisionOnY(x, y, width, height, velocityY) {
    const nextY = y + velocityY;

    // World ceiling
    if (nextY < 20) {
      return true;
    }

    // Bedrock ground level
    if (nextY + height >= this.groundLevel) {
      return true;
    }

    // Platforms & obstacles
    for (const obs of this.obstacles) {
      if (x + width > obs.x && x < obs.x + obs.width) {
        if (obs.isSolid) {
          if (nextY < obs.y + obs.height && nextY + height > obs.y) {
            return true;
          }
        } else {
          // One-way landing platform (can jetpack upwards through it, land on top when falling)
          if (velocityY > 0 && y + height <= obs.y + 14 && nextY + height >= obs.y) {
            return true;
          }
        }
      }
    }

    return false;
  }

  checkBulletCollision(x, y) {
    // Bedrock ground & ceiling
    if (y >= this.groundLevel || y <= 20) {
      return true;
    }

    // Outer boundary walls
    if (x <= 360 || x >= 1700) {
      return true;
    }

    // Check hit on obstacles
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

  getSafeSpawn(slot = 0) {
    // Distinct tactical spawn locations across Outpost map
    const spawns = [
      { x: 880, y: 220, name: 'Upper Castle Deck' },
      { x: 1020, y: 520, name: 'Center Island Mound' },
      { x: 480, y: 380, name: 'Left Surface Outpost' },
      { x: 1420, y: 630, name: 'Mid Right Bunker' },
      { x: 1024, y: 90, name: 'Castle Roof' },
      { x: 1020, y: 810, name: 'Bottom Sandbag Trench' },
      { x: 620, y: 510, name: 'Mid Left Rock Ledge' },
      { x: 1300, y: 720, name: 'Right Lower Trench' }
    ];

    if (slot >= 0 && slot < spawns.length) {
      return spawns[slot];
    }
    return spawns[Math.floor(Math.random() * spawns.length)];
  }
}
