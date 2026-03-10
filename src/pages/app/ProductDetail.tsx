import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Heart, Minus, Plus, ChevronLeft, ShoppingCart } from 'lucide-react';
import { useProduct, useCategories } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { showCartToast } from '@/components/common/CartToast';
import { cn } from '@/lib/utils';
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

const sizes = [
  { id: 'p', label: 'Pequena', description: '4 fatias', priceDelta: 0 },
  { id: 'm', label: 'Média', description: '6 fatias', priceDelta: 10 },
  { id: 'g', label: 'Grande', description: '8 fatias', priceDelta: 20 },
];

const crusts = [
  { id: 'tradicional', label: 'Tradicional', priceDelta: 0 },
  { id: 'catupiry', label: 'Catupiry', priceDelta: 8 },
  { id: 'cheddar', label: 'Cheddar', priceDelta: 8 },
  { id: 'chocolate', label: 'Chocolate', priceDelta: 10 },
];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id!);
  const { addItem } = useCart();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { data: categories } = useCategories();

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(sizes[1]); // Default: Média
  const [selectedCrust, setSelectedCrust] = useState(crusts[0]); // Default: Tradicional
  
  const isProductFavorited = product ? isFavorited(product.id) : false;

  // Check if this product is a beverage (no pizza options needed)
  const productCategory = categories?.find(c => c.id === product?.category_id);
  const isBeverage = productCategory?.slug === 'bebidas' || 
                     productCategory?.name.toLowerCase().includes('bebida') ||
                     product?.name.toLowerCase().includes('coca') ||
                     product?.name.toLowerCase().includes('guaraná') ||
                     product?.name.toLowerCase().includes('fanta') ||
                     product?.name.toLowerCase().includes('sprite') ||
                     product?.name.toLowerCase().includes('pepsi') ||
                     product?.name.toLowerCase().includes('água') ||
                     product?.name.toLowerCase().includes('suco') ||
                     product?.name.toLowerCase().includes('refrigerante');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Produto não encontrado</p>
      </div>
    );
  }

  const basePrice = product.promo_price || product.base_price;
  const totalPrice = isBeverage 
    ? basePrice * quantity 
    : (basePrice + selectedSize.priceDelta + selectedCrust.priceDelta) * quantity;
  const imageUrl = productImages[product.name] || product.image_url;

  const handleAddToCart = () => {
    const options = isBeverage ? [] : [
      {
        optionId: 'size',
        optionName: 'Tamanho',
        itemId: selectedSize.id,
        itemLabel: selectedSize.label,
        priceDelta: selectedSize.priceDelta,
      },
      {
        optionId: 'crust',
        optionName: 'Borda',
        itemId: selectedCrust.id,
        itemLabel: selectedCrust.label,
        priceDelta: selectedCrust.priceDelta,
      },
    ];

    addItem({
      productId: product.id,
      name: product.name,
      basePrice: basePrice,
      quantity,
      options,
      imageUrl: imageUrl || undefined,
    });

    showCartToast({
      productName: product.name,
      quantity,
      imageUrl: imageUrl || null,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Image Header */}
      <div className="relative aspect-square bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
            <span className="text-8xl">🍕</span>
          </div>
        )}

        {/* Navigation */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => toggleFavorite(product.id)}
            className={cn(
              'w-10 h-10 rounded-full shadow-md flex items-center justify-center',
              isProductFavorited ? 'bg-destructive text-destructive-foreground' : 'bg-white'
            )}
          >
            <Heart className={cn('w-5 h-5', isProductFavorited && 'fill-current')} />
          </button>
        </div>

        {/* Promo badge */}
        {product.promo_price && (
          <div className="absolute top-4 left-16 px-3 py-1.5 rounded-full bg-destructive text-white text-sm font-semibold">
            -{Math.round(((product.base_price - product.promo_price) / product.base_price) * 100)}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-6">
        {/* Title & Rating */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{product.rating_avg.toFixed(1)}</span>
              <span className="text-muted-foreground">({product.rating_count} avaliações)</span>
            </div>
          </div>
          <div className="text-right">
            {product.promo_price && (
              <span className="text-sm text-muted-foreground line-through block">
                R$ {product.base_price.toFixed(2).replace('.', ',')}
              </span>
            )}
            <span className="text-2xl font-bold text-primary">
              R$ {basePrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-muted-foreground mb-6">{product.description}</p>

        {/* Size Selection - Only for non-beverages */}
        {!isBeverage && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Tamanho</h3>
            <div className="flex gap-3">
              {sizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    'flex-1 p-3 rounded-xl border-2 text-center transition-all',
                    selectedSize.id === size.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <p className="font-semibold">{size.label}</p>
                  <p className="text-xs text-muted-foreground">{size.description}</p>
                  {size.priceDelta > 0 && (
                    <p className="text-xs text-primary mt-1">+R$ {size.priceDelta.toFixed(2).replace('.', ',')}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Crust Selection - Only for non-beverages */}
        {!isBeverage && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Borda</h3>
            <div className="grid grid-cols-2 gap-3">
              {crusts.map((crust) => (
                <button
                  key={crust.id}
                  onClick={() => setSelectedCrust(crust)}
                  className={cn(
                    'p-3 rounded-xl border-2 text-left transition-all',
                    selectedCrust.id === crust.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <p className="font-medium">{crust.label}</p>
                  {crust.priceDelta > 0 && (
                    <p className="text-xs text-primary">+R$ {crust.priceDelta.toFixed(2).replace('.', ',')}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Quantidade</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 safe-area-bottom">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-primary">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <Button onClick={handleAddToCart} className="btn-primary h-14 px-8 text-base">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
