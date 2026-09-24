import { createPinkNoiseBuffer } from './pinkNoise';

/**
 * Breathing Layer:
 * 
 * Provides an organic "breath through space" synchronized with the visual breathing state:
 * - Inhale: Soft rising atmospheric tone (bandpass filtered airy noise + soft warm sub-sine)
 * - Hold: Tone becomes stable
 * - Exhale: Soft falling atmospheric tone, deep release
 * - Hold Exhale: Tone gently settles
 * 
 * Completely non-musical, soft, warm, and spacious.
 */
export class BreathingLayer {
  private ctx: AudioContext;
  private outputNode: GainNode;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private breathGain: GainNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private subGain: GainNode | null = null;
  private isRunning = false;

  constructor(ctx: AudioContext, outputNode: GainNode) {
    this.ctx = ctx;
    this.outputNode = outputNode;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const now = this.ctx.currentTime;

    // Master breathing layer gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, now);
    this.masterGain.gain.linearRampToValueAtTime(1.0, now + 1.0);
    this.masterGain.connect(this.outputNode);

    // 1. Airy Pink Noise Breath Channel
    const noiseBuffer = createPinkNoiseBuffer(this.ctx, 4);
    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = 'bandpass';
    this.noiseFilter.frequency.setValueAtTime(180, now);
    this.noiseFilter.Q.setValueAtTime(1.2, now);

    this.breathGain = this.ctx.createGain();
    this.breathGain.gain.setValueAtTime(0.002, now);

    this.noiseNode.connect(this.noiseFilter);
    this.noiseFilter.connect(this.breathGain);
    this.breathGain.connect(this.masterGain);

    // 2. Warm Sub-Fundamental Sine Channel (Organic chest warmth, not a musical note)
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subOsc.frequency.setValueAtTime(65, now);

    this.subGain = this.ctx.createGain();
    this.subGain.gain.setValueAtTime(0.001, now);

    this.subOsc.connect(this.subGain);
    this.subGain.connect(this.masterGain);

    this.noiseNode.start(now);
    this.subOsc.start(now);
  }

  /**
   * INHALE: Soft rising atmospheric tone (~4s)
   */
  public inhale(duration = 4.0): void {
    if (!this.isRunning) this.start();
    if (!this.noiseFilter || !this.breathGain || !this.subOsc || !this.subGain) return;

    const now = this.ctx.currentTime;

    // Filter sweeps up gently
    this.noiseFilter.frequency.cancelScheduledValues(now);
    this.noiseFilter.frequency.setValueAtTime(Math.max(160, this.noiseFilter.frequency.value), now);
    this.noiseFilter.frequency.exponentialRampToValueAtTime(460, now + duration);

    // Breath volume rises smoothly
    this.breathGain.gain.cancelScheduledValues(now);
    this.breathGain.gain.setValueAtTime(Math.max(0.002, this.breathGain.gain.value), now);
    this.breathGain.gain.linearRampToValueAtTime(0.034, now + duration);

    // Sub-oscillator rises subtly
    this.subOsc.frequency.cancelScheduledValues(now);
    this.subOsc.frequency.setValueAtTime(Math.max(60, this.subOsc.frequency.value), now);
    this.subOsc.frequency.linearRampToValueAtTime(82, now + duration);

    this.subGain.gain.cancelScheduledValues(now);
    this.subGain.gain.setValueAtTime(this.subGain.gain.value, now);
    this.subGain.gain.linearRampToValueAtTime(0.012, now + duration);
  }

  /**
   * HOLD: Tone becomes stable (~1s)
   */
  public hold(duration = 1.0): void {
    if (!this.noiseFilter || !this.breathGain || !this.subGain) return;
    const now = this.ctx.currentTime;

    // Hold steady
    this.noiseFilter.frequency.cancelScheduledValues(now);
    this.noiseFilter.frequency.setValueAtTime(this.noiseFilter.frequency.value, now);

    this.breathGain.gain.cancelScheduledValues(now);
    this.breathGain.gain.setValueAtTime(this.breathGain.gain.value, now);
    this.breathGain.gain.linearRampToValueAtTime(0.030, now + duration);

    this.subGain.gain.cancelScheduledValues(now);
    this.subGain.gain.setValueAtTime(this.subGain.gain.value, now);
  }

  /**
   * EXHALE: Soft falling atmospheric tone, deep release (~5s)
   */
  public exhale(duration = 5.0, isFinal = false): void {
    if (!this.noiseFilter || !this.breathGain || !this.subOsc || !this.subGain) return;
    const now = this.ctx.currentTime;

    const targetFreq = isFinal ? 120 : 160;
    const targetBreathGain = isFinal ? 0.001 : 0.004;

    // Filter descends smoothly
    this.noiseFilter.frequency.cancelScheduledValues(now);
    this.noiseFilter.frequency.setValueAtTime(Math.max(200, this.noiseFilter.frequency.value), now);
    this.noiseFilter.frequency.exponentialRampToValueAtTime(targetFreq, now + duration);

    // Breath volume gently falls away
    this.breathGain.gain.cancelScheduledValues(now);
    this.breathGain.gain.setValueAtTime(this.breathGain.gain.value, now);
    this.breathGain.gain.linearRampToValueAtTime(targetBreathGain, now + duration);

    // Sub oscillator descends to baseline
    this.subOsc.frequency.cancelScheduledValues(now);
    this.subOsc.frequency.setValueAtTime(this.subOsc.frequency.value, now);
    this.subOsc.frequency.linearRampToValueAtTime(55, now + duration);

    this.subGain.gain.cancelScheduledValues(now);
    this.subGain.gain.setValueAtTime(this.subGain.gain.value, now);
    this.subGain.gain.linearRampToValueAtTime(0.002, now + duration);
  }

  /**
   * HOLD EXHALE: Tone gently settles (~1s)
   */
  public holdExhale(duration = 1.0): void {
    if (!this.breathGain || !this.subGain) return;
    const now = this.ctx.currentTime;

    this.breathGain.gain.cancelScheduledValues(now);
    this.breathGain.gain.setValueAtTime(this.breathGain.gain.value, now);
    this.breathGain.gain.linearRampToValueAtTime(0.002, now + duration);

    this.subGain.gain.cancelScheduledValues(now);
    this.subGain.gain.setValueAtTime(this.subGain.gain.value, now);
    this.subGain.gain.linearRampToValueAtTime(0.001, now + duration);
  }

  /**
   * Fade breathing layer to quiet as drift begins
   */
  public fadeQuick(duration = 1.5): void {
    if (!this.isRunning || !this.masterGain) return;
    const now = this.ctx.currentTime;

    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.0001, now + duration);
  }

  public stop(fadeOutDuration = 0.5): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    const now = this.ctx.currentTime;

    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + fadeOutDuration);
    }

    setTimeout(() => {
      try {
        this.noiseNode?.stop();
        this.subOsc?.stop();
        this.noiseNode?.disconnect();
        this.subOsc?.disconnect();
        this.noiseFilter?.disconnect();
        this.breathGain?.disconnect();
        this.subGain?.disconnect();
        this.masterGain?.disconnect();
      } catch {
        // Safe disposal
      }
      this.noiseNode = null;
      this.subOsc = null;
      this.noiseFilter = null;
      this.breathGain = null;
      this.subGain = null;
      this.masterGain = null;
    }, (fadeOutDuration + 0.1) * 1000);
  }
}
