import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNotificationPreferences } from './useNotificationPreferences';
import { AudioManager } from '@/lib/AudioManager';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  data: any;
  created_at: string;
}

export function useOrderNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { preferences } = useNotificationPreferences();
  const preferencesRef = useRef(preferences);

  // Keep ref in sync
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  const playNotificationSound = useCallback(() => {
    const prefs = preferencesRef.current;
    if (prefs?.order_sound_enabled === false) return;
    
    const soundType = (prefs?.order_sound_type as 'soft_chime' | 'pop' | 'bell') || 'soft_chime';
    const volume = prefs?.order_sound_volume ?? 0.8;
    const soundUrl =
      soundType === 'soft_chime'
        ? '/sounds/soft-chime.mp3'
        : soundType === 'pop'
          ? '/sounds/pop-v2.mp3'
          : '/sounds/bell.mp3';
    
    // Create and play audio with user's preferred sound
    const audio = new Audio(soundUrl);
    audio.volume = volume;
    audio.play().catch((err) => {
      console.warn('[OrderNotifications] Could not play sound:', err);
    });
    
    // Vibrate if enabled
    if (prefs?.vibration_enabled !== false) {
      AudioManager.vibrate([200, 100, 200]);
    }
  }, []);

  const showPushNotification = useCallback((title: string, body: string, icon?: string) => {
    // Try browser push notification first
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/notification-badge.svg',
        tag: 'order-update',
      });
    }
    
    // Always show toast as fallback/supplement
    toast(title, {
      description: body,
      duration: 8000,
      action: {
        label: 'Ver',
        onClick: () => {
          // Navigate to orders
          window.location.href = '/app/orders';
        },
      },
    });
    
    playNotificationSound();
  }, [playNotificationSound]);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Subscribe to new notifications for this user
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          
          // Show push notification
          showPushNotification(notification.title, notification.body);
          
          // Invalidate notifications cache
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          
          // If it's an order notification, also update orders
          if (notification.type === 'order') {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, showPushNotification, queryClient]);

  return {
    requestPermission,
    showPushNotification,
    playNotificationSound,
  };
}

// Hook to request notification permission on app load
export function useNotificationPermission() {
  useEffect(() => {
    // Request permission after a delay to not be intrusive
    const timer = setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'default') {
        // We'll request on user interaction instead
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);
}
