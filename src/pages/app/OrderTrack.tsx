import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MapPin, Navigation, Clock, Phone, ChevronLeft } from 'lucide-react';
import { useOrder } from '@/hooks/useOrders';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { Button } from '@/components/ui/button';
import { GoogleMap } from '@/components/maps/GoogleMap';
import { supabase } from '@/integrations/supabase/client';

interface DriverLocation {
  lat: number;
  lng: number;
  heading: number | null;
  recorded_at: string;
}

export default function OrderTrack() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id!);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);

  // Subscribe to driver location updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`driver-location-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
          filter: `order_id=eq.${id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'lat' in payload.new) {
            setDriverLocation(payload.new as DriverLocation);
          }
        }
      )
      .subscribe();

    // Fetch initial location
    const fetchLocation = async () => {
      const { data } = await supabase
        .from('driver_locations')
        .select('lat, lng, heading, recorded_at')
        .eq('order_id', id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setDriverLocation(data);
      }
    };

    fetchLocation();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Pedido não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3 bg-white/95 backdrop-blur-sm border-b border-border/50">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white shadow-sm border border-border/50 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold">Acompanhar Pedido</h1>
          <p className="text-sm text-muted-foreground">#{order.order_number}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <GoogleMap
          driverLocation={driverLocation ? {
            lat: driverLocation.lat,
            lng: driverLocation.lng,
            heading: driverLocation.heading,
          } : undefined}
          destinationLocation={order.address_snapshot?.lat && order.address_snapshot?.lng ? {
            lat: order.address_snapshot.lat,
            lng: order.address_snapshot.lng,
          } : undefined}
          showRoute={!!driverLocation && !!order.address_snapshot?.lat}
          className="absolute inset-0"
        />

        {/* Overlay when no driver location */}
        {!driverLocation && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center p-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Navigation className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Aguardando Motoboy</h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                O motoboy ainda não iniciou o compartilhamento de localização
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info */}
      <div className="bg-white border-t border-border p-4 safe-area-bottom">
        {/* Driver Info */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">🏍️</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold">Motoboy a caminho</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Chegada estimada: {Math.min(order.estimated_minutes || 30, 90)} min</span>
            </div>
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <Phone className="w-5 h-5" />
          </Button>
        </div>

        {/* Address */}
        {order.address_snapshot && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
            <MapPin className="w-5 h-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">{order.address_snapshot.label}</p>
              <p className="text-muted-foreground">
                {order.address_snapshot.street}, {order.address_snapshot.number}
                {order.address_snapshot.complement && ` - ${order.address_snapshot.complement}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
