import { cn } from '@/lib/utils';

interface CategoryChipProps {
  icon?: string;
  imageUrl?: string | null;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function CategoryChip({ icon, imageUrl, label, active, onClick }: CategoryChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'category-chip touch-feedback',
        active && 'active'
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={label} className="w-7 h-7 rounded-full object-cover shrink-0" />
      ) : icon ? (
        <span className="text-base">{icon}</span>
      ) : null}
      <span>{label}</span>
    </button>
  );
}
