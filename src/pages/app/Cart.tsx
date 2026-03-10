import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useStoreConfig } from '@/contexts/StoreConfigContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import pizzaMargherita from '@/assets/pizza-margherita.jpg';
import pizzaPepperoni from '@/assets/pizza-pepperoni.jpg';
import pizzaQuatroQueijos from '@/assets/pizza-quatro-queijos.jpg';
import pizzaChocolate from '@/assets/pizza-chocolate.jpg';
import pizzaFileMignon from '@/assets/pizza-file-mignon.jpg';

interface BeverageProduct {
  id: string;
  name: string;
  base_price: number;
  promo_price: number | null;
  image_url: string | null;
}

const productImages: Record<string, string> = {
  'Margherita': pizzaMargherita,
  'Pepperoni': pizzaPepperoni,
  'Quatro Queijos': pizzaQuatroQueijos,
  'Chocolate com Morango': pizzaChocolate,
  'Filé Mignon ao Molho Madeira': pizzaFileMignon,
};

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const storeId = useStoreId();
  const { items, removeItem, updateQuantity, getTotal, getItemTotal } = useCart();
  const { isStoreOpen, nextOpenTime, settings } = useStoreConfig();

  // Fetch beverages for "Compre Junto" section
  const { data: beverages = [] } = useQuery({
    queryKey: ['beverages-upsell', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, base_price, promo_price, image_url, categories!inner(slug)')
        .eq('store_id', storeId)
        .eq('active', true)
        .eq('categories.slug', 'bebidas')
        .limit(4);
      
      if (error) throw error;
      return data as BeverageProduct[];
    },
  });

  // Fetch desserts for upsell section
  const { data: desserts = [] } = useQuery({
    queryKey: ['desserts-upsell', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, base_price, promo_price, image_url, categories!inner(slug)')
        .eq('store_id', storeId)
        .eq('active', true)
        .eq('categories.slug', 'sobremesas')
        .limit(4);
      
      if (error) throw error;
      return data as BeverageProduct[];
    },
  });

  // Check if cart already has a beverage
  const hasBeverageInCart = items.some(item => 
    item.name.toLowerCase().includes('coca') ||
    item.name.toLowerCase().includes('guaraná') ||
    item.name.toLowerCase().includes('fanta') ||
    item.name.toLowerCase().includes('sprite') ||
    item.name.toLowerCase().includes('suco') ||
    item.name.toLowerCase().includes('água') ||
    item.name.toLowerCase().includes('refrigerante')
  );

  const handleAddBeverage = (beverage: BeverageProduct) => {
    const price = beverage.promo_price || beverage.base_price;
    // Navigate to product detail for this beverage
    navigate(`/app/product/${beverage.id}`);
  };

  const total = getTotal();
  const deliveryFee = 8.00;
  const finalTotal = total + deliveryFee;
  const closedMessage = settings?.closed_message || 'Estamos fechados no momento.';

  const handleCheckout = () => {
    if (!isStoreOpen) {
      return; // Can't checkout when closed
    }
    if (!user) {
      navigate('/auth/login');
      return;
    }
    navigate('/app/checkout/address');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Carrinho" />
        <EmptyState
          icon={<ShoppingBag className="w-10 h-10 text-muted-foreground" />}
          title="Seu carrinho está vazio"
          description="Adicione produtos deliciosos do nosso cardápio"
          action={
            <Link to="/app/home">
              <Button className="btn-primary">Ver cardápio</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      <PageHeader title="Carrinho" />

      <div className="px-4 pb-4 space-y-4">
        {/* Cart Items */}
        <div className="space-y-3">
          {items.map((item) => {
            const imageUrl = productImages[item.name] || item.imageUrl;
            const itemTotal = getItemTotal(item);

            return (
              <div key={item.id} className="card-premium p-4 animate-fade-in">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                    {imageUrl ? (
                      <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl">🍕</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate text-[15px]">{item.name}</h3>
                    {item.options.length > 0 && (
                      <div className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">
                        {item.options.map((opt) => opt.itemLabel).join(' • ')}
                      </div>
                    )}
                    <p className="text-primary font-bold mt-2 text-base">
                      R${itemTotal.toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-all duration-150"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-end mt-3 pt-3 border-t border-border/30">
                  <div className="qty-stepper">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="qty-btn"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="qty-btn"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compre Junto - Beverages Upsell */}
        {!hasBeverageInCart && beverages.length > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 via-accent/10 to-secondary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Compre Junto</p>
                <p className="text-xs text-muted-foreground">Adicione uma bebida ao seu pedido</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {beverages.slice(0, 4).map((beverage) => {
                const price = beverage.promo_price || beverage.base_price;
                return (
                  <button
                    key={beverage.id}
                    onClick={() => handleAddBeverage(beverage)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-background/80 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-left group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {beverage.image_url ? (
                        <img src={beverage.image_url} alt={beverage.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">🥤</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                        {beverage.name}
                      </p>
                      <p className="text-xs font-bold text-primary">
                        R$ {price.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Ver todas as bebidas */}
            <button
              onClick={() => navigate('/app/category/bebidas')}
              className="w-full mt-3 py-2.5 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
            >
              Ver todas as bebidas
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dessert Upsell - Show dessert products */}
        {desserts.length > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-accent/60 via-accent/40 to-secondary/20 border border-accent">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <span className="text-lg">🍰</span>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Que tal uma sobremesa?</p>
                <p className="text-xs text-muted-foreground">Finalize com algo doce</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {desserts.slice(0, 4).map((dessert) => {
                const price = dessert.promo_price || dessert.base_price;
                return (
                  <button
                    key={dessert.id}
                    onClick={() => navigate(`/app/product/${dessert.id}`)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-background/80 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-left group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {dessert.image_url ? (
                        <img src={dessert.image_url} alt={dessert.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">🍫</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                        {dessert.name}
                      </p>
                      <p className="text-xs font-bold text-primary">
                        R$ {price.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Ver todas as sobremesas */}
            <button
              onClick={() => navigate('/app/category/sobremesas')}
              className="w-full mt-3 py-2.5 px-4 rounded-xl bg-accent hover:bg-accent/80 text-accent-foreground text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
            >
              Ver todas as sobremesas
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Fixed Bottom */}
      <div className="bottom-bar-premium p-4">
        {/* Store Closed Warning */}
        {!isStoreOpen && (
          <div className="mb-4 p-4 rounded-2xl bg-destructive/5 border border-destructive/15 flex items-start gap-3">
            <div className="icon-container bg-destructive/10 text-destructive flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-destructive">Loja Fechada</p>
              <p className="text-xs text-muted-foreground mt-1">
                {closedMessage}
                {nextOpenTime && ` Abrimos às ${nextOpenTime}.`}
              </p>
            </div>
          </div>
        )}
        
        {/* Summary */}
        <div className="space-y-2.5 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">R$ {total.toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxa de entrega</span>
            <span className="font-medium">R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="flex justify-between items-center font-bold text-lg pt-3 border-t border-border/40">
            <span>Total</span>
            <span className="text-primary text-xl">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <Button 
          onClick={handleCheckout} 
          className="w-full btn-primary h-14 text-base"
          disabled={!isStoreOpen}
        >
          {isStoreOpen ? (
            <>
              Ir para pagamento
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          ) : (
            <>
              <Clock className="w-5 h-5 mr-2" />
              Loja fechada
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
