# 🎮 ARCADE HUB • Premium Web Games Collection

A high-performance, responsive web arcade suite built with vanilla **HTML5 Canvas**, **Three.js (WebGL)**, **Matter.js (2D Physics)**, and the **Web Audio API**. Optimized for desktop, tablet, and mobile layouts.

---

## 🕹️ Featured Games

1. **🥟 Squishy Dumplings (Suika Merge)**
   - 10 tiers of cute squishy dumplings with dynamic squash-and-stretch physics.
   - Handcrafted Asian Dim Sum bamboo steamer basket with steam danger line and table base.
   - Fluid particle burst effects, merge animations, and high score tracking.

2. **⚔️ Mini Militia (2D Combat Outpost)**
   - 2D side-scrolling airborne soldier combat inspired by the classic multiplayer shooter.
   - Jetpack flight dynamics, dual virtual joysticks (movement & 360° aim/fire), AK-47 ballistics, and tactical platforming.
   - Intelligent AI bot skirmishes (Sgt. Viper & Col. Hunter), blood splatter, spawn protection shields, and timed/survival modes.
   - Mandatory horizontal landscape enforcement for phone and tablet play with animated rotation guidance.

3. **🍦 Ice Cream Stacking**
   - Realistic 2D rigid-body simulation with friction, mass, and center-of-gravity calculation.
   - Drop scoops onto a waffle cone; off-center drops cause realistic wobbling and toppling.
   - 12 distinct flavored scoops with specular highlights and procedural ruffled skirts.

4. **🌀 3D Ball Maze Puzzle**
   - Three.js isometric 3D labyrinth with dynamic shadows and exit portal arches.
   - 15 handcrafted levels from introductory layouts to complex multi-room mazes.
   - Dual control support: on-screen touch D-pad or keyboard (WASD / Arrows).

5. **🍉 Last Drop**
   - Precision water/juice filling mechanics with realistic liquid physics and meniscus simulation.
   - 3D full watermelon reservoir, brass tap fixture, robotic vs human opponent turns, and glass overflow detection.

6. **🥣 Katori Catch**
   - Reflex thali catch mechanics with stainless steel bowl physics.
   - Dead-centre bank catches, rim ricochet acoustics, combo chains, and multi-tier katoris.

7. **🥁 Masala Memory**
   - 6-spice Indian spice box (Haldi, Mirchi, Pudina, Kesar, Jamun, Imli) musical sequence memory game.
   - Dynamic brass polish, illuminated pulsing spice pods, and progressive round difficulty.

8. **🏃 Tiffin Run**
   - Fast-paced 3-lane Mumbai runner delivering 3-tier brass lunch dabbas across 6 sectors (up to 900m).
   - Chai puddles, vegetable crates, chilli sack hazards, golden idli bonuses, and lane-switching controls.

9. **🍉 Fruit Slice Frenzy**
   - Blade swipe fruit slicing with splash juice splatters, 3 bomb lives, combo multipliers, and rainbow styling.

10. **🧱 Block Blast**
    - 8x8 block puzzle grid featuring drag-and-drop tetromino shapes, row/column line clears, and streak combos.

11. **🌸 Bloom**
    - Hexagonal match-3 blossom chain reactions with cascading flower petals and score multiplier tracking.

---

## 🛠️ Technology Stack

- **Build Tool:** [Vite](https://vitejs.dev/)
- **Graphics & 3D:** Three.js (WebGL), HTML5 Canvas 2D
- **Physics:** Matter.js (2D rigid bodies), custom momentum & ballistics engines
- **Audio:** Custom Web Audio API synthesizer with spatial sound effects
- **Styling:** Modern CSS3 with CSS Grid, Flexbox, backdrop-filter, and fluid clamp typography
- **Storage:** LocalStorage for persistent high scores per game

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### Installation
```bash
# Clone repository
git clone <your-repository-url>
cd GAMES

# Install dependencies
npm install
```

### Development Server
```bash
# Start Vite development server
npm run dev
```
Open your browser to `http://localhost:3000` (or the port displayed in your terminal).

### Production Build
```bash
# Build optimized production bundle to dist/
npm run build

# Preview production build locally
npm run preview
```

---

## 📱 Mobile & Responsive Design
- **Arcade Hub Lobby:** Streamlined 2-column mobile layout (`repeat(2, 1fr)`) showing multiple games at once without excessive scrolling.
- **Orientation Control:** Mini Militia automatically detects orientation, locking to horizontal landscape for phones and tablets.
- **Touch Controls:** Responsive dual virtual joysticks, D-pads, and tactile tap controls designed for thumbs on mobile devices.

---

## 📄 License
MIT License. Created for the Arcade Hub project.
