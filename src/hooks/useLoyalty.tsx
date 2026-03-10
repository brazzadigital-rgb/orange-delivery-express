import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';

// Types
export interface LoyaltySettings {
  store_id: string;
  enabled: boolean;
  program_name: string;
  earning_rate_points_per_real: number;
  reais_per_point: number;
  min_order_to_earn: number;
  credit_on_status: 'paid' | 'accepted' | 'delivered';
  points_expire_days: number | null;
  allow_partial_redeem_shipping: boolean;
  max_points_redeem_per_order: number | null;
  auto_credit_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyWallet {
  id: string;
  store_id: string;
  user_id: string;
  points_balance: number;
  points_pending: number;
  lifetime_earned: number;
  lifetime_spent: number;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  store_id: string;
  user_id: string;
  order_id: string | null;
  type: 'earn_pending' | 'earn_posted' | 'spend' | 'expire' | 'adjustment' | 'refund_reversal';
  points: number;
  description: string;
  meta: Record<string, any> | null;
  created_at: string;
}

export interface LoyaltyReward {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  type: 'free_shipping' | 'free_item' | 'discount_amount' | 'discount_percent';
  points_cost: number;
  active: boolean;
  constraints: {
    max_shipping_value?: number;
    min_order_value?: number;
    product_id?: string;
    max_qty?: number;
    amount?: number;
    percent?: number;
  } | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyRedemption {
  id: string;
  store_id: string;
  user_id: string;
  reward_id: string;
  order_id: string | null;
  status: 'reserved' | 'applied' | 'cancelled' | 'consumed';
  points_spent: number;
  meta: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  loyalty_rewards?: LoyaltyReward;
}

export function useLoyaltySettings() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['loyalty-settings', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_loyalty_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();
      if (error) throw error;
      return data as LoyaltySettings | null;
    },
    staleTime: 60000,
  });
}

export function useLoyaltyWallet() {
  const { user } = useAuth();
  const storeId = useStoreId();

  return useQuery({
    queryKey: ['loyalty-wallet', user?.id, storeId],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('loyalty_wallets')
        .select('*')
        .eq('store_id', storeId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as LoyaltyWallet | null;
    },
    enabled: !!user,
  });
}

export function useEnsureLoyaltyWallet() {
  const { user } = useAuth();
  const storeId = useStoreId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const { data: existing } = await supabase
        .from('loyalty_wallets')
        .select('*')
        .eq('store_id', storeId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (existing) return existing as LoyaltyWallet;

      const { data, error } = await supabase
        .from('loyalty_wallets')
        .insert({ store_id: storeId, user_id: user.id, points_balance: 0, points_pending: 0, lifetime_earned: 0, lifetime_spent: 0 })
        .select()
        .single();
      if (error) throw error;
      return data as LoyaltyWallet;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['loyalty-wallet'] }); },
  });
}

export function useLoyaltyTransactions(filter?: 'all' | 'earn' | 'spend' | 'expire') {
  const { user } = useAuth();
  const storeId = useStoreId();

  return useQuery({
    queryKey: ['loyalty-transactions', user?.id, storeId, filter],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('store_id', storeId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'earn') query = query.in('type', ['earn_pending', 'earn_posted']);
      else if (filter === 'spend') query = query.eq('type', 'spend');
      else if (filter === 'expire') query = query.eq('type', 'expire');

      const { data, error } = await query;
      if (error) throw error;
      return data as LoyaltyTransaction[];
    },
    enabled: !!user,
  });
}

export function useLoyaltyRewards() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['loyalty-rewards', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('store_id', storeId)
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data as LoyaltyReward[];
    },
  });
}

export function useLoyaltyRedemptions() {
  const { user } = useAuth();
  const storeId = useStoreId();

  return useQuery({
    queryKey: ['loyalty-redemptions', user?.id, storeId],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('loyalty_redemptions')
        .select('*, loyalty_rewards(*)')
        .eq('store_id', storeId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as LoyaltyRedemption[];
    },
    enabled: !!user,
  });
}

export function useReserveReward() {
  const { user } = useAuth();
  const storeId = useStoreId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rewardId, pointsCost }: { rewardId: string; pointsCost: number }) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('loyalty_redemptions')
        .insert({ store_id: storeId, user_id: user.id, reward_id: rewardId, status: 'reserved', points_spent: pointsCost })
        .select('*, loyalty_rewards(*)')
        .single();
      if (error) throw error;
      return data as LoyaltyRedemption;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['loyalty-redemptions'] }); },
  });
}

export function useCancelRedemption() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (redemptionId: string) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('loyalty_redemptions')
        .update({ status: 'cancelled' })
        .eq('id', redemptionId)
        .eq('user_id', user.id)
        .eq('status', 'reserved');
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['loyalty-redemptions'] }); },
  });
}

export function isRewardApplicable(
  reward: LoyaltyReward,
  userBalance: number,
  orderSubtotal: number,
  deliveryFee: number
): { applicable: boolean; reason?: string } {
  if (userBalance < reward.points_cost) {
    return { applicable: false, reason: `Faltam ${reward.points_cost - userBalance} pontos` };
  }
  const constraints = reward.constraints || {};
  if (constraints.min_order_value && orderSubtotal < constraints.min_order_value) {
    return { applicable: false, reason: `Pedido mínimo: R$ ${constraints.min_order_value.toFixed(2).replace('.', ',')}` };
  }
  if (reward.type === 'free_shipping') {
    if (deliveryFee <= 0) return { applicable: false, reason: 'Frete já é grátis' };
    if (constraints.max_shipping_value && deliveryFee > constraints.max_shipping_value) {
      return { applicable: false, reason: `Frete máximo: R$ ${constraints.max_shipping_value.toFixed(2).replace('.', ',')}` };
    }
  }
  return { applicable: true };
}

export function getRewardTypeLabel(type: LoyaltyReward['type']): string {
  const labels: Record<LoyaltyReward['type'], string> = {
    free_shipping: 'Frete Grátis', free_item: 'Item Grátis', discount_amount: 'Desconto em R$', discount_percent: 'Desconto %',
  };
  return labels[type] || type;
}

export function getTransactionTypeLabel(type: LoyaltyTransaction['type']): string {
  const labels: Record<LoyaltyTransaction['type'], string> = {
    earn_pending: 'Pendente', earn_posted: 'Recebido', spend: 'Resgatado', expire: 'Expirado', adjustment: 'Ajuste', refund_reversal: 'Estorno',
  };
  return labels[type] || type;
}
