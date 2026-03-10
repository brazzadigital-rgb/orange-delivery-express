import { useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useOrder, useOrderItems, useOrderEvents } from '@/hooks/useOrders';
import { usePrintSettings, useUpdatePrintJob } from '@/hooks/usePrintSettings';
import { useAdminDrivers } from '@/hooks/useAdmin';
import { KitchenTicket } from '@/components/print/KitchenTicket';
import { CounterReceipt } from '@/components/print/CounterReceipt';
import { DeliverySlip } from '@/components/print/DeliverySlip';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { format } from 'date-fns';

export default function OrderPrint() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const template = (searchParams.get('template') || 'kitchen') as 'kitchen' | 'counter' | 'delivery';
  const autoPrint = searchParams.get('auto') === 'true';
  const jobId = searchParams.get('jobId');

  const { data: order, isLoading: orderLoading } = useOrder(id!);
  const { data: items, isLoading: itemsLoading } = useOrderItems(id!);
  const { data: settings } = usePrintSettings();
  const { data: drivers } = useAdminDrivers();
  const { data: events } = useOrderEvents(id!);
  const updatePrintJob = useUpdatePrintJob();

  const hasPrinted = useRef(false);

  // Extract departure and delivery times from events
  const { departureTime, deliveryTime } = useMemo(() => {
    if (!events) return { departureTime: null, deliveryTime: null };
    
    const departureEvent = events.find(e => e.status === 'out_for_delivery');
    const deliveryEvent = events.find(e => e.status === 'delivered');
    
    return {
      departureTime: departureEvent ? format(new Date(departureEvent.created_at), 'HH:mm') : null,
      deliveryTime: deliveryEvent ? format(new Date(deliveryEvent.created_at), 'HH:mm') : null,
    };
  }, [events]);
 
  // Auto-print when ready
  useEffect(() => {
    if (autoPrint && order && items && !hasPrinted.current) {
      hasPrinted.current = true;

      // Small delay to ensure render is complete
      setTimeout(() => {
        window.print();

        // Mark job as printed
        if (jobId) {
          updatePrintJob.mutate({ jobId, status: 'printed' });
        }
      }, 500);
    }
  }, [autoPrint, order, items, jobId]);

  if (orderLoading || itemsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order || !items) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p>Pedido não encontrado</p>
      </div>
    );
  }

  const paperSize = settings?.paper_size || '80mm';
  const driverName = order.driver_id
    ? drivers?.find(d => d.user_id === order.driver_id)?.profiles?.name
    : undefined;

  const handlePrint = () => {
    window.print();
    if (jobId) {
      updatePrintJob.mutate({ jobId, status: 'printed' });
    }
  };

  const renderTemplate = () => {
    switch (template) {
      case 'kitchen':
        return (
          <KitchenTicket
            order={order}
            items={items}
            paperSize={paperSize}
            showPrices={settings?.show_prices_on_kitchen || false}
          />
        );
      case 'counter':
        return (
          <CounterReceipt
            order={order}
            items={items}
            paperSize={paperSize}
            footerMessage={settings?.footer_message}
          />
        );
      case 'delivery':
        return (
          <DeliverySlip
            order={order}
            items={items}
            paperSize={paperSize}
            driverName={driverName}
            departureTime={departureTime}
            deliveryTime={deliveryTime}
          />
        );
      default:
        return null;
    }
  };

  const templateLabels = {
    kitchen: '🍳 Cozinha',
    counter: '🧾 Balcão',
    delivery: '🛵 Entrega',
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Toolbar - hidden when printing */}
      <div className="no-print bg-background border-b p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold">
              Pedido #{order.order_number} - {templateLabels[template]}
            </h1>
            <p className="text-sm text-muted-foreground">
              Visualização de impressão
            </p>
          </div>
       </div>
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
     </div>

      {/* Print Content */}
      <div className="py-8">
        {renderTemplate()}
      </div>
    </div>
  );
}