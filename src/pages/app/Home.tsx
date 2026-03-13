import { useState, useEffect } from 'react';
import { VideoSplash } from '@/components/common/VideoSplash';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, ShoppingCart, ChevronRight, Truck } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { getStoreTypeConfig } from '@/lib/store-type-config';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useCategories, useFeaturedProducts, usePromoProducts, useBeverageProducts, Product } from '@/hooks/useProducts';
import { useActivePromotions } from '@/hooks/usePromotions';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { toast } from 'sonner';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { useStoreConfig } from '@/contexts/StoreConfigContext';
import { CategoryChip } from '@/components/customer/CategoryChip';
import { ProductCard } from '@/components/customer/ProductCard';
import { PromoBannerCarousel } from '@/components/customer/PromoBannerCarousel';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StoreStatusBadge } from '@/components/common/StoreStatusBadge';
import { ClosedStoreNotice } from '@/components/common/ClosedStoreNotice';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtime';
import { Skeleton } from '@/components/ui/skeleton';
import { PromotionCard } from '@/components/customer/PromotionCard';
import { BuilderCTA } from '@/components/home/BuilderCTA';
import { useEnabledHomeSections } from '@/hooks/useHomeSections';
import pizzaMargherita from '@/assets/pizza-margherita.jpg';
import pizzaPepperoni from '@/assets/pizza-pepperoni.jpg';
import pizzaQuatroQueijos from '@/assets/pizza-quatro-queijos.jpg';
import pizzaChocolate from '@/assets/pizza-chocolate.jpg';
import pizzaFileMignon from '@/assets/pizza-file-mignon.jpg';
import bgHome from '@/assets/bg-home.png';
 
 const productImages: Record<string, string> = {
   'Margherita': pizzaMargherita,
   'Pepperoni': pizzaPepperoni,
   'Quatro Queijos': pizzaQuatroQueijos,
   'Chocolate com Morango': pizzaChocolate,
   'Filé Mignon ao Molho Madeira': pizzaFileMignon,
 };
 
 function ProductCardSkeleton() {
   return (
     <div className="w-44 flex-shrink-0">
       <div className="bg-card rounded-[20px] overflow-hidden border border-border/30" style={{ boxShadow: 'var(--shadow-card)' }}>
         <Skeleton className="aspect-square w-full" />
         <div className="p-3 space-y-2">
           <Skeleton className="h-4 w-3/4" />
           <Skeleton className="h-3 w-1/2" />
           <Skeleton className="h-5 w-20 mt-2" />
         </div>
       </div>
     </div>
   );
 }
 
 function CategorySkeleton() {
   return (
     <>
       {[1, 2, 3, 4].map((i) => (
         <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
       ))}
     </>
   );
 }
 
 function formatDiscount(type: string, value: number) {
   switch (type) {
     case 'percent': return `${value}% OFF`;
    case 'value': return `Desconto de R$ ${value.toFixed(2).replace('.', ',')}`;
     case 'free_delivery': return 'Frete Grátis';
     case 'combo': return 'Combo';
     default: return value.toString();
   }
 }
 
export default function AppHome() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splash_seen');
  });
   const navigate = useNavigate();
   const { user } = useAuth();
    const { data: profile, isLoading: profileLoading } = useProfile();
    const { store } = useTenant();
    const storeTypeConfig = getStoreTypeConfig(store?.store_type);
   const { data: categories, isLoading: categoriesLoading } = useCategories();
   const { data: featuredProducts, isLoading: featuredLoading } = useFeaturedProducts();
  const { data: promoProducts, isLoading: promoLoading } = usePromoProducts();
  const { data: beverageProducts, isLoading: beveragesLoading } = useBeverageProducts();
   const { data: activePromotions, isLoading: promotionsLoading } = useActivePromotions();
    const { items, addItem } = useCart();
    const { isFavorited, toggleFavorite } = useFavorites();
   const { data: unreadCount } = useUnreadNotificationsCount();
   const { config, isLoading: configLoading } = useAppConfig();
   const { isStoreOpen, settings } = useStoreConfig();
   const { sections: enabledSections } = useEnabledHomeSections();

   const show = (key: string) => enabledSections.length === 0 || enabledSections.includes(key);

   useRealtimeNotifications();

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('splash_seen', 'true');
  };

  if (showSplash) {
    return <VideoSplash onComplete={handleSplashComplete} />;
  }
 
   const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
   const estimatedDelivery = settings?.sla_delivery_minutes || 45;
   const userName = profileLoading ? '' : (profile?.name || 'Cliente');
 
   function getGreeting() {
     const hour = new Date().getHours();
     if (hour < 12) return 'Bom dia';
     if (hour < 18) return 'Boa tarde';
     return 'Boa noite';
   }
 
  const greeting = getGreeting();

  // Quick add to cart function
  const handleQuickAdd = (product: Product) => {
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

    toast.success(
      <div className="flex items-center gap-3">
        {(productImages[product.name] || product.image_url) && (
          <img 
            src={productImages[product.name] || product.image_url!} 
            alt={product.name}
            className="w-10 h-10 rounded-lg object-cover"
          />
        )}
        <div>
          <p className="font-semibold text-sm">{product.name}</p>
          <p className="text-xs text-muted-foreground">Adicionado ao carrinho</p>
        </div>
      </div>,
      {
        duration: 2000,
        position: 'top-center',
      }
    );
  };
   return (
     <div className="pb-4">
       <ClosedStoreNotice variant="banner" />
       
        <header 
          className="relative text-white px-4 pb-8 rounded-b-[28px] overflow-hidden"
          style={{ 
            paddingTop: 'max(56px, calc(env(safe-area-inset-top, 24px) + 32px))',
            background: `linear-gradient(135deg, ${config?.gradient_start || 'hsl(var(--primary))'} 0%, ${config?.gradient_end || 'hsl(var(--primary))'} 100%)` 
          }}
         >
           {/* Background image overlay - use custom or fallback */}
           <div 
             className="absolute inset-0 pointer-events-none"
             style={{
                backgroundImage: `url(${config?.home_bg_image_url || bgHome})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: config?.home_bg_image_url ? 0.3 : 1,
             }}
           />
          <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
            {configLoading ? (
              <Skeleton className="h-10 w-28 bg-white/20 flex-shrink-0" />
            ) : config?.app_logo_url ? (
              <div className="relative flex-shrink min-w-0 max-w-[60%]">
                <div className="absolute inset-0 bg-white/25 rounded-xl blur-xl scale-110" />
                <img 
                  src={config.app_logo_url} 
                  alt={config?.app_name || 'App'} 
                  className="relative h-auto max-h-14 w-auto max-w-full object-contain drop-shadow-xl"
                />
              </div>
            ) : (
              <h1 className="text-xl font-bold tracking-tight truncate">{config?.app_name || ''}</h1>
            )}
            
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Link
                to="/app/notifications"
                className="relative w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all duration-150"
              >
                <Bell className="w-5 h-5" />
                {(unreadCount || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-white text-primary text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/app/cart"
                className="relative w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all duration-150"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-white text-primary text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
 
         <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-4 border border-white/10">
           {profileLoading ? (
             <>
               <Skeleton className="h-4 w-20 bg-white/20 mb-2" />
               <Skeleton className="h-7 w-40 bg-white/20" />
             </>
           ) : (
             <>
               <p className="text-white/70 text-sm">{greeting},</p>
               <h2 className="text-2xl font-bold tracking-tight">{userName}</h2>
             </>
           )}
           
           <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/15">
             <StoreStatusBadge variant="full" className="bg-white/15 border-white/20 text-white backdrop-blur-sm" />
             {isStoreOpen && (
               <div className="flex items-center gap-1.5 text-white/80 text-xs">
                 <Truck className="w-3.5 h-3.5" />
                 <span>Entrega ~{estimatedDelivery} min</span>
               </div>
             )}
           </div>
         </div>
 
          <Link
            to="/app/search"
            className="relative z-10 flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/10 hover:bg-white/20 active:scale-[0.99] transition-all duration-150"
          >
           <Search className="w-5 h-5 text-white/70" />
           <span className="text-white/70">O que você deseja?</span>
         </Link>
       </header>
 
       {show('banners') && (
         <div className="px-4 -mt-4">
           <PromoBannerCarousel />
         </div>
       )}
 
        {/* Builder CTA (pizza, combo, etc.) */}
        {(show('pizza_builder_cta') || show('combo_builder_cta')) && <BuilderCTA />}

        {show('categories') && (
         <section className="section-premium">
           <div className="section-header">
             <h2 className="section-title">Categorias</h2>
             <Link to="/app/search" className="section-link">Ver todas</Link>
           </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 px-4 pb-2">
              {categoriesLoading ? (
                <CategorySkeleton />
              ) : (
                categories?.map((category) => (
                  <CategoryChip
                    key={category.id}
                    icon={category.icon || '🍕'}
                    label={category.name}
                    onClick={() => navigate(`/app/category/${category.slug}`)}
                  />
                ))
              )}
            </div>
          </div>
        </section>
        )}
 
       {/* Active Promotions */}
       {show('promotions') && (promotionsLoading || (activePromotions && activePromotions.length > 0)) && (
          <section className="section-premium">
            <div className="section-header">
               <h2 className="section-title">🎉 Ofertas Especiais</h2>
            </div>
            {promotionsLoading ? (
              <div className="px-4">
                 <Skeleton className="h-40 w-80 rounded-3xl" />
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 px-4 pb-2">
                  {activePromotions?.map((promo) => (
                     <PromotionCard
                       key={promo.id}
                       title={promo.title}
                       description={promo.description}
                       discountLabel={formatDiscount(promo.discount_type, promo.discount_value ?? 0)}
                       bannerUrl={promo.banner_url}
                     />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
 
        {show('products') && (
         <section className="section-premium">
           <div className="section-header">
             <h2 className="section-title">{storeTypeConfig.sections.featured}</h2>
            <Link to="/app/search" className="section-link">Ver todas</Link>
          </div>
          {featuredLoading ? (
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 px-4 pb-2">
                {[1, 2, 3].map((i) => <ProductCardSkeleton key={i} />)}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 px-4 pb-2">
                   {featuredProducts?.slice(0, 6).map((product) => (
                   <div key={product.id} className="w-44 flex-shrink-0">
                     <ProductCard
                       id={product.id}
                       name={product.name}
                       description={product.description || undefined}
                       price={product.base_price}
                       promoPrice={product.promo_price}
                       imageUrl={productImages[product.name] || product.image_url}
                       rating={product.rating_avg}
                       ratingCount={product.rating_count}
                       isFavorite={isFavorited(product.id)}
                       onFavorite={() => toggleFavorite(product.id)}
                       fallbackEmoji={storeTypeConfig.productFallbackEmoji}
                     />
                   </div>
                 ))}
              </div>
            </div>
          )}
         </section>
        )}

         {show('promotions') && promoProducts && promoProducts.length > 0 && (
          <section className="section-premium">
            <div className="section-header">
              <h2 className="section-title">{storeTypeConfig.sections.promos}</h2>
              <Link to="/app/search" className="section-link">Ver todas</Link>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 px-4 pb-2">
                 {promoProducts?.map((product) => (
                   <div key={product.id} className="w-44 flex-shrink-0">
                     <ProductCard
                       id={product.id}
                       name={product.name}
                       description={product.description || undefined}
                       price={product.base_price}
                       promoPrice={product.promo_price}
                       imageUrl={productImages[product.name] || product.image_url}
                       rating={product.rating_avg}
                       ratingCount={product.rating_count}
                       isFavorite={isFavorited(product.id)}
                       onFavorite={() => toggleFavorite(product.id)}
                       fallbackEmoji={storeTypeConfig.productFallbackEmoji}
                     />
                   </div>
                 ))}
              </div>
            </div>
          </section>
        )}

        {/* Beverages Section */}
         {show('products') && (beveragesLoading || (beverageProducts && beverageProducts.length > 0)) && (
          <section className="section-premium">
            <div className="section-header">
              <h2 className="section-title">{storeTypeConfig.sections.beverages}</h2>
              <Link to="/app/category/bebidas" className="section-link">Ver todas</Link>
            </div>
            {beveragesLoading ? (
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-4 px-4 pb-2">
                  {[1, 2, 3].map((i) => <ProductCardSkeleton key={i} />)}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-4 px-4 pb-2">
                  {beverageProducts?.map((product) => (
                    <div key={product.id} className="w-44 flex-shrink-0">
                      <ProductCard
                        id={product.id}
                        name={product.name}
                        description={product.description || undefined}
                        price={product.base_price}
                        promoPrice={product.promo_price}
                        imageUrl={product.image_url}
                        rating={product.rating_avg}
                        ratingCount={product.rating_count}
                        isFavorite={isFavorited(product.id)}
                        onFavorite={() => toggleFavorite(product.id)}
                        onAdd={() => handleQuickAdd(product)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {show('products') && (
         <section className="section-premium px-4">
         <h2 className="section-title mb-4">{storeTypeConfig.sections.allProducts}</h2>
         {featuredLoading ? (
           <div className="grid grid-cols-2 gap-4">
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
         ) : (
           <div className="grid grid-cols-2 gap-4">
               {featuredProducts?.slice(0, 8).map((product) => (
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
                   isFavorite={isFavorited(product.id)}
                   onFavorite={() => toggleFavorite(product.id)}
                   fallbackEmoji={storeTypeConfig.productFallbackEmoji}
                 />
               ))}
           </div>
         )}
        </section>
        )}
     </div>
   );
 }