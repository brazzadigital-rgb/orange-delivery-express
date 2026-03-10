import { Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStoreConfig } from '@/contexts/StoreConfigContext';
import { useToggleStoreOpen } from '@/hooks/useStoreSettings';

interface StoreStatusPreviewProps {
  isAutoEnabled: boolean;
  isOpenOverride: boolean | null;
}

export function StoreStatusPreview({ isAutoEnabled, isOpenOverride }: StoreStatusPreviewProps) {
  const { isStoreOpen, nextOpenTime, closesAt } = useStoreConfig();
  const toggleOpen = useToggleStoreOpen();

  const getStatusInfo = () => {
    if (isOpenOverride !== null) {
      return {
        isOpen: isOpenOverride,
        mode: 'override' as const,
        message: isOpenOverride 
          ? 'Forçado ABERTO (override manual)' 
          : 'Forçado FECHADO (override manual)',
      };
    }
    
    if (!isAutoEnabled) {
      return {
        isOpen: true,
        mode: 'manual' as const,
        message: 'Modo manual - sempre aberto',
      };
    }
    
    return {
      isOpen: isStoreOpen,
      mode: 'auto' as const,
      message: isStoreOpen 
        ? closesAt 
          ? `Aberto • fecha às ${closesAt}` 
          : 'Aberto agora'
        : nextOpenTime 
          ? `Fechado • abre às ${nextOpenTime}` 
          : 'Fechado',
    };
  };

  const status = getStatusInfo();

  const handleForceOpen = () => toggleOpen.mutate(true);
  const handleForceClose = () => toggleOpen.mutate(false);
  const handleAutoMode = () => toggleOpen.mutate(null);

  return (
    <div className="bg-card rounded-xl border p-4 space-y-4">
      {/* Status Display */}
      <div className={cn(
        'flex items-center gap-3 p-4 rounded-lg',
        status.isOpen 
          ? 'bg-success/10' 
          : 'bg-destructive/10'
      )}>
        {status.isOpen ? (
          <CheckCircle2 className="w-6 h-6 text-success" />
        ) : (
          <XCircle className="w-6 h-6 text-destructive" />
        )}
        <div className="flex-1">
          <p className={cn(
            'font-semibold',
            status.isOpen ? 'text-success' : 'text-destructive'
          )}>
            {status.isOpen ? 'ABERTO' : 'FECHADO'}
          </p>
          <p className="text-sm text-muted-foreground">
            {status.message}
          </p>
        </div>
        {status.mode === 'override' && (
          <AlertTriangle className="w-5 h-5 text-warning" />
        )}
      </div>

      {/* Override Controls */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Controle Manual</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={isOpenOverride === true ? 'default' : 'outline'}
            size="sm"
            onClick={handleForceOpen}
            disabled={toggleOpen.isPending}
            className="gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Forçar Aberto
          </Button>
          <Button
            variant={isOpenOverride === false ? 'destructive' : 'outline'}
            size="sm"
            onClick={handleForceClose}
            disabled={toggleOpen.isPending}
            className="gap-2"
          >
            <XCircle className="w-4 h-4" />
            Forçar Fechado
          </Button>
          {isOpenOverride !== null && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAutoMode}
              disabled={toggleOpen.isPending}
              className="gap-2"
            >
              <Clock className="w-4 h-4" />
              Voltar ao Automático
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
