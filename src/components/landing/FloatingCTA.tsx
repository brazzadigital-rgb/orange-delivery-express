import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerInstallPrompt } from '@/lib/pwa-prompt';
import { useState, useEffect } from 'react';

export default function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 500px
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInstall = async () => {
    const success = await triggerInstallPrompt();
    if (!success) {
      window.location.href = '/pwa/install';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 animate-fade-in">
      <Button
        onClick={handleInstall}
        className="floating-cta btn-shimmer h-11 sm:h-14 px-4 sm:px-6 text-sm sm:text-base font-semibold rounded-xl sm:rounded-2xl text-white border-0 shadow-2xl"
      >
        <Download className="mr-1.5 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">Instalar</span>
      </Button>
    </div>
  );
}
