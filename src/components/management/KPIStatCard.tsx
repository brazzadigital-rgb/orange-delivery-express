import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface KPIStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  isLoading?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export function KPIStatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  isLoading = false,
  variant = 'default',
}: KPIStatCardProps) {
  const variantStyles = {
    default: 'bg-card',
    primary: 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20',
    success: 'bg-gradient-to-br from-success/10 to-success/5 border-success/20',
    warning: 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20',
    danger: 'bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20',
  };

  const iconStyles = {
    default: 'bg-muted text-muted-foreground',
    primary: 'gradient-primary text-white',
    success: 'bg-success text-white',
    warning: 'bg-amber-500 text-white',
    danger: 'bg-destructive text-white',
  };

  if (isLoading) {
    return (
      <div className={cn(
        'p-6 rounded-2xl border shadow-sm transition-all duration-200',
        variantStyles[variant]
      )}>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <Skeleton className="w-16 h-6 rounded-full" />
        </div>
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  return (
    <div className={cn(
      'p-6 rounded-2xl border shadow-sm transition-all duration-200',
      'hover:shadow-lg hover:-translate-y-0.5',
      'cursor-default',
      variantStyles[variant]
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          iconStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-semibold px-2.5 py-1 rounded-full',
            trend.isPositive 
              ? 'bg-success/10 text-success' 
              : 'bg-destructive/10 text-destructive'
          )}>
            {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold tracking-tight mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
