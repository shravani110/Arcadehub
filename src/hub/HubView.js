// HubView.js - Arcade Lobby & Game Selector for Arcade Portal
import { soundManager } from '../sound/SoundManager.js';

export class HubView {
  constructor(containerEl, onSelectGame) {
    this.container = containerEl;
    this.onSelectGame = onSelectGame;
    this.render();
  }

  render() {
    const isMuted = soundManager.isMuted();

    // High Scores
    const tiffinRunBest = localStorage.getItem('tiffinrun_high_score') || '0';
    const katoriCatchBest = localStorage.getItem('katoricatch_high_score') || '0';
    const masalaMemoryBest = localStorage.getItem('masalamemory_high_score') || '0';
    const dumplingBest = localStorage.getItem('dumpling_high_score') || '0';
    const lastDropBest = localStorage.getItem('lastdrop_high_score') || '0';
    const blockBlastBest = localStorage.getItem('blockblast_high_score') || '0';
    const fruitSliceBest = localStorage.getItem('fruitslice_high_score') || '0';
    const bloomBest = localStorage.getItem('bloom_high_score') || '0';
    const miniMilitiaBest = localStorage.getItem('minimilitia_high_score') || '0';

    this.container.innerHTML = `
      <div class="hub-wrapper">
        <header class="hub-header">
          <div style="display: flex; justify-content: flex-end; width: 100%; margin-bottom: 12px;">
            <button class="icon-btn" id="hub-sound-btn" title="Toggle Sound">
              ${isMuted 
                ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
                : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>'}
            </button>
          </div>
          <h1 class="hub-title">ARCADE HUB</h1>
          <p class="hub-subtitle">Premium web games collection • Instant play on desktop & mobile</p>
        </header>

        <main class="hub-grid">
          <!-- Game 1: Tiffin Run -->
          <article class="game-card card-tiffinrun" data-game="tiffinrun">
            <div class="card-preview">
              <span class="card-badge" style="background: rgba(244, 140, 6, 0.25); color: #f48c06; border-color: rgba(244, 140, 6, 0.4);">3-LANE RUNNER</span>
              <div class="preview-visual" style="display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, #2d241c 0%, #15100c 100%);">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <path d="M20 160 L75 80 L105 80 L160 160 Z" fill="#2a1f18" stroke="#f48c06" stroke-width="1.5" stroke-dasharray="4,4"/>
                  <!-- 3-Tier Brass Tiffin Carrier Stack -->
                  <rect x="76" y="85" width="28" height="10" rx="3" fill="#e0a93b" stroke="#7d5813" stroke-width="1.5"/>
                  <rect x="74" y="97" width="32" height="11" rx="3" fill="#e0a93b" stroke="#7d5813" stroke-width="1.5"/>
                  <rect x="72" y="110" width="36" height="12" rx="3" fill="#e0a93b" stroke="#7d5813" stroke-width="1.5"/>
                  <path d="M84 85 Q90 70 96 85" fill="none" stroke="#68470a" stroke-width="3"/>
                  <!-- Golden Idli Aura -->
                  <circle cx="90" cy="52" r="18" fill="rgba(255, 209, 102, 0.25)"/>
                  <ellipse cx="90" cy="52" rx="14" ry="10" fill="#fff9db" stroke="#ffd166" stroke-width="2"/>
                </svg>
              </div>
            </div>
            <div class="card-content">
              <h2 class="card-title">Tiffin Run</h2>
              <p class="card-desc">Dash across Mumbai streets delivering hot lunch dabbas! Dodge chai puddles & chilli sacks, collect golden idlis, and complete all 6 sectors to 900m.</p>
              <div class="card-footer">
                <span class="card-tag">Best: ${tiffinRunBest} pts</span>
                <button class="card-play-btn">
                  Play Game
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Game 2: Katori Catch (PLACED BACK AS IS) -->
          <article class="game-card card-katoricatch" data-game="katoricatch">
            <div class="card-preview">
              <span class="card-badge" style="background: rgba(131, 197, 190, 0.25); color: #83c5be; border-color: rgba(131, 197, 190, 0.4);">REFLEX BANK</span>
              <div class="preview-visual" style="display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, #162823 0%, #091310 100%);">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <!-- Raining Katoris -->
                  <ellipse cx="65" cy="50" rx="14" ry="5" fill="#bcc7cf" stroke="#8b98a3" stroke-width="2"/>
                  <path d="M51 50 Q65 72 79 50 Z" fill="#6a7782"/>
                  <ellipse cx="115" cy="70" rx="14" ry="5" fill="#ffd166" stroke="#b8860b" stroke-width="2"/>
                  <path d="M101 70 Q115 92 129 70 Z" fill="#c9933b"/>
                  <!-- Thali Platter -->
                  <ellipse cx="90" cy="138" rx="60" ry="16" fill="#7f8c99"/>
                  <ellipse cx="90" cy="132" rx="58" ry="16" fill="#d4dbe0" stroke="#f0f4f7" stroke-width="2"/>
                  <ellipse cx="90" cy="132" rx="30" ry="8" fill="none" stroke="#83c5be" stroke-width="2" stroke-dasharray="4,4"/>
                </svg>
              </div>
            </div>
            <div class="card-content">
              <h2 class="card-title">Katori Catch</h2>
              <p class="card-desc">Slide your stainless steel thali to catch raining bowls! Dead-centre bank catches build huge multipliers, while rim catches ricochet with a high-stakes "Ting!".</p>
              <div class="card-footer">
                <span class="card-tag">Best: ${katoriCatchBest} pts</span>
                <button class="card-play-btn">
                  Play Game
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Game 3: Masala Memory (PLACED BACK AS IS) -->
          <article class="game-card card-masalamemory" data-game="masalamemory">
            <div class="card-preview">
              <span class="card-badge" style="background: rgba(224, 164, 88, 0.25); color: #e0a458; border-color: rgba(224, 164, 88, 0.4);">MUSICAL PUZZLE</span>
              <div class="preview-visual" style="display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, #291c13 0%, #120a06 100%);">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <!-- Circular Brass Masala Dabba -->
                  <circle cx="90" cy="90" r="70" fill="#2b211a" stroke="#d4a84d" stroke-width="4"/>
                  <!-- 6 Spice Bowls -->
                  <circle cx="90" cy="45" r="14" fill="#e9b44c" stroke="#ffe89e" stroke-width="2"/>
                  <circle cx="128" cy="68" r="14" fill="#c94f2a" stroke="#ffa38c" stroke-width="1.5"/>
                  <circle cx="128" cy="112" r="14" fill="#7fa87f" stroke="#a8dca8" stroke-width="1.5"/>
                  <circle cx="90" cy="135" r="14" fill="#e07a5f" stroke="#ffa38c" stroke-width="1.5"/>
                  <circle cx="52" cy="112" r="14" fill="#7d6ba3" stroke="#ac98d8" stroke-width="1.5"/>
                  <circle cx="52" cy="68" r="14" fill="#b08954" stroke="#dcaf74" stroke-width="1.5"/>
                  <!-- Central Dial -->
                  <circle cx="90" cy="90" r="18" fill="#18120c" stroke="#c9933b" stroke-width="2"/>
                  <text x="90" y="94" font-size="11" font-weight="900" fill="#ffd166" text-anchor="middle">12</text>
                </svg>
              </div>
            </div>
            <div class="card-content">
              <h2 class="card-title">Masala Memory</h2>
              <p class="card-desc">The authentic Indian Masala Dabba memory puzzle! Watch the six vibrant spice bowls glow to melodic tones, then replay the progressive culinary sequence.</p>
              <div class="card-footer">
                <span class="card-tag">Best: ${masalaMemoryBest} pts</span>
                <button class="card-play-btn">
                  Play Game
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Game 4: Ice Cream Stacking Game -->
          <article class="game-card card-icecream" data-game="icecream">
            <div class="card-preview">
              <span class="card-badge">2D PHYSICS</span>
              <div class="preview-visual preview-icecream-art">
                <svg width="180" height="190" viewBox="0 0 180 190">
                  <circle cx="90" cy="95" r="75" fill="rgba(255, 94, 138, 0.12)" filter="blur(10px)"/>
                  <circle cx="90" cy="52" r="28" fill="#f16e8c"/>
                  <ellipse cx="80" cy="42" rx="10" ry="6" fill="rgba(255,255,255,0.4)" transform="rotate(-20 80 42)"/>
                  <path d="M60 62 Q75 75 90 62 Q105 75 120 62" stroke="#9c1c3c" stroke-width="5" fill="none"/>
                  <circle cx="90" cy="88" r="30" fill="#542d17"/>
                  <ellipse cx="78" cy="78" rx="10" ry="6" fill="rgba(255,255,255,0.25)" transform="rotate(-20 78 78)"/>
                  <path d="M58 100 Q75 114 90 100 Q105 114 122 100" stroke="#231006" stroke-width="6" fill="none"/>
                  <polygon points="62,112 118,112 90,172" fill="#d39856" stroke="#8d5622" stroke-width="2"/>
                </svg>
              </div>
            </div>
            <div class="card-content">
              <h2 class="card-title">Ice Cream Stacking</h2>
              <p class="card-desc">Drop scoops from the moving spawner to build a towering 12-scoop cone. Beware of the shifting center of gravity!</p>
              <div class="card-footer">
                <span class="card-tag">Goal: 12 Scoops</span>
                <button class="card-play-btn">
                  Play Game
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Game 5: 3D Ball Maze Puzzle -->
          <article class="game-card card-maze" data-game="maze3d">
            <div class="card-preview">
              <span class="card-badge">3D ISOMETRIC</span>
              <div class="preview-visual preview-maze-art">
                <svg width="200" height="190" viewBox="0 0 200 190">
                  <polygon points="100,30 180,75 100,120 20,75" fill="#26ab3b" stroke="#1d842d" stroke-width="2"/>
                  <polygon points="100,120 180,75 180,95 100,140" fill="#4d2212"/>
                  <polygon points="20,75 100,120 100,140 20,95" fill="#602d18"/>
                  <polygon points="80,65 140,98 140,84 80,51" fill="#7a391e"/>
                  <polygon points="45,88 85,110 85,96 45,74" fill="#6e311a"/>
                  <circle cx="95" cy="85" r="18" fill="#ffcc00"/>
                  <ellipse cx="89" cy="79" rx="6" ry="4" fill="#ffffff" opacity="0.8" transform="rotate(-25 89 79)"/>
                  <ellipse cx="145" cy="62" rx="14" ry="7" fill="#00ffcc" opacity="0.7"/>
                </svg>
              </div>
            </div>
            <div class="card-content">
              <h2 class="card-title">3D Ball Maze</h2>
              <p class="card-desc">Guide the yellow rolling sphere through 15 intricate 3D isometric mazes. Features genuine rolling physics and on-screen D-Pad.</p>
              <div class="card-footer">
                <span class="card-tag">15 Distinct Mazes</span>
                <button class="card-play-btn">
                  Play Game
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Game 6: Physics Merge Drop Game -->
          <article class="game-card card-dumpling" data-game="dumplings">
            <div class="card-preview">
              <span class="card-badge">PHYSICS MERGE</span>
              <div class="preview-visual preview-dumpling-art">
                <svg width="200" height="190" viewBox="0 0 200 190">
                  <rect x="25" y="10" width="150" height="170" rx="10" fill="none" stroke="#8b5921" stroke-width="8"/>
                  <line x1="25" y1="50" x2="175" y2="50" stroke="#ffffff" stroke-width="3" stroke-dasharray="6,4"/>
                  <circle cx="100" cy="115" r="32" fill="#2b7fff"/>
                  <ellipse cx="100" cy="86" rx="9" ry="6" fill="#70b2ff"/>
                  <circle cx="88" cy="113" r="3.5" fill="#111"/>
                  <circle cx="112" cy="113" r="3.5" fill="#111"/>
                  <path d="M96 120 Q100 125 104 120" stroke="#111" stroke-width="2" fill="none"/>
                </svg>
              </div>
            </div>
            <div class="card-content">
              <h2 class="card-title">Squishy Dumplings</h2>
              <p class="card-desc">Drop and bounce squishy dumplings in the bamboo basket. Merge identical dumplings to evolve them up to the legendary Emperor Bao!</p>
              <div class="card-footer">
                <span class="card-tag">Best: ${dumplingBest} pts</span>
                <button class="card-play-btn">
                  Play Game
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Game 7: Last Drop (Watermelon Juice Showdown) -->
          <article class="game-card card-lastdrop" data-game="lastdrop">
            <div class="card-preview">
              <img src="/assets/last_drop_square.jpeg" alt="Last Drop" class="preview-visual" />
            </div>
            <div class="card-content">
              <h2 class="card-title">Last Drop</h2>
              <p class="card-desc">Test your nerve at the watermelon juice tap! Fill the glass tumbler to the very edge without letting the last drop spill over.</p>
              <div class="card-footer">
                <span class="card-tag">Best: ${lastDropBest} pts</span>
                <button class="card-play-btn">
                  Play Game
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Game 8: Block Blast (Polyomino Grid Puzzle) -->
          <article class="game-card card-blockblast" data-game="blockblast">
            <div class="card-preview">
              <img src="/assets/block_blast_square.jpeg" alt="Block Blast" class="preview-visual" />
            </div>
            <div class="card-content">
              <h2 class="card-title">Block Blast</h2>
              <p class="card-desc">The viral block puzzle! Drag polyomino cubes into the 8×8 grid, clear lines, beat the 👑 Crown High Score, and blast combos!</p>
              <div class="card-footer">
                <span class="card-tag">Best: ${blockBlastBest} pts</span>
                <button class="card-play-btn">
                  Play Game
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Game 9: Fruit Slice Frenzy (Blade Slicing Arcade) -->
          <article class="game-card card-fruitslice" data-game="fruitslice">
            <div class="card-preview">
              <img src="/assets/fruit_slice_square.jpeg" alt="Fruit Slice Frenzy" class="preview-visual" />
            </div>
            <div class="card-content">
              <h2 class="card-title">Fruit Slice Frenzy</h2>
              <p class="card-desc">Swipe flying watermelons, oranges, apples, and strawberries in the sky-blue arcade! Slice multi-fruit combos and keep your 3 lives intact.</p>
              <div class="card-footer">
                <span class="card-tag">Best: ${fruitSliceBest} pts</span>
                <button class="card-play-btn">
                  Play Game
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Game 10: Bloom Sort (Flower Pot Sorting) -->
          <article class="game-card card-bloom" data-game="bloom">
            <div class="card-preview">
              <img src="/assets/bloom_square.jpeg" alt="Bloom Sort" class="preview-visual" />
            </div>
            <div class="card-content">
              <h2 class="card-title">Bloom Sort</h2>
              <p class="card-desc">The authentic Bloom puzzle! Place flower pots on the 4×4 garden tray. Watch petals sort and transfer to adjacent pots until they hit 6 petals and BLOOM!</p>
              <div class="card-footer">
                <span class="card-tag">Best: ${bloomBest} pts</span>
                <button class="card-play-btn">
                  Play Game
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Game 11: Mini Militia (2D Combat Shooter) -->
          <article class="game-card card-minimilitia" data-game="minimilitia">
            <div class="card-preview">
              <span class="card-badge" style="background: rgba(89, 184, 235, 0.25); color: #59b8eb; border-color: rgba(89, 184, 235, 0.4);">2D COMBAT SHOOTER</span>
              <div class="preview-visual" style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle, #1e3a4b 0%, #0c1820 100%); position: relative; overflow: hidden;">
                <img src="/assets/minimilitia/bg2.jpeg" alt="Jungle" style="position: absolute; width: 100%; height: 100%; object-fit: cover; opacity: 0.35;" />
                <img src="/assets/minimilitia/Ak-47.png" alt="AK-47" style="position: relative; width: 130px; height: auto; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.8)); margin-bottom: 8px;" />
                <div style="position: relative; display: flex; align-items: center; gap: 8px;">
                  <span style="background: rgba(0, 255, 68, 0.2); color: #00ff44; border: 1px solid #00ff44; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 10px;">JETPACK ⚡</span>
                  <span style="background: rgba(160, 32, 240, 0.25); color: #e024c3; border: 1px solid #e024c3; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 10px;">AK-47 💥</span>
                </div>
              </div>
            </div>
            <div class="card-content">
              <h2 class="card-title">Mini Militia</h2>
              <p class="card-desc">Authentic Doodle Army 2 style combat! Jetpack across jungle platforms, aim 360°, spray 25-round AK-47 bursts, and battle AI bots in intense tactical shootouts.</p>
              <div class="card-footer">
                <span class="card-tag">Best: ${miniMilitiaBest} pts</span>
                <button class="card-play-btn">
                  Play Game
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                </button>
              </div>
            </div>
          </article>
        </main>

        <footer class="hub-footer">
          <p>Created with HTML5 Canvas, Three.js, Matter.js & Web Audio API • 100% Client-Side Physics • Unified Web Arcade</p>
        </footer>
      </div>
    `;

    // Event listeners
    this.container.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        soundManager.playClick();
        const gameId = card.dataset.game;
        this.onSelectGame(gameId);
      });
    });

    this.container.querySelector('#hub-sound-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const muted = soundManager.toggleMute();
      this.container.querySelector('#hub-sound-btn').innerHTML = muted 
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
        : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>';
    });
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
