import { createPinkNoiseBuffer } from './pinkNoise';

/**
 * Interaction Sounds:
 * 
 * Subdued, organic spatial effects:
 * - Thought Input "Continue": Transitioning into quiet deep space (no web click sound)
 * - Thought becomes Star: Delicate, distant celestial shimmer
 */
export class InteractionSounds {
  private ctx: AudioContext;
  private outputNode: GainNode;

  constructor(ctx: AudioContext, outputNode: GainNode) {
    this.ctx = ctx;
    this.outputNode = outputNode;
  }

  /**
   * "CONTINUE" Transition:
   * A very soft, warm atmospheric breath entering another space.
   */
  public playSpaceTransition(): void {
    const now = this.ctx.currentTime;

    const noiseBuffer = createPinkNoiseBuffer(this.ctx, 2);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(110, now + 1.4);
    filter.Q.setValueAtTime(1.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.022, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode);

    noiseSource.start(now);
    noiseSource.stop(now + 1.45);

    setTimeout(() => {
      try {
        noiseSource.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {
        // Safe disposal
      }
    }, 1600);
  }

  /**
   * "THOUGHT BECOMES A STAR":
   * When the thought settles into a distant star point at 53s.
   * Extremely subtle, airy celestial starlight glow:
   * - ZERO "ding", ZERO chime, ZERO percussive game sound
   * - Soft bandpass stardust noise + gentle 528Hz harmonic glow
   * - 1.2s gradual swell, 2.5s smooth exponential decay
   */
  public playStarShimmer(): void {
    const now = this.ctx.currentTime;

    // 1. Airy celestial dust layer
    const noiseBuffer = createPinkNoiseBuffer(this.ctx, 4);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1400, now);
    noiseFilter.Q.setValueAtTime(0.7, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(0.0035, now + 1.2);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.outputNode);

    // 2. Faint harmonic starlight resonance (warm 528Hz, filtered at 700Hz)
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, now); // Solfeggio / calm celestial frequency

    const oscFilter = this.ctx.createBiquadFilter();
    oscFilter.type = 'lowpass';
    oscFilter.frequency.setValueAtTime(700, now);
    oscFilter.Q.setValueAtTime(0.5, now);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.linearRampToValueAtTime(0.0022, now + 1.2);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(this.outputNode);

    noiseSource.start(now);
    noiseSource.stop(now + 3.9);
    osc.start(now);
    osc.stop(now + 3.9);

    setTimeout(() => {
      try {
        noiseSource.disconnect();
        noiseFilter.disconnect();
        noiseGain.disconnect();
        osc.disconnect();
        oscFilter.disconnect();
        oscGain.disconnect();
      } catch {
        // Safe disposal
      }
    }, 4100);
  }
}
