import { useState } from 'react';
import { Star, MessageCircle, ArrowLeft, Sparkles, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePublicReviews, useReviewsStats } from '@/hooks/usePublicReviews';
import { useReviewSettings, useCanSubmitReview } from '@/hooks/useAppReviews';
import { AppReviewModal } from '@/components/profile/AppReviewModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import reviewsHeroImage from '@/assets/reviews-hero.jpg';

// Premium star rating component with large, visible stars
function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} transition-all duration-200 ${
            star <= rating
              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]'
              : 'text-muted-foreground/20'
          }`}
        />
      ))}
    </div>
  );
}

// Animated badge component
function AnimatedBadge({ 
  children, 
  delay = 0,
  icon: Icon 
}: { 
  children: React.ReactNode; 
  delay?: number;
  icon?: React.ElementType;
}) {
  return (
    <div 
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/60 backdrop-blur-sm border border-border/50 text-sm font-medium animate-fade-in hover:bg-background/80 hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] transition-all duration-200"
      style={{ animationDelay: `${delay}ms` }}
    >
      {Icon && <Icon className="w-4 h-4 text-primary" />}
      {children}
    </div>
  );
}

export default function Reviews() {
  const navigate = useNavigate();
  const { data: reviews, isLoading: reviewsLoading } = usePublicReviews(50);
  const { data: stats, isLoading: statsLoading } = useReviewsStats();
  const { data: reviewSettings } = useReviewSettings();
  const { data: canSubmitReview } = useCanSubmitReview();
  const [showReviewModal, setShowReviewModal] = useState(false);

  const isLoading = reviewsLoading || statsLoading;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Premium gradient background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(60% 40% at 20% 10%, hsl(var(--primary) / 0.15) 0%, transparent 60%),
            radial-gradient(50% 35% at 90% 5%, hsl(var(--destructive) / 0.1) 0%, transparent 60%),
            linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.3) 100%)
          `
        }}
      />
      
      {/* Subtle grain texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10">
        {/* Hero Banner with AI Image */}
        <div className="relative h-48 md:h-64 overflow-hidden">
          {/* Background image */}
          <img 
            src={reviewsHeroImage} 
            alt="Reviews"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, hsl(var(--background) / 0.3) 0%, hsl(var(--background) / 0.7) 60%, hsl(var(--background)) 100%)`
            }}
          />
          
          {/* Back button */}
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-background active:scale-95 transition-all duration-150"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Hero content overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 backdrop-blur-sm border border-border/50 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Avaliações verificadas</span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold">
              Avaliações do App
            </h1>
            <p className="text-muted-foreground mt-1">
              Sua opinião ajuda a melhorar a experiência.
            </p>
          </div>
        </div>

        {/* Animated badges */}
        {stats && stats.total > 0 && (
          <div className="px-4 pt-4 flex flex-wrap gap-2">
            <AnimatedBadge delay={0} icon={Star}>
              Média: {stats.average} ★
            </AnimatedBadge>
            <AnimatedBadge delay={100} icon={TrendingUp}>
              {stats.positivePercent}% positivas
            </AnimatedBadge>
            <AnimatedBadge delay={200} icon={Users}>
              {stats.total} avaliações
            </AnimatedBadge>
          </div>
        )}

        {/* CTA to rate */}
        {reviewSettings?.enabled && canSubmitReview && (
          <div className="px-4 pt-4">
            <button
              onClick={() => setShowReviewModal(true)}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold flex items-center justify-center gap-3 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
            >
              <Star className="w-5 h-5" />
              Avaliar agora
            </button>
          </div>
        )}

        {/* Stats Card - Large stars */}
        {isLoading ? (
          <div className="px-4 mb-6">
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : stats && stats.total > 0 ? (
          <div className="px-4 mb-6">
            <div className="card-premium p-5 relative overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
              
              <div className="relative flex items-center justify-between">
                {/* Average rating with large stars */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
                    <span className="text-2xl font-bold text-white">{stats.average}</span>
                  </div>
                  <div>
                    <StarRating rating={Math.round(stats.average)} size="lg" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats.total} {stats.total === 1 ? 'avaliação' : 'avaliações'}
                    </p>
                  </div>
                </div>

                {/* Positive percentage */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{stats.positivePercent}%</p>
                  <p className="text-xs text-muted-foreground">recomendam</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Reviews List */}
        <div className="px-4 pb-8 space-y-3">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))
          ) : reviews && reviews.length > 0 ? (
            reviews.map((review, index) => (
              <div
                key={review.id}
                className="card-premium p-5 space-y-3 animate-fade-in hover:-translate-y-0.5 transition-transform duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* User header with large stars */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-white font-bold shadow-md shadow-primary/20">
                      {review.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{review.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Large stars with rating number */}
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} size="md" />
                    <span className="text-lg font-bold text-foreground">{review.rating}.0</span>
                  </div>
                </div>

                {/* Comment */}
                {review.comment ? (
                  <div className="relative pl-4 border-l-2 border-primary/30">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      "{review.comment}"
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic pl-4">
                    Sem comentário
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-16 space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                <MessageCircle className="w-9 h-9 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-semibold text-lg">Ainda não há avaliações</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Seja o primeiro a avaliar!
                </p>
              </div>
              {reviewSettings?.enabled && canSubmitReview && (
                <Button
                  onClick={() => setShowReviewModal(true)}
                  className="mt-4 bg-gradient-to-r from-primary to-primary/80"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Avaliar agora
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <AppReviewModal open={showReviewModal} onOpenChange={setShowReviewModal} />
    </div>
  );
}
