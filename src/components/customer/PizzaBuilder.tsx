import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { showCartToast } from '@/components/common/CartToast';
import { toast } from 'sonner';

interface PizzaBuilderProps {
  productId: string;
  productName: string;
}

// Types for builder options
interface SizeOption {
  id: string;
  label: string;
  slices: number;
  price: number;
}

interface CrustOption {
  id: string;
  label: string;
  price: number;
}

interface BorderOption {
  id: string;
  label: string;
  price: number;
}

interface SauceOption {
  id: string;
  label: string;
  price: number;
}

interface FlavorOption {
  id: string;
  label: string;
  description?: string;
  price: number;
}

interface ExtraOption {
  id: string;
  label: string;
  price: number;
}

// Sample data - in production, load from database via product_options
const SIZES: SizeOption[] = [
  { id: 'p', label: 'Pequena', slices: 4, price: 29.90 },
  { id: 'm', label: 'Média', slices: 6, price: 39.90 },
  { id: 'g', label: 'Grande', slices: 8, price: 49.90 },
  { id: 'f', label: 'Família', slices: 12, price: 64.90 },
];

const CRUSTS: CrustOption[] = [
  { id: 'tradicional', label: 'Tradicional', price: 0 },
  { id: 'integral', label: 'Integral', price: 3 },
  { id: 'fininha', label: 'Fininha', price: 0 },
];

const BORDERS: BorderOption[] = [
  { id: 'sem', label: 'Sem borda recheada', price: 0 },
  { id: 'cheddar', label: 'Cheddar', price: 8 },
  { id: 'catupiry', label: 'Catupiry', price: 8 },
  { id: 'chocolate', label: 'Chocolate', price: 10 },
];

const SAUCES: SauceOption[] = [
  { id: 'tradicional', label: 'Molho tradicional', price: 0 },
  { id: 'picante', label: 'Molho picante', price: 0 },
  { id: 'branco', label: 'Molho branco', price: 2 },
];

const FLAVORS: FlavorOption[] = [
  { id: 'margherita', label: 'Margherita', description: 'Molho, mussarela, tomate e manjericão', price: 0 },
  { id: 'pepperoni', label: 'Pepperoni', description: 'Molho, mussarela e pepperoni', price: 5 },
  { id: 'calabresa', label: 'Calabresa', description: 'Molho, mussarela, calabresa e cebola', price: 3 },
  { id: '4queijos', label: 'Quatro Queijos', description: 'Mussarela, provolone, parmesão e gorgonzola', price: 8 },
  { id: 'frango', label: 'Frango com Catupiry', description: 'Frango desfiado e catupiry', price: 6 },
  { id: 'portuguesa', label: 'Portuguesa', description: 'Presunto, ovos, cebola, ervilha e azeitona', price: 5 },
];

const EXTRAS: ExtraOption[] = [
  { id: 'queijo-extra', label: 'Queijo extra', price: 5 },
  { id: 'bacon', label: 'Bacon', price: 6 },
  { id: 'cebola', label: 'Cebola caramelizada', price: 3 },
  { id: 'rucula', label: 'Rúcula', price: 4 },
  { id: 'tomate-seco', label: 'Tomate seco', price: 5 },
];

const STEPS = [
  { id: 1, title: 'Tamanho', subtitle: 'Escolha o tamanho' },
  { id: 2, title: 'Massa', subtitle: 'Tipo de massa' },
  { id: 3, title: 'Borda', subtitle: 'Borda recheada' },
  { id: 4, title: 'Molho', subtitle: 'Base da pizza' },
  { id: 5, title: 'Sabores', subtitle: 'Até 2 sabores' },
  { id: 6, title: 'Adicionais', subtitle: 'Extras opcionais' },
  { id: 7, title: 'Observações', subtitle: 'Algum pedido especial?' },
];

export function PizzaBuilder({ productId, productName }: PizzaBuilderProps) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Selections
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedCrust, setSelectedCrust] = useState<string>('tradicional');
  const [selectedBorder, setSelectedBorder] = useState<string>('sem');
  const [selectedSauce, setSelectedSauce] = useState<string>('tradicional');
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [isHalfHalf, setIsHalfHalf] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Calculate total price
  const totalPrice = useMemo(() => {
    let total = 0;
    
    // Size base price
    const size = SIZES.find(s => s.id === selectedSize);
    if (size) total += size.price;
    
    // Crust
    const crust = CRUSTS.find(c => c.id === selectedCrust);
    if (crust) total += crust.price;
    
    // Border
    const border = BORDERS.find(b => b.id === selectedBorder);
    if (border) total += border.price;
    
    // Sauce
    const sauce = SAUCES.find(s => s.id === selectedSauce);
    if (sauce) total += sauce.price;
    
    // Flavors (use the most expensive one for half-half)
    if (selectedFlavors.length > 0) {
      const flavorPrices = selectedFlavors.map(f => FLAVORS.find(fl => fl.id === f)?.price || 0);
      total += Math.max(...flavorPrices);
    }
    
    // Extras
    selectedExtras.forEach(extraId => {
      const extra = EXTRAS.find(e => e.id === extraId);
      if (extra) total += extra.price;
    });
    
    return total;
  }, [selectedSize, selectedCrust, selectedBorder, selectedSauce, selectedFlavors, selectedExtras]);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1: return !!selectedSize;
      case 2: return !!selectedCrust;
      case 3: return !!selectedBorder;
      case 4: return !!selectedSauce;
      case 5: return selectedFlavors.length > 0;
      case 6: return true;
      case 7: return true;
      default: return false;
    }
  }, [currentStep, selectedSize, selectedCrust, selectedBorder, selectedSauce, selectedFlavors]);

  const handleFlavorToggle = (flavorId: string) => {
    setSelectedFlavors(prev => {
      if (prev.includes(flavorId)) {
        return prev.filter(f => f !== flavorId);
      }
      if (isHalfHalf && prev.length >= 2) {
        return [...prev.slice(1), flavorId];
      }
      if (!isHalfHalf && prev.length >= 1) {
        return [flavorId];
      }
      return [...prev, flavorId];
    });
  };

  const handleExtraToggle = (extraId: string) => {
    setSelectedExtras(prev => 
      prev.includes(extraId) 
        ? prev.filter(e => e !== extraId)
        : [...prev, extraId]
    );
  };

  const handleAddToCart = () => {
    if (!selectedSize || selectedFlavors.length === 0) {
      toast.error('Complete todas as etapas obrigatórias');
      return;
    }

    const size = SIZES.find(s => s.id === selectedSize);
    const flavorNames = selectedFlavors.map(f => FLAVORS.find(fl => fl.id === f)?.label).join(' + ');
    
    const options: any[] = [];
    
    // Size
    if (size) {
      options.push({ optionId: 'size', optionName: 'Tamanho', itemId: size.id, itemLabel: size.label, priceDelta: 0 });
    }
    
    // Crust
    const crust = CRUSTS.find(c => c.id === selectedCrust);
    if (crust) {
      options.push({ optionId: 'crust', optionName: 'Massa', itemId: crust.id, itemLabel: crust.label, priceDelta: crust.price });
    }
    
    // Border
    const border = BORDERS.find(b => b.id === selectedBorder);
    if (border) {
      options.push({ optionId: 'border', optionName: 'Borda', itemId: border.id, itemLabel: border.label, priceDelta: border.price });
    }
    
    // Sauce
    const sauce = SAUCES.find(s => s.id === selectedSauce);
    if (sauce) {
      options.push({ optionId: 'sauce', optionName: 'Molho', itemId: sauce.id, itemLabel: sauce.label, priceDelta: sauce.price });
    }
    
    // Flavors
    selectedFlavors.forEach((f, i) => {
      const flavor = FLAVORS.find(fl => fl.id === f);
      if (flavor) {
        options.push({ optionId: `flavor-${i}`, optionName: 'Sabor', itemId: flavor.id, itemLabel: flavor.label, priceDelta: i === 0 ? flavor.price : 0 });
      }
    });
    
    // Extras
    selectedExtras.forEach((e, i) => {
      const extra = EXTRAS.find(ex => ex.id === e);
      if (extra) {
        options.push({ optionId: `extra-${i}`, optionName: 'Adicional', itemId: extra.id, itemLabel: extra.label, priceDelta: extra.price });
      }
    });

    addItem({
      productId,
      name: `${productName} ${size?.label} - ${flavorNames}`,
      basePrice: size?.price || 0,
      quantity: 1,
      options,
      notes: notes || undefined,
    });

    showCartToast({
      productName: `${productName} ${size?.label}`,
      quantity: 1,
    });
    navigate('/app/cart');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid grid-cols-2 gap-3">
            {SIZES.map((size) => (
              <button
                key={size.id}
                onClick={() => setSelectedSize(size.id)}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all',
                  selectedSize === size.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{size.label}</span>
                  {selectedSize === size.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{size.slices} fatias</p>
                <p className="text-lg font-bold text-primary mt-1">
                  R$ {size.price.toFixed(2).replace('.', ',')}
                </p>
              </button>
            ))}
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            {CRUSTS.map((crust) => (
              <button
                key={crust.id}
                onClick={() => setSelectedCrust(crust.id)}
                className={cn(
                  'w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all',
                  selectedCrust === crust.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <span className="font-medium">{crust.label}</span>
                <div className="flex items-center gap-2">
                  {crust.price > 0 && (
                    <span className="text-sm text-primary">+R$ {crust.price.toFixed(2)}</span>
                  )}
                  {selectedCrust === crust.id && <Check className="w-5 h-5 text-primary" />}
                </div>
              </button>
            ))}
          </div>
        );

      case 3:
        return (
          <div className="space-y-3">
            {BORDERS.map((border) => (
              <button
                key={border.id}
                onClick={() => setSelectedBorder(border.id)}
                className={cn(
                  'w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all',
                  selectedBorder === border.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <span className="font-medium">{border.label}</span>
                <div className="flex items-center gap-2">
                  {border.price > 0 && (
                    <span className="text-sm text-primary">+R$ {border.price.toFixed(2)}</span>
                  )}
                  {selectedBorder === border.id && <Check className="w-5 h-5 text-primary" />}
                </div>
              </button>
            ))}
          </div>
        );

      case 4:
        return (
          <div className="space-y-3">
            {SAUCES.map((sauce) => (
              <button
                key={sauce.id}
                onClick={() => setSelectedSauce(sauce.id)}
                className={cn(
                  'w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all',
                  selectedSauce === sauce.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <span className="font-medium">{sauce.label}</span>
                <div className="flex items-center gap-2">
                  {sauce.price > 0 && (
                    <span className="text-sm text-primary">+R$ {sauce.price.toFixed(2)}</span>
                  )}
                  {selectedSauce === sauce.id && <Check className="w-5 h-5 text-primary" />}
                </div>
              </button>
            ))}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            {/* Half-half toggle */}
            <button
              onClick={() => {
                setIsHalfHalf(!isHalfHalf);
                if (isHalfHalf) setSelectedFlavors(prev => prev.slice(0, 1));
              }}
              className={cn(
                'w-full p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all',
                isHalfHalf
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30'
              )}
            >
              <span className="text-2xl">🍕</span>
              <span className="font-medium">Meio a Meio</span>
              {isHalfHalf && <Check className="w-5 h-5" />}
            </button>

            <p className="text-sm text-muted-foreground text-center">
              {isHalfHalf ? 'Escolha até 2 sabores' : 'Escolha 1 sabor'}
            </p>

            <div className="space-y-3">
              {FLAVORS.map((flavor) => (
                <button
                  key={flavor.id}
                  onClick={() => handleFlavorToggle(flavor.id)}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all',
                    selectedFlavors.includes(flavor.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{flavor.label}</span>
                    <div className="flex items-center gap-2">
                      {flavor.price > 0 && (
                        <span className="text-sm text-primary">+R$ {flavor.price.toFixed(2)}</span>
                      )}
                      {selectedFlavors.includes(flavor.id) && <Check className="w-5 h-5 text-primary" />}
                    </div>
                  </div>
                  {flavor.description && (
                    <p className="text-sm text-muted-foreground">{flavor.description}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Selecione adicionais (opcional)</p>
            {EXTRAS.map((extra) => (
              <button
                key={extra.id}
                onClick={() => handleExtraToggle(extra.id)}
                className={cn(
                  'w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all',
                  selectedExtras.includes(extra.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <span className="font-medium">{extra.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-primary">+R$ {extra.price.toFixed(2)}</span>
                  {selectedExtras.includes(extra.id) && <Check className="w-5 h-5 text-primary" />}
                </div>
              </button>
            ))}
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Sem cebola, bem assada, cortar em 8 pedaços..."
              className="input-modern min-h-32"
            />
            
            {/* Summary */}
            <div className="p-4 rounded-xl bg-muted/50 space-y-2">
              <h4 className="font-semibold">Resumo do pedido</h4>
              <div className="text-sm space-y-1">
                <p>Tamanho: {SIZES.find(s => s.id === selectedSize)?.label}</p>
                <p>Massa: {CRUSTS.find(c => c.id === selectedCrust)?.label}</p>
                <p>Borda: {BORDERS.find(b => b.id === selectedBorder)?.label}</p>
                <p>Molho: {SAUCES.find(s => s.id === selectedSauce)?.label}</p>
                <p>Sabores: {selectedFlavors.map(f => FLAVORS.find(fl => fl.id === f)?.label).join(' + ')}</p>
                {selectedExtras.length > 0 && (
                  <p>Adicionais: {selectedExtras.map(e => EXTRAS.find(ex => ex.id === e)?.label).join(', ')}</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold">Monte sua Pizza</h1>
            <p className="text-sm text-muted-foreground">{STEPS[currentStep - 1].subtitle}</p>
          </div>
          <span className="text-sm font-medium text-primary">{currentStep}/{STEPS.length}</span>
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 py-3">
        <div className="flex gap-1">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                step.id <= currentStep ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
        <p className="text-center mt-2 font-semibold">{STEPS[currentStep - 1].title}</p>
      </div>

      {/* Content */}
      <div className="px-4 py-2">
        {renderStep()}
      </div>

      {/* Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 space-y-3">
        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="text-2xl font-bold text-primary">
            R$ {totalPrice.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}
          
          {currentStep < STEPS.length ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed}
              className="btn-primary flex-1"
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleAddToCart}
              className="btn-primary flex-1"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Adicionar ao Carrinho
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PizzaBuilder;
