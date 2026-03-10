import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { AppReviewSettings } from './useAppReviews';

export interface AdminReview {
  id: string;
  store_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  contact_allowed: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'pwa' | null;
  app_version: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface ReviewMetrics {
  totalReviews: number;
  averageRating: number;
  percentHighRating: number;
  ratingDistribution: Record<number, number>;
}

export interface ReviewFilters {
  rating?: number;
  hasComment?: boolean;
  startDate?: string;
  endDate?: string;
}

export function useAdminReviews(filters?: ReviewFilters) {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['admin-reviews', storeId, filters],
    queryFn: async () => {
      let query = supabase
        .from('app_reviews')
        .select(`*, profiles!inner(name, email)`)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (filters?.rating) query = query.eq('rating', filters.rating);
      if (filters?.hasComment !== undefined) {
        if (filters.hasComment) query = query.not('comment', 'is', null);
        else query = query.is('comment', null);
      }
      if (filters?.startDate) query = query.gte('created_at', filters.startDate);
      if (filters?.endDate) query = query.lte('created_at', filters.endDate);

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((review: any) => ({
        ...review,
        user_name: review.profiles?.name || 'Usuário',
        user_email: review.profiles?.email || '',
        profiles: undefined,
      })) as AdminReview[];
    },
  });
}

export function useReviewMetrics() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['review-metrics', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_reviews')
        .select('rating')
        .eq('store_id', storeId);

      if (error) throw error;
      const reviews = data || [];
      const totalReviews = reviews.length;
      if (totalReviews === 0) {
        return { totalReviews: 0, averageRating: 0, percentHighRating: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } } as ReviewMetrics;
      }
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      const averageRating = sum / totalReviews;
      const highRatings = reviews.filter((r) => r.rating >= 4).length;
      const percentHighRating = (highRatings / totalReviews) * 100;
      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach((r) => { ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1; });
      return { totalReviews, averageRating, percentHighRating, ratingDistribution } as ReviewMetrics;
    },
  });
}

export function useAdminReviewSettings() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['admin-review-settings', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_app_review_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();
      if (error) throw error;
      return data as AppReviewSettings | null;
    },
  });
}

export function useUpdateReviewSettings() {
  const queryClient = useQueryClient();
  const storeId = useStoreId();

  return useMutation({
    mutationFn: async (settings: Partial<AppReviewSettings>) => {
      const { data: existing } = await supabase
        .from('store_app_review_settings')
        .select('store_id')
        .eq('store_id', storeId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('store_app_review_settings')
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq('store_id', storeId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('store_app_review_settings')
          .insert({ store_id: storeId, ...settings })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-review-settings'] });
      queryClient.invalidateQueries({ queryKey: ['app-review-settings'] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (error) => {
      console.error('Error saving review settings:', error);
      toast.error('Erro ao salvar configurações');
    },
  });
}
