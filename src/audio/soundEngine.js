// Web Audio API procedural sound engine for Skyholm
// Wind ambiance, harmonic celestial drone, engine throttle drone, and dock chimes

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.engineGain = null;
    this.engineOsc = null;
    this.windGain = null;
    this.droneGain = null;
    this.isEnabled = false;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);

      // 1. Procedural Wind Buffer (white noise modulated by bandpass filter & LFO)
      const sampleRate = this.ctx.sampleRate;
      const bufferLength = sampleRate * 4;
      const noiseBuffer = this.ctx.createBuffer(1, bufferLength, sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let lastVal = 0;
      for (let i = 0; i < bufferLength; i++) {
        const white = Math.random() * 2 - 1;
        lastVal = (lastVal + 0.02 * white) / 1.02;
        data[i] = lastVal * 3.2;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.value = 420;
      windFilter.Q.value = 0.6;

      this.windGain = this.ctx.createGain();
      this.windGain.gain.value = 0.35;

      noiseSource.connect(windFilter).connect(this.windGain).connect(this.master);
      noiseSource.start();

      // Wind LFO for natural breath
      const windLfo = this.ctx.createOscillator();
      windLfo.frequency.value = 0.07;
      const windLfoGain = this.ctx.createGain();
      windLfoGain.gain.value = 260;
      windLfo.connect(windLfoGain).connect(windFilter.frequency);
      windLfo.start();

      // 2. Harmonic Drone (G chord pad [196, 246.94, 293.66, 392])
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.value = 0.04;
      const droneFilter = this.ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 900;
      this.droneGain.connect(droneFilter).connect(this.master);

      const chord = [196, 246.94, 293.66, 392];
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        osc.detune.value = (idx - 1.5) * 4;
        osc.connect(this.droneGain);
        osc.start();
      });

      // 3. Airship Engine Hum (sawtooth with lowpass filter responsive to speed)
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 52;

      const engineFilter = this.ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.value = 180;

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;

      this.engineOsc.connect(engineFilter).connect(this.engineGain).connect(this.master);
      this.engineOsc.start();

      this.isInitialized = true;
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  toggle(forceState) {
    this.init();
    if (!this.ctx) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const nextState = forceState !== undefined ? forceState : !this.isEnabled;
    this.isEnabled = nextState;

    if (this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.setTargetAtTime(this.isEnabled ? 0.75 : 0, now, 0.4);
    }

    return this.isEnabled;
  }

  updateEngine(throttle) {
    if (!this.isEnabled || !this.engineGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    const clampedThrottle = Math.max(0, Math.min(1, throttle));
    
    // Engine volume and pitch modulate with flight throttle
    this.engineGain.gain.setTargetAtTime(0.02 + clampedThrottle * 0.12, now, 0.1);
    if (this.engineOsc) {
      this.engineOsc.frequency.setTargetAtTime(50 + clampedThrottle * 35, now, 0.15);
    }
  }

  playChime() {
    if (!this.isEnabled || !this.ctx || !this.master) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
      
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = notes[Math.floor(Math.random() * notes.length)];
        
        const startTime = now + i * 0.16;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.06, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.4);

        osc.connect(gain).connect(this.master);
        osc.start(startTime);
        osc.stop(startTime + 2.5);
      }
    } catch (e) {
      console.warn("Chime error:", e);
    }
  }

  playBump() {
    if (!this.isEnabled || !this.ctx || !this.master) return;
    try {
      const now = this.ctx.currentTime;
      // Soft low-frequency wooden hull bump / collision impact thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.16);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(filter).connect(gain).connect(this.master);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      // ignore
    }
  }
}

export const soundEngine = new SoundEngine();
