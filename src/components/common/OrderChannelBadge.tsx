import { Badge } from '@/components/ui/badge';
import { Smartphone, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderChannelBadgeProps {
  channel: 'internal' | 'ifood' | string;
  className?: string;
}

export function OrderChannelBadge({ channel, className }: OrderChannelBadgeProps) {
  if (channel === 'ifood') {
    return (
      <Badge 
        className={cn(
          'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20',
          className
        )}
      >
        <Smartphone className="h-3 w-3 mr-1" />
        iFood
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline"
      className={cn('text-muted-foreground', className)}
    >
      <Store className="h-3 w-3 mr-1" />
      Interno
    </Badge>
  );
}
