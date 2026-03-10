/**
 * AudioManager - Singleton for handling audio playback on mobile
 * Manages audio unlock, sound playback, and vibration
 */

type SoundType = 'soft_chime' | 'pop' | 'bell';
type OrderStatus = 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered';

interface AudioManagerState {
  unlocked: boolean;
  audioContext: AudioContext | null;
  preloadedSounds: Map<string, HTMLAudioElement>;
}

// Sound URLs - using publicly hosted sounds
const SOUND_URLS: Record<SoundType, string> = {
  soft_chime: '/sounds/soft-chime.mp3',
  // NOTE: use a versioned filename to avoid stale PWA/service-worker caches.
  pop: '/sounds/pop-v2.mp3',
  bell: '/sounds/bell.mp3',
};

// Map order status to sound characteristics
const STATUS_SOUNDS: Record<OrderStatus, { type: SoundType; vibrate?: number[] }> = {
  accepted: { type: 'soft_chime', vibrate: [200] },
  preparing: { type: 'pop', vibrate: [100] },
  ready: { type: 'bell', vibrate: [200, 100, 200] },
  out_for_delivery: { type: 'soft_chime', vibrate: [300, 100, 300] },
  delivered: { type: 'bell', vibrate: [200, 100, 200, 100, 200] },
};

class AudioManagerClass {
  private state: AudioManagerState = {
    unlocked: false,
    audioContext: null,
    preloadedSounds: new Map(),
  };

  private unlockPromise: Promise<boolean> | null = null;
  private unlockListenerAttached = false;

  /**
   * Check if audio is unlocked
   */
  isUnlocked(): boolean {
    return this.state.unlocked;
  }

  /**
   * Attempt to unlock audio - must be called from user interaction
   */
  async unlock(): Promise<boolean> {
    if (this.state.unlocked) {
      return true;
    }

    // Avoid concurrent unlock attempts (very common when we have both a global
    // click listener + an explicit “Ativar” button).
    if (this.unlockPromise) {
      return this.unlockPromise;
    }

    this.unlockPromise = (async () => {
      try {
        console.log('[AudioManager] Unlock attempt started');

        // Create AudioContext if not exists
        if (!this.state.audioContext) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            this.state.audioContext = new AudioContextClass();
          }
        }

        // IMPORTANT (mobile/Safari): call play() as early as possible inside the user gesture.
        // Avoid awaiting other promises before play(), otherwise the gesture can be lost.
        const resumePromise =
          this.state.audioContext?.state === 'suspended'
            ? this.state.audioContext.resume().catch((e) => {
                console.warn('[AudioManager] audioContext.resume() failed (ignored):', e);
                return undefined;
              })
            : Promise.resolve(undefined);

        // Attempt 1: play/pause a real file (more compatible than data: on some devices)
        try {
          await this.playProbeSound(SOUND_URLS.soft_chime);
          console.log('[AudioManager] Probe sound played (muted)');
        } catch (e) {
          console.warn('[AudioManager] Probe sound failed, trying data URI fallback:', e);

          // Attempt 2: fallback to a tiny data: mp3
          await this.playProbeSound(
            'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYJqzrLAAAAAAD/+1DEAAAGrANX9AAACQ0Ob/cYYAgAANIAAABPhY+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fk5OTk5OT//tQxAAABvQDV/AAAAkJDm/3GGAIAAAA0gAAAR4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pg=='
          );
          console.log('[AudioManager] Data URI probe played (muted)');
        }

        // Best-effort: also “tickle” WebAudio graph (some PWAs behave better with this)
        await this.tryWebAudioNudge().catch((e) => {
          console.warn('[AudioManager] WebAudio nudge failed (ignored):', e);
        });

        // Ensure audio context is resumed too (best effort)
        await resumePromise;

        this.state.unlocked = true;
        console.log('[AudioManager] Audio unlocked successfully');

        // Preload sounds after unlock
        this.preloadSounds();

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('audio-unlocked'));

        return true;
      } catch (error: any) {
        const name = error?.name;
        const message = error?.message;
        console.warn('[AudioManager] Failed to unlock audio:', { name, message, error });
        return false;
      }
    })();

    const result = await this.unlockPromise.finally(() => {
      this.unlockPromise = null;
    });

    return result;
  }

  /**
   * Play/pause a muted audio element to satisfy mobile “user gesture” rules.
   */
  private async playProbeSound(url: string): Promise<void> {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.muted = true;
    audio.volume = 0;
    audio.loop = false;

    // Ensure we start from a clean state
    try {
      audio.currentTime = 0;
    } catch {
      // ignore
    }

    // Trigger fetch/decode before play (best effort)
    try {
      audio.load();
    } catch {
      // ignore
    }

    const playPromise = audio.play();
    if (playPromise) await playPromise;

    // Immediately stop
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {
      // ignore
    }
  }

  /**
   * Best-effort: create a silent oscillator to improve WebAudio readiness in some mobile/PWA contexts.
   */
  private async tryWebAudioNudge(): Promise<void> {
    const ctx = this.state.audioContext;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // ignore
      }
    }

    // Some browsers require creating a node graph after resume
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.01);
  }

  /**
   * Preload all sounds for faster playback
   */
  private preloadSounds(): void {
    Object.entries(SOUND_URLS).forEach(([type, url]) => {
      if (!this.state.preloadedSounds.has(type)) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.load();
        this.state.preloadedSounds.set(type, audio);
      }
    });
  }

  /**
   * Play a sound for a specific order status
   */
  async playStatusSound(
    status: OrderStatus,
    options: { volume?: number; vibrate?: boolean; soundType?: SoundType } = {}
  ): Promise<boolean> {
    const { volume = 0.8, vibrate = true, soundType } = options;

    if (!this.state.unlocked) {
      console.log('[AudioManager] Audio not unlocked, cannot play sound');
      return false;
    }

    const statusConfig = STATUS_SOUNDS[status];
    if (!statusConfig) {
      console.log('[AudioManager] No sound configured for status:', status);
      return false;
    }

    // Use provided soundType or fall back to status default
    const typeToPlay = soundType || statusConfig.type;

    try {
      // Play sound (reuse preloaded element created after unlock)
      const soundUrl = SOUND_URLS[typeToPlay];
      let audio = this.state.preloadedSounds.get(typeToPlay);

      if (!audio) {
        // Fallback (should rarely happen): create and cache
        audio = new Audio(soundUrl);
        audio.preload = 'auto';
        audio.load();
        this.state.preloadedSounds.set(typeToPlay, audio);
      }

      audio.volume = Math.min(1, Math.max(0, volume));
      try {
        // If it was mid-play, pause before rewinding (more reliable on iOS)
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // ignore
      }

      await audio.play();

      // Vibrate if enabled and available
      if (vibrate && statusConfig.vibrate && 'vibrate' in navigator) {
        try {
          navigator.vibrate(statusConfig.vibrate);
        } catch (e) {
          console.log('[AudioManager] Vibration not available');
        }
      }

      console.log('[AudioManager] Played sound for status:', status);
      return true;
    } catch (error) {
      console.error('[AudioManager] Failed to play sound:', error);
      return false;
    }
  }

  /**
   * Play a test sound
   */
  async playTestSound(type: SoundType = 'soft_chime', volume = 0.8): Promise<boolean> {
    if (!this.state.unlocked) {
      // Try to unlock first
      const unlocked = await this.unlock();
      if (!unlocked) return false;
    }

    try {
      const soundUrl = SOUND_URLS[type];
      const audio = new Audio(soundUrl);
      audio.volume = Math.min(1, Math.max(0, volume));
      await audio.play();
      return true;
    } catch (error) {
      console.error('[AudioManager] Failed to play test sound:', error);
      return false;
    }
  }

  /**
   * Trigger vibration
   */
  vibrate(pattern: number | number[] = [200]): boolean {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  /**
   * Attach global unlock listener for first user interaction
   */
  attachUnlockListener(): void {
    if (this.unlockListenerAttached || this.state.unlocked) return;

    const handleInteraction = async () => {
      if (!this.state.unlocked) {
        await this.unlock();
      }
     // Only remove listeners after successful unlock
     if (this.state.unlocked) {
       document.removeEventListener('click', handleInteraction);
       document.removeEventListener('touchstart', handleInteraction);
       document.removeEventListener('keydown', handleInteraction);
     }
    };

   // Use capture phase to ensure we get the event before other handlers
   document.addEventListener('click', handleInteraction, { capture: true, passive: true });
   document.addEventListener('touchstart', handleInteraction, { capture: true, passive: true });
   document.addEventListener('touchend', handleInteraction, { capture: true, passive: true });
   document.addEventListener('keydown', handleInteraction, { capture: true, passive: true });

    this.unlockListenerAttached = true;
    console.log('[AudioManager] Unlock listener attached');
  }
}

// Export singleton instance
export const AudioManager = new AudioManagerClass();

// Export types
export type { SoundType, OrderStatus };
