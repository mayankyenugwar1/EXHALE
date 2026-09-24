/**
 * EXHALE — Ambient Music Player
 * 
 * Manages the playback of the provided ambient soundtrack:
 * "Meanwhile(chosic.com).mp3"
 * 
 * Features:
 * - Strictly ONE HTMLAudioElement instance across the application lifetime.
 * - Starts ONLY on user gesture (Continue button from Thought Input).
 * - Slow 5-second cinematic fade-in curve to ambient level (~0.20).
 * - Continuous playback across Breathing, Drift, and Starlight without restarts.
 * - Smooth muting/unmuting without altering playback position.
 * - Gentle 4-second fade-out into silence at Completion.
 * - Complete stop and reset to 00:00 on Return Home or Back navigation.
 */

const TARGET_AMBIENT_VOLUME = 0.20;

export class AmbientMusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private isMuted = false;
  private isPlaying = false;
  private fadeAnimationId: number | null = null;
  private audioUrl: string;

  constructor() {
    // Determine path based on Vite BASE_URL
    const base = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL 
      ? import.meta.env.BASE_URL 
      : '/';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    this.audioUrl = `${cleanBase}audio/Meanwhile.mp3`;

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('exhale_audio_muted');
        this.isMuted = saved === 'true';
        (window as unknown as { __ambientMusicPlayer: unknown }).__ambientMusicPlayer = this;
      } catch {
        // Ignore storage access errors
      }
    }
  }

  private getOrCreateAudio(): HTMLAudioElement {
    if (!this.audio) {
      this.audio = new Audio(this.audioUrl);
      this.audio.preload = 'auto';
      this.audio.loop = false; // Do not loop normally; let it play naturally
      this.audio.volume = 0;

      // Seamless loop only if session exceeds 5+ minutes
      this.audio.addEventListener('ended', () => {
        if (this.isPlaying && this.audio) {
          this.audio.currentTime = 0;
          this.audio.play().catch(() => {});
        }
      });
    }
    return this.audio;
  }

  /**
   * Starts the music with a slow 5-second cinematic fade-in.
   * Called upon explicit user interaction (Continue from Thought Input).
   */
  public async start(): Promise<void> {
    const audio = this.getOrCreateAudio();
    this.clearFade();

    this.isPlaying = true;
    try {
      if (audio.currentTime > 0) {
        audio.currentTime = 0;
      }
    } catch {
      // Ignore if media isn't ready for seeking yet
    }

    audio.volume = 0;

    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (err) {
      console.warn('[AmbientMusicPlayer] Playback was prevented:', err);
      return;
    }

    if (this.isMuted) {
      audio.volume = 0;
      return;
    }

    // 5-second smooth cinematic fade-in curve:
    // 0s: 0.0 -> 1s: ~0.03 -> 3s: ~0.11 -> 5s: 0.20
    this.rampVolume(TARGET_AMBIENT_VOLUME, 5000, 'in');
  }

  /**
   * Smoothly fades out the music over a specified duration (e.g. 4.0s for completion, 0.8s for early exit).
   * Once volume reaches 0, pauses and optionally resets position.
   */
  public fadeOut(durationSeconds = 4.0, reset = false): void {
    if (!this.audio) return;
    if (!this.isPlaying) {
      if (reset) {
        try {
          this.audio.pause();
          this.audio.currentTime = 0;
        } catch {}
      }
      return;
    }

    this.rampVolume(0, durationSeconds * 1000, 'out', () => {
      if (this.audio) {
        this.audio.pause();
        if (reset) {
          try {
            this.audio.currentTime = 0;
          } catch {}
        }
      }
      this.isPlaying = false;
    });
  }

  /**
   * Stops the music and resets playhead to 00:00.
   * Called on "Return Home" or when backing out to Thought Input.
   */
  public stopAndReset(fadeSeconds = 1.0): void {
    if (!this.audio) return;
    if (!this.isPlaying) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch {}
      return;
    }
    this.fadeOut(fadeSeconds, true);
  }

  /**
   * Mutes or unmutes the music.
   * When muting, volume fades to 0 smoothly while playback continues silently.
   * When unmuting, volume fades back up to TARGET_AMBIENT_VOLUME from the current position.
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (!this.audio || !this.isPlaying) return;

    if (muted) {
      this.rampVolume(0, 400, 'out');
    } else {
      this.rampVolume(TARGET_AMBIENT_VOLUME, 800, 'in');
    }
  }

  /**
   * Smooth volume interpolation helper using requestAnimationFrame
   */
  private rampVolume(
    targetVolume: number,
    durationMs: number,
    curve: 'in' | 'out',
    onComplete?: () => void
  ): void {
    this.clearFade();
    if (!this.audio) return;

    const startVolume = this.audio.volume;
    const startTime = performance.now();

    const step = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);

      // Organic easing curve:
      // 'in': quadratic ease-in (gradual bloom)
      // 'out': sine ease-out (gentle, zero clicks)
      let ease = progress;
      if (curve === 'in') {
        ease = progress * progress;
      } else {
        ease = Math.sin((progress * Math.PI) / 2);
      }

      const newVol = Math.max(0, Math.min(1, startVolume + (targetVolume - startVolume) * ease));
      if (this.audio) {
        this.audio.volume = newVol;
      }

      if (progress < 1.0) {
        this.fadeAnimationId = requestAnimationFrame(step);
      } else {
        this.clearFade();
        if (this.audio) {
          this.audio.volume = targetVolume;
        }
        onComplete?.();
      }
    };

    this.fadeAnimationId = requestAnimationFrame(step);
  }

  private clearFade(): void {
    if (this.fadeAnimationId !== null) {
      cancelAnimationFrame(this.fadeAnimationId);
      this.fadeAnimationId = null;
    }
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audio;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTime(): number {
    return this.audio ? this.audio.currentTime : 0;
  }
}

export const ambientMusicPlayer = new AmbientMusicPlayer();
