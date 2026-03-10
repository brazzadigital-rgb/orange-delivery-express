/**
 * GLOBAL PWA INSTALL PROMPT CAPTURE
 * ==================================
 * This file captures the beforeinstallprompt event BEFORE React mounts.
 * The event fires only once and can be missed if React hasn't loaded yet.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Store the deferred prompt globally
let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Capture the event immediately (before React mounts)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA] beforeinstallprompt captured globally');
    
    // Dispatch custom event so React can react to it
    window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
  });
}

export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function clearDeferredPrompt(): void {
  deferredPrompt = null;
}

export async function triggerInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] No deferred prompt available');
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User choice:', outcome);
    
    if (outcome === 'accepted') {
      clearDeferredPrompt();
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PWA] Error triggering prompt:', error);
    return false;
  }
}
