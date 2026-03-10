import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight, Clock, Package } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useOrders } from '@/hooks/useOrders';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function OrderSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card-premium p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border/30">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Orders() {
  const { data: orders, isLoading } = useOrders();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Meus Pedidos" showBack={false} />

      <div className="px-4 pb-8">
        {isLoading ? (
          <OrderSkeleton />
        ) : orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order, index) => (
              <Link
                key={order.id}
                to={`/app/orders/${order.id}`}
                className="card-premium p-4 block animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="icon-container icon-container-primary w-9 h-9">
                        <Package className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-[15px]">Pedido #{order.order_number}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2 ml-11">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDistanceToNow(new Date(order.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                  <span className="text-lg font-bold text-primary">
                    R$ {order.total.toFixed(2).replace('.', ',')}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ShoppingBag className="w-12 h-12 text-muted-foreground" />}
            title="Nenhum pedido ainda"
            description="Faça seu primeiro pedido e acompanhe tudo por aqui!"
            action={
              <Link to="/app/home">
                <Button className="btn-primary">Ver cardápio</Button>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
