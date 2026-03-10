interface PriceTagProps {
  price: number;
  promoPrice?: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceTag({ price, promoPrice, size = 'md' }: PriceTagProps) {
  const hasPromo = promoPrice && promoPrice < price;
  const displayPrice = hasPromo ? promoPrice : price;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-baseline gap-2">
      {hasPromo && (
        <span className="text-sm text-muted-foreground line-through">
          R$ {price.toFixed(2).replace('.', ',')}
        </span>
      )}
      <span className={`font-bold text-primary ${sizeClasses[size]}`}>
        R$ {displayPrice.toFixed(2).replace('.', ',')}
      </span>
    </div>
  );
}
