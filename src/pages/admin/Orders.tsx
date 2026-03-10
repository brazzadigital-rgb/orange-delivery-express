import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Clock, Check, Truck, X, RefreshCw, ChefHat, Package, Eye, UserCheck, Filter, Smartphone, Store, Printer, Replace, GlassWater } from 'lucide-react';
import { useAdminOrders } from '@/hooks/useAdmin';
import { useUpdateOrderStatus, useAssignDriver } from '@/hooks/useOrderActions';
import { useAdminDrivers } from '@/hooks/useAdmin';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { OrderChannelBadge } from '@/components/common/OrderChannelBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useIFoodOrderAction } from '@/hooks/useIFoodIntegration';
import { PrintActions } from '@/components/print/PrintActions';
import { useBeverageCategoryIds } from '@/hooks/useBeverageDetection';

import { LayoutGrid } from 'lucide-react';

const statusTabs = [
  { id: 'active', label: 'Todos Ativos', icon: LayoutGrid, color: 'text-primary' },
  { id: 'created', label: 'Novos', icon: ShoppingBag, color: 'text-amber-500' },
  { id: 'accepted', label: 'Aceitos', icon: Check, color: 'text-blue-500' },
  { id: 'preparing', label: 'Preparando', icon: ChefHat, color: 'text-purple-500' },
  { id: 'ready', label: 'Prontos', icon: Package, color: 'text-green-500' },
  { id: 'out_for_delivery', label: 'Em Rota', icon: Truck, color: 'text-orange-500' },
  { id: 'finished', label: 'Finalizados', icon: Check, color: 'text-emerald-500' },
];

export default function AdminOrders() {
  const [activeTab, setActiveTab] = useState('active');
  const [channelFilter, setChannelFilter] = useState<'all' | 'internal' | 'ifood'>('all');
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; orderId: string | null }>({ open: false, orderId: null });
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; orderId: string | null; isIfood: boolean }>({ open: false, orderId: null, isIfood: false });
  const [driverDialog, setDriverDialog] = useState<{ open: boolean; orderId: string | null }>({ open: false, orderId: null });
  const [reassignDialog, setReassignDialog] = useState<{ open: boolean; orderId: string | null; currentDriverId: string | null }>({ open: false, orderId: null, currentDriverId: null });
  const [reason, setReason] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  
  const { data: allOrders, isLoading, refetch } = useAdminOrders();
  const { data: drivers } = useAdminDrivers();
  const updateStatus = useUpdateOrderStatus();
  const assignDriver = useAssignDriver();
  const ifoodAction = useIFoodOrderAction();
  const { data: beverageCatIds } = useBeverageCategoryIds();

  // Build product→category map for beverage detection
  const [productCategoryMap, setProductCategoryMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!allOrders || !beverageCatIds || beverageCatIds.size === 0) return;
    // Collect all product IDs from table orders
    const productIds = new Set<string>();
    allOrders.forEach(o => {
      if (o.delivery_type === 'table' && o.order_items) {
        o.order_items.forEach(i => { if (i.product_id) productIds.add(i.product_id); });
      }
    });
    if (productIds.size === 0) return;
    supabase
      .from('products')
      .select('id, category_id')
      .in('id', Array.from(productIds))
      .then(({ data }) => {
        if (data) {
          const m = new Map<string, string>();
          data.forEach(p => { if (p.category_id) m.set(p.id, p.category_id); });
          setProductCategoryMap(m);
        }
      });
  }, [allOrders, beverageCatIds]);

  const isBeverageOnlyOrder = useCallback((order: typeof allOrders extends (infer T)[] ? T : never) => {
    if (order.delivery_type !== 'table' || !order.order_items || order.order_items.length === 0) return false;
    if (!beverageCatIds || beverageCatIds.size === 0 || productCategoryMap.size === 0) return false;
    return order.order_items.every(i => {
      if (!i.product_id) return false;
      const catId = productCategoryMap.get(i.product_id);
      return catId && beverageCatIds.has(catId);
    });
  }, [beverageCatIds, productCategoryMap]);

  // Subscribe to realtime updates for data refresh only
  // (sound and toast are handled globally by useAdminOrderAlerts in AdminLayout)
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Filter orders by tab and channel
  const getFilteredOrders = () => {
    if (!allOrders) return [];
    
    let filtered = allOrders;
    
    // Filter by channel
    if (channelFilter !== 'all') {
      filtered = filtered.filter(o => (o as any).channel === channelFilter);
    }

    // "Todos Ativos" – show all non-finished orders sorted by status priority
    if (activeTab === 'active') {
      const statusPriority: Record<string, number> = {
        created: 0, paid: 0, accepted: 1, preparing: 2, ready: 3, out_for_delivery: 4,
      };
      return filtered
        .filter(o => !['delivered', 'rejected', 'canceled'].includes(o.status))
        .sort((a, b) => (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99));
    }
    
    // Compatibility: some flows still set orders.status = 'paid' after payment.
    // Operationally, these should behave like new orders in the admin queue.
    if (activeTab === 'created') {
      return filtered.filter((o) => ['created', 'paid'].includes(o.status));
    }
    if (activeTab === 'finished') {
      return filtered.filter(o => ['delivered', 'rejected', 'canceled'].includes(o.status));
    }
    return filtered.filter(o => o.status === activeTab);
  };

  const orders = getFilteredOrders();

  // Count orders by channel
  const getChannelCounts = () => {
    if (!allOrders) return { all: 0, internal: 0, ifood: 0 };
    return {
      all: allOrders.length,
      internal: allOrders.filter(o => (o as any).channel !== 'ifood').length,
      ifood: allOrders.filter(o => (o as any).channel === 'ifood').length,
    };
  };

  const channelCounts = getChannelCounts();

  // Count orders per tab
  const getCounts = () => {
    if (!allOrders) return {};
    const activeCount = allOrders.filter(o => !['delivered', 'rejected', 'canceled'].includes(o.status)).length;
    return {
      active: activeCount,
      created: allOrders.filter(o => ['created', 'paid'].includes(o.status)).length,
      accepted: allOrders.filter(o => o.status === 'accepted').length,
      preparing: allOrders.filter(o => o.status === 'preparing').length,
      ready: allOrders.filter(o => o.status === 'ready').length,
      out_for_delivery: allOrders.filter(o => o.status === 'out_for_delivery').length,
      finished: allOrders.filter(o => ['delivered', 'rejected', 'canceled'].includes(o.status)).length,
    };
  };

  const counts = getCounts();

  const handleAccept = async (orderId: string) => {
    await updateStatus.mutateAsync({ orderId, newStatus: 'accepted' });
    toast.success('Pedido aceito!');
  };

  const handleReject = async () => {
    if (!rejectDialog.orderId) return;
    await updateStatus.mutateAsync({ 
      orderId: rejectDialog.orderId, 
      newStatus: 'rejected',
      rejectReason: reason 
    });
    toast.success('Pedido recusado');
    setRejectDialog({ open: false, orderId: null });
    setReason('');
  };

  const handleCancel = async () => {
    if (!cancelDialog.orderId) return;
    await updateStatus.mutateAsync({ 
      orderId: cancelDialog.orderId, 
      newStatus: 'canceled',
      cancelReason: reason 
    });
    toast.success('Pedido cancelado');
    setCancelDialog({ open: false, orderId: null, isIfood: false });
    setReason('');
  };

  const handleStartPreparing = async (orderId: string) => {
    await updateStatus.mutateAsync({ orderId, newStatus: 'preparing' });
    toast.success('Preparo iniciado!');
  };

  const handleMarkReady = async (orderId: string) => {
    await updateStatus.mutateAsync({ orderId, newStatus: 'ready' });
    toast.success('Pedido pronto!');
  };

  const handleDispatch = async (orderId: string, driverId?: string | null) => {
    if (!driverId) {
      setDriverDialog({ open: true, orderId });
      return;
    }
    await updateStatus.mutateAsync({ orderId, newStatus: 'out_for_delivery' });
    toast.success('Pedido despachado!');
  };

  const handleAssignAndDispatch = async () => {
    if (!driverDialog.orderId || !selectedDriver) return;
    await assignDriver.mutateAsync({ orderId: driverDialog.orderId, driverId: selectedDriver });
    await updateStatus.mutateAsync({ orderId: driverDialog.orderId, newStatus: 'out_for_delivery' });
    toast.success('Motoboy atribuído e pedido despachado!');
    setDriverDialog({ open: false, orderId: null });
    setSelectedDriver('');
  };

  const handleReassignDriver = async () => {
    if (!reassignDialog.orderId || !selectedDriver) return;
    await assignDriver.mutateAsync({ orderId: reassignDialog.orderId, driverId: selectedDriver });
    toast.success('Motoboy reatribuído com sucesso!');
    setReassignDialog({ open: false, orderId: null, currentDriverId: null });
    setSelectedDriver('');
  };

  const handleMarkDelivered = async (orderId: string) => {
    await updateStatus.mutateAsync({ orderId, newStatus: 'delivered' });
    toast.success('Pedido entregue!');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">Gerencie os pedidos em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Channel Filter */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              size="sm"
              variant={channelFilter === 'all' ? 'default' : 'ghost'}
              onClick={() => setChannelFilter('all')}
              className="h-8"
            >
              <Filter className="w-4 h-4 mr-1" />
              Todos ({channelCounts.all})
            </Button>
            <Button
              size="sm"
              variant={channelFilter === 'internal' ? 'default' : 'ghost'}
              onClick={() => setChannelFilter('internal')}
              className="h-8"
            >
              <Store className="w-4 h-4 mr-1" />
              Interno ({channelCounts.internal})
            </Button>
            <Button
              size="sm"
              variant={channelFilter === 'ifood' ? 'default' : 'ghost'}
              onClick={() => setChannelFilter('ifood')}
              className="h-8"
            >
              <Smartphone className="w-4 h-4 mr-1" />
              iFood ({channelCounts.ifood})
            </Button>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl mb-6">
          {statusTabs.map((tab) => {
            const count = counts[tab.id as keyof typeof counts] || 0;
            const Icon = tab.icon;
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className={cn(
                  "flex-1 min-w-[100px] gap-2 data-[state=active]:bg-background",
                  count > 0 && tab.id === 'created' && "animate-pulse"
                )}
              >
                <Icon className={cn("w-4 h-4", tab.color)} />
                <span className="hidden sm:inline">{tab.label}</span>
                {count > 0 && (
                  <span className={cn(
                    "ml-1 px-2 py-0.5 rounded-full text-xs font-bold",
                    tab.id === 'created' ? "bg-primary text-primary-foreground" : 
                    tab.id === 'active' ? "bg-primary text-primary-foreground" :
                    "bg-muted-foreground/20"
                  )}>
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const beverageOnly = isBeverageOnlyOrder(order);
              return (
              <div key={order.id} className="card-premium p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg">#{order.order_number}</span>
                      <OrderStatusBadge status={order.status} />
                      <OrderChannelBadge channel={(order as any).channel || 'internal'} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.profiles?.name || 'Cliente'} • {order.profiles?.phone || 'Sem telefone'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(order.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                      <span className="px-2 py-0.5 rounded bg-muted">
                        {order.delivery_type === 'delivery' ? '🛵 Entrega' : order.delivery_type === 'table' ? '🍽️ Mesa' : '🏪 Retirada'}
                      </span>
                      {(order as any).restaurant_tables && (
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                          Mesa {(order as any).restaurant_tables.number}
                        </span>
                      )}
                      {beverageOnly && (
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium flex items-center gap-1">
                          <GlassWater className="w-3 h-3" />
                          Bebidas
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-primary">
                      R$ {order.total.toFixed(2).replace('.', ',')}
                    </span>
                    <p className="text-xs text-muted-foreground capitalize">
                      {order.payment_method === 'pix' ? 'PIX' : order.payment_method === 'card' ? 'Cartão' : 'Dinheiro'}
                      <span className={cn(
                        "ml-2 px-1.5 py-0.5 rounded",
                        order.payment_status === 'paid' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                      )}>
                        {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Actions based on status */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                  <Link to={`/admin/orders/${order.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      Detalhes
                    </Button>
                  </Link>

                  {/* Print Actions */}
                  <PrintActions orderId={order.id} orderNumber={order.order_number} compact showLabels={false} />

                  {(order.status === 'created' || order.status === 'paid') && (
                    <>
                      <Button
                        size="sm"
                        className="btn-primary"
                        onClick={() => handleAccept(order.id)}
                        disabled={updateStatus.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectDialog({ open: true, orderId: order.id })}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Recusar
                      </Button>
                    </>
                  )}

                  {order.status === 'accepted' && (
                    <>
                      {beverageOnly ? (
                        <Button
                          size="sm"
                          className="bg-success hover:bg-success/90"
                          onClick={() => handleMarkDelivered(order.id)}
                          disabled={updateStatus.isPending}
                        >
                          <GlassWater className="w-4 h-4 mr-1" />
                          Servir Bebidas
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="btn-primary"
                          onClick={() => handleStartPreparing(order.id)}
                          disabled={updateStatus.isPending}
                        >
                          <ChefHat className="w-4 h-4 mr-1" />
                          Iniciar Preparo
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCancelDialog({ open: true, orderId: order.id, isIfood: (order as any).channel === 'ifood' })}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                    </>
                  )}

                  {order.status === 'preparing' && (
                    <Button
                      size="sm"
                      className="btn-primary"
                      onClick={() => handleMarkReady(order.id)}
                      disabled={updateStatus.isPending}
                    >
                      <Package className="w-4 h-4 mr-1" />
                      Marcar Pronto
                    </Button>
                  )}

                  {order.status === 'ready' && (
                    <>
                      {order.delivery_type === 'delivery' ? (
                        <>
                          {!order.driver_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDriverDialog({ open: true, orderId: order.id })}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Atribuir Motoboy
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="btn-primary"
                            onClick={() => handleDispatch(order.id, order.driver_id)}
                            disabled={updateStatus.isPending}
                          >
                            <Truck className="w-4 h-4 mr-1" />
                            {order.driver_id ? 'Despachar' : 'Atribuir e Despachar'}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-success hover:bg-success/90"
                          onClick={() => handleMarkDelivered(order.id)}
                          disabled={updateStatus.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Marcar Entregue
                        </Button>
                      )}
                    </>
                  )}

                  {order.status === 'out_for_delivery' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReassignDialog({ open: true, orderId: order.id, currentDriverId: order.driver_id })}
                      >
                        <Replace className="w-4 h-4 mr-1" />
                        Trocar Motoboy
                      </Button>
                      <Link to="/admin/live-map">
                        <Button size="sm" variant="outline">
                          Ver Mapa
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        className="bg-success hover:bg-success/90"
                        onClick={() => handleMarkDelivered(order.id)}
                        disabled={updateStatus.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Marcar Entregue
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ); })}
          </div>
        ) : (
          <div className="card-premium p-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Nenhum pedido</h3>
            <p className="text-muted-foreground">
              Os novos pedidos aparecerão aqui em tempo real
            </p>
          </div>
        )}
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, orderId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Pedido</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Motivo da recusa</label>
            <Textarea
              placeholder="Ex: Produto indisponível, fora da área de entrega..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, orderId: null })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!reason.trim()}>
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, orderId: null, isIfood: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Pedido</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Motivo do cancelamento</label>
            <Textarea
              placeholder="Ex: Cliente solicitou cancelamento..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog({ open: false, orderId: null, isIfood: false })}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={!reason.trim()}>
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Driver Assignment Dialog */}
      <Dialog open={driverDialog.open} onOpenChange={(open) => setDriverDialog({ open, orderId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Motoboy</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Selecione o motoboy</label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um motoboy..." />
              </SelectTrigger>
              <SelectContent>
                {drivers?.map((driver) => (
                  <SelectItem key={driver.user_id} value={driver.user_id}>
                    {driver.profiles?.name || driver.profiles?.email || 'Motoboy'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDriverDialog({ open: false, orderId: null })}>
              Cancelar
            </Button>
            <Button onClick={handleAssignAndDispatch} disabled={!selectedDriver}>
              Atribuir e Despachar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Driver Dialog */}
      <Dialog open={reassignDialog.open} onOpenChange={(open) => setReassignDialog({ open, orderId: null, currentDriverId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar Motoboy</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Selecione um novo motoboy para assumir esta entrega.
            </p>
            <label className="text-sm font-medium mb-2 block">Novo motoboy</label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um motoboy..." />
              </SelectTrigger>
              <SelectContent>
                {drivers
                  ?.filter(driver => driver.user_id !== reassignDialog.currentDriverId)
                  .map((driver) => (
                    <SelectItem key={driver.user_id} value={driver.user_id}>
                      {driver.profiles?.name || driver.profiles?.email || 'Motoboy'}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReassignDialog({ open: false, orderId: null, currentDriverId: null }); setSelectedDriver(''); }}>
              Cancelar
            </Button>
            <Button onClick={handleReassignDriver} disabled={!selectedDriver || assignDriver.isPending}>
              <Replace className="w-4 h-4 mr-2" />
              Confirmar Troca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
