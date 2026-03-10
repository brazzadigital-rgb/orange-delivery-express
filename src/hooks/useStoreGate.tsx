import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';

export type StoreGate = 'open' | 'past_due' | 'blocked';

export function useStoreGate() {
  const storeId = useStoreId();

  return useQuery({
    queryKey: ['store-billing-gate', storeId],
    queryFn: async () => {
      if (!storeId) return 'open' as StoreGate;
      const { data, error } = await supabase.rpc('get_billing_gate', { p_store_id: storeId });
      if (error) {
        console.error('Error fetching billing gate:', error);
        return 'open' as StoreGate; // fail open to avoid blocking customers on error
      }
      return (data || 'open') as StoreGate;
    },
    enabled: !!storeId,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
