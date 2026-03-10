import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { LoyaltySettings, LoyaltyReward, LoyaltyWallet, LoyaltyTransaction, LoyaltyRedemption } from './useLoyalty';

// Pending points order interface
export interface PendingPointsOrder {
  id: string;
  order_number: number;
  total: number;
  loyalty_points_earned: number;
  created_at: string;
  status: string;
  user_id: string;
  profile?: { name: string | null; email: string | null } | null;
}

// Admin hook for loyalty settings with upsert
export function useAdminLoyaltySettings() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['admin-loyalty-settings', storeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('store_loyalty_settings').select('*').eq('store_id', storeId).maybeSingle();
      if (error) throw error;
      return data as LoyaltySettings | null;
    },
  });
}

export function useUpsertLoyaltySettings() {
  const queryClient = useQueryClient();
  const storeId = useStoreId();
  return useMutation({
    mutationFn: async (settings: Partial<LoyaltySettings>) => {
      const { data, error } = await supabase.from('store_loyalty_settings').upsert({ store_id: storeId, ...settings }, { onConflict: 'store_id' }).select().single();
      if (error) throw error;
      return data as LoyaltySettings;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-loyalty-settings'] }); queryClient.invalidateQueries({ queryKey: ['loyalty-settings'] }); toast.success('Configurações salvas com sucesso!'); },
    onError: (error: any) => { toast.error(error.message || 'Erro ao salvar configurações'); },
  });
}

// Hook for pending points orders (when auto_credit is disabled)
export function usePendingPointsOrders() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['pending-points-orders', storeId],
    queryFn: async () => {
      const { data: settings } = await supabase.from('store_loyalty_settings').select('credit_on_status, min_order_to_earn').eq('store_id', storeId).single();
      const creditStatus = settings?.credit_on_status || 'delivered';
      const minOrder = settings?.min_order_to_earn || 0;

      const { data: orders, error } = await supabase.from('orders')
        .select('id, order_number, total, loyalty_points_earned, created_at, status, user_id')
        .eq('store_id', storeId).eq('status', creditStatus as any).eq('loyalty_earn_processed', false).gte('total', minOrder).gt('loyalty_points_earned', 0)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!orders || orders.length === 0) return [];

      const userIds = [...new Set(orders.map(o => o.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, name, email').in('id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return orders.map(order => ({ ...order, profile: profileMap.get(order.user_id) || null })) as PendingPointsOrder[];
    },
  });
}

// Hook to approve pending points manually
export function useApprovePoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc('approve_loyalty_points', { p_order_id: orderId });
      if (error) throw error;
      if (!data) throw new Error('Não foi possível aprovar os pontos');
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pending-points-orders'] }); queryClient.invalidateQueries({ queryKey: ['admin-loyalty-wallets'] }); queryClient.invalidateQueries({ queryKey: ['admin-loyalty-stats'] }); toast.success('Pontos aprovados e creditados!'); },
    onError: (error: any) => { toast.error(error.message || 'Erro ao aprovar pontos'); },
  });
}

// Hook to approve all pending points
export function useApproveAllPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderIds: string[]) => {
      const results = await Promise.all(orderIds.map(id => supabase.rpc('approve_loyalty_points', { p_order_id: id })));
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw new Error(`${errors.length} erro(s) ao aprovar pontos`);
      return results.length;
    },
    onSuccess: (count) => { queryClient.invalidateQueries({ queryKey: ['pending-points-orders'] }); queryClient.invalidateQueries({ queryKey: ['admin-loyalty-wallets'] }); queryClient.invalidateQueries({ queryKey: ['admin-loyalty-stats'] }); toast.success(`${count} pedido(s) aprovado(s)!`); },
    onError: (error: any) => { toast.error(error.message || 'Erro ao aprovar pontos'); },
  });
}

// Admin hook for rewards CRUD
export function useAdminLoyaltyRewards() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['admin-loyalty-rewards', storeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('loyalty_rewards').select('*').eq('store_id', storeId).order('sort_order');
      if (error) throw error;
      return data as LoyaltyReward[];
    },
  });
}

export function useCreateLoyaltyReward() {
  const queryClient = useQueryClient();
  const storeId = useStoreId();
  return useMutation({
    mutationFn: async (reward: Omit<LoyaltyReward, 'id' | 'store_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('loyalty_rewards').insert({ store_id: storeId, ...reward }).select().single();
      if (error) throw error;
      return data as LoyaltyReward;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-loyalty-rewards'] }); queryClient.invalidateQueries({ queryKey: ['loyalty-rewards'] }); toast.success('Recompensa criada com sucesso!'); },
    onError: (error: any) => { toast.error(error.message || 'Erro ao criar recompensa'); },
  });
}

export function useUpdateLoyaltyReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LoyaltyReward> & { id: string }) => {
      const { data, error } = await supabase.from('loyalty_rewards').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as LoyaltyReward;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-loyalty-rewards'] }); queryClient.invalidateQueries({ queryKey: ['loyalty-rewards'] }); toast.success('Recompensa atualizada!'); },
    onError: (error: any) => { toast.error(error.message || 'Erro ao atualizar recompensa'); },
  });
}

export function useDeleteLoyaltyReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('loyalty_rewards').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-loyalty-rewards'] }); queryClient.invalidateQueries({ queryKey: ['loyalty-rewards'] }); toast.success('Recompensa removida!'); },
    onError: (error: any) => { toast.error(error.message || 'Erro ao remover recompensa'); },
  });
}

// Admin hook for customer wallets
export interface LoyaltyWalletWithProfile extends LoyaltyWallet {
  profile?: { name: string | null; email: string | null; phone: string | null } | null;
}

export function useAdminLoyaltyWallets(searchTerm?: string) {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['admin-loyalty-wallets', storeId, searchTerm],
    queryFn: async () => {
      const { data: wallets, error: walletsError } = await supabase.from('loyalty_wallets').select('*').eq('store_id', storeId).order('points_balance', { ascending: false }).limit(100);
      if (walletsError) throw walletsError;
      if (!wallets || wallets.length === 0) return [];

      const userIds = [...new Set(wallets.map(w => w.user_id))];
      const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, name, email, phone').in('id', userIds);
      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      const result: LoyaltyWalletWithProfile[] = wallets.map(wallet => ({ ...wallet, profile: profileMap.get(wallet.user_id) || null }));

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return result.filter(w => w.profile?.name?.toLowerCase().includes(term) || w.profile?.email?.toLowerCase().includes(term) || w.profile?.phone?.includes(term));
      }
      return result;
    },
  });
}

// Admin hook for customer transactions
export function useAdminCustomerTransactions(userId: string) {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['admin-loyalty-transactions', userId, storeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('loyalty_transactions').select('*').eq('store_id', storeId).eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data as LoyaltyTransaction[];
    },
    enabled: !!userId,
  });
}

// Admin hook to adjust points
export function useAdjustPoints() {
  const queryClient = useQueryClient();
  const storeId = useStoreId();
  return useMutation({
    mutationFn: async ({ userId, points, description }: { userId: string; points: number; description: string }) => {
      let { data: wallet, error: walletError } = await supabase.from('loyalty_wallets').select('*').eq('store_id', storeId).eq('user_id', userId).maybeSingle();
      if (walletError) throw walletError;

      if (!wallet) {
        const { data: newWallet, error: createError } = await supabase.from('loyalty_wallets').insert({ store_id: storeId, user_id: userId, points_balance: 0, points_pending: 0, lifetime_earned: 0, lifetime_spent: 0 }).select().single();
        if (createError) throw createError;
        wallet = newWallet;
      }

      const { error: txError } = await supabase.from('loyalty_transactions').insert({ store_id: storeId, user_id: userId, type: 'adjustment', points, description, meta: { adjusted_by: 'admin' } });
      if (txError) throw txError;

      const newBalance = (wallet.points_balance || 0) + points;
      const lifetimeUpdate = points > 0 ? { lifetime_earned: (wallet.lifetime_earned || 0) + points } : { lifetime_spent: (wallet.lifetime_spent || 0) + Math.abs(points) };
      const { error: updateError } = await supabase.from('loyalty_wallets').update({ points_balance: Math.max(0, newBalance), ...lifetimeUpdate }).eq('id', wallet.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-loyalty-wallets'] }); queryClient.invalidateQueries({ queryKey: ['admin-loyalty-transactions'] }); toast.success('Pontos ajustados com sucesso!'); },
    onError: (error: any) => { toast.error(error.message || 'Erro ao ajustar pontos'); },
  });
}

// Admin loyalty reports/stats
export function useAdminLoyaltyStats() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['admin-loyalty-stats', storeId],
    queryFn: async () => {
      const { data: wallets } = await supabase.from('loyalty_wallets').select('points_balance, points_pending, lifetime_earned, lifetime_spent').eq('store_id', storeId);
      const totals = (wallets || []).reduce((acc, w) => ({
        totalBalance: acc.totalBalance + (w.points_balance || 0), totalPending: acc.totalPending + (w.points_pending || 0),
        totalEarned: acc.totalEarned + (w.lifetime_earned || 0), totalSpent: acc.totalSpent + (w.lifetime_spent || 0), customerCount: acc.customerCount + 1,
      }), { totalBalance: 0, totalPending: 0, totalEarned: 0, totalSpent: 0, customerCount: 0 });

      const { data: redemptions } = await supabase.from('loyalty_redemptions').select('status, points_spent').eq('store_id', storeId);
      const redemptionStats = (redemptions || []).reduce((acc, r) => ({
        totalRedemptions: acc.totalRedemptions + 1,
        appliedRedemptions: acc.appliedRedemptions + (r.status === 'applied' || r.status === 'consumed' ? 1 : 0),
        pointsRedeemed: acc.pointsRedeemed + (r.status === 'applied' || r.status === 'consumed' ? r.points_spent : 0),
      }), { totalRedemptions: 0, appliedRedemptions: 0, pointsRedeemed: 0 });

      return { ...totals, ...redemptionStats };
    },
  });
}

// Create demo rewards
export function useCreateDemoRewards() {
  const queryClient = useQueryClient();
  const storeId = useStoreId();
  return useMutation({
    mutationFn: async () => {
      const demoRewards = [
        { store_id: storeId, name: 'Frete Grátis', description: 'Troque seus pontos por frete grátis', type: 'free_shipping' as const, points_cost: 80, active: true, constraints: { max_shipping_value: 15, min_order_value: 35 }, sort_order: 0 },
        { store_id: storeId, name: 'R$ 10 de Desconto', description: 'Desconto de R$ 10 no seu pedido', type: 'discount_amount' as const, points_cost: 120, active: true, constraints: { amount: 10, min_order_value: 60 }, sort_order: 1 },
        { store_id: storeId, name: 'Pizza Grátis 8 Fatias', description: 'Ganhe uma pizza de 8 fatias grátis', type: 'free_item' as const, points_cost: 250, active: true, constraints: { max_qty: 1 }, sort_order: 2 },
      ];
      const { error } = await supabase.from('loyalty_rewards').insert(demoRewards);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-loyalty-rewards'] }); queryClient.invalidateQueries({ queryKey: ['loyalty-rewards'] }); toast.success('Recompensas demo criadas!'); },
  });
}
