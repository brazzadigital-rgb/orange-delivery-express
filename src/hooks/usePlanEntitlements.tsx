import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';

export interface PlanEntitlements {
  plan_slug: string;
  plan_name: string;
  max_products: number | null;
  max_categories: number | null;
  max_orders_per_month: number | null;
  max_users: number | null;
  max_drivers: number | null;
  has_analytics: boolean;
  has_api_access: boolean;
  has_custom_domain: boolean;
  has_priority_support: boolean;
  subscription_status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  billing_cycle: string;
}

export interface StoreUsage {
  orders_this_month: number;
  products_count: number;
  categories_count: number;
  users_count: number;
  drivers_count: number;
}

export function usePlanEntitlements() {
  const storeId = useStoreId();

  const { data: entitlements, isLoading: entitlementsLoading } = useQuery({
    queryKey: ['plan-entitlements', storeId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_store_plan_entitlements', {
        p_store_id: storeId,
      });
      if (error) {
        console.error('[PlanEntitlements] RPC error:', error);
        return null;
      }
      // RPC returns an array of rows, take first
      const row = Array.isArray(data) ? data[0] : data;
      return (row as unknown as PlanEntitlements) || null;
    },
    enabled: !!storeId,
    staleTime: 60_000,
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['store-usage', storeId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_store_current_usage', {
        p_store_id: storeId,
      });
      if (error) {
        console.error('[StoreUsage] RPC error:', error);
        return null;
      }
      const row = Array.isArray(data) ? data[0] : data;
      return (row as StoreUsage) || null;
    },
    enabled: !!storeId,
    staleTime: 30_000,
  });

  const isLoading = entitlementsLoading || usageLoading;

  /** Check if a specific limit has been reached */
  const isLimitReached = (limitType: 'products' | 'categories' | 'orders' | 'users' | 'drivers'): boolean => {
    if (!entitlements || !usage) return false;

    const limitMap: Record<string, { limit: number | null; current: number }> = {
      products: { limit: entitlements.max_products, current: usage.products_count },
      categories: { limit: entitlements.max_categories, current: usage.categories_count },
      orders: { limit: entitlements.max_orders_per_month, current: usage.orders_this_month },
      users: { limit: entitlements.max_users, current: usage.users_count },
      drivers: { limit: entitlements.max_drivers, current: usage.drivers_count },
    };

    const entry = limitMap[limitType];
    if (!entry || entry.limit === null) return false; // null = unlimited
    return entry.current >= entry.limit;
  };

  /** Check if the plan has a specific feature */
  const hasPlanFeature = (feature: 'analytics' | 'api_access' | 'custom_domain' | 'priority_support'): boolean => {
    if (!entitlements) return true; // fail open
    const featureMap: Record<string, boolean> = {
      analytics: entitlements.has_analytics,
      api_access: entitlements.has_api_access,
      custom_domain: entitlements.has_custom_domain,
      priority_support: entitlements.has_priority_support,
    };
    return featureMap[feature] ?? true;
  };

  const isFree = entitlements?.plan_slug === 'free';
  const isTrialing = entitlements?.subscription_status === 'trialing';

  return {
    entitlements,
    usage,
    isLoading,
    isLimitReached,
    hasPlanFeature,
    isFree,
    isTrialing,
  };
}
