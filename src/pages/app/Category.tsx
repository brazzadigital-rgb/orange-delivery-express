import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { PageHeader } from '@/components/common/PageHeader';
import { ProductCard } from '@/components/customer/ProductCard';
import { CategoryChip } from '@/components/customer/CategoryChip';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Pizza } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { showCartToast } from '@/components/common/CartToast';
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

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts(slug);
  const { addItem } = useCart();

  const currentCategory = categories?.find((c) => c.slug === slug);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Check if category is beverages (quick add enabled)
  const isBeverageCategory = slug === 'bebidas' || 
    currentCategory?.name?.toLowerCase().includes('bebida');

  const handleQuickAdd = (product: typeof products extends (infer T)[] ? T : never) => {
    if (!product) return;
    
    const imageUrl = productImages[product.name] || product.image_url;
    
    addItem({
      productId: product.id,
      name: product.name,
      basePrice: product.promo_price || product.base_price,
      quantity: 1,
      options: [],
      imageUrl: imageUrl || undefined,
    });
    
    showCartToast({
      productName: product.name,
      quantity: 1,
      imageUrl: imageUrl,
    });
  };

  const handleCategoryChange = (categorySlug: string) => {
    if (categorySlug !== slug) {
      setIsTransitioning(true);
      navigate(`/app/category/${categorySlug}`, { replace: true });
    }
  };

  // Scroll to active category chip
  useEffect(() => {
    if (scrollContainerRef.current && slug) {
      const activeChip = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeChip) {
        activeChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [slug]);

  // Reset transition state when products change
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setIsTransitioning(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, products]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title={currentCategory?.name || 'Categoria'} />

      {/* Category chips */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-sm border-b border-border/30 -mx-0 px-0">
        <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-hide py-3">
          <div className="flex gap-2 px-4">
          {categories?.map((category) => (
            <div key={category.id} data-active={category.slug === slug}>
              <CategoryChip
                icon={category.icon || '🍕'}
                imageUrl={category.image_url}
                label={category.name}
                active={category.slug === slug}
                onClick={() => handleCategoryChange(category.slug)}
              />
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="px-4 pb-8">
        {isLoading || isTransitioning ? (
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-[20px] overflow-hidden border border-border/30" style={{ boxShadow: 'var(--shadow-card)' }}>
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-5 w-20 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 pt-4 animate-fade-in">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description || undefined}
                price={product.base_price}
                promoPrice={product.promo_price}
                imageUrl={productImages[product.name] || product.image_url}
                rating={product.rating_avg}
                ratingCount={product.rating_count}
                onAdd={isBeverageCategory ? () => handleQuickAdd(product) : undefined}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Pizza className="w-10 h-10 text-muted-foreground" />}
            title="Nenhum produto encontrado"
            description="Esta categoria ainda não possui produtos."
          />
        )}
      </div>
    </div>
  );
}
