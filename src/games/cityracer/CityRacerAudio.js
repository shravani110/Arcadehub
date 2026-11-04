// CityRacerAudio.js - Procedural Web Audio Synthesizer for Midnight City Highway Racer
// Synthesizes V8 Monster Engine roar, Police Sirens, tire screeches, near-miss whooshes & crash impacts.

export class CityRacerAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Master & Engine
    this.masterGain = null;
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineFilter = null;
    this.engineGain = null;

    // Police Siren
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenInterval = null;
    this.isSirenPlaying = false;

    // Wind & Tire Skid Noise
    this.windNoise = null;
    this.windGain = null;
    this.windFilter = null;
    this.skidGain = null;
    this.skidFilter = null;
  }

  init() {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // --- 1. Deep V8 Monster Engine (Dual Sawtooth + Sub Triangle) ---
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(42, this.ctx.currentTime);

      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(21, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(380, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc1.start();
      this.engineOsc2.start();

      // --- 2. Police Siren Synthesizer ---
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'sine';
      this.sirenOsc.frequency.setValueAtTime(700, this.ctx.currentTime);

      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.masterGain);
      this.sirenOsc.start();

      // --- 3. Wind & Skid Noise Buffer ---
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      // Wind Rush
      this.windNoise = this.ctx.createBufferSource();
      this.windNoise.buffer = noiseBuffer;
      this.windNoise.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.setValueAtTime(650, this.ctx.currentTime);
      this.windFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.windNoise.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);
      this.windNoise.start();

      // Tire Skid
      const skidSource = this.ctx.createBufferSource();
      skidSource.buffer = noiseBuffer;
      skidSource.loop = true;

      this.skidFilter = this.ctx.createBiquadFilter();
      this.skidFilter.type = 'bandpass';
      this.skidFilter.frequency.setValueAtTime(2200, this.ctx.currentTime);
      this.skidFilter.Q.setValueAtTime(5.0, this.ctx.currentTime);

      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      skidSource.connect(this.skidFilter);
      this.skidFilter.connect(this.skidGain);
      this.skidGain.connect(this.masterGain);
      skidSource.start();

      this.isInitialized = true;
    } catch (e) {
      console.warn('Audio context creation deferred:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.65, this.ctx.currentTime, 0.05);
    }
  }

  update({ speedKmh = 0, isAccelerating = false, isBraking = false, isSiren = false, isSkidding = false }) {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const speedRatio = Math.min(speedKmh / 220, 1.0);

    // 1. Engine Pitch & Tone
    const basePitch = 38 + speedRatio * 95 + (isAccelerating ? 25 : 0);
    this.engineOsc1.frequency.setTargetAtTime(basePitch, t, 0.04);
    this.engineOsc2.frequency.setTargetAtTime(basePitch * 0.5, t, 0.04);

    const filterCutoff = 320 + speedRatio * 1800 + (isAccelerating ? 400 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, t, 0.04);

    // 2. Wind Rush
    this.windGain.gain.setTargetAtTime(speedRatio * 0.22, t, 0.08);

    // 3. Tire Skid
    this.skidGain.gain.setTargetAtTime(isSkidding ? 0.22 : (isBraking && speedKmh > 50 ? 0.15 : 0.0), t, 0.04);

    // 4. Police Siren Logic
    if (isSiren) {
      this.sirenGain.gain.setTargetAtTime(0.24, t, 0.05);
      // High-low frequency oscillation (700Hz to 1100Hz)
      const sirenCycle = Math.sin(t * 8) * 200 + 900;
      this.sirenOsc.frequency.setTargetAtTime(sirenCycle, t, 0.03);
    } else {
      this.sirenGain.gain.setTargetAtTime(0.0, t, 0.08);
    }
  }

  playNearMiss() {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.25);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.35);
    } catch (_) {}
  }

  playCrash() {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      // Metal thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.35);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.45);
    } catch (_) {}
  }

  destroy() {
    try {
      if (this.ctx) {
        this.ctx.close();
      }
    } catch (_) {}
    this.isInitialized = false;
  }
}
