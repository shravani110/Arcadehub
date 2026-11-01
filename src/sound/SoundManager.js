// Web Audio API Synthesizer - Self-contained high quality sound effects

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('arcade_sound_muted') === 'true';
    this.rollOsc = null;
    this.rollGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('arcade_sound_muted', this.muted);
    if (this.muted && this.rollGain) {
      this.rollGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // --- ICE CREAM SOUNDS ---

  playScoopDrop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.15);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  playCreamSplat(stability = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Low frequency thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.14);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);

    // Creamy noise pop
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(500, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(t);
  }

  playTowerWobble() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(110, t + 0.1);
    osc.frequency.linearRampToValueAtTime(75, t + 0.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, t);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  playTopple() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [180, 140, 90].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      osc.frequency.exponentialRampToValueAtTime(30, t + idx * 0.08 + 0.25);

      gain.gain.setValueAtTime(0.18, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.26);
    });
  }

  // --- 3D BALL MAZE SOUNDS ---

  playWallBump(force = 0.5) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.07);

    const vol = Math.min(0.25, Math.max(0.05, force * 0.2));
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  playPortalWarp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.12, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.36);
    });
  }

  // Continuous ball rolling effect
  startRollingLoop() {
    if (this.rollOsc || !this.ctx) return;
    try {
      this.init();
      const t = this.ctx.currentTime;
      this.rollOsc = this.ctx.createOscillator();
      this.rollGain = this.ctx.createGain();

      this.rollOsc.type = 'triangle';
      this.rollOsc.frequency.setValueAtTime(65, t);

      this.rollGain.gain.setValueAtTime(0, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, t);

      this.rollOsc.connect(filter);
      filter.connect(this.rollGain);
      this.rollGain.connect(this.ctx.destination);

      this.rollOsc.start(t);
    } catch (e) {
      console.warn('Audio loop error', e);
    }
  }

  updateRollingSpeed(speed) {
    if (this.muted || !this.rollGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    const clampedSpeed = Math.min(1, Math.max(0, speed));
    const targetGain = clampedSpeed > 0.05 ? clampedSpeed * 0.07 : 0;
    const targetFreq = 50 + clampedSpeed * 50;

    this.rollGain.gain.setTargetAtTime(targetGain, t, 0.05);
    this.rollOsc.frequency.setTargetAtTime(targetFreq, t, 0.05);
  }

  stopRollingLoop() {
    if (this.rollGain && this.ctx) {
      this.rollGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  // --- SQUISHY DUMPLING SOUNDS ---

  playDumplingDrop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.09);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  playDumplingBounce(impact = 0.5) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);

    const vol = Math.min(0.2, Math.max(0.04, impact * 0.15));
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  playDumplingMerge(tier = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Harmonic scale based on tier
    const baseFreqs = [
      [392.00, 523.25, 659.25],       // G4, C5, E5 (Tier 1)
      [440.00, 554.37, 659.25],       // A4, C#5, E5 (Tier 2)
      [523.25, 659.25, 783.99],       // C5, E5, G5 (Tier 3)
      [587.33, 739.99, 880.00],       // D5, F#5, A5 (Tier 4)
      [659.25, 830.61, 987.77],       // E5, G#5, B5 (Tier 5)
      [783.99, 987.77, 1174.66],      // G5, B5, D6 (Tier 6)
      [880.00, 1108.73, 1318.51],     // A5, C#6, E6 (Tier 7)
      [1046.50, 1318.51, 1567.98],    // C6, E6, G6 (Tier 8)
      [1174.66, 1479.98, 1760.00],    // D6, F#6, A6 (Tier 9)
      [1318.51, 1661.22, 1975.53]     // E6, G#6, B6 (Tier 10)
    ];

    const chord = baseFreqs[Math.min(tier - 1, baseFreqs.length - 1)];
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.035);

      gain.gain.setValueAtTime(0.18, t + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.035 + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.035);
      osc.stop(t + idx * 0.035 + 0.4);
    });

    // Add bright high chime shimmer
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(1760 + tier * 100, t);
    chimeGain.gain.setValueAtTime(0.06, t);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    chime.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);
    chime.start(t);
    chime.stop(t + 0.26);
  }

  playDangerBeep() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // --- GENERAL ARCADE SOUNDS ---

  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const fanfareNotes = [
      { f: 523.25, d: 0.12, off: 0 },
      { f: 659.25, d: 0.12, off: 0.12 },
      { f: 783.99, d: 0.12, off: 0.24 },
      { f: 1046.50, d: 0.45, off: 0.36 }
    ];

    fanfareNotes.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t + note.off);

      gain.gain.setValueAtTime(0.25, t + note.off);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.off + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + note.off);
      osc.stop(t + note.off + note.d + 0.02);
    });
  }

  playGameOver() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { f: 392.00, off: 0 },
      { f: 349.23, off: 0.15 },
      { f: 329.63, off: 0.30 },
      { f: 261.63, off: 0.45 }
    ];

    notes.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, t + note.off);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t + note.off);

      gain.gain.setValueAtTime(0.18, t + note.off);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.off + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + note.off);
      osc.stop(t + note.off + 0.26);
    });
  }

  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // --- LAST DROP SOUNDS ---

  startPourLiquid() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || this.pourNode) return;

    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, this.ctx.currentTime);
    filter.Q.setValueAtTime(4, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, this.ctx.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    this.pourNode = { noise, filter, gain };
  }

  stopPourLiquid() {
    if (!this.pourNode || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.pourNode.gain.gain.setValueAtTime(this.pourNode.gain.gain.value, t);
    this.pourNode.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    setTimeout(() => {
      if (this.pourNode) {
        try { this.pourNode.noise.stop(); } catch (e) {}
        this.pourNode = null;
      }
    }, 90);
  }

  playTensionPulse(tension = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const freq = 60 + tension * 40;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  playLiquidSpill() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Splash noise burst
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.45);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }

  playCupBank() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [1046.5, 1318.5, 1567.98].forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + idx * 0.06);
      gain.gain.setValueAtTime(0.2, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.36);
    });
  }

  // --- BLOCK BLAST SOUNDS ---

  playBlockPlace() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playLineClear(linesCount = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const baseFreqs = [523.25, 659.25, 783.99, 1046.5];
    for (let i = 0; i <= linesCount; i++) {
      const f = baseFreqs[i % baseFreqs.length] * (1 + Math.floor(i / baseFreqs.length) * 0.5);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.05);

      gain.gain.setValueAtTime(0.25, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.3);
    }
  }

  playComboBlast(combo = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140 + combo * 30, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  // --- FRUIT SLICE FRENZY SOUNDS ---

  playSwordWhoosh() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }

  playFruitSlice() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Wet slice squish
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);

    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  playBombExplode() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }

  playFruitCombo(comboCount = 3) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].slice(0, Math.min(4, comboCount)).forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.05);
      gain.gain.setValueAtTime(0.24, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.32);
    });
  }

  // --- BLOOM SOUNDS ---

  playFlowerPlant() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.09);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playBloomChime(count = 3) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chord.slice(0, Math.min(5, count + 1)).forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.07);
      gain.gain.setValueAtTime(0.22, t + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.46);
    });
  }

  playShearsCut() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.06);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, t);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // --- UNIVERSAL ARCADE SYNTHESIZER (Tiffin Run, Naan Ninja, Laddu Launcher, Katori Catch, Masala Memory, Sugar Rush) ---

  playTone(freq, duration = 0.15, { to = null, gain = 0.1, delay = 0, type = 'sine' } = {}) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + duration);
    }

    gainNode.gain.setValueAtTime(gain, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  playNoise(duration = 0.2, { gain = 0.15, from = 1000, to = 100, band = false } = {}) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = band ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + duration);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(gain, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    noise.start(t);
  }

  // Helper sound triggers
  playBladeSlash() {
    this.playTone(1200, 0.08, { to: 400, gain: 0.14, type: 'sawtooth' });
  }

  playFoodSlice() {
    this.playTone(600, 0.06, { to: 850, gain: 0.12, type: 'triangle' });
    this.playNoise(0.05, { gain: 0.08, from: 2200, to: 800 });
  }

  playGlassShatter() {
    this.playNoise(0.35, { gain: 0.25, from: 3500, to: 400, band: true });
    this.playTone(900, 0.15, { to: 250, gain: 0.12, type: 'square' });
  }

  playMetalClink() {
    this.playTone(1480, 0.25, { to: 880, gain: 0.15, type: 'sine' });
    this.playTone(2200, 0.18, { gain: 0.08, delay: 0.02, type: 'triangle' });
  }

  playMithaiBeat(freq, isPerfect = true) {
    this.playTone(freq, 0.14, { gain: isPerfect ? 0.15 : 0.09, type: 'sine' });
    if (isPerfect) {
      this.playTone(freq * 1.5, 0.10, { gain: 0.08, delay: 0.04, type: 'triangle' });
    }
  }
}

export const soundManager = new SoundManager();
