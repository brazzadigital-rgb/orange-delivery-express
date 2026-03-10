import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Check, ChefHat, Package, UtensilsCrossed, PartyPopper, Plus, Clock, AlertCircle, GlassWater, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Same design pattern as OrderDetail - status icons mapping
const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  created: ShoppingBag,
  accepted: Check,
  preparing: ChefHat,
  ready: Package,
  served: UtensilsCrossed,
  delivered: PartyPopper,
};

const TABLE_STATUS_ORDER = ['created', 'accepted', 'preparing', 'ready', 'served'];

// Beverage-only: simplified timeline
const BEVERAGE_STATUS_ORDER = ['created', 'accepted', 'served'];

const TABLE_STATUS_LABELS: Record<string, string> = {
  created: 'Pedido recebido pelo restaurante',
  accepted: 'Seu pedido foi aceito',
  preparing: 'Estamos preparando seu pedido com carinho',
  ready: 'Seu pedido está pronto!',
  served: 'Pedido servido na mesa. Bom apetite!',
};

const BEVERAGE_STATUS_LABELS: Record<string, string> = {
  created: 'Pedido recebido pelo restaurante',
  accepted: 'Pedido aceito pelo restaurante',
  served: 'Pedido servido na mesa. Bom apetite!',
};

interface OrderData {
  id: string;
  order_number: number;
  status: string;
  kitchen_status: string | null;
  total: number;
  subtotal: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItemData {
  id: string;
  name_snapshot: string;
  quantity: number;
  item_total: number;
  options_snapshot: any;
  product_id: string | null;
}

export default function TableOrderStatus() {
  const { token, orderId } = useParams<{ token: string; orderId: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [items, setItems] = useState<OrderItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReadyAlert, setShowReadyAlert] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const [isBeverageOnly, setIsBeverageOnly] = useState(false);

  // Fetch order and items directly (no auth required - RLS allows table orders)
  const fetchOrder = async () => {
    if (!orderId) return;
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, status, kitchen_status, total, subtotal, notes, created_at, updated_at, reject_reason')
      .eq('id', orderId)
      .eq('delivery_type', 'table')
      .maybeSingle();

    if (!error && data) {
      setOrder(data as unknown as OrderData);
    }
    setIsLoading(false);
  };

  const fetchItems = async () => {
    if (!orderId) return;
    const { data } = await supabase
      .from('order_items')
      .select('id, name_snapshot, quantity, item_total, options_snapshot, product_id')
      .eq('order_id', orderId);
    if (data) {
      setItems(data as OrderItemData[]);
      // Check if all items are beverages
      checkBeverageOnly(data as OrderItemData[]);
    }
  };

  const checkBeverageOnly = async (orderItems: OrderItemData[]) => {
    if (orderItems.length === 0) return;
    
    const productIds = orderItems
      .map(i => i.product_id)
      .filter(Boolean) as string[];
    
    if (productIds.length === 0) return;

    const { data: products } = await supabase
      .from('products')
      .select('id, category_id')
      .in('id', productIds);

    if (!products || products.length === 0) return;

    const categoryIds = [...new Set(products.map(p => p.category_id).filter(Boolean))];
    
    const { data: categories } = await supabase
      .from('categories')
      .select('id, slug, name')
      .in('id', categoryIds as string[]);

    if (!categories) return;

    // Check if ALL categories are beverages
    const allBeverage = categories.every(c =>
      c.slug?.toLowerCase().includes('bebida') ||
      c.slug?.toLowerCase().includes('drink') ||
      c.name?.toLowerCase().includes('bebida') ||
      c.name?.toLowerCase().includes('drink')
    );

    setIsBeverageOnly(allBeverage);
  };

  // Initial fetch
  useEffect(() => {
    fetchOrder();
    fetchItems();
  }, [orderId]);

  // Realtime subscription + polling fallback
  useEffect(() => {
    if (!orderId) return;
    let pollInterval = 3000;
    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (!isActive) return;
      await fetchOrder();
      if (isActive) {
        pollInterval = Math.min(pollInterval * 1.3, 15000);
        timeoutId = setTimeout(poll, pollInterval);
      }
    };

    const channel = supabase
      .channel(`table-order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        () => {
          fetchOrder();
          pollInterval = 3000; // Reset on realtime update
        }
      )
      .subscribe();

    // Start polling as fallback
    timeoutId = setTimeout(poll, pollInterval);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Detect status changes for alerts
  useEffect(() => {
    if (!order) return;
    const effectiveStatus = mapKitchenToOrderStatus(order, isBeverageOnly);

    if (effectiveStatus === 'ready' && previousStatus && previousStatus !== 'ready' && !isBeverageOnly) {
      setShowReadyAlert(true);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
      try {
        const audio = new Audio('/sounds/bell.mp3');
        audio.play().catch(() => {});
      } catch {}
    }

    // For beverages, alert when served
    if (isBeverageOnly && effectiveStatus === 'served' && previousStatus && previousStatus !== 'served') {
      setShowReadyAlert(true);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
      try {
        const audio = new Audio('/sounds/bell.mp3');
        audio.play().catch(() => {});
      } catch {}
    }

    setPreviousStatus(effectiveStatus);
  }, [order?.status, order?.kitchen_status, isBeverageOnly]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <p className="text-muted-foreground">Pedido não encontrado</p>
      </div>
    );
  }

  const effectiveStatus = mapKitchenToOrderStatus(order, isBeverageOnly);
  const isRejectedOrCanceled = order.status === 'rejected' || order.status === 'canceled';
  const statusOrder = isBeverageOnly ? BEVERAGE_STATUS_ORDER : TABLE_STATUS_ORDER;
  const statusLabels = isBeverageOnly ? BEVERAGE_STATUS_LABELS : TABLE_STATUS_LABELS;
  const currentStatusIndex = statusOrder.indexOf(effectiveStatus);
  const isServed = effectiveStatus === 'served';

  return (
    <>
      {/* Ready Alert Overlay */}
      {showReadyAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowReadyAlert(false)}>
          <div className="bg-background rounded-2xl p-8 text-center max-w-sm mx-4 animate-in zoom-in-95">
            <PartyPopper className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {isBeverageOnly ? 'Suas bebidas chegaram!' : 'Seu pedido está pronto!'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isBeverageOnly ? 'Suas bebidas foram servidas na mesa.' : 'Aguarde o garçom servir na sua mesa.'}
            </p>
            <Button onClick={() => setShowReadyAlert(false)}>Entendi!</Button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-background pb-24">
        {/* Header - same style as OrderDetail */}
        <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex-1">
            <h1 className="font-semibold text-lg">Pedido #{order.order_number}</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <OrderStatusBadge status={effectiveStatus} />
        </div>

        <div className="px-4 space-y-6 mt-4">
          {/* Rejected / Canceled Alert */}
          {isRejectedOrCanceled && (
            <div className="flex items-center gap-3 px-4 py-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <XCircle className="w-8 h-8 text-destructive flex-shrink-0" />
              <div>
                <p className="font-bold text-destructive">
                  {order.status === 'rejected' ? 'Pedido Recusado' : 'Pedido Cancelado'}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {order.status === 'rejected'
                    ? 'Infelizmente o restaurante não pôde aceitar seu pedido. Tente novamente ou chame um atendente.'
                    : 'Este pedido foi cancelado.'}
                </p>
                {(order as any).reject_reason && (
                  <p className="text-sm mt-1">Motivo: {(order as any).reject_reason}</p>
                )}
              </div>
            </div>
          )}

          {/* Beverage indicator */}
          {isBeverageOnly && !isRejectedOrCanceled && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <GlassWater className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Pedido de bebidas</span>
            </div>
          )}

          {/* Status Timeline - hide if rejected/canceled */}
          {!isRejectedOrCanceled && (
            <section className="card-premium p-4">
              <h2 className="font-semibold mb-4">Status do Pedido</h2>
              <div className="space-y-0">
                {statusOrder.map((status, index) => {
                  const isPast = index < currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
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
                        <div className="relative">
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
                        {index < statusOrder.length - 1 && (
                          <div className="relative w-0.5 h-12 mt-1">
                            <div className="absolute inset-0 bg-border" />
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
                          {statusLabels[status] || status}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Order Items */}
          <section className="card-premium p-4">
            <h2 className="font-semibold mb-3">Itens do Pedido</h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.quantity}x {item.name_snapshot}</p>
                    {item.options_snapshot && Array.isArray(item.options_snapshot) && item.options_snapshot.length > 0 && (
                      <ul className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                        {item.options_snapshot
                          .filter((opt: any) => opt.optionName !== 'Tamanho' && opt.optionName !== 'Sabor')
                          .map((opt: any, idx: number) => (
                            <li key={idx}>• {opt.optionName}: {opt.itemLabel} {opt.priceDelta > 0 && `(+R$ ${opt.priceDelta.toFixed(2).replace('.', ',')})`}</li>
                          ))}
                      </ul>
                    )}
                  </div>
                  <span className="font-medium">
                    R$ {item.item_total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between font-bold text-lg pt-3 mt-3 border-t border-border">
              <span>Total</span>
              <span className="text-primary">R$ {order.total.toFixed(2).replace('.', ',')}</span>
            </div>
          </section>

          {/* Notes */}
          {order.notes && (
            <section className="card-premium p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Observações</p>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
              </div>
            </section>
          )}

          {/* New Order Button */}
          <Link to={`/t/${token}`}>
            <Button className="w-full rounded-xl h-12" variant="outline" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Fazer Novo Pedido
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}

/** Maps kitchen_status and order status to a unified status for the timeline */
function mapKitchenToOrderStatus(order: OrderData, isBeverageOnly: boolean): string {
  const ks = order.kitchen_status;

  if (isBeverageOnly) {
    // Beverage: skip preparing/ready, go straight to served
    if (ks === 'served' || order.status === 'delivered') return 'served';
    if (ks === 'ready' || ks === 'preparing' || order.status === 'accepted' || order.status === 'preparing' || order.status === 'ready') return 'accepted';
    return 'created';
  }

  // Standard table order
  if (ks === 'served') return 'served';
  if (ks === 'ready') return 'ready';
  if (ks === 'preparing') return 'preparing';

  if (order.status === 'accepted') return 'accepted';
  if (order.status === 'preparing') return 'preparing';
  if (order.status === 'ready') return 'ready';
  if (order.status === 'delivered') return 'served';

  return 'created';
}
