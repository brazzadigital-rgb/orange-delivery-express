import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface AppReviewSettings {
  store_id: string;
  enabled: boolean;
  min_days_between_reviews: number;
  play_store_url: string | null;
  app_store_url: string | null;
  review_prompt_title: string;
  review_prompt_subtitle: string;
  thank_you_message: string;
}

export interface AppReview {
  id: string;
  store_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  contact_allowed: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'pwa' | null;
  app_version: string | null;
  created_at: string;
}

const DEFAULT_SETTINGS: Omit<AppReviewSettings, 'store_id'> = {
  enabled: true,
  min_days_between_reviews: 30,
  play_store_url: null,
  app_store_url: null,
  review_prompt_title: 'Avaliar o app',
  review_prompt_subtitle: 'Conte como foi sua experiência',
  thank_you_message: 'Obrigado pela avaliação! 🙌',
};

export function detectPlatform(): 'ios' | 'android' | 'desktop' | 'pwa' {
  const ua = navigator.userAgent.toLowerCase();
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  if (/iphone|ipad|ipod/.test(ua)) return isStandalone ? 'pwa' : 'ios';
  if (/android/.test(ua)) return isStandalone ? 'pwa' : 'android';
  return 'desktop';
}

export function getStoreUrl(settings: AppReviewSettings | null): string | null {
  if (!settings) return null;
  const platform = detectPlatform();
  if (platform === 'ios' && settings.app_store_url) return settings.app_store_url;
  if (platform === 'android' && settings.play_store_url) return settings.play_store_url;
  return settings.play_store_url || settings.app_store_url || null;
}

export function useReviewSettings() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['app-review-settings', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_app_review_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return { store_id: storeId, ...DEFAULT_SETTINGS } as AppReviewSettings;
      return data as AppReviewSettings;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCanSubmitReview() {
  const { user } = useAuth();
  const storeId = useStoreId();

  return useQuery({
    queryKey: ['can-submit-review', user?.id, storeId],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('can_submit_review', {
        p_user_id: user.id,
        p_store_id: storeId,
      });
      if (error) { console.error('Error checking review eligibility:', error); return true; }
      return data as boolean;
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });
}

export function useLastReview() {
  const { user } = useAuth();
  const storeId = useStoreId();

  return useQuery({
    queryKey: ['last-review', user?.id, storeId],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('app_reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as AppReview | null;
    },
    enabled: !!user,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const storeId = useStoreId();

  return useMutation({
    mutationFn: async ({ rating, comment, contactAllowed }: { rating: number; comment?: string; contactAllowed?: boolean }) => {
      if (!user) throw new Error('User not authenticated');
      const platform = detectPlatform();
      const { data, error } = await supabase
        .from('app_reviews')
        .insert({
          store_id: storeId,
          user_id: user.id,
          rating,
          comment: comment || null,
          contact_allowed: contactAllowed || false,
          platform,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['can-submit-review'] });
      queryClient.invalidateQueries({ queryKey: ['last-review'] });
    },
    onError: (error) => {
      console.error('Error submitting review:', error);
      toast.error('Erro ao enviar avaliação. Tente novamente.');
    },
  });
}
