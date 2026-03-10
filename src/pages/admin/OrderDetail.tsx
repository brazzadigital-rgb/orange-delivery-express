import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Clock, User, Truck, Check, X, ChefHat, Package, UserCheck, Navigation, Printer, GlassWater } from 'lucide-react';
import { useOrder, useOrderItems, useOrderEvents } from '@/hooks/useOrders';
import { useUpdateOrderStatus, useAssignDriver } from '@/hooks/useOrderActions';
import { useIsBeverageOnlyOrder } from '@/hooks/useBeverageDetection';
import { useAdminDrivers } from '@/hooks/useAdmin';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PrintActions } from '@/components/print/PrintActions';
import { PrintJobsHistory } from '@/components/print/PrintJobsHistory';
import { Zap } from 'lucide-react';

const statusOrder = ['created', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading: orderLoading, refetch: refetchOrder } = useOrder(id!);
  const { data: items, refetch: refetchItems } = useOrderItems(id!);
  const { data: events, refetch: refetchEvents } = useOrderEvents(id!);
  const { data: drivers } = useAdminDrivers();
  const { data: isBeverageOnly } = useIsBeverageOnlyOrder(items);
  
  const updateStatus = useUpdateOrderStatus();
  const assignDriver = useAssignDriver();
  
  const [rejectDialog, setRejectDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [driverDialog, setDriverDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(order?.driver_id || '');

  // Realtime subscription
  useEffect(() => {
    if (!id) return;
    
    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, () => {
        refetchOrder();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_events', filter: `order_id=eq.${id}` }, () => {
        refetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refetchOrder, refetchEvents]);

  if (orderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <p>Pedido não encontrado</p>
        <Button onClick={() => navigate('/admin/orders')} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  const currentStatusIndex = statusOrder.indexOf(order.status);
  const isFinished = ['delivered', 'rejected', 'canceled'].includes(order.status);

  const handleAccept = async () => {
    await updateStatus.mutateAsync({ orderId: order.id, newStatus: 'accepted' });
    toast.success('Pedido aceito!');
  };

  const handleReject = async () => {
    await updateStatus.mutateAsync({ orderId: order.id, newStatus: 'rejected', rejectReason: reason });
    toast.success('Pedido recusado');
    setRejectDialog(false);
    setReason('');
  };

  const handleCancel = async () => {
    await updateStatus.mutateAsync({ orderId: order.id, newStatus: 'canceled', cancelReason: reason });
    toast.success('Pedido cancelado');
    setCancelDialog(false);
    setReason('');
  };

  const handleStartPreparing = async () => {
    await updateStatus.mutateAsync({ orderId: order.id, newStatus: 'preparing' });
    toast.success('Preparo iniciado!');
  };

  const handleMarkReady = async () => {
    await updateStatus.mutateAsync({ orderId: order.id, newStatus: 'ready' });
    toast.success('Pedido pronto!');
  };

  const handleAssignDriver = async () => {
    if (!selectedDriver) return;
    await assignDriver.mutateAsync({ orderId: order.id, driverId: selectedDriver });
    setDriverDialog(false);
  };

  const handleDispatch = async () => {
    if (!order.driver_id) {
      setDriverDialog(true);
      return;
    }
    await updateStatus.mutateAsync({ orderId: order.id, newStatus: 'out_for_delivery' });
    toast.success('Pedido despachado!');
  };

  const handleMarkDelivered = async () => {
    await updateStatus.mutateAsync({ orderId: order.id, newStatus: 'delivered' });
    toast.success('Pedido entregue!');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/orders')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Pedido #{order.order_number}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(order.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Actions Card */}
          {!isFinished && (
            <section className="card-premium p-4">
              <h2 className="font-semibold mb-4">Ações</h2>
              <div className="flex flex-wrap gap-2">
                {/* Print Actions */}
                <PrintActions orderId={order.id} orderNumber={order.order_number} />
                
                {order.status === 'created' && (
                  <>
                    <Button onClick={handleAccept} disabled={updateStatus.isPending}>
                      <Check className="w-4 h-4 mr-2" />
                      Aceitar Pedido
                    </Button>
                    <Button variant="destructive" onClick={() => setRejectDialog(true)}>
                      <X className="w-4 h-4 mr-2" />
                      Recusar
                    </Button>
                  </>
                )}

                {order.status === 'accepted' && (
                  <>
                    {isBeverageOnly && order.delivery_type === 'table' ? (
                      <Button onClick={handleMarkDelivered} disabled={updateStatus.isPending} className="bg-success hover:bg-success/90">
                        <GlassWater className="w-4 h-4 mr-2" />
                        Servir Bebidas
                      </Button>
                    ) : (
                      <Button onClick={handleStartPreparing} disabled={updateStatus.isPending}>
                        <ChefHat className="w-4 h-4 mr-2" />
                        Iniciar Preparo
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setCancelDialog(true)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </>
                )}

                {order.status === 'preparing' && (
                  <Button onClick={handleMarkReady} disabled={updateStatus.isPending}>
                    <Package className="w-4 h-4 mr-2" />
                    Marcar como Pronto
                  </Button>
                )}

                {order.status === 'ready' && (
                  <>
                    {order.delivery_type === 'delivery' ? (
                      <>
                        <Button variant="outline" onClick={() => setDriverDialog(true)}>
                          <UserCheck className="w-4 h-4 mr-2" />
                          {order.driver_id ? 'Trocar Motoboy' : 'Atribuir Motoboy'}
                        </Button>
                        <Button onClick={handleDispatch} disabled={updateStatus.isPending}>
                          <Truck className="w-4 h-4 mr-2" />
                          Despachar
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleMarkDelivered} disabled={updateStatus.isPending} className="bg-success hover:bg-success/90">
                        <Check className="w-4 h-4 mr-2" />
                        Cliente Retirou
                      </Button>
                    )}
                  </>
                )}

                {order.status === 'out_for_delivery' && (
                  <>
                    <Link to="/admin/live-map">
                      <Button variant="outline">
                        <Navigation className="w-4 h-4 mr-2" />
                        Ver no Mapa
                      </Button>
                    </Link>
                    <Button onClick={handleMarkDelivered} disabled={updateStatus.isPending} className="bg-success hover:bg-success/90">
                      <Check className="w-4 h-4 mr-2" />
                      Marcar Entregue
                    </Button>
                  </>
                )}
              </div>
            </section>
          )}

          {/* Print Section */}
          <section className="card-premium p-4">
            <div className="flex items-center gap-2 mb-4">
              <Printer className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-semibold">Impressão</h2>
            </div>
            <div className="mb-4">
              <PrintActions orderId={order.id} orderNumber={order.order_number} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Histórico de impressões:</p>
              <PrintJobsHistory orderId={order.id} />
            </div>
          </section>

          {/* Order Items */}
          <section className="card-premium p-4">
            <h2 className="font-semibold mb-4">Itens do Pedido</h2>
            <div className="space-y-3">
              {items?.map((item) => (
                <div key={item.id} className="flex justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium">{item.quantity}x {item.name_snapshot}</p>
                    {item.options_snapshot && Array.isArray(item.options_snapshot) && item.options_snapshot.length > 0 && (
                      <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        {item.options_snapshot.map((opt: any, idx: number) => (
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
            
            {/* Order Notes */}
            {order.notes && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Observações:</p>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            )}
          </section>

          {/* Timeline */}
          <section className="card-premium p-4">
            <h2 className="font-semibold mb-4">Histórico</h2>
            <div className="space-y-4">
              {events?.map((event, index) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    {index < (events?.length || 0) - 1 && (
                      <div className="w-0.5 h-full bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">{ORDER_STATUS_LABELS[event.status] || event.status}</p>
                    {event.message && (
                      <p className="text-sm text-muted-foreground">{event.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(event.created_at), "dd/MM 'às' HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <section className="card-premium p-4">
            <h2 className="font-semibold mb-3">Cliente</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{(order as any).profiles?.name || 'Cliente'}</span>
              </div>
              {(order as any).profiles?.phone && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <a 
                    href={`https://wa.me/55${(order as any).profiles?.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {(order as any).profiles?.phone}
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Delivery Address */}
          {order.delivery_type === 'delivery' && order.address_snapshot && (
            <section className="card-premium p-4">
              <h2 className="font-semibold mb-3">Endereço de Entrega</h2>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p>{order.address_snapshot.label}</p>
                  <p className="text-muted-foreground">
                    {order.address_snapshot.street}, {order.address_snapshot.number}
                    {order.address_snapshot.complement && ` - ${order.address_snapshot.complement}`}
                  </p>
                  <p className="text-muted-foreground">
                    {order.address_snapshot.neighborhood}, {order.address_snapshot.city}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Driver Info */}
          {order.driver_id && (
            <section className="card-premium p-4">
              <h2 className="font-semibold mb-3">Motoboy</h2>
              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4 text-muted-foreground" />
                <span>
                  {drivers?.find(d => d.user_id === order.driver_id)?.profiles?.name || 'Motoboy atribuído'}
                </span>
              </div>
            </section>
          )}

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
                  <span>R$ {(order.delivery_fee || 0).toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {(order.discount || 0) > 0 && (
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
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Método</span>
                <span className="capitalize">
                  {order.payment_method === 'pix' ? 'PIX' : order.payment_method === 'card' ? 'Cartão' : 'Dinheiro'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium",
                  order.payment_status === 'paid' ? 'bg-success/20 text-success' : 'bg-amber-500/20 text-amber-600'
                )}>
                  {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                </span>
              </div>
            </div>

            {/* Cash Change Info */}
            {order.payment_method === 'cash' && (order as any).cash_change_needed && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <h3 className="font-medium text-amber-600 mb-2 flex items-center gap-2">
                  💵 Troco Necessário
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Troco para:</span>
                    <span className="font-medium">
                      R$ {((order as any).cash_change_for || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Troco a levar:</span>
                    <span className="font-bold text-amber-600">
                      R$ {((order as any).cash_change_amount || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* No change needed for cash */}
            {order.payment_method === 'cash' && !(order as any).cash_change_needed && (
              <div className="mt-4 p-3 rounded-xl bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground">
                  ✓ Cliente não precisa de troco
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Pedido</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Motivo da recusa *</label>
            <Textarea
              placeholder="Ex: Produto indisponível, fora da área de entrega..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!reason.trim() || updateStatus.isPending}>
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Pedido</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Motivo do cancelamento *</label>
            <Textarea
              placeholder="Ex: Cliente solicitou cancelamento..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(false)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={!reason.trim() || updateStatus.isPending}>
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Driver Assignment Dialog */}
      <Dialog open={driverDialog} onOpenChange={setDriverDialog}>
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
            <Button variant="outline" onClick={() => setDriverDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignDriver} disabled={!selectedDriver || assignDriver.isPending}>
              Atribuir Motoboy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
