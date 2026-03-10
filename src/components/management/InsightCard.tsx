import { LucideIcon, AlertTriangle, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type InsightType = 'warning' | 'success' | 'danger' | 'info';

interface InsightCardProps {
  type: InsightType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: LucideIcon;
}

const typeConfig: Record<InsightType, { 
  bg: string; 
  border: string; 
  icon: LucideIcon; 
  iconColor: string;
}> = {
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: TrendingUp,
    iconColor: 'text-emerald-600',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    icon: AlertCircle,
    iconColor: 'text-red-600',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Lightbulb,
    iconColor: 'text-blue-600',
  },
};

export function InsightCard({
  type,
  title,
  description,
  action,
  icon,
}: InsightCardProps) {
  const config = typeConfig[type];
  const IconComponent = icon || config.icon;

  return (
    <div className={cn(
      'p-4 rounded-xl border transition-all duration-200',
      'hover:shadow-md hover:-translate-y-0.5',
      config.bg,
      config.border
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          'bg-white/80 dark:bg-black/20'
        )}>
          <IconComponent className={cn('w-5 h-5', config.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
          {action && (
            <Button
              variant="link"
              size="sm"
              onClick={action.onClick}
              className="px-0 h-auto mt-2 font-medium"
            >
              {action.label} →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
