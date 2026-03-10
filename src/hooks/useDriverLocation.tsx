import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface DriverLocation {
  id: string;
  driver_id: string;
  order_id: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  recorded_at: string;
}

// Hook to get latest driver location for an order
export function useDriverLocation(orderId: string) {
  return useQuery({
    queryKey: ['driver-location', orderId],
    queryFn: async () => {
      if (!orderId) return null;

      const { data, error } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('order_id', orderId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as DriverLocation | null;
    },
    enabled: !!orderId,
    refetchInterval: 5000, // Poll every 5 seconds as fallback
  });
}

// Hook to get all active deliveries with latest locations
export function useActiveDeliveries() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['active-deliveries', storeId],
    queryFn: async () => {
      // Get orders that are out for delivery for THIS store only
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, profiles!orders_user_id_profiles_fkey (name, phone)')
        .eq('store_id', storeId)
        .eq('status', 'out_for_delivery');

      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) return [];

      // Get latest locations for these orders
      const orderIds = orders.map(o => o.id);
      const { data: locations, error: locError } = await supabase
        .from('driver_locations')
        .select('*')
        .in('order_id', orderIds)
        .order('recorded_at', { ascending: false });

      if (locError) throw locError;

      // Get latest location per order
      const latestLocations = new Map<string, DriverLocation>();
      for (const loc of locations || []) {
        if (!latestLocations.has(loc.order_id)) {
          latestLocations.set(loc.order_id, loc as DriverLocation);
        }
      }

      // Combine orders with locations
      return orders.map(order => ({
        ...order,
        location: latestLocations.get(order.id) || null,
      }));
    },
    refetchInterval: 10000, // Poll every 10 seconds
  });
}

// Hook for driver to share location
export function useShareLocation(orderId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSharing, setIsSharing] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const insertLocation = useMutation({
    mutationFn: async (position: GeolocationPosition) => {
      if (!user || !orderId) return;

      const { error } = await supabase
        .from('driver_locations')
        .insert({
          driver_id: user.id,
          order_id: orderId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        });

      if (error) throw error;
    },
    onError: (error: Error) => {
      console.error('Error sharing location:', error);
    },
  });

  const startSharing = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada neste dispositivo');
      return;
    }

    setIsSharing(true);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        insertLocation.mutate(position);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Erro ao obter localização');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    setWatchId(id);
    toast.success('Compartilhamento de localização iniciado');
  }, [insertLocation, orderId]);

  const stopSharing = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsSharing(false);
    toast.info('Compartilhamento de localização parado');
  }, [watchId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    isSharing,
    startSharing,
    stopSharing,
  };
}

// Hook to update order status and create event
export function useUpdateOrderStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      status, 
      message 
    }: { 
      orderId: string; 
      status: string; 
      message?: string;
    }) => {
      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: status as any })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Create order event
      const { error: eventError } = await supabase
        .from('order_events')
        .insert({
          order_id: orderId,
          status: status as any,
          message: message || getStatusMessage(status),
          created_by: user?.id,
        });

      if (eventError) throw eventError;

      // Get order for notification
      const { data: order } = await supabase
        .from('orders')
        .select('user_id, order_number')
        .eq('id', orderId)
        .single();

      if (order) {
        // Notify customer
        await supabase
          .from('notifications')
          .insert({
            user_id: order.user_id,
            title: getStatusTitle(status),
            body: `Pedido #${order.order_number} - ${getStatusMessage(status)}`,
            type: 'order',
            data: { order_id: orderId },
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
      toast.success('Status atualizado!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });
}

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    created: 'Pedido recebido',
    paid: 'Pagamento confirmado',
    accepted: 'Pedido aceito pela cozinha',
    preparing: 'Preparando seu pedido',
    ready: 'Pedido pronto para entrega',
    out_for_delivery: 'Saiu para entrega',
    delivered: 'Pedido entregue',
    canceled: 'Pedido cancelado',
  };
  return messages[status] || status;
}

function getStatusTitle(status: string): string {
  const titles: Record<string, string> = {
    created: '📋 Pedido Recebido',
    paid: '💳 Pagamento Confirmado',
    accepted: '✅ Pedido Aceito',
    preparing: '👨‍🍳 Em Preparo',
    ready: '📦 Pronto!',
    out_for_delivery: '🛵 Saiu para Entrega',
    delivered: '🎉 Entregue!',
    canceled: '❌ Cancelado',
  };
  return titles[status] || 'Atualização do Pedido';
}
