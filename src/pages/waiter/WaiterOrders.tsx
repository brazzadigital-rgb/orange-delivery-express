import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChefHat, PartyPopper, UtensilsCrossed, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useTableOrders, useUpdateKitchenStatus } from '@/hooks/useTableOrders';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useState } from 'react';

const kitchenTabs = [
  { id: 'received', label: 'Novos', icon: Clock, color: 'text-amber-500' },
  { id: 'preparing', label: 'Preparo', icon: ChefHat, color: 'text-purple-500' },
  { id: 'ready', label: 'Prontos', icon: PartyPopper, color: 'text-green-500' },
  { id: 'served', label: 'Servidos', icon: UtensilsCrossed, color: 'text-emerald-500' },
];

export default function WaiterOrders() {
  const { data: orders, isLoading, refetch } = useTableOrders();
  const updateKitchen = useUpdateKitchenStatus();
  const [activeTab, setActiveTab] = useState('received');

  useEffect(() => {
    const channel = supabase
      .channel('waiter-orders-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const filtered = orders?.filter((o: any) => o.kitchen_status === activeTab) || [];
  const counts: Record<string, number> = {};
  kitchenTabs.forEach(t => {
    counts[t.id] = orders?.filter((o: any) => o.kitchen_status === t.id).length || 0;
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await updateKitchen.mutateAsync({ orderId, kitchenStatus: newStatus });
    toast.success(`Status atualizado: ${kitchenTabs.find(t => t.id === newStatus)?.label}`);
  };

  if (isLoading) return <div className="p-6"><LoadingSpinner /></div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Pedidos de Mesa</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4 mb-4">
          {kitchenTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs gap-1">
                <Icon className={cn("w-4 h-4", tab.color)} />
                {tab.label}
                {counts[tab.id] > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-primary text-primary-foreground">
                    {counts[tab.id]}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum pedido</p>
          ) : (
            filtered.map((order: any) => (
              <div key={order.id} className="card-premium p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">#{order.order_number}</span>
                      {order.restaurant_tables && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          Mesa {order.restaurant_tables.number}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <span className="font-bold text-primary">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                </div>

                {/* Items */}
                <div className="text-sm text-muted-foreground mb-3 space-y-0.5">
                  {order.order_items?.map((item: any) => (
                    <p key={item.id}>{item.quantity}x {item.name_snapshot}</p>
                  ))}
                </div>

                {order.notes && (
                  <p className="text-xs italic text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 mb-3">
                    📝 {order.notes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  {activeTab === 'received' && (
                    <Button size="sm" onClick={() => handleStatusChange(order.id, 'preparing')}>
                      <ChefHat className="w-4 h-4 mr-1" /> Iniciar Preparo
                    </Button>
                  )}
                  {activeTab === 'preparing' && (
                    <Button size="sm" onClick={() => handleStatusChange(order.id, 'ready')}>
                      <PartyPopper className="w-4 h-4 mr-1" /> Marcar Pronto
                    </Button>
                  )}
                  {activeTab === 'ready' && (
                    <Button size="sm" onClick={() => handleStatusChange(order.id, 'served')}>
                      <UtensilsCrossed className="w-4 h-4 mr-1" /> Marcar Servido
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Tabs>
    </div>
  );
}
