import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminPreferences, playNotificationSound } from './useAdminPreferences';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useStoreId } from '@/contexts/TenantContext';

interface PendingCounts {
  total: number;
  delivery: number;
  table: number;
}

/**
 * Hook that manages pending order counts, realtime updates, sound alerts,
 * and deduplication to prevent sound on page reload.
 */
export function useAdminPendingOrders() {
  const storeId = useStoreId();
  const queryClient = useQueryClient();
  const { data: preferences } = useAdminPreferences();
  const preferencesRef = useRef(preferences);
  const navigate = useNavigate();

  // Deduplication: track notified order IDs
  const processedIds = useRef(new Set<string>());
  // Flag: only play sound after initial load completes
  const realtimeReady = useRef(false);
  // "Mark as seen" state (visual only)
  const [seenAt, setSeenAt] = useState<string | null>(null);
  // Session start timestamp - only play sound for orders created after this
  const sessionStart = useRef(new Date().toISOString());

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  // Fetch pending counts
  const { data: counts = { total: 0, delivery: 0, table: 0 }, refetch } = useQuery({
    queryKey: ['admin-pending-counts', storeId],
    queryFn: async (): Promise<PendingCounts> => {
      const { data, error } = await (supabase
        .from('orders')
        .select('id, delivery_type, status')
        .in('status', ['created', 'paid'])
        .or('created_by_source.is.null,created_by_source.eq.customer')
        .eq('store_id', storeId) as any);

      if (error) throw error;

      const orders = data || [];
      // Seed processedIds with existing orders so we don't alert on them
      orders.forEach(o => processedIds.current.add(o.id));
      // Mark realtime as ready after initial fetch
      realtimeReady.current = true;

      return {
        total: orders.length,
        table: orders.filter(o => o.delivery_type === 'table').length,
        delivery: orders.filter(o => o.delivery_type !== 'table').length,
      };
    },
    refetchInterval: 60000, // refresh every 60s as fallback
  });

  const playSound = useCallback(() => {
    playNotificationSound(preferencesRef.current ?? null);
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`admin-pending-orders-realtime-${storeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
        (payload) => {
          const order = payload.new as {
            id: string;
            status: string;
            delivery_type: string;
            created_at: string;
            order_number: number;
            created_by_source: string | null;
          };

          // Skip admin/waiter-created internal table orders
          if (order.created_by_source === 'admin' || order.created_by_source === 'waiter') return;

          // Refresh counts
          refetch();
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });

          // Only alert for pending orders created after session start
          if (!['created', 'paid'].includes(order.status)) return;
          if (!realtimeReady.current) return;
          if (processedIds.current.has(order.id)) return;
          if (order.created_at < sessionStart.current) return;

          // Mark as processed
          processedIds.current.add(order.id);
          // Cap set size
          if (processedIds.current.size > 200) {
            const arr = Array.from(processedIds.current);
            processedIds.current = new Set(arr.slice(-100));
          }

          // Play sound
          playSound();

          // Toast
          const isTable = order.delivery_type === 'table';
          toast.success(
            isTable ? '🍽️ Novo pedido de mesa!' : '🍕 Novo pedido pendente!',
            {
              description: `Pedido #${order.order_number}`,
              duration: 10000,
              action: {
                label: 'Ver',
                onClick: () => navigate(`/admin/orders/${order.id}`),
              },
            }
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
        (payload) => {
          const newRow = payload.new as {
            id: string;
            status: string;
            delivery_type: string;
            order_number: number;
          };
          const oldRow = payload.old as { status?: string };

          // Always refresh counts on any order update
          refetch();
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });

          // Only alert if transitioning TO pending from non-pending
          const wasPending = oldRow.status && ['created', 'paid'].includes(oldRow.status);
          const isPending = ['created', 'paid'].includes(newRow.status);

          if (isPending && !wasPending && realtimeReady.current && !processedIds.current.has(newRow.id)) {
            processedIds.current.add(newRow.id);
            playSound();
            const isTable = newRow.delivery_type === 'table';
            toast.success(
              isTable ? '🍽️ Novo pedido de mesa!' : '🍕 Novo pedido pendente!',
              {
                description: `Pedido #${newRow.order_number}`,
                duration: 10000,
                action: {
                  label: 'Ver',
                  onClick: () => navigate(`/admin/orders/${newRow.id}`),
                },
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playSound, refetch, queryClient, navigate, storeId]);

  // "Mark as seen" - visual only, doesn't change order status
  const markAsSeen = useCallback(() => {
    setSeenAt(new Date().toISOString());
  }, []);

  // Reset "seen" when new orders arrive (counts change and are higher)
  const prevTotal = useRef(counts.total);
  useEffect(() => {
    if (counts.total > prevTotal.current && seenAt) {
      // New orders came in after marking as seen
      setSeenAt(null);
    }
    prevTotal.current = counts.total;
  }, [counts.total, seenAt]);

  return {
    counts,
    /** Visual badge count (0 if marked as seen, real count otherwise) */
    badgeCount: seenAt ? 0 : counts.total,
    markAsSeen,
    refetch,
  };
}
