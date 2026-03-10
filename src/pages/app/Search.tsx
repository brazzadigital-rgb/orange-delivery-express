import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { CategoryChip } from '@/components/customer/CategoryChip';
import { ProductCard } from '@/components/customer/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
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

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-card rounded-[20px] overflow-hidden border border-border/30" style={{ boxShadow: 'var(--shadow-card)' }}>
          <Skeleton className="aspect-square w-full" />
          <div className="p-3.5 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-20 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts(selectedCategory || undefined);

  const filteredProducts = products?.filter((product) =>
    query
      ? product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase())
      : true
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl px-4 pt-4 pb-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
            <Input
              type="text"
              placeholder="Buscar pizza, bebida..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11 pr-10 input-modern h-12"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="overflow-x-auto scrollbar-hide px-4 py-3">
        <div className="flex gap-2.5">
          <CategoryChip
            label="Todas"
            active={!selectedCategory}
            onClick={() => setSelectedCategory(null)}
          />
          {categories?.map((category) => (
            <CategoryChip
              key={category.id}
              icon={category.icon || '🍕'}
              label={category.name}
              active={selectedCategory === category.slug}
              onClick={() => setSelectedCategory(category.slug)}
            />
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 pb-8">
        {isLoading ? (
          <ProductGridSkeleton />
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4 font-medium">
              {filteredProducts.length} resultado(s)
            </p>
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
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
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={<SearchIcon className="w-12 h-12 text-muted-foreground" />}
            title="Nenhum resultado"
            description={query ? `Nenhum produto encontrado para "${query}"` : 'Selecione uma categoria ou busque um produto'}
          />
        )}
      </div>
    </div>
  );
}
