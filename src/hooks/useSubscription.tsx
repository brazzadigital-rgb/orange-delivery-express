import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type SubscriptionGate = 'open' | 'past_due' | 'blocked';

export interface Subscription {
  id: string;
  user_id: string;
  store_id: string;
  plan_code: string;
  plan_months: number;
  base_monthly_price: number;
  discount_percent: number;
  amount_per_cycle: number;
  currency: string;
  status: string;
  grace_period_days: number;
  mp_preapproval_id: string | null;
  mp_init_point: string | null;
  mp_payer_email: string | null;
  last_mp_status: string | null;
  next_due_date: string | null;
  last_payment_date: string | null;
  last_payment_amount: number | null;
  created_at: string;
  updated_at: string;
}

export function computeSubscriptionGate(sub: Subscription | null, isOwnerOrAdmin: boolean): SubscriptionGate {
  // Owners/admins always pass
  if (isOwnerOrAdmin) return 'open';
  
  // No subscription = open (no subscription required yet)
  if (!sub) return 'open';

  const { status, next_due_date, grace_period_days } = sub;

  if (status === 'suspended' || status === 'cancelled') return 'blocked';
  if (status === 'pending') return 'blocked';

  if (status === 'active') {
    if (next_due_date) {
      const now = new Date();
      const due = new Date(next_due_date);
      const graceEnd = new Date(due);
      graceEnd.setDate(graceEnd.getDate() + (grace_period_days || 2));

      if (now > graceEnd) return 'blocked';
      if (now > due) return 'past_due';
    }
    return 'open';
  }

  if (status === 'past_due') return 'past_due';

  return 'blocked';
}

/** Fetch the current user's subscription */
export function useMySubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}

/** Fetch subscription payments for the current user */
export function useMySubscriptionPayments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-subscription-payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

/** Fetch ALL subscriptions for a store (owner view) */
export function useStoreSubscriptions(storeId: string | undefined) {
  return useQuery({
    queryKey: ['store-subscriptions', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, profiles:user_id(id, name, email)')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });
}

/** Fetch payments for a specific subscription (owner view) */
export function useSubscriptionPayments(subscriptionId: string | undefined) {
  return useQuery({
    queryKey: ['subscription-payments', subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) return [];
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!subscriptionId,
  });
}

/** Create a new subscription via MP preapproval */
export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planCode, storeId }: { planCode: string; storeId: string }) => {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { plan_code: planCode, store_id: storeId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['store-subscriptions'] });
    },
  });
}

/** Sync subscription with MP */
export function useSyncSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscriptionId?: string) => {
      const { data, error } = await supabase.functions.invoke('sync-subscription', {
        body: { subscription_id: subscriptionId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['store-subscriptions'] });
    },
  });
}

/** Simulate subscription events (test mode) */
export function useSimulateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action, subscriptionId }: { action: string; subscriptionId?: string }) => {
      const { data, error } = await supabase.functions.invoke('simulate-subscription', {
        body: { action, subscription_id: subscriptionId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['store-subscriptions'] });
    },
  });
}

/** Owner creates a subscription for a user */
export function useOwnerCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, storeId, planCode }: { targetUserId: string; storeId: string; planCode: string }) => {
      const { data, error } = await supabase.functions.invoke('owner-create-subscription', {
        body: { target_user_id: targetUserId, store_id: storeId, plan_code: planCode },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-subscriptions'] });
    },
  });
}
