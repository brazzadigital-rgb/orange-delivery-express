import { useEffect, useMemo } from 'react';
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, AlertCircle, ShoppingBag, Check, ChefHat, Package, Truck, PartyPopper, CreditCard, Zap, Banknote } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useOrder, useOrderItems, useOrderEvents } from '@/hooks/useOrders';
import { ORDER_STATUS_LABELS, ORDER_STATUS_DESCRIPTIONS } from '@/lib/constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryTrackingMap } from '@/components/customer/DeliveryTrackingMap';
import { OrderDeliveredCelebration } from '@/components/customer/OrderDeliveredCelebration';
import { useQuery } from '@tanstack/react-query';

// Status icons mapping (iFood style)
const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  created: ShoppingBag,
  paid: CreditCard,
  accepted: Check,
  preparing: ChefHat,
  ready: Package,
  out_for_delivery: Truck,
  delivered: PartyPopper,
};

const fullStatusOrder = ['created', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
// Simplified flow for beverage-only orders (no preparing/ready)
const beverageStatusOrder = ['created', 'accepted', 'out_for_delivery', 'delivered'];

const BEVERAGE_STATUS_DESCRIPTIONS: Record<string, string> = {
  created: 'Aguardando a confirmação do restaurante',
  accepted: 'Pedido aceito pelo restaurante',
  out_for_delivery: 'Pedido está sendo entregue',
  delivered: 'Pedido foi entregue',
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading: orderLoading, refetch: refetchOrder } = useOrder(id!);
  const { data: items } = useOrderItems(id!);
  const { data: events, refetch: refetchEvents } = useOrderEvents(id!);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

  // Detect if this is a beverage-only order
  const productIds = useMemo(() => items?.map(i => i.product_id).filter(Boolean) || [], [items]);
  const { data: productCategories } = useQuery({
    queryKey: ['order-product-categories', id, productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data } = await supabase
        .from('products')
        .select('id, category_id, categories(slug, name)')
        .in('id', productIds as string[]);
      return data || [];
    },
    enabled: productIds.length > 0,
  });

  const isBeverageOnly = useMemo(() => {
    if (!items || items.length === 0) return false;
    // Items without product_id (e.g. custom pizzas) are NOT beverages
    const hasCustomItems = items.some(i => !i.product_id);
    if (hasCustomItems) return false;
    if (!productCategories || productCategories.length === 0) return false;
    // All products must belong to beverage categories
    return productCategories.every((p: any) => {
      const cat = p.categories;
      if (!cat) return false;
      return cat.slug === 'bebidas' || cat.name?.toLowerCase().includes('bebida');
    });
  }, [productCategories, items]);

  const statusOrder = isBeverageOnly ? beverageStatusOrder : fullStatusOrder;

  // Realtime subscription for order updates
  useEffect(() => {
    if (!id) return;
    
    const channel = supabase
      .channel(`customer-order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, (payload) => {
        refetchOrder();
        // Check if status changed to delivered
        if (payload.new && typeof payload.new === 'object' && 'status' in payload.new) {
          const newStatus = payload.new.status as string;
          if (newStatus === 'delivered' && previousStatus !== 'delivered') {
            setShowCelebration(true);
          }
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_events', filter: `order_id=eq.${id}` }, () => {
        refetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refetchOrder, refetchEvents, previousStatus]);

  // Track status changes to detect when it becomes delivered
  useEffect(() => {
    if (order?.status) {
      // Only show celebration if transitioning TO delivered (not on initial load if already delivered)
      if (order.status === 'delivered' && previousStatus && previousStatus !== 'delivered') {
        setShowCelebration(true);
      }
      setPreviousStatus(order.status);
    }
  }, [order?.status, previousStatus]);

  if (orderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Pedido não encontrado</p>
      </div>
    );
  }

  const currentStatusIndex = statusOrder.indexOf(order.status);
  const isDelivering = order.status === 'out_for_delivery';
  const isCompleted = order.status === 'delivered' || order.status === 'canceled';
  const isRejected = order.status === 'rejected';
  const isCanceled = order.status === 'canceled';

  return (
    <>
      {/* Celebration Overlay */}
      {showCelebration && order && (
        <OrderDeliveredCelebration 
          orderNumber={order.order_number} 
          onClose={() => setShowCelebration(false)}
        />
      )}

      <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title={`Pedido #${order.order_number}`}
        rightElement={<OrderStatusBadge status={order.status} />}
      />

      <div className="px-4 space-y-6">
        {/* Rejected/Canceled Alert */}
        {(isRejected || isCanceled) && (
          <div className="card-premium p-4 bg-destructive/10 border-destructive/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">
                  {isRejected ? 'Pedido Recusado' : 'Pedido Cancelado'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(order as any).reject_reason || (order as any).cancel_reason || 'Entre em contato com o suporte para mais informações.'}
                </p>
                <Link to="/app/support" className="text-sm text-primary font-medium mt-2 inline-block">
                  Falar com suporte →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Live Tracking Map - Shows automatically when out for delivery */}
        {isDelivering && (
          <DeliveryTrackingMap
            orderId={order.id}
            estimatedMinutes={order.estimated_minutes}
            addressSnapshot={order.address_snapshot}
          />
        )}

        {/* Status Timeline */}
        <section className="card-premium p-4">
          <h2 className="font-semibold mb-4">Status do Pedido</h2>
          <div className="space-y-0">
            {statusOrder.slice(0, -1).map((status, index) => {
              const isPast = index < currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const event = events?.find((e) => e.status === status);
              const StatusIcon = STATUS_ICONS[status] || ShoppingBag;

              return (
                <div 
                  key={status} 
                  className={cn(
                    "flex gap-4 transition-all duration-500",
                    isCurrent && "scale-[1.02]"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col items-center">
                    {/* Status Circle with Icon */}
                    <div className="relative">
                      {/* Pulse ring for current status */}
                      {isCurrent && (
                        <>
                          <div className="absolute inset-0 w-10 h-10 -m-1 rounded-full bg-primary/30 animate-ping" />
                          <div className="absolute inset-0 w-11 h-11 -m-1.5 rounded-full bg-primary/20 animate-pulse" />
                        </>
                      )}
                      <div
                        className={cn(
                          'relative w-8 h-8 rounded-full transition-all duration-300 flex items-center justify-center',
                          isPast && 'bg-primary',
                          isCurrent && 'bg-primary scale-110 shadow-lg shadow-primary/40',
                          !isPast && !isCurrent && 'bg-muted border-2 border-border'
                        )}
                      >
                        <StatusIcon 
                          className={cn(
                            "w-4 h-4 transition-all duration-300",
                            (isPast || isCurrent) ? "text-primary-foreground" : "text-muted-foreground",
                            isCurrent && "animate-pulse"
                          )} 
                        />
                      </div>
                    </div>
                    
                    {/* Connecting Line */}
                    {index < statusOrder.length - 2 && (
                      <div className="relative w-0.5 h-12 mt-1">
                        {/* Background line */}
                        <div className="absolute inset-0 bg-border" />
                        {/* Animated fill line */}
                        <div
                          className={cn(
                            'absolute top-0 left-0 w-full bg-primary transition-all duration-500 ease-out',
                            isPast ? 'h-full' : isCurrent ? 'h-1/2 animate-pulse' : 'h-0'
                          )}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 -mt-0.5 pb-6">
                    <p
                      className={cn(
                        'font-medium transition-all duration-300',
                        isPast && 'text-foreground',
                        isCurrent && 'text-primary font-semibold',
                        !isPast && !isCurrent && 'text-muted-foreground'
                      )}
                    >
                      {(isBeverageOnly ? BEVERAGE_STATUS_DESCRIPTIONS[status] : ORDER_STATUS_DESCRIPTIONS[status]) || ORDER_STATUS_LABELS[status]}
                    </p>
                    {event && (
                      <p className={cn(
                        "text-xs mt-0.5 transition-colors duration-300",
                        isCurrent ? "text-primary/70" : "text-muted-foreground"
                      )}>
                        {format(new Date(event.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Delivery Address */}
        {order.address_snapshot && (
          <section className="card-premium p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{order.address_snapshot.label}</p>
                <p className="text-sm text-muted-foreground">
                  {order.address_snapshot.street}, {order.address_snapshot.number}
                  {order.address_snapshot.complement && ` - ${order.address_snapshot.complement}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.address_snapshot.neighborhood}, {order.address_snapshot.city}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Order Items */}
        <section className="card-premium p-4">
          <h2 className="font-semibold mb-3">Itens do Pedido</h2>
          <div className="space-y-3">
            {items?.map((item) => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <p className="font-medium">{item.quantity}x {item.name_snapshot}</p>
                  {item.options_snapshot && Array.isArray(item.options_snapshot) && (
                    <p className="text-xs text-muted-foreground">
                      {item.options_snapshot.map((opt: any) => opt.itemLabel).join(' • ')}
                    </p>
                  )}
                </div>
                <span className="font-medium">
                  R$ {item.item_total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Summary */}
        <section className="card-premium p-4">
          <h2 className="font-semibold mb-3">Pagamento</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>R$ {order.subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            {/* Delivery fee with loyalty reward indication */}
            {(order as any).loyalty_reward_applied?.type === 'free_shipping' ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de entrega</span>
                <div className="flex items-center gap-2">
                  <span className="line-through text-muted-foreground">
                    R$ {((order as any).loyalty_reward_applied?.value || 0).toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-success font-medium">Grátis</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de entrega</span>
                <span>R$ {order.delivery_fee.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Desconto</span>
                <span>-R$ {order.discount.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            {/* Loyalty Points Used */}
            {(order as any).loyalty_points_spent > 0 && (
              <div className="flex justify-between items-center text-amber-600">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  Pontos usados
                </span>
                <span className="font-medium">
                  {(order as any).loyalty_points_spent} pts
                  {(order as any).loyalty_reward_applied?.type === 'free_shipping' && ' (Frete Grátis)'}
                  {(order as any).loyalty_reward_applied?.type === 'discount_amount' && ` (-R$ ${((order as any).loyalty_reward_applied?.value || 0).toFixed(2).replace('.', ',')})`}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">R$ {order.total.toFixed(2).replace('.', ',')}</span>
            </div>
          {/* Cash Change Information */}
          {order.payment_method === 'cash' && (order as any).cash_change_needed && (order as any).cash_change_amount > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Banknote className="w-4 h-4 text-primary" />
                <span className="font-medium">Troco</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Troco para</span>
                <span>R$ {((order as any).cash_change_for || 0).toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Você vai receber</span>
                <span className="font-semibold text-success">R$ {((order as any).cash_change_amount || 0).toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          )}
          </div>
        </section>
      </div>

      {/* Fixed Bottom - Help */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
        <Link to="/app/support">
          <Button variant="outline" className="w-full rounded-xl h-12">
            <Phone className="w-5 h-5 mr-2" />
            Precisa de ajuda?
          </Button>
        </Link>
      </div>
      </div>
    </>
  );
}
