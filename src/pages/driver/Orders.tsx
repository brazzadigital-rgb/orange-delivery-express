import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Clock, ChevronRight, Navigation } from 'lucide-react';
import { useDriverOrders, useDriverOrdersRealtime } from '@/hooks/useDriverOrders';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function DriverOrders() {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useDriverOrders();
  
  // Enable realtime updates
  useDriverOrdersRealtime();

  const activeDeliveries = orders?.filter(o => o.status === 'out_for_delivery') || [];
  const pendingDeliveries = orders?.filter(o => o.status === 'ready') || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-4 bg-card border-b border-border">
        <h1 className="text-xl font-bold">Minhas Entregas</h1>
        <p className="text-sm text-muted-foreground">
          {orders?.length || 0} entrega{(orders?.length || 0) !== 1 && 's'} ativa{(orders?.length || 0) !== 1 && 's'}
        </p>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        ) : orders && orders.length > 0 ? (
          <>
            {/* Active Deliveries */}
            {activeDeliveries.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Em Rota ({activeDeliveries.length})
                </h2>
                <div className="space-y-3">
                  {activeDeliveries.map((order) => (
                    <div
                      key={order.id}
                      className="card-premium p-4 border-l-4 border-l-primary"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="font-bold text-lg">
                            Pedido #{order.order_number}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(order.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>

                      {order.address_snapshot && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 mb-3">
                          <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium">
                              {order.address_snapshot.street}, {order.address_snapshot.number}
                            </p>
                            <p className="text-muted-foreground">
                              {order.address_snapshot.neighborhood}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">
                          R$ {order.total.toFixed(2).replace('.', ',')}
                        </span>
                        <Button
                          className="btn-primary"
                          onClick={() => navigate(`/driver/navigation/${order.id}`)}
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Continuar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pending Deliveries */}
            {pendingDeliveries.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Prontos para Retirar ({pendingDeliveries.length})
                </h2>
                <div className="space-y-3">
                  {pendingDeliveries.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => navigate(`/driver/orders/${order.id}`)}
                      className="w-full card-premium p-4 text-left"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-bold">
                            Pedido #{order.order_number}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(order.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>

                      {order.address_snapshot && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">
                            {order.address_snapshot.street}, {order.address_snapshot.number} - {order.address_snapshot.neighborhood}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                        <span className="font-bold text-primary">
                          R$ {order.total.toFixed(2).replace('.', ',')}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="card-premium p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-lg font-semibold mb-2">Nenhuma entrega atribuída</h2>
            <p className="text-muted-foreground text-sm">
              Quando o estabelecimento atribuir entregas a você, elas aparecerão aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
