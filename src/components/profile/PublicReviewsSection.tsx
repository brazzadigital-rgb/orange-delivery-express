import { Star, MessageCircle, ChevronRight } from 'lucide-react';
import { usePublicReviews, useReviewsStats } from '@/hooks/usePublicReviews';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PublicReviewsSection() {
  const { data: reviews, isLoading: reviewsLoading } = usePublicReviews(6);
  const { data: stats, isLoading: statsLoading } = useReviewsStats();

  if (reviewsLoading || statsLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-64 flex-shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Don't show if no reviews
  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-base">O que estão falando</h3>
        </div>
        {stats && stats.total > 0 && (
          <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-sm font-semibold text-primary">{stats.average}</span>
            <span className="text-xs text-muted-foreground">({stats.total})</span>
          </div>
        )}
      </div>

      {/* Horizontal scroll reviews */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="flex-shrink-0 w-64 snap-center card-premium p-4 space-y-2.5"
          >
            {/* User and rating */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                  {review.user_name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-sm">{review.user_name}</span>
              </div>
              <div className="flex items-center gap-0.5">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-accent fill-accent" />
                ))}
              </div>
            </div>

            {/* Comment */}
            {review.comment && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                "{review.comment}"
              </p>
            )}

            {/* Time */}
            <p className="text-xs text-muted-foreground/70">
              {formatDistanceToNow(new Date(review.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </p>
          </div>
        ))}

        {/* See more card */}
        {stats && stats.total > 6 && (
          <div className="flex-shrink-0 w-32 snap-center card-premium p-4 flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">
              +{stats.total - 6} avaliações
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
