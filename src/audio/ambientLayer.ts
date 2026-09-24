import { createPinkNoiseBuffer } from './pinkNoise';

/**
 * Cinematic Ambient Background Layer (Web Audio API):
 * 
 * Creates a calm, spacious, non-musical cosmic atmosphere:
 * 1. Warm Low-Frequency Drone:
 *    - Dual detuned sines (54.85Hz & 55.15Hz) creating a natural 3.3s slow acoustic breathing beat
 *    - Faint fifth harmonic (82.4Hz) for celestial depth without musical melody
 *    - Steep 24dB/oct cascaded lowpass filters stripping away harshness, leaving pure deep warmth
 * 2. Soft Airy Texture:
 *    - Seamless 8-second stereo pink noise buffer (1/f cosmic wind)
 *    - Dynamic lowpass filtering that breathes and expands
 * 3. Distant High-Frequency Atmosphere:
 *    - Delicate bandpass-filtered cosmic dust giving depth and vastness
 * 4. Subtle Spatial Movement:
 *    - Ultra-slow 30-second stereo panning LFO giving an organic, living presence
 * 5. Stage-Aware Dynamic Transitions:
 *    - Begin: Fades in quietly (3.0s) to Thought level (~0.016)
 *    - Thought Continue: Gently swells to Breathing bed level (~0.024)
 *    - Drift: Filter opens, atmosphere widens (~0.032)
 *    - Perspective & Completion: Gracefully decays to peaceful near-silence (~0.0015)
 *    - Return Home: Smooth 1.5s fade-out with complete node disposal
 */
export class AmbientLayer {
  private ctx: AudioContext;
  private outputNode: GainNode;
  private masterGain: GainNode | null = null;

  // Drone nodes
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneOsc3: OscillatorNode | null = null;
  private droneFilter1: BiquadFilterNode | null = null;
  private droneFilter2: BiquadFilterNode | null = null;
  private droneGain: GainNode | null = null;

  // Airy atmosphere nodes
  private airSource: AudioBufferSourceNode | null = null;
  private airFilter: BiquadFilterNode | null = null;
  private airGain: GainNode | null = null;

  // High atmosphere cosmic dust nodes
  private highDustFilter: BiquadFilterNode | null = null;
  private highDustGain: GainNode | null = null;

  // Spatial panning nodes
  private panner: StereoPannerNode | null = null;
  private pannerLfo: OscillatorNode | null = null;
  private pannerLfoGain: GainNode | null = null;

  // Lifecycle & transition flags
  private isRunning = false;
  private isExpanded = false;
  private isFadingToSilence = false;
  private stopTimer: NodeJS.Timeout | null = null;

  constructor(ctx: AudioContext, outputNode: GainNode) {
    this.ctx = ctx;
    this.outputNode = outputNode;
  }

  /**
   * Initializes and begins the ambient layer.
   * Called on intentional user interaction (e.g. "Begin" button).
   * Fades in gently over 2–4 seconds at Thought screen volume.
   */
  public start(fadeInDuration = 3.0): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isExpanded = false;
    this.isFadingToSilence = false;

    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }

    const now = this.ctx.currentTime;

    // 1. Master Ambient Gain (sits quietly beneath breathing audio)
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, now);
    this.masterGain.gain.linearRampToValueAtTime(0.016, now + fadeInDuration);

    // 2. Spatial Stereo Panner (if supported by platform)
    let pannerDestination: AudioNode = this.masterGain;
    if (typeof this.ctx.createStereoPanner === 'function') {
      try {
        this.panner = this.ctx.createStereoPanner();
        this.panner.pan.setValueAtTime(0, now);

        // Ultra-slow 30-second LFO (0.033Hz) for imperceptible spatial breathing
        this.pannerLfo = this.ctx.createOscillator();
        this.pannerLfo.type = 'sine';
        this.pannerLfo.frequency.setValueAtTime(0.033, now);

        this.pannerLfoGain = this.ctx.createGain();
        this.pannerLfoGain.gain.setValueAtTime(0.12, now); // Gentle +/-0.12 pan modulation

        this.pannerLfo.connect(this.pannerLfoGain);
        this.pannerLfoGain.connect(this.panner.pan);
        this.pannerLfo.start(now);

        this.panner.connect(this.masterGain);
        pannerDestination = this.panner;
      } catch {
        pannerDestination = this.masterGain;
      }
    }

    this.masterGain.connect(this.outputNode);

    // 3. Warm Low-Frequency Drone (Dual detuned sines + subtle 5th harmonic)
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.022, now);

    // Dual-stage lowpass filter (steep 24dB/oct roll-off above 120Hz for womb-like warmth)
    this.droneFilter1 = this.ctx.createBiquadFilter();
    this.droneFilter1.type = 'lowpass';
    this.droneFilter1.frequency.setValueAtTime(120, now);
    this.droneFilter1.Q.setValueAtTime(0.6, now);

    this.droneFilter2 = this.ctx.createBiquadFilter();
    this.droneFilter2.type = 'lowpass';
    this.droneFilter2.frequency.setValueAtTime(175, now);
    this.droneFilter2.Q.setValueAtTime(0.5, now);

    this.droneFilter1.connect(this.droneFilter2);
    this.droneFilter2.connect(this.droneGain);
    this.droneGain.connect(pannerDestination);

    // Detuned fundamental: 54.85Hz and 55.15Hz (0.3Hz slow natural beating)
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc1.frequency.setValueAtTime(54.85, now);

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'sine';
    this.droneOsc2.frequency.setValueAtTime(55.15, now);

    // Fifth harmonic (82.4Hz, E2) at low amplitude for rich space presence
    this.droneOsc3 = this.ctx.createOscillator();
    this.droneOsc3.type = 'sine';
    this.droneOsc3.frequency.setValueAtTime(82.4, now);

    const fifthGain = this.ctx.createGain();
    fifthGain.gain.setValueAtTime(0.45, now);
    this.droneOsc3.connect(fifthGain);
    fifthGain.connect(this.droneFilter1);

    this.droneOsc1.connect(this.droneFilter1);
    this.droneOsc2.connect(this.droneFilter1);

    // 4. Soft Airy Texture (Seamless Stereo Pink Noise)
    const noiseBuffer = createPinkNoiseBuffer(this.ctx, 8);
    this.airSource = this.ctx.createBufferSource();
    this.airSource.buffer = noiseBuffer;
    this.airSource.loop = true;

    this.airFilter = this.ctx.createBiquadFilter();
    this.airFilter.type = 'lowpass';
    this.airFilter.frequency.setValueAtTime(190, now);
    this.airFilter.Q.setValueAtTime(0.65, now);

    this.airGain = this.ctx.createGain();
    this.airGain.gain.setValueAtTime(0.012, now);

    this.airSource.connect(this.airFilter);
    this.airFilter.connect(this.airGain);
    this.airGain.connect(pannerDestination);

    // 5. Distant High-Frequency Atmosphere (Cosmic Dust)
    this.highDustFilter = this.ctx.createBiquadFilter();
    this.highDustFilter.type = 'bandpass';
    this.highDustFilter.frequency.setValueAtTime(1500, now);
    this.highDustFilter.Q.setValueAtTime(0.6, now);

    this.highDustGain = this.ctx.createGain();
    this.highDustGain.gain.setValueAtTime(0.003, now);

    this.airSource.connect(this.highDustFilter);
    this.highDustFilter.connect(this.highDustGain);
    this.highDustGain.connect(pannerDestination);

    // Start all audio sources synchronously
    this.droneOsc1.start(now);
    this.droneOsc2.start(now);
    this.droneOsc3.start(now);
    this.airSource.start(now);
  }

  /**
   * Called on "Continue" from Thought Input into Breathing Stage:
   * Ambient layer gently swells to become slightly more present as the breathing bed.
   */
  public transitionToBreathing(duration = 2.5): void {
    if (!this.isRunning || !this.masterGain || !this.airFilter) return;
    const now = this.ctx.currentTime;

    // Gently open air filter from 190Hz to 240Hz
    this.airFilter.frequency.cancelScheduledValues(now);
    this.airFilter.frequency.setValueAtTime(this.airFilter.frequency.value, now);
    this.airFilter.frequency.linearRampToValueAtTime(240, now + duration);

    // Swell master ambient gain slightly (from 0.016 to 0.024)
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.024, now + duration);
  }

  /**
   * Called at final exhale / drift transition:
   * Opens the atmospheric filters and stereo field, giving a sensation of wide, deep, expanding space.
   */
  public expand(duration = 6.0): void {
    if (!this.isRunning || !this.airFilter || !this.droneFilter1 || !this.masterGain || this.isExpanded) return;
    this.isExpanded = true;
    const now = this.ctx.currentTime;

    // Airy cosmic wind expands upward to 380Hz
    this.airFilter.frequency.cancelScheduledValues(now);
    this.airFilter.frequency.setValueAtTime(this.airFilter.frequency.value, now);
    this.airFilter.frequency.exponentialRampToValueAtTime(380, now + duration);

    // Drone warmth opens slightly to 160Hz
    this.droneFilter1.frequency.cancelScheduledValues(now);
    this.droneFilter1.frequency.setValueAtTime(this.droneFilter1.frequency.value, now);
    this.droneFilter1.frequency.linearRampToValueAtTime(160, now + duration);

    // High atmosphere cosmic dust blooms subtly
    if (this.highDustFilter && this.highDustGain) {
      this.highDustFilter.frequency.cancelScheduledValues(now);
      this.highDustFilter.frequency.setValueAtTime(this.highDustFilter.frequency.value, now);
      this.highDustFilter.frequency.linearRampToValueAtTime(2100, now + duration);

      this.highDustGain.gain.cancelScheduledValues(now);
      this.highDustGain.gain.setValueAtTime(this.highDustGain.gain.value, now);
      this.highDustGain.gain.linearRampToValueAtTime(0.005, now + duration);
    }

    // Master ambient level gently breathes outward (from 0.024 to 0.032)
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.032, now + duration);
  }

  /**
   * Called during completion / perspective reveal:
   * Smoothly drops to near-silence. Leaves a short period of peaceful stillness.
   */
  public fadeToSilence(duration = 3.5): void {
    if (!this.isRunning || !this.masterGain || this.isFadingToSilence) return;
    this.isFadingToSilence = true;
    const now = this.ctx.currentTime;

    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.0015, now + duration);
  }

  /**
   * Smoothly stops all audio nodes and resets state.
   * Called on "Return Home".
   */
  public stop(fadeOutDuration = 1.5): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.isExpanded = false;
    this.isFadingToSilence = false;

    const now = this.ctx.currentTime;

    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + fadeOutDuration);
    }

    if (this.stopTimer) clearTimeout(this.stopTimer);
    this.stopTimer = setTimeout(() => {
      try {
        this.droneOsc1?.stop();
        this.droneOsc2?.stop();
        this.droneOsc3?.stop();
        this.airSource?.stop();
        this.pannerLfo?.stop();

        this.droneOsc1?.disconnect();
        this.droneOsc2?.disconnect();
        this.droneOsc3?.disconnect();
        this.airSource?.disconnect();
        this.droneFilter1?.disconnect();
        this.droneFilter2?.disconnect();
        this.droneGain?.disconnect();
        this.airFilter?.disconnect();
        this.airGain?.disconnect();
        this.highDustFilter?.disconnect();
        this.highDustGain?.disconnect();
        this.pannerLfo?.disconnect();
        this.pannerLfoGain?.disconnect();
        this.panner?.disconnect();
        this.masterGain?.disconnect();
      } catch {
        // Safe disposal
      }

      this.droneOsc1 = null;
      this.droneOsc2 = null;
      this.droneOsc3 = null;
      this.airSource = null;
      this.droneFilter1 = null;
      this.droneFilter2 = null;
      this.droneGain = null;
      this.airFilter = null;
      this.airGain = null;
      this.highDustFilter = null;
      this.highDustGain = null;
      this.panner = null;
      this.pannerLfo = null;
      this.pannerLfoGain = null;
      this.masterGain = null;
      this.stopTimer = null;
    }, (fadeOutDuration + 0.1) * 1000);
  }
}
