import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { 
  MapPin, 
  Navigation as NavIcon, 
  Phone, 
  ChevronLeft, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Share2,
  Map
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useDriverOrderDetail, useDriverUpdateStatus } from '@/hooks/useDriverOrders';
import { useShareLocation } from '@/hooks/useDriverLocation';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function DriverNavigation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useDriverOrderDetail(id!);
  const { isSharing, startSharing, stopSharing } = useShareLocation(id!);
  const updateStatus = useDriverUpdateStatus();
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Watch position for display
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Auto-start sharing when order is out_for_delivery
  useEffect(() => {
    if (order?.status === 'out_for_delivery' && !isSharing) {
      startSharing();
    }
  }, [order?.status, isSharing, startSharing]);

  const handleStartDelivery = useCallback(async () => {
    if (!id) return;
    await updateStatus.mutateAsync({ orderId: id, status: 'out_for_delivery' });
    startSharing();
  }, [id, updateStatus, startSharing]);

  const handleCompleteDelivery = useCallback(async () => {
    if (!id) return;
    stopSharing();
    await updateStatus.mutateAsync({ orderId: id, status: 'delivered' });
    toast.success('Entrega concluída!');
    navigate('/driver/orders');
  }, [id, updateStatus, stopSharing, navigate]);

  const openExternalMaps = useCallback(() => {
    if (!order?.address_snapshot) return;
    
    const { lat, lng, street, number, neighborhood, city } = order.address_snapshot;
    
    // If we have coordinates, use them
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
      // Otherwise use address
      const address = encodeURIComponent(`${street}, ${number}, ${neighborhood}, ${city}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  }, [order]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Pedido não encontrado</h2>
        <p className="text-muted-foreground mb-4">Este pedido pode não estar mais atribuído a você.</p>
        <Button onClick={() => navigate('/driver/orders')}>
          Voltar para Entregas
        </Button>
      </div>
    );
  }

  const { address_snapshot: address } = order;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3 bg-card border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold">Navegação</h1>
          <p className="text-sm text-muted-foreground">Pedido #{order.order_number}</p>
        </div>
        
        {/* GPS Status */}
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
          isSharing ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
        )}>
          {isSharing ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              GPS ativo
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3" />
              GPS inativo
            </>
          )}
        </div>
      </header>

      {/* Map Area */}
      <div className="flex-1 relative bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <NavIcon className="w-10 h-10 text-primary" />
            </div>
            
            {currentPosition ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Sua localização atual:</p>
                <p className="font-mono text-xs">
                  {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Obtendo localização...</p>
            )}

            <Button
              variant="outline"
              className="mt-4"
              onClick={openExternalMaps}
            >
              <Map className="w-4 h-4 mr-2" />
              Abrir no Google Maps
            </Button>
          </div>
        </div>

        {/* Live indicator */}
        {isSharing && currentPosition && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <div className="bg-success text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg">
              <Share2 className="w-4 h-4 animate-pulse" />
              Compartilhando localização
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panel */}
      <div className="bg-card border-t border-border p-4 safe-area-bottom space-y-4">
        {/* Address */}
        {address && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">{address.label || 'Endereço de entrega'}</p>
              <p className="text-sm text-muted-foreground">
                {address.street}, {address.number}
                {address.complement && ` - ${address.complement}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {address.neighborhood}, {address.city}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={openExternalMaps}
            >
              <NavIcon className="w-5 h-5 text-primary" />
            </Button>
          </div>
        )}

        {/* Order Info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total do pedido:</span>
          <span className="font-bold text-primary text-lg">
            R$ {order.total.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {order.notes && (
          <div className="p-3 rounded-xl bg-warning/10 border border-warning/30">
            <p className="text-sm text-warning-foreground">
              <strong>Obs:</strong> {order.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {order.status === 'ready' && (
            <Button
              className="flex-1 h-14 text-base btn-primary"
              onClick={handleStartDelivery}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <NavIcon className="w-5 h-5 mr-2" />
              )}
              Iniciar Entrega
            </Button>
          )}

          {order.status === 'out_for_delivery' && (
            <Button
              className="flex-1 h-14 text-base bg-success hover:bg-success/90 text-white"
              onClick={handleCompleteDelivery}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              Confirmar Entrega
            </Button>
          )}
        </div>

        {/* Toggle GPS */}
        {order.status === 'out_for_delivery' && (
          <Button
            variant="outline"
            className="w-full"
            onClick={isSharing ? stopSharing : startSharing}
          >
            {isSharing ? 'Pausar GPS' : 'Retomar GPS'}
          </Button>
        )}
      </div>
    </div>
  );
}
