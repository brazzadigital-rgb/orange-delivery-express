import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { supabase as supabaseClient } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Types
export interface Promotion {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  discount_type: string;
  discount_value: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  target_audience: 'all' | 'customers' | 'inactive_30d' | 'vip';
  created_at: string;
}

export interface PromotionFormData {
  title: string;
  description?: string;
  banner_url?: string;
  discount_type: string;
  discount_value: number;
  starts_at?: string;
  ends_at?: string;
  active?: boolean;
  target_audience?: 'all' | 'customers' | 'inactive_30d' | 'vip';
}

export function usePromotions() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['promotions', storeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('promotions').select('*').eq('store_id', storeId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Promotion[];
    },
  });
}

export function useActivePromotions() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['active-promotions', storeId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotions').select('*').eq('store_id', storeId).eq('active', true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Promotion[];
    },
  });
}

export function usePromotion(id: string) {
  return useQuery({
    queryKey: ['promotion', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('promotions').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Promotion;
    },
    enabled: !!id,
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();
  const storeId = useStoreId();

  return useMutation({
    mutationFn: async (formData: PromotionFormData) => {
      const { data, error } = await supabase.from('promotions').insert({ store_id: storeId, ...formData }).select().single();
      if (error) throw error;
      return data as Promotion;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['promotions'] }); toast.success('Promoção criada com sucesso!'); },
    onError: (error: Error) => { toast.error(error.message || 'Erro ao criar promoção'); },
  });
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PromotionFormData> }) => {
      const { error } = await supabase.from('promotions').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['promotions'] }); toast.success('Promoção atualizada com sucesso!'); },
    onError: (error: Error) => { toast.error(error.message || 'Erro ao atualizar promoção'); },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('promotions').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['promotions'] }); toast.success('Promoção excluída!'); },
    onError: (error: Error) => { toast.error(error.message || 'Erro ao excluir promoção'); },
  });
}

export function usePublishPromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (promotion: Promotion) => {
      const { error: updateError } = await supabase.from('promotions').update({ active: true }).eq('id', promotion.id);
      if (updateError) throw updateError;

      // Only notify users who have ordered from THIS store (not all users globally)
      const { data: storeOrders } = await supabase
        .from('orders')
        .select('user_id')
        .eq('store_id', promotion.store_id)
        .not('user_id', 'is', null);

      const uniqueUserIds = [...new Set((storeOrders || []).map(o => o.user_id).filter(Boolean))] as string[];
      const users = uniqueUserIds.map(id => ({ id }));
      const usersError = null;

      let pushSentCount = 0;
      if (users && users.length > 0) {
        const notifications = users.map(user => ({
          user_id: user.id,
          title: `🎉 ${promotion.title}`,
          body: promotion.description || 'Confira nossa nova promoção!',
          type: 'promo' as const,
          data: { promotion_id: promotion.id },
        }));

        const { error: notifError } = await supabase.from('notifications').insert(notifications);
        if (notifError) throw notifError;

        const pushPromises = users.map(async (user) => {
          try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(await supabaseClient.auth.getSession()).data.session?.access_token}`,
              },
              body: JSON.stringify({
                user_id: user.id,
                title: `🎉 ${promotion.title}`,
                body: promotion.description || 'Confira nossa nova promoção!',
                url: '/app/home',
                tag: `promo-${promotion.id}`,
                image: promotion.banner_url || null,
                data: { promotion_id: promotion.id },
              }),
            });
            if (response.ok) { const result = await response.json(); return result.sent || 0; }
            return 0;
          } catch (e) {
            console.warn('[usePromotions] Failed to send push to user:', user.id, e);
            return 0;
          }
        });

        const pushResults = await Promise.all(pushPromises);
        pushSentCount = pushResults.reduce((acc, count) => acc + count, 0);
      }

      return { notified: users?.length || 0, pushSent: pushSentCount };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['active-promotions'] });
      toast.success(`Promoção publicada! ${data.notified} usuários notificados${data.pushSent > 0 ? ` (${data.pushSent} push enviados)` : ''}.`);
    },
    onError: (error: Error) => { toast.error(error.message || 'Erro ao publicar promoção'); },
  });
}
