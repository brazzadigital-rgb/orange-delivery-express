import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * SERVICE WORKER UPDATE PROMPT
 * ============================
 * Detects when a new service worker is available and prompts
 * the user to update. This ensures users always get the latest
 * version without stale cached content.
 */
export function ServiceWorkerUpdate() {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Listen for new service worker
      navigator.serviceWorker.ready.then((registration) => {
        // Check for updates periodically
        const checkForUpdates = () => {
          registration.update().catch(console.error);
        };
        
        // Check every 5 minutes
        const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
        
        // Handle waiting service worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdateBanner(true);
        }
        
        // Listen for new waiting service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                setWaitingWorker(newWorker);
                setShowUpdateBanner(true);
              }
            });
          }
        });
        
        return () => clearInterval(interval);
      });

      // Handle controller change (new SW activated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      // Tell the waiting service worker to skip waiting
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdateBanner(false);
  };

  const handleDismiss = () => {
    setShowUpdateBanner(false);
  };

  if (!showUpdateBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] p-3 bg-primary text-primary-foreground animate-fade-in shadow-lg">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <RefreshCw className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm flex-1">
          Nova versão disponível!
        </p>
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={handleUpdate}
          className="flex-shrink-0"
        >
          Atualizar
        </Button>
        <button 
          onClick={handleDismiss} 
          className="text-primary-foreground/70 hover:text-primary-foreground p-1"
          aria-label="Dispensar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
