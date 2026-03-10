import { useState, useEffect, useCallback } from 'react';
import { AudioManager } from '@/lib/AudioManager';
import { useNotificationPreferences } from './useNotificationPreferences';

export function useAudioUnlock() {
  const [isUnlocked, setIsUnlocked] = useState(AudioManager.isUnlocked());
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const { markSoundUnlocked } = useNotificationPreferences();

  useEffect(() => {
    // Attach global unlock listener
    AudioManager.attachUnlockListener();

    // Listen for unlock event
    const handleUnlock = () => {
      setIsUnlocked(true);
      setShowUnlockPrompt(false);
      markSoundUnlocked();
    };

    window.addEventListener('audio-unlocked', handleUnlock);

    // Check initial state
    setIsUnlocked(AudioManager.isUnlocked());

    return () => {
      window.removeEventListener('audio-unlocked', handleUnlock);
    };
  }, [markSoundUnlocked]);

  const unlock = useCallback(async () => {
    const success = await AudioManager.unlock();
    if (success) {
      setIsUnlocked(true);
      setShowUnlockPrompt(false);
      markSoundUnlocked();
    }
    return success;
  }, [markSoundUnlocked]);

  const promptUnlock = useCallback(() => {
    if (!isUnlocked) {
      setShowUnlockPrompt(true);
    }
  }, [isUnlocked]);

  const dismissPrompt = useCallback(() => {
    setShowUnlockPrompt(false);
  }, []);

  return {
    isUnlocked,
    showUnlockPrompt,
    unlock,
    promptUnlock,
    dismissPrompt,
  };
}
