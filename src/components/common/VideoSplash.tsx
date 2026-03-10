import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface VideoSplashProps {
  onComplete: () => void;
}

export function VideoSplash({ onComplete }: VideoSplashProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    };

    video.addEventListener('ended', handleEnded);
    
    // Fallback timeout in case video doesn't play
    const fallbackTimeout = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 8000);

    return () => {
      video.removeEventListener('ended', handleEnded);
      clearTimeout(fallbackTimeout);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        onError={() => {
          setIsVisible(false);
          setTimeout(onComplete, 100);
        }}
      >
        <source src="/videos/splash.mp4" type="video/mp4" />
      </video>

      {/* Overlay content */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 sm:pb-16 z-10">
        {/* Loading text */}
        <div className="mb-6 text-center">
          <p className="text-foreground/80 text-sm sm:text-base font-medium animate-pulse drop-shadow-md">
            Carregando experiência...
          </p>
        </div>

        {/* Skip button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-foreground/70 hover:text-foreground hover:bg-foreground/10 border border-foreground/20 rounded-full px-6"
        >
          Pular intro
        </Button>
      </div>
    </div>
  );
}
