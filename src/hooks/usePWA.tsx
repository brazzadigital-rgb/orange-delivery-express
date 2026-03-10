import { useState, useEffect, useCallback } from 'react';
import { getDeferredPrompt, triggerInstallPrompt, clearDeferredPrompt } from '@/lib/pwa-prompt';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
}

const DISMISS_STORAGE_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7;

// Force show banner in preview/development for testing
const FORCE_SHOW_BANNER = import.meta.env.DEV || window.location.hostname.includes('lovable');

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isIOS: false,
    isAndroid: false,
    isStandalone: false,
  });
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Check if we should force show for dev/preview
  const forceShow = FORCE_SHOW_BANNER;

  useEffect(() => {
    // Check if running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSinceDismiss = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < DISMISS_DAYS) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(DISMISS_STORAGE_KEY);
      }
    }

    // Check if we already have a deferred prompt (captured before React mounted)
    const existingPrompt = getDeferredPrompt();
    
    setState(prev => ({
      ...prev,
      isStandalone,
      isInstalled: isStandalone,
      isIOS,
      isAndroid,
      isInstallable: existingPrompt !== null,
    }));

    // Listen for custom event when prompt becomes available
    const handlePromptAvailable = () => {
      console.log('[usePWA] Prompt available event received');
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('[usePWA] App installed');
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
      }));
      clearDeferredPrompt();
    };

    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const success = await triggerInstallPrompt();
    if (success) {
      setState(prev => ({
        ...prev,
        isInstallable: false,
      }));
    }
    return success;
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_STORAGE_KEY, new Date().toISOString());
    setIsDismissed(true);
  }, []);

  const shouldShowBanner = !state.isInstalled && !isDismissed && (state.isInstallable || state.isIOS || forceShow);

  return {
    ...state,
    isDismissed,
    shouldShowBanner,
    promptInstall,
    dismiss,
    forceShow, // Expose so components know we're in preview mode
  };
}

// Service Worker registration helper
export function useServiceWorker() {
  const [isReady, setIsReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        setIsReady(true);
      });
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }, []);

  const subscribeToPush = useCallback(async (vapidPublicKey?: string) => {
    if (!registration || !vapidPublicKey) return null;

    try {
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }, [registration]);

  return {
    isReady,
    registration,
    requestNotificationPermission,
    subscribeToPush,
  };
}
