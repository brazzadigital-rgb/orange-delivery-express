import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNotificationPreferences } from './useNotificationPreferences';
import { useAudioUnlock } from './useAudioUnlock';
import { AudioManager, OrderStatus } from '@/lib/AudioManager';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface OrderStatusCache {
  [orderId: string]: {
    status: string;
    lastUpdated: number;
  };
}

const STATUS_MESSAGES: Record<string, { title: string; description: string }> = {
  accepted: { title: '🎉 Pedido aceito!', description: 'A cozinha já está preparando seu pedido' },
  preparing: { title: '👨‍🍳 Em preparo', description: 'Seu pedido está sendo preparado' },
  ready: { title: '✅ Pronto!', description: 'Seu pedido está pronto' },
  out_for_delivery: { title: '🛵 Saiu para entrega!', description: 'O entregador está a caminho' },
  delivered: { title: '📦 Entregue!', description: 'Seu pedido foi entregue. Bom apetite!' },
};

// Debounce map to prevent duplicate notifications
const notificationDebounce = new Map<string, number>();
const DEBOUNCE_MS = 2000;

export function useCustomerOrderNotifications() {
  const { user } = useAuth();
  const { preferences } = useNotificationPreferences();
  const { isUnlocked, unlock, promptUnlock } = useAudioUnlock();
  const queryClient = useQueryClient();
  
  // Cache of known order statuses to detect changes
  const statusCacheRef = useRef<OrderStatusCache>({});
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Store refs for latest values to avoid stale closures
  const isUnlockedRef = useRef(isUnlocked);
  const preferencesRef = useRef(preferences);
  const unlockRef = useRef(unlock);

  // Keep refs in sync
  useEffect(() => {
    isUnlockedRef.current = isUnlocked;
  }, [isUnlocked]);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    unlockRef.current = unlock;
  }, [unlock]);

  const handleStatusChange = useCallback(async (
    orderId: string,
    newStatus: string,
    oldStatus: string | null
  ) => {
    // Only process relevant status changes
    if (!STATUS_MESSAGES[newStatus]) return;
    
    // Debounce duplicate notifications for same order+status
    const debounceKey = `${orderId}-${newStatus}`;
    const lastNotified = notificationDebounce.get(debounceKey);
    const now = Date.now();
    
    if (lastNotified && now - lastNotified < DEBOUNCE_MS) {
      console.log('[CustomerNotifications] Debounced duplicate:', debounceKey);
      return;
    }
    notificationDebounce.set(debounceKey, now);
    
    // Clean old entries from debounce map
    for (const [key, timestamp] of notificationDebounce.entries()) {
      if (now - timestamp > DEBOUNCE_MS * 5) {
        notificationDebounce.delete(key);
      }
    }
    
    const statusInfo = STATUS_MESSAGES[newStatus];
    const isVisible = document.visibilityState === 'visible';
    const currentPrefs = preferencesRef.current;
    const currentUnlocked = isUnlockedRef.current;

    console.log('[CustomerNotifications] Status changed:', { 
      orderId, oldStatus, newStatus, isVisible, 
      soundEnabled: currentPrefs?.order_sound_enabled,
      audioUnlocked: currentUnlocked 
    });

    // Always show in-app notification (single toast)
    toast(statusInfo.title, {
      id: debounceKey, // Use unique ID to prevent duplicate toasts
      description: statusInfo.description,
      duration: 8000,
      action: {
        label: 'Ver',
        onClick: () => {
          window.location.href = `/app/orders/${orderId}`;
        },
      },
    });

    // Update badge/counter
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    queryClient.invalidateQueries({ queryKey: ['notifications-count'] });

    // Handle sound and vibration - use refs for current values
    if (currentPrefs?.order_sound_enabled !== false && isVisible) {
      console.log('[CustomerNotifications] Attempting to play sound, unlocked:', currentUnlocked);
      if (currentUnlocked) {
        // Play sound immediately
        try {
          const played = await AudioManager.playStatusSound(newStatus as OrderStatus, {
            volume: currentPrefs?.order_sound_volume ?? 0.8,
            vibrate: currentPrefs?.vibration_enabled !== false,
            soundType: (currentPrefs?.order_sound_type as 'soft_chime' | 'pop' | 'bell') || 'soft_chime',
          });
          console.log('[CustomerNotifications] Sound played:', played);
        } catch (err) {
          console.error('[CustomerNotifications] Sound error:', err);
        }
      } else {
        console.log('[CustomerNotifications] Audio not unlocked, attempting unlock...');
        // Try to unlock audio first (works if user has interacted with page)
        const unlocked = await unlockRef.current();
        if (unlocked) {
          try {
            await AudioManager.playStatusSound(newStatus as OrderStatus, {
              volume: currentPrefs?.order_sound_volume ?? 0.8,
              vibrate: currentPrefs?.vibration_enabled !== false,
              soundType: (currentPrefs?.order_sound_type as 'soft_chime' | 'pop' | 'bell') || 'soft_chime',
            });
          } catch (err) {
            console.error('[CustomerNotifications] Sound error after unlock:', err);
          }
        } else {
          // Only prompt if unlock failed
          promptUnlock();
        }
      }
    } else if (currentPrefs?.vibration_enabled !== false && isVisible) {
      // Vibrate even if sound is disabled
      AudioManager.vibrate([200, 100, 200]);
    }

    // If app is not visible, try to show browser notification
    if (!isVisible && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(statusInfo.title, {
          body: statusInfo.description,
          icon: '/notification-badge.svg',
          tag: `order-${orderId}-${newStatus}`,
        });
      } catch (e) {
        console.log('[CustomerNotifications] Browser notification failed:', e);
      }
    }
  }, [promptUnlock, queryClient]);

  useEffect(() => {
    if (!user) return;

    // Clean up previous subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    const channel = supabase
      .channel(`customer-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const orderId = payload.new.id as string;
          const newStatus = payload.new.status as string;
          const oldPayload = payload.old as { status?: string } | undefined;
          const oldStatus = oldPayload?.status || statusCacheRef.current[orderId]?.status || null;

          // Check if status actually changed
          if (newStatus !== oldStatus) {
            // Update cache
            statusCacheRef.current[orderId] = {
              status: newStatus,
              lastUpdated: Date.now(),
            };

            // Handle the status change
            handleStatusChange(orderId, newStatus, oldStatus);
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user, handleStatusChange]);

  // Listen to notifications table ONLY for invalidation (no duplicate toasts)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`customer-notifications-invalidate-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Only invalidate queries - no toast here (handled by orders subscription)
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    isUnlocked,
    preferences,
  };
}
