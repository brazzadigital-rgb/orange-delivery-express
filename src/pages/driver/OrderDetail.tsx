import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Package, 
  Clock, 
  CreditCard,
  ChevronLeft,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { 
  useDriverOrderDetail, 
  useDriverOrderItems,
  useDriverUpdateStatus 
} from '@/hooks/useDriverOrders';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DriverOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useDriverOrderDetail(id!);
  const { data: items } = useDriverOrderItems(id!);
  const updateStatus = useDriverUpdateStatus();

  const handleStartDelivery = async () => {
    if (!id) return;
    await updateStatus.mutateAsync({ orderId: id, status: 'out_for_delivery' });
    navigate(`/driver/navigation/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Detalhes da Entrega" />
        <div className="p-4 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Pedido não encontrado</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/driver/orders')}
          >
            Voltar para Entregas
          </Button>
        </div>
      </div>
    );
  }

  const { address_snapshot: address } = order;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3 bg-card border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold">Pedido #{order.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <div className="p-4 space-y-4">
        {/* Delivery Address */}
        {address && (
          <section className="card-premium p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço de Entrega
            </h2>
            <div className="space-y-1">
              <p className="font-semibold">{address.label || 'Endereço'}</p>
              <p className="text-muted-foreground">
                {address.street}, {address.number}
                {address.complement && ` - ${address.complement}`}
              </p>
              <p className="text-muted-foreground">
                {address.neighborhood}, {address.city} - {address.state}
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => {
                const query = address.lat && address.lng
                  ? `${address.lat},${address.lng}`
                  : encodeURIComponent(`${address.street}, ${address.number}, ${address.neighborhood}, ${address.city}`);
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
              }}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Abrir no Google Maps
            </Button>
          </section>
        )}

        {/* Order Items */}
        <section className="card-premium p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Itens do Pedido ({items?.length || 0})
          </h2>
          <div className="space-y-3">
            {items?.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {item.quantity}x
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name_snapshot}</p>
                  {item.options_snapshot && Array.isArray(item.options_snapshot) && item.options_snapshot.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {(item.options_snapshot as any[])
                        .map((opt: any) => opt.itemLabel || opt.label)
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Info */}
        <section className="card-premium p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Pagamento
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Forma de pagamento</span>
            <span className="font-medium">
              {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-muted-foreground">Status</span>
            <span className={order.payment_status === 'paid' ? 'text-success font-medium' : 'text-amber-600 font-medium'}>
              {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-primary">
              R$ {order.total.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </section>

        {/* Notes */}
        {order.notes && (
          <section className="p-4 rounded-xl bg-warning/10 border border-warning/30">
            <h2 className="text-sm font-medium text-warning-foreground mb-2">Observações</h2>
            <p className="text-foreground">{order.notes}</p>
          </section>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border safe-area-bottom">
        {order.status === 'ready' && (
          <Button
            className="w-full h-14 text-base btn-primary"
            onClick={handleStartDelivery}
            disabled={updateStatus.isPending}
          >
            {updateStatus.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Navigation className="w-5 h-5 mr-2" />
            )}
            Iniciar Entrega
          </Button>
        )}

        {order.status === 'out_for_delivery' && (
          <Button
            className="w-full h-14 text-base btn-primary"
            onClick={() => navigate(`/driver/navigation/${id}`)}
          >
            <Navigation className="w-5 h-5 mr-2" />
            Continuar Navegação
          </Button>
        )}
      </div>
    </div>
  );
}
