import { Clock, XCircle } from 'lucide-react';
import { useStoreConfig } from '@/contexts/StoreConfigContext';
import { cn } from '@/lib/utils';

// Re-export the new premium component
export { ClosedStoreNotice, StoreClosedBanner } from './ClosedStoreNotice';

interface StoreStatusBadgeProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export function StoreStatusBadge({ className, variant = 'compact' }: StoreStatusBadgeProps) {
  const { isStoreOpen, nextOpenTime, closesAt, isLoading } = useStoreConfig();

  if (isLoading) {
    return (
      <div className={cn("h-6 w-24 bg-muted/50 rounded-full animate-pulse", className)} />
    );
  }

  if (isStoreOpen) {
    return (
      <div 
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
          "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
          className
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold">Aberto agora</span>
        {variant === 'full' && closesAt && (
          <span className="text-xs text-emerald-600/70">• até {closesAt}</span>
        )}
      </div>
    );
  }

  // Store is closed
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
        "bg-red-500/10 text-red-600 border border-red-500/20",
        className
      )}
    >
      <XCircle className="w-3 h-3" />
      <span className="text-xs font-semibold">Fechado</span>
      {variant === 'full' && nextOpenTime && (
        <span className="text-xs text-red-600/70">• abre às {nextOpenTime}</span>
      )}
    </div>
  );
}

// Overlay for blocking actions when store is closed
export function StoreClosedOverlay({ children }: { children: React.ReactNode }) {
  const { isStoreOpen, isLoading } = useStoreConfig();

  if (isLoading || isStoreOpen) {
    return <>{children}</>;
  }

  // Import and render the modal variant
  const { ClosedStoreNotice } = require('./ClosedStoreNotice');
  
  return (
    <div className="relative">
      <ClosedStoreNotice variant="modal" />
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
    </div>
  );
}
