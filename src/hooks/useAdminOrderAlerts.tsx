import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminPreferences, playNotificationSound } from './useAdminPreferences';
import { useQueryClient } from '@tanstack/react-query';

/**
 * @deprecated Use useAdminPendingOrders instead. This hook is kept for backward compatibility
 * but is now a no-op since useAdminPendingOrders handles all alerts.
 */
export function useAdminOrderAlerts() {
  const playSound = useCallback(() => {
    // No-op - handled by useAdminPendingOrders
  }, []);

  return { playSound };
}
