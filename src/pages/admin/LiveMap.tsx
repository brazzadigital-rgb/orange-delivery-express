import { useEffect, useRef, useState } from 'react';
import { MapPin, Phone, User, Package, Clock, Navigation, ChevronRight, RefreshCw } from 'lucide-react';
import { useActiveDeliveries } from '@/hooks/useDriverLocation';
import { useRealtimeLiveMap } from '@/hooks/useRealtime';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { GoogleMap } from '@/components/maps/GoogleMap';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useNavigate } from 'react-router-dom';

export default function AdminLiveMap() {
  const navigate = useNavigate();
  const { data: deliveries, isLoading, refetch } = useActiveDeliveries();
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Enable realtime updates
  useRealtimeLiveMap();

  const handleDeliveryClick = (delivery: any) => {
    setSelectedDelivery(delivery);
    setIsDrawerOpen(true);
  };

  const getLastUpdateText = (recordedAt: string) => {
    const diff = Date.now() - new Date(recordedAt).getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 30) return 'Agora';
    if (seconds < 60) return `${seconds}s atrás`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min atrás`;
    return 'Sinal fraco';
  };

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-screen flex flex-col">
      {/* Header */}
      <div className="flex-none p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Mapa ao Vivo</h1>
            <p className="text-sm text-muted-foreground">
              {deliveries?.length || 0} entrega{(deliveries?.length || 0) !== 1 && 's'} em andamento
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative">
          <GoogleMap
            fitToMarkers
            markers={
              deliveries
                ?.map((d) => {
                  const lat = Number((d as any).location?.lat);
                  const lng = Number((d as any).location?.lng);

                  return {
                    id: d.id,
                    lat: Number.isFinite(lat) ? lat : 0,
                    lng: Number.isFinite(lng) ? lng : 0,
                    label: `#${d.order_number}`,
                    icon: 'driver' as const,
                  };
                })
                .filter((m) => m.lat !== 0 && m.lng !== 0) || []
            }
            zoom={13}
            onMarkerClick={(id) => {
              const delivery = deliveries?.find((d) => d.id === id);
              if (delivery) handleDeliveryClick(delivery);
            }}
            className="absolute inset-0"
          />

          {/* Empty state overlay */}
          {(!deliveries || deliveries.length === 0) && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="text-center p-8">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Nenhuma entrega em andamento</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Quando houver entregas ativas, você verá a localização dos motoboys aqui.
                </p>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
        </div>

        {/* Sidebar - Active Deliveries */}
        <div className="hidden lg:flex w-80 flex-col border-l border-border bg-card">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">Em Rota Agora</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4">
                <LoadingSpinner />
              </div>
            ) : deliveries && deliveries.length > 0 ? (
              <div className="divide-y divide-border">
                {deliveries.map((delivery) => (
                  <button
                    key={delivery.id}
                    onClick={() => handleDeliveryClick(delivery)}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-semibold text-primary">
                          Pedido #{delivery.order_number}
                        </span>
                        <p className="text-sm text-muted-foreground">
                          {(delivery as any).profiles?.name || 'Cliente'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(delivery.created_at), 'HH:mm', { locale: ptBR })}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full',
                          delivery.location && Date.now() - new Date(delivery.location.recorded_at).getTime() < 30000
                            ? 'bg-success/10 text-success'
                            : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {delivery.location
                          ? getLastUpdateText(delivery.location.recorded_at)
                          : 'Aguardando GPS'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma entrega em andamento
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {selectedDelivery && (
            <>
              <SheetHeader>
                <SheetTitle>Pedido #{selectedDelivery.order_number}</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Customer */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Cliente</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{(selectedDelivery as any).profiles?.name || 'Cliente'}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedDelivery as any).profiles?.phone || 'Sem telefone'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Endereço</h4>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {selectedDelivery.address_snapshot?.street}, {selectedDelivery.address_snapshot?.number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedDelivery.address_snapshot?.neighborhood} - {selectedDelivery.address_snapshot?.city}
                      </p>
                    </div>
                  </div>
                </div>

                {/* GPS Info */}
                {selectedDelivery.location && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Localização do Motoboy</h4>
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Lat:</span>{' '}
                          {selectedDelivery.location.lat.toFixed(6)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Lng:</span>{' '}
                          {selectedDelivery.location.lng.toFixed(6)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Precisão:</span>{' '}
                          {selectedDelivery.location.accuracy?.toFixed(0)}m
                        </div>
                        <div>
                          <span className="text-muted-foreground">Velocidade:</span>{' '}
                          {selectedDelivery.location.speed
                            ? `${(selectedDelivery.location.speed * 3.6).toFixed(0)} km/h`
                            : '-'}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Atualizado: {getLastUpdateText(selectedDelivery.location.recorded_at)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if ((selectedDelivery as any).profiles?.phone) {
                        window.open(`tel:${(selectedDelivery as any).profiles.phone}`);
                      }
                    }}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Ligar
                  </Button>
                  <Button
                    className="btn-primary flex-1"
                    onClick={() => navigate(`/admin/orders/${selectedDelivery.id}`)}
                  >
                    Ver Pedido
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
