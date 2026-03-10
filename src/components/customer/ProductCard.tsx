import { Star, Heart, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  promoPrice?: number | null;
  imageUrl?: string | null;
  rating?: number;
  ratingCount?: number;
  isFavorite?: boolean;
  onFavorite?: () => void;
  onAdd?: () => void;
  fallbackEmoji?: string;
}

export function ProductCard({
  id,
  name,
  description,
  price,
  promoPrice,
  imageUrl,
  rating = 0,
  ratingCount = 0,
  isFavorite,
  onFavorite,
  onAdd,
  fallbackEmoji = '🍕',
}: ProductCardProps) {
  const hasPromo = promoPrice && promoPrice < price;
  const displayPrice = hasPromo ? promoPrice : price;
  const discountPercent = hasPromo ? Math.round(((price - promoPrice!) / price) * 100) : 0;

  return (
    <Link to={`/app/product/${id}`} className="product-card group">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="product-card-image transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
            <span className="text-4xl">{fallbackEmoji}</span>
          </div>
        )}
        
        {hasPromo && (
          <div className="badge-promo absolute top-2.5 left-2.5 shadow-md">
            -{discountPercent}%
          </div>
        )}
        
        {onFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onFavorite();
            }}
            className={cn(
              'absolute top-2.5 right-2.5 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90',
              isFavorite
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-white/90 backdrop-blur-sm text-muted-foreground hover:bg-white hover:text-red-500'
            )}
          >
            <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
          </button>
        )}
      </div>
      
      <div className="p-3.5">
        <h3 className="font-semibold text-foreground line-clamp-1 text-[15px]">{name}</h3>
        
        {description && (
          <p className="text-sm text-muted-foreground/80 line-clamp-2 mt-1 leading-snug">{description}</p>
        )}
        
        <div className="flex items-center gap-1 mt-2.5">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-sm font-medium">{rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground/70">({ratingCount})</span>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <div className="flex flex-col">
            {hasPromo && (
              <span className="text-xs text-muted-foreground/60 line-through">
                R${price.toFixed(2).replace('.', ',')}
              </span>
            )}
            <span className={cn(
              "font-bold text-primary",
              hasPromo ? "text-base" : "text-lg"
            )}>
              R${displayPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
          
          {onAdd && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAdd();
              }}
              className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white shadow-md hover:shadow-lg active:scale-95 transition-all duration-150"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
