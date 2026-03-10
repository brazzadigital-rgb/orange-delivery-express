import { useState } from 'react';
import { Star, Filter, Users, ChevronLeft, TrendingUp, Sparkles, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAdminReviews, useReviewMetrics, ReviewFilters } from '@/hooks/useAdminReviews';
import { cn } from '@/lib/utils';

// Premium star rating with large, visible stars
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

// Animated metric badge
function MetricBadge({ 
  label, 
  value, 
  icon: Icon,
  delay = 0 
}: { 
  label: string; 
  value: string | number;
  icon: React.ElementType;
  delay?: number;
}) {
  return (
    <div 
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 animate-fade-in hover:bg-background/80 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.01] transition-all duration-200"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-primary/20">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// Rating chip for filtering
function RatingChip({ 
  rating, 
  active, 
  count,
  onClick 
}: { 
  rating: number | 'all'; 
  active: boolean; 
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
        active 
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
          : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      {rating === 'all' ? (
        'Todas'
      ) : (
        <>
          {rating}
          <Star className={cn(
            "w-3 h-3",
            active ? "fill-primary-foreground" : "fill-muted-foreground"
          )} />
        </>
      )}
      {count !== undefined && (
        <span className={cn(
          "text-xs",
          active ? "text-primary-foreground/80" : "text-muted-foreground/60"
        )}>
          ({count})
        </span>
      )}
    </button>
  );
}

function RatingDistribution({ distribution }: { distribution: Record<number, number> }) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-2.5">
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = distribution[rating] || 0;
        const percent = total > 0 ? (count / total) * 100 : 0;

        return (
          <div key={rating} className="flex items-center gap-2.5 text-sm">
            <span className="w-4 text-muted-foreground font-medium">{rating}</span>
            <Star className="w-4 h-4 text-accent fill-accent" />
            <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="w-10 text-right text-muted-foreground font-medium">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminReviews() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ReviewFilters>({});

  const { data: reviews, isLoading: reviewsLoading } = useAdminReviews(filters);
  const { data: metrics, isLoading: metricsLoading } = useReviewMetrics();

  const handleFilterChange = (key: keyof ReviewFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const filteredCount = reviews?.length || 0;
  const totalCount = metrics?.totalReviews || 0;

  return (
    <div className="space-y-6 relative">
      {/* Premium gradient background for header area */}
      <div 
        className="absolute inset-x-0 top-0 h-80 pointer-events-none -z-10"
        style={{
          background: `
            radial-gradient(60% 50% at 20% 0%, hsl(var(--primary) / 0.08) 0%, transparent 60%),
            radial-gradient(50% 40% at 90% 10%, hsl(var(--destructive) / 0.06) 0%, transparent 60%)
          `
        }}
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-10 h-10 rounded-xl bg-card border border-border/40 flex items-center justify-center hover:bg-muted/50 active:scale-95 transition-all duration-150"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 mb-2">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-primary">Gestão de Avaliações</span>
            </div>
            <h1 className="text-2xl font-bold">Avaliações do App</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhe satisfação e feedbacks por período.
            </p>
          </div>
        </div>
      </div>

      {/* Animated Metric Badges */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {metricsLoading ? (
          <>
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </>
        ) : (
          <>
            <MetricBadge
              label="Total de Avaliações"
              value={metrics?.totalReviews || 0}
              icon={Users}
              delay={0}
            />
            <MetricBadge
              label="Média Geral"
              value={`${metrics?.averageRating.toFixed(1) || '0.0'} ★`}
              icon={Star}
              delay={100}
            />
            <MetricBadge
              label="Avaliações Positivas"
              value={`${metrics?.percentHighRating.toFixed(0) || 0}%`}
              icon={TrendingUp}
              delay={200}
            />
            <Card className="animate-fade-in border-border/50" style={{ animationDelay: '300ms' }}>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">Distribuição</p>
                <RatingDistribution distribution={metrics?.ratingDistribution || {}} />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Premium Filter Toolbar */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            Filtros
            {filteredCount !== totalCount && (
              <Badge variant="secondary" className="ml-2">
                Mostrando {filteredCount} de {totalCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {/* Rating chips */}
            <div className="flex flex-wrap gap-2">
              <RatingChip
                rating="all"
                active={!filters.rating}
                onClick={() => handleFilterChange('rating', undefined)}
              />
              {[5, 4, 3, 2, 1].map((r) => (
                <RatingChip
                  key={r}
                  rating={r}
                  active={filters.rating === r}
                  count={metrics?.ratingDistribution[r] || 0}
                  onClick={() => handleFilterChange('rating', r)}
                />
              ))}
            </div>

            <div className="h-6 w-px bg-border hidden sm:block" />

            {/* Comment filter */}
            <div className="flex items-center gap-2">
              <Switch
                id="with-comment"
                checked={filters.hasComment === true}
                onCheckedChange={(checked) => 
                  handleFilterChange('hasComment', checked ? true : undefined)
                }
              />
              <Label htmlFor="with-comment" className="text-sm cursor-pointer">
                Somente com comentário
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Cards */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Avaliações Recentes
        </h2>

        {reviewsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : reviews?.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Star className="w-9 h-9 text-muted-foreground/50" />
              </div>
              <p className="font-semibold text-lg">Nenhuma avaliação encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ajuste os filtros ou aguarde novas avaliações.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews?.map((review, index) => (
              <Card 
                key={review.id} 
                className="border-border/50 animate-fade-in hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Avatar and user info */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold shadow-md shadow-primary/20 flex-shrink-0">
                        {review.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{review.user_name}</p>
                        <p className="text-sm text-muted-foreground truncate">{review.user_email}</p>
                      </div>
                    </div>

                    {/* Rating and date */}
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} size="lg" />
                        <span className="text-xl font-bold">{review.rating}.0</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="mt-4">
                    {review.comment ? (
                      <div className="relative pl-4 border-l-2 border-primary/30">
                        <p className="text-sm leading-relaxed">{review.comment}</p>
                        {review.contact_allowed && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            ✓ Permite contato
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 italic pl-4">
                        Sem comentário
                      </p>
                    )}
                  </div>

                  {/* Platform badge */}
                  <div className="mt-4 flex gap-2">
                    <Badge variant="secondary" className="capitalize text-xs">
                      {review.platform || 'web'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
