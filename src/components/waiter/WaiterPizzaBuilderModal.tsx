import { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Minus, Check, Pizza, GlassWater } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  usePizzaSizes,
  usePizzaFlavors,
  usePizzaFlavorPrices,
  usePizzaAddonGroups,
  usePizzaAddons,
  useStorePizzaSettings,
  type PizzaSize,
  type SelectedFlavor,
  type SelectedAddon,
  type SelectedCrust,
} from '@/hooks/usePizzaBuilder';
import { cn } from '@/lib/utils';

interface WaiterPizzaBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPizza: (pizza: {
    name: string;
    basePrice: number;
    quantity: number;
    options_snapshot: any;
  }) => void;
}

type Step = 'size' | 'flavors' | 'extras';

export function WaiterPizzaBuilderModal({ open, onOpenChange, onAddPizza }: WaiterPizzaBuilderModalProps) {
  const { data: sizes } = usePizzaSizes();
  const { data: flavors } = usePizzaFlavors();
  const { data: settings } = useStorePizzaSettings();
  const { data: addonGroups } = usePizzaAddonGroups();
  const { data: addons } = usePizzaAddons();

  const [step, setStep] = useState<Step>('size');
  const [selectedSize, setSelectedSize] = useState<PizzaSize | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<SelectedFlavor[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [selectedCrust, setSelectedCrust] = useState<SelectedCrust | null>(null);
  const [generalObservation, setGeneralObservation] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [searchFlavor, setSearchFlavor] = useState('');

  const { data: flavorPrices } = usePizzaFlavorPrices(selectedSize?.id);

  const pricingRule = settings?.pricing_rule || 'average';

  const resetState = () => {
    setStep('size');
    setSelectedSize(null);
    setSelectedFlavors([]);
    setSelectedAddons([]);
    setSelectedCrust(null);
    setGeneralObservation('');
    setQuantity(1);
    setSearchFlavor('');
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetState();
    onOpenChange(v);
  };

  const handleSelectSize = (size: PizzaSize) => {
    setSelectedSize(size);
    setSelectedFlavors([]);
    setSelectedAddons([]);
    setSelectedCrust(null);
    setStep('flavors');
  };

  const getFlavorPrice = (flavorId: string) => {
    const fp = flavorPrices?.find(p => p.flavor_id === flavorId);
    return fp?.price ?? selectedSize?.base_price ?? 0;
  };

  const toggleFlavor = (flavor: { id: string; name: string }) => {
    const exists = selectedFlavors.find(f => f.flavor_id === flavor.id);
    if (exists) {
      setSelectedFlavors(prev => prev.filter(f => f.flavor_id !== flavor.id));
    } else {
      if (selectedSize && selectedFlavors.length >= selectedSize.max_flavors) return;
      setSelectedFlavors(prev => [
        ...prev,
        { flavor_id: flavor.id, name: flavor.name, price: getFlavorPrice(flavor.id), observation: '' },
      ]);
    }
  };

  const crustGroups = addonGroups?.filter(g => g.group_type === 'single') || [];
  const multiGroups = addonGroups?.filter(g => g.group_type === 'multi') || [];
  const getAddonsForGroup = (groupId: string) => addons?.filter(a => a.group_id === groupId) || [];
  const getAddonQty = (addonId: string) => selectedAddons.find(a => a.addon_id === addonId)?.qty || 0;

  const handleSelectCrust = (addon: { id: string; name: string; price: number }) => {
    const isSelected = selectedCrust?.addon_id === addon.id;
    setSelectedCrust(isSelected ? null : { addon_id: addon.id, name: addon.name, price: addon.price });
  };

  const handleSetAddonQty = (addonId: string, name: string, price: number, qty: number) => {
    const clampedQty = Math.min(1, qty);
    if (clampedQty <= 0) {
      setSelectedAddons(prev => prev.filter(a => a.addon_id !== addonId));
      return;
    }
    const existing = selectedAddons.find(a => a.addon_id === addonId);
    if (existing) {
      setSelectedAddons(prev => prev.map(a => a.addon_id === addonId ? { ...a, qty: clampedQty } : a));
    } else {
      setSelectedAddons(prev => [...prev, { addon_id: addonId, name, price, qty: clampedQty }]);
    }
  };

  const calculatedBasePrice = useMemo(() => {
    if (selectedFlavors.length === 0) return 0;
    if (pricingRule === 'highest') {
      return Math.max(...selectedFlavors.map(f => f.price));
    }
    return selectedFlavors.reduce((s, f) => s + f.price, 0) / selectedFlavors.length;
  }, [selectedFlavors, pricingRule]);

  const addonsTotal = useMemo(() => {
    const addonsSum = selectedAddons.reduce((sum, a) => sum + (a.price * a.qty), 0);
    const crustPrice = selectedCrust?.price || 0;
    return addonsSum + crustPrice;
  }, [selectedAddons, selectedCrust]);

  const totalPrice = (calculatedBasePrice + addonsTotal) * quantity;

  const hasExtras = crustGroups.length > 0 || multiGroups.length > 0;

  const handleGoToExtras = () => {
    if (hasExtras) {
      setStep('extras');
    } else {
      handleConfirm();
    }
  };

  const handleConfirm = () => {
    if (!selectedSize || selectedFlavors.length === 0) return;

    const flavorNames = selectedFlavors.map(f => f.name).join(' / ');
    let name = `Pizza ${selectedSize.name} — ${flavorNames}`;
    if (selectedCrust) name += ` | Borda: ${selectedCrust.name}`;

    const optionsArray: any[] = [
      {
        optionId: 'pizza_size',
        optionName: 'Tamanho',
        itemId: selectedSize.id,
        itemLabel: selectedSize.name,
        priceDelta: 0,
      },
      ...selectedFlavors.map(f => ({
        optionId: `flavor_${f.flavor_id}`,
        optionName: 'Sabor',
        itemId: f.flavor_id,
        itemLabel: f.name,
        priceDelta: 0,
      })),
      ...(selectedCrust ? [{
        optionId: 'crust',
        optionName: 'Borda',
        itemId: selectedCrust.addon_id,
        itemLabel: selectedCrust.name,
        priceDelta: selectedCrust.price,
      }] : []),
      ...selectedAddons.map(a => ({
        optionId: `addon_${a.addon_id}`,
        optionName: 'Adicional',
        itemId: a.addon_id,
        itemLabel: `${a.name} x${a.qty}`,
        priceDelta: a.price * a.qty,
      })),
      ...(generalObservation ? [{
        optionId: 'observation',
        optionName: 'Observação',
        itemId: 'obs',
        itemLabel: generalObservation,
        priceDelta: 0,
      }] : []),
    ];

    onAddPizza({
      name,
      basePrice: calculatedBasePrice + addonsTotal,
      quantity,
      options_snapshot: optionsArray,
    });

    resetState();
    onOpenChange(false);
  };

  const filteredFlavors = (flavors || []).filter(f =>
    !searchFlavor || f.name.toLowerCase().includes(searchFlavor.toLowerCase())
  );

  const stepLabel = step === 'size' ? 'Escolha o Tamanho' : step === 'flavors' ? `Sabores — ${selectedSize?.name}` : 'Extras e Observações';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg h-[85vh] flex flex-col p-0 gap-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <DialogHeader className="p-4 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            {step !== 'size' && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setStep(step === 'extras' ? 'flavors' : 'size')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className="flex items-center gap-2">
              <Pizza className="w-5 h-5 text-primary" />
              {stepLabel}
            </DialogTitle>
          </div>
          {/* Step indicators */}
          <div className="flex items-center gap-1 mt-2">
            {['Tamanho', 'Sabores', ...(hasExtras ? ['Extras'] : [])].map((label, idx) => {
              const stepIdx = step === 'size' ? 0 : step === 'flavors' ? 1 : 2;
              return (
                <div key={label} className="flex items-center gap-1 flex-1">
                  <div className={cn(
                    'h-1 rounded-full flex-1 transition-colors',
                    idx <= stepIdx ? 'bg-primary' : 'bg-muted'
                  )} />
                </div>
              );
            })}
          </div>
          {step === 'flavors' && selectedSize && (
            <p className="text-xs text-muted-foreground mt-1">
              Escolha até {selectedSize.max_flavors} sabor(es) • {selectedFlavors.length}/{selectedSize.max_flavors} selecionado(s)
            </p>
          )}
        </DialogHeader>

        {/* Size selection */}
        {step === 'size' && (
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {(sizes || []).map(size => (
                <button
                  key={size.id}
                  onClick={() => handleSelectSize(size)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-sm">{size.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {size.slices} fatias • até {size.max_flavors} sabor(es)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      R$ {size.base_price.toFixed(2).replace('.', ',')}
                    </p>
                    {size.is_promo && size.promo_label && (
                      <Badge variant="destructive" className="text-[10px]">{size.promo_label}</Badge>
                    )}
                  </div>
                </button>
              ))}
              {(!sizes || sizes.length === 0) && (
                <p className="text-center text-muted-foreground py-8 text-sm">Nenhum tamanho cadastrado</p>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Flavor selection */}
        {step === 'flavors' && (
          <>
            <div className="px-4 pt-3">
              <Input
                placeholder="Buscar sabor..."
                value={searchFlavor}
                onChange={e => setSearchFlavor(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto px-4 pt-2">
              <div className="space-y-1.5 pb-4">
                {filteredFlavors.map(flavor => {
                  const isSelected = selectedFlavors.some(f => f.flavor_id === flavor.id);
                  const price = getFlavorPrice(flavor.id);
                  const isDisabled = !isSelected && selectedSize && selectedFlavors.length >= selectedSize.max_flavors;
                  return (
                    <button
                      key={flavor.id}
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleFlavor(flavor); }}
                      disabled={!!isDisabled}
                      type="button"
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left',
                        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                        isDisabled && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                          isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{flavor.name}</p>
                          {flavor.description && (
                            <p className="text-xs text-muted-foreground truncate">{flavor.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary ml-2">
                        R$ {price.toFixed(2).replace('.', ',')}
                      </span>
                    </button>
                  );
                })}
                {filteredFlavors.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">Nenhum sabor encontrado</p>
                )}
              </div>
            </div>

            {/* Flavors footer */}
            {selectedFlavors.length > 0 && (
              <div className="border-t border-border p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate">
                    {selectedFlavors.map(f => f.name).join(' / ')}
                  </span>
                  <span className="font-bold text-primary ml-2">
                    R$ {calculatedBasePrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <Button className="w-full" onClick={handleGoToExtras}>
                  {hasExtras ? 'Próximo: Extras' : 'Confirmar Pizza'}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Extras step */}
        {step === 'extras' && (
          <>
            <div className="flex-1 overflow-y-auto px-4 pt-3">
              <div className="space-y-5 pb-4">
                {/* Crust (single select) */}
                {crustGroups.map(group => (
                  <div key={group.id}>
                    <h3 className="font-semibold text-sm mb-2">
                      {group.name}
                    </h3>
                    <div className="space-y-1.5">
                      {getAddonsForGroup(group.id).map(addon => {
                        const isSelected = selectedCrust?.addon_id === addon.id;
                        return (
                          <button
                            key={addon.id}
                            onClick={() => handleSelectCrust(addon)}
                            className={cn(
                              'w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left',
                              isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                            )}
                          >
                            <div>
                              <p className="font-medium text-sm">{addon.name}</p>
                              <p className="text-xs text-primary">+R$ {addon.price.toFixed(2).replace('.', ',')}</p>
                            </div>
                            <div className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                              isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                            )}>
                              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Multi addons */}
                {multiGroups.map(group => (
                  <div key={group.id}>
                    <h3 className="font-semibold text-sm mb-2">{group.name}</h3>
                    <div className="space-y-1.5">
                      {getAddonsForGroup(group.id).map(addon => {
                        const qty = getAddonQty(addon.id);
                        return (
                          <div
                            key={addon.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border"
                          >
                            <div>
                              <p className="font-medium text-sm">{addon.name}</p>
                              <p className="text-xs text-primary">+R$ {addon.price.toFixed(2).replace('.', ',')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleSetAddonQty(addon.id, addon.name, addon.price, qty - 1)} disabled={qty === 0}>
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-6 text-center text-sm font-medium">{qty}</span>
                              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleSetAddonQty(addon.id, addon.name, addon.price, qty + 1)} disabled={qty >= 1}>
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* General observation */}
                <div>
                  <h3 className="font-semibold text-sm mb-2">Observação</h3>
                  <Textarea
                    placeholder="Alguma observação?"
                    value={generalObservation}
                    onChange={e => setGeneralObservation(e.target.value.slice(0, 200))}
                    className="resize-none text-sm"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Extras footer */}
            <div className="border-t border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quantidade</span>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center font-bold">{quantity}</span>
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQuantity(q => q + 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate">
                  {selectedFlavors.map(f => f.name).join(' / ')}
                  {selectedCrust ? ` + ${selectedCrust.name}` : ''}
                </span>
                <span className="font-bold text-primary">
                  R$ {totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <Button className="w-full" onClick={handleConfirm}>
                <Check className="w-4 h-4 mr-2" />
                Adicionar Pizza
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
