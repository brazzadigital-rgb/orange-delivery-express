import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Pizza, Flame } from 'lucide-react';
import { usePizzaSizes, usePizzaBuilderStore, useStorePizzaSettings } from '@/hooks/usePizzaBuilder';
import { BuilderStepper } from '@/components/pizza/BuilderStepper';
import { FreePizzaRewardBanner } from '@/components/pizza/FreePizzaRewardBanner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBuilderLabels } from '@/hooks/useBuilderLabels';

// Simple pizza icon with slice divisions
function PizzaIcon({ slices }: { slices: number }) {
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg" />
      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-amber-300 to-orange-400" />
      {/* Slice lines */}
      {Array.from({ length: slices }).map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-6 bg-amber-600/40 origin-bottom"
          style={{
            transform: `rotate(${(360 / slices) * i}deg)`,
            bottom: '50%',
          }}
        />
      ))}
      <span className="relative text-white font-bold text-base drop-shadow">{slices}</span>
    </div>
  );
}

export default function PizzaSizes() {
  const navigate = useNavigate();
  const { data: sizes, isLoading } = usePizzaSizes();
  const { data: settings } = useStorePizzaSettings();
  const { setSelectedSize, resetBuilder } = usePizzaBuilderStore();
  const labels = useBuilderLabels();
  const pricingMode = settings?.pricing_mode || 'matrix';

  // Reset builder when entering this page
  useEffect(() => {
    resetBuilder();
  }, [resetBuilder]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSelectSize = (size: typeof sizes extends (infer T)[] ? T : never) => {
    setSelectedSize(size);
    navigate('/app/pizza/sabores');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6 overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-4">
          <button
            onClick={() => navigate('/app/home')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors touch-manipulation flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">{labels.step1.heading}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{labels.step1.subtitle}</p>
          </div>
        </div>

        <BuilderStepper
          steps={labels.steps.map(s => ({ label: s, shortLabel: s }))}
          currentStep={0}
        />
      </div>

      {/* Free Pizza Reward Banner */}
      <FreePizzaRewardBanner />

      {/* Sizes List */}
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        {(!sizes || sizes.length === 0) ? (
          <div className="text-center py-12">
            <Pizza className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">{labels.step1.emptyTitle}</h2>
            <p className="text-muted-foreground mb-6">
              {labels.step1.emptyDesc}
            </p>
            <Button variant="outline" onClick={() => navigate('/app/home')}>
              Voltar ao início
            </Button>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {sizes.map((size) => (
              <button
                key={size.id}
                onClick={() => handleSelectSize(size)}
                type="button"
                className={cn(
                  "w-full flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-left",
                  "hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]",
                  "touch-manipulation cursor-pointer",
                  size.is_promo
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                )}
              >
                <div className="flex-shrink-0">
                  <PizzaIcon slices={size.slices} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base">{size.name}</h3>
                    {size.is_promo && size.promo_label && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-destructive to-orange-500 text-white text-xs font-bold shadow-lg">
                        {size.promo_label}
                        <Flame className="w-3 h-3 animate-pulse" />
                        <span className="animate-pulse">HOT</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {pricingMode === 'per_item' && size.unit_label 
                      ? size.unit_label
                      : `Escolha até ${size.max_flavors} ${size.max_flavors === 1 ? labels.step1.itemUnit : labels.step1.itemUnit + (labels.step1.itemUnit.endsWith('ão') ? '' : 'es')}`
                    }
                  </p>
                  {size.description && (
                    <p className="text-xs text-muted-foreground">{size.description}</p>
                  )}
                  <p className="text-sm font-semibold text-primary mt-0.5">
                    {pricingMode === 'per_item' 
                      ? `Base R$ ${size.base_price.toFixed(2).replace('.', ',')} + itens`
                      : `A partir de R$ ${size.base_price.toFixed(2).replace('.', ',')}`
                    }
                  </p>
                </div>

                <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
