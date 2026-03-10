import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavoritesWithProducts, useFavorites } from '@/hooks/useFavorites';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { showCartToast } from '@/components/common/CartToast';
import { cn } from '@/lib/utils';

// Product images mapping (same as Home)
import pizzaMargherita from '@/assets/pizza-margherita.jpg';
import pizzaPepperoni from '@/assets/pizza-pepperoni.jpg';
import pizzaQuatroQueijos from '@/assets/pizza-quatro-queijos.jpg';
import pizzaChocolate from '@/assets/pizza-chocolate.jpg';
import pizzaFileMignon from '@/assets/pizza-file-mignon.jpg';

const productImages: Record<string, string> = {
  'Margherita': pizzaMargherita,
  'Pepperoni': pizzaPepperoni,
  'Quatro Queijos': pizzaQuatroQueijos,
  'Chocolate com Morango': pizzaChocolate,
  'Filé Mignon ao Molho Madeira': pizzaFileMignon,
};

function FavoriteCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border/30 flex gap-4 animate-pulse">
      <Skeleton className="w-24 h-24 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  );
}

export default function Favorites() {
  const { user } = useAuth();
  const { data: favorites, isLoading } = useFavoritesWithProducts();
  const { toggleFavorite } = useFavorites();
  const { addItem } = useCart();

  // Not logged in state
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Favoritos" showBack={false} />
        <EmptyState
          icon={<Heart className="w-12 h-12 text-muted-foreground" />}
          title="Entre para ver seus favoritos"
          description="Faça login para salvar e visualizar seus produtos favoritos"
          action={
            <Link to="/auth/login">
              <Button className="btn-primary">Entrar</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Favoritos" showBack={false} />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <FavoriteCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!favorites || favorites.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Favoritos" showBack={false} />
        <EmptyState
          icon={<Heart className="w-12 h-12 text-muted-foreground" />}
          title="Nenhum favorito"
          description="Toque no coração dos produtos para salvá-los aqui"
          action={
            <Link to="/app/home">
              <Button className="btn-primary">Explorar cardápio</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const handleAddToCart = (fav: typeof favorites[0]) => {
    if (!fav.product || !fav.product.active) return;

    const product = fav.product;
    const finalPrice = product.promo_price && product.promo_price < product.base_price
      ? product.promo_price
      : product.base_price;

    addItem({
      productId: product.id,
      name: product.name,
      basePrice: finalPrice,
      quantity: 1,
      options: [],
      imageUrl: productImages[product.name] || product.image_url || undefined,
    });

    showCartToast({
      productName: product.name,
      quantity: 1,
      imageUrl: productImages[product.name] || product.image_url,
    });
  };

  const handleRemoveFavorite = (productId: string) => {
    toggleFavorite(productId);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Favoritos" showBack={false} />
      
      <div className="p-4 space-y-4">
        {favorites.map((fav) => {
          const product = fav.product;
          const isUnavailable = !product || !product.active;
          const imageUrl = product ? (productImages[product.name] || product.image_url) : null;
          const hasPromo = product && product.promo_price && product.promo_price < product.base_price;
          const displayPrice = hasPromo ? product.promo_price : product?.base_price;
          const discountPercent = hasPromo && product
            ? Math.round(((product.base_price - product.promo_price!) / product.base_price) * 100)
            : 0;

          return (
            <div
              key={fav.id}
              className={cn(
                "bg-card rounded-2xl p-4 border border-border/30 flex gap-4 relative overflow-hidden",
                isUnavailable && "opacity-60"
              )}
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              {/* Product Image */}
              <Link
                to={isUnavailable ? '#' : `/app/product/${fav.product_id}`}
                className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-muted"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product?.name || 'Produto'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                    <span className="text-3xl">🍕</span>
                  </div>
                )}
                
                {/* Promo badge */}
                {hasPromo && (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-destructive text-white text-[10px] font-semibold">
                    -{discountPercent}%
                  </div>
                )}
                
                {/* Unavailable overlay */}
                {isUnavailable && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Indisponível</span>
                  </div>
                )}
              </Link>

              {/* Product Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <Link
                    to={isUnavailable ? '#' : `/app/product/${fav.product_id}`}
                    className="block"
                  >
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {product?.name || 'Produto removido'}
                    </h3>
                    {product?.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {product.description}
                      </p>
                    )}
                  </Link>
                </div>

                <div className="flex items-end justify-between mt-2">
                  <div>
                    {hasPromo && product && (
                      <span className="text-xs text-muted-foreground line-through block">
                        R$ {product.base_price.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                    {displayPrice && (
                      <span className="text-lg font-bold text-primary">
                        R$ {displayPrice.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isUnavailable && (
                      <button
                        onClick={() => handleAddToCart(fav)}
                        className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md hover:shadow-lg active:scale-95 transition-all duration-150"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveFavorite(fav.product_id)}
                      className="w-9 h-9 rounded-xl bg-destructive flex items-center justify-center text-destructive-foreground shadow-md hover:shadow-lg active:scale-95 transition-all duration-150"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
