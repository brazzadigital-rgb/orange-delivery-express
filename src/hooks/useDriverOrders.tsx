import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useCallback, useEffect, useState, useRef } from 'react';

// Sound URL for driver notifications
const DRIVER_NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export interface DriverOrder {
  id: string;
  order_number: number;
  status: string;
  delivery_type: string;
  address_snapshot: {
    label?: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    lat?: number;
    lng?: number;
  } | null;
  total: number;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  estimated_minutes: number | null;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
}

// Get orders assigned to the logged-in driver
export function useDriverOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['driver-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          delivery_type,
          address_snapshot,
          total,
          payment_method,
          payment_status,
          notes,
          estimated_minutes,
          created_at
        `)
        .eq('driver_id', user.id)
        .in('status', ['ready', 'out_for_delivery'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DriverOrder[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Get a single order detail for the driver
export function useDriverOrderDetail(orderId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['driver-order', orderId],
    queryFn: async () => {
      if (!user || !orderId) return null;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          delivery_type,
          address_snapshot,
          total,
          payment_method,
          payment_status,
          notes,
          estimated_minutes,
          created_at
        `)
        .eq('id', orderId)
        .eq('driver_id', user.id)
        .single();

      if (error) throw error;
      return data as DriverOrder;
    },
    enabled: !!user && !!orderId,
  });
}

// Get order items for driver view
export function useDriverOrderItems(orderId: string) {
  return useQuery({
    queryKey: ['driver-order-items', orderId],
    queryFn: async () => {
      if (!orderId) return [];

      const { data, error } = await supabase
        .from('order_items')
        .select('id, name_snapshot, quantity, options_snapshot')
        .eq('order_id', orderId);

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

// Driver can update order status (out_for_delivery -> delivered)
export function useDriverUpdateStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      message,
    }: {
      orderId: string;
      status: 'out_for_delivery' | 'delivered';
      message?: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: status as any })
        .eq('id', orderId)
        .eq('driver_id', user.id);

      if (orderError) throw orderError;

      // Create order event
      const statusMessages: Record<string, string> = {
        out_for_delivery: 'Motoboy saiu para entrega',
        delivered: 'Pedido entregue ao cliente',
      };

      const { error: eventError } = await supabase
        .from('order_events')
        .insert({
          order_id: orderId,
          status: status as any,
          message: message || statusMessages[status],
          created_by: user.id,
        });

      if (eventError) throw eventError;

      // Get order for notification
      const { data: order } = await supabase
        .from('orders')
        .select('user_id, order_number')
        .eq('id', orderId)
        .single();

      if (order) {
        const notificationTitles: Record<string, string> = {
          out_for_delivery: '🛵 Saiu para Entrega!',
          delivered: '🎉 Pedido Entregue!',
        };

        await supabase.from('notifications').insert({
          user_id: order.user_id,
          title: notificationTitles[status],
          body: `Pedido #${order.order_number} - ${statusMessages[status]}`,
          type: 'order',
          data: { order_id: orderId },
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
      queryClient.invalidateQueries({ queryKey: ['driver-order', variables.orderId] });
      toast.success('Status atualizado!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });
}

// Driver online/offline status (stored locally + can be synced to profile)
export function useDriverStatus() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('driver_online') === 'true';
    }
    return false;
  });

  const toggleOnline = useCallback(() => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    localStorage.setItem('driver_online', String(newStatus));
    toast.success(newStatus ? 'Você está online!' : 'Você está offline');
  }, [isOnline]);

  return { isOnline, toggleOnline, setIsOnline };
}

// Realtime subscription for driver's orders
export function useDriverOrdersRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio on mount
  useEffect(() => {
    if (typeof Audio !== 'undefined') {
      audioRef.current = new Audio(DRIVER_NOTIFICATION_SOUND);
      audioRef.current.volume = 0.8;
    }
  }, []);

  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`driver-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `driver_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Driver order update:', payload);
          queryClient.invalidateQueries({ queryKey: ['driver-orders'] });

          if (payload.eventType === 'INSERT') {
            // Play sound for new delivery
            playSound();
            toast.info('🏍️ Nova entrega atribuída!', {
              description: `Pedido #${(payload.new as any).order_number}`,
              duration: 10000,
            });
          } else if (payload.eventType === 'UPDATE') {
            const newStatus = (payload.new as any).status;
            if (newStatus === 'ready') {
              playSound();
              toast.info('📦 Pedido pronto para retirada!', {
                description: `Pedido #${(payload.new as any).order_number}`,
                duration: 8000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, playSound]);
}

// Statistics for driver dashboard
export function useDriverStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['driver-stats', user?.id],
    queryFn: async () => {
      if (!user) return { today: 0, total: 0 };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Count today's deliveries
      const { count: todayCount, error: todayError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', user.id)
        .eq('status', 'delivered')
        .gte('created_at', today.toISOString());

      // Count total deliveries
      const { count: totalCount, error: totalError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', user.id)
        .eq('status', 'delivered');

      return {
        today: todayCount || 0,
        total: totalCount || 0,
      };
    },
    enabled: !!user,
  });
}
