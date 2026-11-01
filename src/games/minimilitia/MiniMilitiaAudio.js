// MiniMilitiaAudio.js - Authentic Audio System with MP3 pooling and Web Audio fallbacks
import { soundManager } from '../../sound/SoundManager.js';

export class MiniMilitiaAudio {
  constructor() {
    this.gunSounds = [];
    this.gunSoundIndex = 0;
    this.maxPoolSize = 6;
    
    this.reloadAudio = null;
    this.jetpackAudio = null;
    this.isJetpackPlaying = false;

    this.initPools();
  }

  initPools() {
    // Pool gunshots for rapid-fire playback without audio clipping
    for (let i = 0; i < this.maxPoolSize; i++) {
      const audio = new Audio('/assets/minimilitia/sounds/submachineGun.mp3');
      audio.volume = 0.55;
      audio.preload = 'auto';
      this.gunSounds.push(audio);
    }

    this.reloadAudio = new Audio('/assets/minimilitia/sounds/gunReload.mp3');
    this.reloadAudio.volume = 0.65;
    this.reloadAudio.preload = 'auto';

    this.jetpackAudio = new Audio('/assets/minimilitia/sounds/jetpack.mp3');
    this.jetpackAudio.volume = 0.45;
    this.jetpackAudio.loop = true;
    this.jetpackAudio.preload = 'auto';
  }

  playShoot(volume = 0.55) {
    if (soundManager.isMuted()) return;
    
    try {
      const audio = this.gunSounds[this.gunSoundIndex];
      this.gunSoundIndex = (this.gunSoundIndex + 1) % this.maxPoolSize;
      audio.volume = volume;
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => {
          this.synthGunshot();
        });
      }
    } catch {
      this.synthGunshot();
    }
  }

  playReload() {
    if (soundManager.isMuted()) return;

    try {
      if (this.reloadAudio) {
        this.reloadAudio.currentTime = 0;
        const playPromise = this.reloadAudio.play();
        if (playPromise) {
          playPromise.catch(() => {
            this.synthReload();
          });
        }
      }
    } catch {
      this.synthReload();
    }
  }

  startJetpack() {
    if (soundManager.isMuted() || this.isJetpackPlaying) return;

    try {
      if (this.jetpackAudio) {
        this.isJetpackPlaying = true;
        const playPromise = this.jetpackAudio.play();
        if (playPromise) {
          playPromise.catch(() => {
            this.isJetpackPlaying = false;
          });
        }
      }
    } catch {
      this.isJetpackPlaying = false;
    }
  }

  stopJetpack() {
    if (!this.isJetpackPlaying) return;
    this.isJetpackPlaying = false;
    try {
      if (this.jetpackAudio) {
        this.jetpackAudio.pause();
        this.jetpackAudio.currentTime = 0;
      }
    } catch {
      // Ignored
    }
  }

  playHit() {
    if (soundManager.isMuted()) return;
    try {
      soundManager.init();
      const ctx = soundManager.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch {
      // Ignore
    }
  }

  playExplosion() {
    if (soundManager.isMuted()) return;
    try {
      soundManager.init();
      const ctx = soundManager.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    } catch {
      // Ignore
    }
  }

  synthGunshot() {
    try {
      soundManager.init();
      const ctx = soundManager.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch {
      // Ignore
    }
  }

  synthReload() {
    try {
      soundManager.init();
      const ctx = soundManager.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.setValueAtTime(900, t + 0.1);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    } catch {
      // Ignore
    }
  }

  destroy() {
    this.stopJetpack();
    this.gunSounds.forEach(a => {
      a.pause();
      a.currentTime = 0;
    });
    this.gunSounds = [];
    if (this.reloadAudio) {
      this.reloadAudio.pause();
      this.reloadAudio = null;
    }
    if (this.jetpackAudio) {
      this.jetpackAudio.pause();
      this.jetpackAudio = null;
    }
  }
}
