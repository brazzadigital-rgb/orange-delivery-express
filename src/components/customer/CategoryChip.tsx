import { cn } from '@/lib/utils';

interface CategoryChipProps {
  icon?: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function CategoryChip({ icon, label, active, onClick }: CategoryChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'category-chip touch-feedback',
        active && 'active'
      )}
    >
      {icon && <span className="text-base">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
