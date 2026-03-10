import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Plus, Minus } from 'lucide-react';
import { 
  usePizzaFlavors, 
  usePizzaFlavorPrices, 
  usePizzaBuilderStore,
  useStorePizzaSettings 
} from '@/hooks/usePizzaBuilder';
import { BuilderStepper } from '@/components/pizza/BuilderStepper';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useBuilderLabels } from '@/hooks/useBuilderLabels';

type SortOption = 'relevance' | 'name' | 'price';

export default function PizzaFlavors() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const labels = useBuilderLabels();
  
  const { 
    selectedSize, 
    selectedFlavors, 
    addFlavor, 
    removeFlavor,
    canAddMoreFlavors,
    calculateBasePrice 
  } = usePizzaBuilderStore();
  
  const { data: flavors, isLoading: loadingFlavors } = usePizzaFlavors();
  const { data: prices, isLoading: loadingPrices } = usePizzaFlavorPrices(selectedSize?.id);
  const { data: settings } = useStorePizzaSettings();

  // Redirect if no size selected
  useEffect(() => {
    if (!selectedSize) {
      navigate('/app/pizza', { replace: true });
    }
  }, [selectedSize, navigate]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const pricingMode = settings?.pricing_mode || 'matrix';

  // Map prices by flavor_id (matrix mode)
  const priceMap = useMemo(() => {
    const map = new Map<string, number>();
    prices?.forEach(p => map.set(p.flavor_id, p.price));
    return map;
  }, [prices]);

  // Flavors with prices (adapts to pricing mode)
  const flavorsWithPrices = useMemo(() => {
    if (!flavors) return [];
    return flavors.map(f => ({
      ...f,
      price: pricingMode === 'matrix' 
        ? (priceMap.get(f.id) || 0) 
        : pricingMode === 'per_item' 
          ? (f.unit_price || 0) 
          : 0, // fixed_by_size: flavor has no extra cost
    }));
  }, [flavors, priceMap, pricingMode]);

  // Filtered and sorted
  const filteredFlavors = useMemo(() => {
    let result = [...flavorsWithPrices];
    
    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.name.toLowerCase().includes(term) ||
        f.description?.toLowerCase().includes(term)
      );
    }
    
    // Sort
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'relevance':
      default:
        result.sort((a, b) => a.sort_order - b.sort_order);
    }
    
    return result;
  }, [flavorsWithPrices, searchTerm, sortBy]);

  const isFlavorSelected = (flavorId: string) => 
    selectedFlavors.some(f => f.flavor_id === flavorId);

  const handleToggleFlavor = (flavor: typeof flavorsWithPrices[0]) => {
    if (isFlavorSelected(flavor.id)) {
      removeFlavor(flavor.id);
    } else if (canAddMoreFlavors()) {
      addFlavor({
        flavor_id: flavor.id,
        name: flavor.name,
        price: flavor.price,
        observation: '',
      });
    }
  };

  const estimatedPrice = calculateBasePrice(settings?.pricing_rule || 'average', pricingMode);
  const canContinue = selectedFlavors.length >= 1;
  const isLimitReached = selectedSize && selectedFlavors.length >= selectedSize.max_flavors;

  if (!selectedSize || loadingFlavors || loadingPrices) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 sm:pb-28 overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-4">
          <button
            onClick={() => navigate('/app/pizza')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors touch-manipulation flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold truncate">{selectedSize?.name}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {labels.step2.subtitle(selectedSize?.max_flavors || 1)}
            </p>
          </div>
        </div>
        
        <BuilderStepper
          steps={labels.steps.map(s => ({ label: s, shortLabel: s }))}
          currentStep={1}
        />

        {/* Search & Sort */}
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 sm:space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={labels.step2.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 sm:h-11 text-sm"
            />
          </div>
          
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1">
            {(['relevance', 'name', 'price'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={cn(
                  "px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0",
                  sortBy === option
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {option === 'relevance' && 'Relevância'}
                {option === 'name' && 'Nome A-Z'}
                {option === 'price' && 'Preço $'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Limit indicator */}
        {isLimitReached && (
          <div className="mx-4 mb-4 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 text-sm font-medium">
            Limite atingido ({selectedFlavors.length}/{selectedSize.max_flavors})
          </div>
        )}
      </div>

      {/* Flavors List */}
      <div className="px-4 py-4">
        <div className="space-y-3">
          {filteredFlavors.map((flavor) => {
            const selected = isFlavorSelected(flavor.id);
            const disabled = !selected && isLimitReached;
            
            return (
              <div
                key={flavor.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                  selected 
                    ? "border-primary bg-primary/5" 
                    : "border-border bg-card",
                  disabled && "opacity-50"
                )}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{flavor.name}</h3>
                  {flavor.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {flavor.description}
                    </p>
                  )}
                  {pricingMode !== 'fixed_by_size' && flavor.price > 0 && (
                  <p className="text-sm font-medium text-primary mt-1">
                    R$ {flavor.price.toFixed(2).replace('.', ',')}
                    {pricingMode === 'per_item' && ' / un.'}
                  </p>
                  )}
                  {pricingMode === 'fixed_by_size' && (
                    <p className="text-xs text-muted-foreground mt-1">Incluso no tamanho</p>
                  )}
                </div>
                
                <button
                  onClick={() => !disabled && handleToggleFlavor(flavor)}
                  disabled={disabled}
                  className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all touch-manipulation flex-shrink-0",
                    selected 
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-primary/20",
                    disabled && "cursor-not-allowed"
                  )}
                >
                  {selected ? <Minus className="w-4 h-4 sm:w-5 sm:h-5" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-3 sm:p-4 z-20" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {selectedFlavors.length} {selectedFlavors.length === 1 ? labels.step2.selectedUnit : labels.step2.selectedUnit + (labels.step2.selectedUnit.endsWith('ão') ? '' : 's')} selecionado{selectedFlavors.length !== 1 && 's'}
            </p>
            <p className="text-base sm:text-lg font-bold text-primary truncate">
              {estimatedPrice > 0 
                ? `R$ ${estimatedPrice.toFixed(2).replace('.', ',')}`
                : `Selecione ${labels.step2.selectedUnit}s`
              }
            </p>
          </div>
          <Button 
            onClick={() => navigate('/app/pizza/adicionais')}
            disabled={!canContinue}
            className={cn(
              "h-11 sm:h-12 px-4 sm:px-6 text-sm sm:text-base touch-manipulation transition-all duration-300 flex-shrink-0",
              isLimitReached && "scale-105 shadow-lg shadow-primary/25"
            )}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
