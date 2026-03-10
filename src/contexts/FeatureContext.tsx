import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';

export interface StoreFeatures {
  table_service: boolean;
  waiter_app: boolean;
  courier_app: boolean;
  loyalty_points: boolean;
  kitchen_kds: boolean;
}

const ALL_ENABLED: StoreFeatures = {
  table_service: true,
  waiter_app: true,
  courier_app: true,
  loyalty_points: true,
  kitchen_kds: true,
};

interface FeatureContextValue {
  features: StoreFeatures;
  isLoaded: boolean;
  hasFeature: (key: keyof StoreFeatures) => boolean;
}

const FeatureContext = createContext<FeatureContextValue | undefined>(undefined);

export function FeatureProvider({ children }: { children: ReactNode }) {
  const storeId = useStoreId();
  const [features, setFeatures] = useState<StoreFeatures>(ALL_ENABLED);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchFeatures = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('store_features')
        .select('features')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) throw error;

      if (data?.features) {
        const f = data.features as Record<string, unknown>;
        setFeatures({
          table_service: f.table_service !== false,
          waiter_app: f.waiter_app !== false,
          courier_app: f.courier_app !== false,
          loyalty_points: f.loyalty_points !== false,
          kitchen_kds: f.kitchen_kds !== false,
        });
      }
    } catch (err) {
      console.error('[Features] Failed to fetch:', err);
    } finally {
      setIsLoaded(true);
    }
  }, [storeId]);

  useEffect(() => {
    fetchFeatures();

    const channel = supabase
      .channel(`store-features-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'store_features',
          filter: `store_id=eq.${storeId}`,
        },
        () => {
          fetchFeatures();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFeatures, storeId]);

  const hasFeature = useCallback(
    (key: keyof StoreFeatures) => features[key],
    [features]
  );

  return (
    <FeatureContext.Provider value={{ features, isLoaded, hasFeature }}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeatures() {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatures must be used within FeatureProvider');
  }
  return context;
}
