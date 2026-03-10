import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';

export type BillingGate = 'open' | 'past_due' | 'blocked';

interface BillingSettings {
  id: string;
  store_id: string;
  plan_name: string;
  monthly_price: number;
  currency: string;
  status: string;
  grace_period_days: number;
  mp_preapproval_id: string | null;
  mp_init_point: string | null;
  mp_payer_email: string | null;
  next_due_date: string | null;
  last_payment_date: string | null;
  last_payment_amount: number | null;
  last_mp_status: string | null;
  current_plan_code: string | null;
  current_plan_months: number | null;
  current_plan_amount: number | null;
  current_plan_discount_percent: number | null;
  updated_at: string;
}

export function computeBillingGate(settings: BillingSettings | null): BillingGate {
  if (!settings) return 'blocked';

  const { status, last_mp_status, next_due_date, grace_period_days } = settings;

  if (status === 'suspended' || last_mp_status === 'cancelled') return 'blocked';
  if (status === 'pending') return 'blocked';
  if (status === 'trial' || status === 'trialing') {
    // Check if trial has expired
    if (next_due_date) {
      const now = new Date();
      const due = new Date(next_due_date);
      if (now > due) return 'blocked';
    }
    return 'open';
  }

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

export function useBillingSettings(overrideStoreId?: string) {
  const resolvedId = useStoreId();
  const storeId = overrideStoreId || resolvedId;

  return useQuery({
    queryKey: ['billing-settings', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) throw error;
      return data as BillingSettings | null;
    },
    enabled: !!storeId,
    staleTime: 30_000,
  });
}

export function useBillingGate() {
  const { data: settings, isLoading: settingsLoading } = useBillingSettings();
  const resolvedId = useStoreId();

  const { data: rpcGate, isLoading: rpcLoading } = useQuery({
    queryKey: ['billing-gate-rpc', resolvedId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_billing_gate', { p_store_id: resolvedId });
      if (error) {
        console.error('Error fetching billing gate:', error);
        return 'open' as BillingGate;
      }
      return (data || 'open') as BillingGate;
    },
    enabled: !!resolvedId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const gate = rpcGate || computeBillingGate(settings);
  const isLoading = settingsLoading || rpcLoading;
  return { gate, settings, isLoading };
}

export function useBillingPayments() {
  return useQuery({
    queryKey: ['billing-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePreapproval() {
  const queryClient = useQueryClient();
  const storeId = useStoreId();

  return useMutation({
    mutationFn: async ({ payerEmail, planCode }: { payerEmail: string; planCode: string }) => {
      const { data, error } = await supabase.functions.invoke('create-preapproval', {
        body: { payer_email: payerEmail, plan_code: planCode, store_id: storeId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-settings', storeId] });
    },
  });
}

export function useBillingSync() {
  const queryClient = useQueryClient();
  const storeId = useStoreId();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('billing-sync', {
        body: { store_id: storeId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-settings', storeId] });
    },
  });
}

export function useBillingSimulate() {
  const queryClient = useQueryClient();
  const storeId = useStoreId();

  return useMutation({
    mutationFn: async (action: 'approve' | 'pause' | 'cancel' | 'expire') => {
      const { data, error } = await supabase.functions.invoke('billing-simulate', {
        body: { action, store_id: storeId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-settings', storeId] });
    },
  });
}
