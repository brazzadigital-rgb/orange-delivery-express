import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  isLoading?: boolean;
  className?: string;
  action?: ReactNode;
}

export const ChartCard = forwardRef<HTMLDivElement, ChartCardProps>(
  ({ title, subtitle, children, isLoading = false, className, action }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          'bg-card rounded-2xl border shadow-sm p-6',
          'transition-all duration-200 hover:shadow-md',
          className
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        ) : (
          <div className="min-h-[200px]">
            {children}
          </div>
        )}
      </div>
    );
  }
);

ChartCard.displayName = 'ChartCard';
