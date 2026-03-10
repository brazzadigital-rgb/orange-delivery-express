import { Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioUnlock } from '@/hooks/useAudioUnlock';
import { cn } from '@/lib/utils';

export function AudioUnlockBanner() {
  const { showUnlockPrompt, unlock, dismissPrompt } = useAudioUnlock();

  if (!showUnlockPrompt) return null;

  const handleActivate = async () => {
    await unlock();
  };

  return (
    <div className={cn(
      "fixed bottom-20 left-4 right-4 z-50",
      "bg-accent text-accent-foreground rounded-xl shadow-lg",
      "p-4 flex items-center gap-3",
      "animate-in slide-in-from-bottom-5 duration-300"
    )}>
      <Volume2 className="w-6 h-6 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">Ative o som para receber alertas</p>
        <p className="text-xs opacity-80">Toque para ativar notificações sonoras</p>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          variant="secondary"
          onClick={handleActivate}
        >
          Ativar
        </Button>
        <button 
          onClick={dismissPrompt}
          className="p-1 hover:bg-foreground/10 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
