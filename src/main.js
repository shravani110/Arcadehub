// main.js - Arcade Application Orchestrator & Async Code-Split Router
import './styles/main.css';
import './styles/hub.css';
import './styles/icecream.css';
import './styles/maze3d.css';
import './styles/dumplings.css';
import './styles/lastdrop.css';
import './styles/blockblast.css';
import './styles/fruitslice.css';
import './styles/bloom.css';

// London Cafe Arcade Collection
import './styles/tiffinrun.css';
import './styles/katoricatch.css';
import './styles/masalamemory.css';
import './styles/minimilitia.css';

import { HubView } from './hub/HubView.js';

class ArcadeApp {
  constructor() {
    this.appContainer = document.getElementById('app');
    this.currentGame = null;
    this.currentView = null;
    this.currentRoute = null;

    this.initRouter();
  }

  initRouter() {
    window.addEventListener('hashchange', () => {
      this.route();
    });

    window.addEventListener('popstate', () => {
      this.route();
    });

    // Initial route
    this.route();
  }

  async route() {
    const rawHash = window.location.hash.replace('#', '') || 'hub';
    const hash = rawHash.split('?')[0].replace(/^game=/, '');

    this.currentRoute = hash;

    if (this.currentGame) {
      try {
        this.currentGame.destroy();
      } catch (e) {
        console.warn('Error destroying active game:', e);
      }
      this.currentGame = null;
    }
    if (this.currentView) {
      try {
        this.currentView.destroy();
      } catch (e) {
        console.warn('Error destroying active view:', e);
      }
      this.currentView = null;
    }

    this.appContainer.innerHTML = '';

    try {
      switch (hash) {
        case 'icecream': {
          const { IceCreamGame } = await import('./games/icecream/IceCreamGame.js');
          this.currentGame = new IceCreamGame(this.appContainer, () => this.navigateTo('hub'));
          break;
        }
        case 'maze3d': {
          const { MazeGame } = await import('./games/maze3d/MazeGame.js');
          this.currentGame = new MazeGame(this.appContainer, () => this.navigateTo('hub'));
          break;
        }
        case 'dumplings': {
          const { DumplingGame } = await import('./games/dumplings/DumplingGame.js');
          this.currentGame = new DumplingGame(this.appContainer, () => this.navigateTo('hub'));
          break;
        }
        case 'lastdrop': {
          const { LastDropGame } = await import('./games/lastdrop/LastDropGame.js');
          this.currentGame = new LastDropGame(this.appContainer, () => this.navigateTo('hub'));
          break;
        }
        case 'blockblast': {
          const { BlockBlastGame } = await import('./games/blockblast/BlockBlastGame.js');
          this.currentGame = new BlockBlastGame(this.appContainer, () => this.navigateTo('hub'));
          break;
        }
        case 'fruitslice': {
          const { FruitSliceGame } = await import('./games/fruitslice/FruitSliceGame.js');
          this.currentGame = new FruitSliceGame(this.appContainer, () => this.navigateTo('hub'));
          break;
        }
        case 'bloom': {
          const { BloomGame } = await import('./games/bloom/BloomGame.js');
          this.currentGame = new BloomGame(this.appContainer, () => this.navigateTo('hub'));
          break;
        }
        // London Cafe Collection
        case 'tiffinrun':
        case 'tiffin-run': {
          const { TiffinRunGame } = await import('./games/tiffinrun/TiffinRunGame.js');
          this.currentGame = new TiffinRunGame(this.appContainer, () => this.navigateTo('hub'));
          break;
        }
        case 'katoricatch':
        case 'katori-catch': {
          const { KatoriCatchGame } = await import('./games/katoricatch/KatoriCatchGame.js');
          this.currentGame = new KatoriCatchGame(this.appContainer, () => this.navigateTo('hub'));
          break;
        }
        case 'masalamemory':
        case 'masala-memory': {
          const { MasalaMemoryGame } = await import('./games/masalamemory/MasalaMemoryGame.js');
          this.currentGame = new MasalaMemoryGame(this.appContainer, () => this.navigateTo('hub'));
          break;
        }
        case 'minimilitia':
        case 'mini-militia': {
          const { MiniMilitiaGame } = await import('./games/minimilitia/MiniMilitiaGame.js');
          this.currentGame = new MiniMilitiaGame(this.appContainer, () => this.navigateTo('hub'));
          break;
        }
        case 'hub':
        default: {
          this.currentView = new HubView(this.appContainer, (gameId) => this.navigateTo(gameId));
          break;
        }
      }
    } catch (err) {
      console.error('Failed to load game view:', err);
      this.currentView = new HubView(this.appContainer, (gameId) => this.navigateTo(gameId));
    }
  }

  navigateTo(viewId) {
    const targetHash = `#${viewId}`;
    if (window.location.hash === targetHash) {
      this.route();
    } else {
      window.location.hash = targetHash;
      // Fallback in case browser suppresses or delays hashchange
      setTimeout(() => {
        const cur = window.location.hash.replace('#', '') || 'hub';
        if (cur === viewId && this.currentRoute !== viewId) {
          this.route();
        }
      }, 50);
    }
  }
}

new ArcadeApp();
