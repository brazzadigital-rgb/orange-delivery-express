import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  className?: string;
  transparent?: boolean;
}

export function PageHeader({
  title,
  showBack = true,
  rightElement,
  className,
  transparent = false,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 px-4 py-4 flex items-center gap-3',
        transparent 
          ? 'bg-transparent' 
          : 'bg-background/90 backdrop-blur-xl border-b border-border/30',
        className
      )}
    >
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-card border border-border/40 flex items-center justify-center hover:bg-muted/50 active:scale-95 transition-all duration-150"
          style={{ boxShadow: 'var(--shadow-soft)' }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      
      <h1 className="flex-1 text-lg font-bold truncate">{title}</h1>
      
      {rightElement && <div className="flex-shrink-0">{rightElement}</div>}
    </header>
  );
}
