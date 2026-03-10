import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Power, Navigation, Clock, ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { 
  useDriverOrders, 
  useDriverStats, 
  useDriverStatus,
  useDriverOrdersRealtime 
} from '@/hooks/useDriverOrders';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DriverHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: orders, isLoading: ordersLoading } = useDriverOrders();
  const { data: stats } = useDriverStats();
  const { isOnline, toggleOnline } = useDriverStatus();
  
  // Enable realtime updates
  useDriverOrdersRealtime();

  const pendingDeliveries = orders?.filter(o => o.status === 'ready') || [];
  const activeDeliveries = orders?.filter(o => o.status === 'out_for_delivery') || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-hero text-white px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/80 text-sm">Olá, {profile?.name || 'Motoboy'}</p>
            <h1 className="text-xl font-bold">Bem-vindo!</h1>
          </div>
          <div className={cn(
            'flex items-center gap-3 rounded-full px-4 py-2 transition-colors',
            isOnline ? 'bg-white/20' : 'bg-destructive/30'
          )}>
            <span className="text-sm font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <Switch 
              checked={isOnline} 
              onCheckedChange={toggleOnline}
              className="data-[state=checked]:bg-white data-[state=checked]:text-primary"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/20 rounded-2xl p-4 text-center backdrop-blur-sm">
            <p className="text-3xl font-bold">{stats?.today || 0}</p>
            <p className="text-sm text-white/80">Entregas hoje</p>
          </div>
          <div className="bg-white/20 rounded-2xl p-4 text-center backdrop-blur-sm">
            <p className="text-3xl font-bold">{stats?.total || 0}</p>
            <p className="text-sm text-white/80">Total de entregas</p>
          </div>
        </div>
      </header>

      <div className="px-4 -mt-4 space-y-4 pb-8">
        {/* Active Delivery Card */}
        {activeDeliveries.length > 0 && (
          <div className="card-premium p-4 border-2 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <h2 className="font-semibold text-primary">Entrega em Andamento</h2>
            </div>
            
            {activeDeliveries.map((order) => (
              <button
                key={order.id}
                onClick={() => navigate(`/driver/navigation/${order.id}`)}
                className="w-full p-3 rounded-xl bg-card border border-border/50 text-left mb-2 last:mb-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-lg">Pedido #{order.order_number}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate max-w-[200px]">
                        {order.address_snapshot?.street}, {order.address_snapshot?.number}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" className="btn-primary">
                    <Navigation className="w-4 h-4 mr-1" />
                    Navegar
                  </Button>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Pending Deliveries */}
        {pendingDeliveries.length > 0 && (
          <div className="card-premium p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Prontos para Retirar ({pendingDeliveries.length})
            </h2>
            
            <div className="space-y-2">
              {pendingDeliveries.map((order) => (
                <button
                  key={order.id}
                  onClick={() => navigate(`/driver/orders/${order.id}`)}
                  className="w-full p-3 rounded-xl bg-muted/50 text-left flex items-center justify-between hover:bg-muted transition-colors"
                >
                  <div>
                    <span className="font-semibold">Pedido #{order.order_number}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatDistanceToNow(new Date(order.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!ordersLoading && (!orders || orders.length === 0) && (
          <div className="card-premium p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">
              {isOnline ? 'Aguardando entregas...' : 'Você está offline'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isOnline 
                ? 'Novas entregas aparecerão aqui automaticamente quando forem atribuídas a você.'
                : 'Fique online para receber novas entregas atribuídas pela pizzaria.'
              }
            </p>
            
            {!isOnline && (
              <Button onClick={toggleOnline} className="btn-primary mt-4">
                <Power className="w-4 h-4 mr-2" />
                Ficar Online
              </Button>
            )}
          </div>
        )}

        {ordersLoading && (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  );
}
