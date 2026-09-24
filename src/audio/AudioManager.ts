import { AmbientLayer } from './ambientLayer';
import { BreathingLayer } from './breathingLayer';
import { InteractionSounds } from './interactionSounds';
import { ambientMusicPlayer } from './ambientMusic';

type MuteListener = (isMuted: boolean) => void;

/**
 * EXHALE Central Audio Manager (Web Audio API + Ambient Music Player):
 * 
 * Orchestrates:
 * - Lazy initialization on intentional user gesture (Continue / Toggle)
 * - Safe handling of browser autoplay restrictions
 * - Continuous playback of "Meanwhile" ambient music track across Journey phases
 * - Master volume smoothing and zero-click gain ramping
 * - Seamless synchronization with CosmicJourney visual phase machine
 * - Complete teardown and fresh session reset on Return Home
 */
class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambient: AmbientLayer | null = null;
  private breathing: BreathingLayer | null = null;
  private interactions: InteractionSounds | null = null;
  private muted = false;
  private listeners: Set<MuteListener> = new Set();
  private isInitialized = false;

  constructor() {
    // Check saved mute preference
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('exhale_audio_muted');
        this.muted = saved === 'true';
        (window as unknown as { __audioManager: unknown }).__audioManager = this;
      } catch {
        // Ignore storage errors
      }
    }
  }

  /**
   * Initializes the AudioContext upon intentional user gesture.
   * Never forces autoplay before user interaction.
   */
  public async init(): Promise<boolean> {
    if (this.ctx && this.ctx.state === 'running') return true;

    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return false;

        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0.0001 : 1.0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.ambient = new AmbientLayer(this.ctx, this.masterGain);
        this.breathing = new BreathingLayer(this.ctx, this.masterGain);
        this.interactions = new InteractionSounds(this.ctx, this.masterGain);
        this.isInitialized = true;
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      return true;
    } catch {
      // Audio is an enhancement, never a blocker. Fail silently.
      return false;
    }
  }

  /**
   * Starts the ambient music journey with slow 5-second cinematic fade-in.
   * Called on intentional user interaction (Continue from Thought Input).
   */
  public startMusicJourney(): void {
    // 1. Start Meanwhile ambient soundtrack immediately within the synchronous user gesture
    ambientMusicPlayer.start();

    // 2. Initialize supplementary Web Audio API layers (breathing noise, space transition) in background
    this.init().catch(() => {});
  }

  /**
   * Starts quiet cosmic atmosphere (home screen remains silent).
   */
  public async startAmbient(): Promise<void> {
    // Home & Thought Input remain quiet per design requirements
  }

  /**
   * Subtle space transition sound (called on "Continue" from Thought Input).
   */
  public async playSpaceTransition(): Promise<void> {
    const ready = await this.init();
    if (!ready) return;
    this.interactions?.playSpaceTransition();
  }

  /**
   * Called when user returns from Journey to Thought input.
   * Stops music and breathing audio cleanly.
   */
  public onBackToThought(): void {
    ambientMusicPlayer.stopAndReset(0.8);
    if (!this.isInitialized) return;
    this.breathing?.stop(1.0);
  }

  /**
   * Synchronizes audio with the continuous JourneyPhase state machine.
   */
  public onJourneyPhase(phase: string): void {
    if (!this.isInitialized) return;

    switch (phase) {
      case 'arriving':
        // Breathing layer enters quiet holding state
        this.breathing?.start();
        break;

      case 'inhale-1':
      case 'inhale-2':
      case 'inhale-3':
        this.breathing?.inhale(4.0);
        break;

      case 'hold-1':
      case 'hold-2':
      case 'hold-3':
        this.breathing?.hold(2.0);
        break;

      case 'exhale-1':
      case 'exhale-2':
        this.breathing?.exhale(6.0, false);
        break;

      case 'rest-1':
      case 'rest-2':
      case 'hold-ex-1':
      case 'hold-ex-2':
        this.breathing?.holdExhale(2.0);
        break;

      case 'final-exhale':
        this.breathing?.exhale(6.0, true);
        break;

      case 'stillness':
        // Breathing layer naturally settles to silent stillness as final exhale completes (1.5s)
        this.breathing?.fadeQuick(1.5);
        break;

      case 'drift-init':
      case 'drift':
      case 'drift-moving':
      case 'drift-smaller':
      case 'drift-pullback':
        // Breathing sound is fully settled; ambient music continues uninterrupted
        this.breathing?.stop(0.8);
        break;

      case 'drift-star':
        // Thought blooms into a star point: delicate starlight shimmer
        this.interactions?.playStarShimmer();
        break;

      case 'perspective-1':
      case 'perspective-2':
        // Music continues underneath perspective realizations
        break;

      case 'completion':
        // Gentle 4-second fade-out into silence at the end of the journey
        ambientMusicPlayer.fadeOut(4.0, false);
        break;

      default:
        break;
    }
  }

  /**
   * Smoothly stops all audio and resets state for a clean new session.
   * Called on "Return Home".
   */
  public stopAll(fadeDuration = 1.5): void {
    ambientMusicPlayer.stopAndReset(fadeDuration);

    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.0001, now + fadeDuration);

    this.ambient?.stop(fadeDuration);
    this.breathing?.stop(fadeDuration);

    setTimeout(() => {
      // Re-arm master gain for the next session if not muted
      if (this.ctx && this.masterGain) {
        const resetNow = this.ctx.currentTime;
        this.masterGain.gain.setValueAtTime(this.muted ? 0.0001 : 1.0, resetNow);
      }
    }, (fadeDuration + 0.1) * 1000);
  }

  /**
   * Mute / Unmute Control
   */
  public setMuted(muted: boolean): void {
    this.muted = muted;
    ambientMusicPlayer.setMuted(muted);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('exhale_audio_muted', muted ? 'true' : 'false');
      } catch {
        // Ignore storage errors
      }
    }

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0.0001 : 1.0, now + 0.3);
    }

    this.notifyListeners();
  }

  public toggleMuted(): boolean {
    // If not initialized yet, clicking toggle initializes AudioContext
    this.init();
    this.setMuted(!this.muted);
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public subscribe(listener: MuteListener): () => void {
    this.listeners.add(listener);
    listener(this.muted);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.muted);
    }
  }
}

export const audioManager = new AudioManager();
