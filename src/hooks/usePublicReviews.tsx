import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';

export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name: string;
}

export function usePublicReviews(limit = 10) {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['public-reviews', storeId, limit],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from('app_reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id
        `)
        .eq('store_id', storeId)
        .gte('rating', 4)
        .not('comment', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!reviews || reviews.length === 0) return [];

      const userIds = [...new Set(reviews.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

      return reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        user_name: getDisplayName(profileMap.get(review.user_id)),
      })) as PublicReview[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

function getDisplayName(name: string | null | undefined): string {
  if (!name) return 'Cliente';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

export function useReviewsStats() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['public-reviews-stats', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_reviews')
        .select('rating')
        .eq('store_id', storeId);

      if (error) throw error;
      if (!data || data.length === 0) {
        return { average: 0, total: 0, positivePercent: 0 };
      }

      const total = data.length;
      const sum = data.reduce((acc, r) => acc + r.rating, 0);
      const average = sum / total;
      const positive = data.filter(r => r.rating >= 4).length;
      const positivePercent = Math.round((positive / total) * 100);

      return { average: Math.round(average * 10) / 10, total, positivePercent };
    },
    staleTime: 5 * 60 * 1000,
  });
}
