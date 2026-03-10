import { cn } from '@/lib/utils';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants';

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        'status-badge',
        ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800',
        className
      )}
    >
      {ORDER_STATUS_LABELS[status] || status}
    </span>
  );
}
