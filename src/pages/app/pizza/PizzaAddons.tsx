import { useEffect, useRef } from 'react';
 import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Minus, ShoppingCart, Check } from 'lucide-react';
 import { 
   usePizzaAddonGroups, 
   usePizzaAddons, 
   usePizzaBuilderStore,
   useStorePizzaSettings 
 } from '@/hooks/usePizzaBuilder';
import { BuilderStepper } from '@/components/pizza/BuilderStepper';
 import { useCart } from '@/hooks/useCart';
 import { LoadingSpinner } from '@/components/common/LoadingSpinner';
 import { Button } from '@/components/ui/button';
 import { Textarea } from '@/components/ui/textarea';
 import { cn } from '@/lib/utils';
import { showCartToast } from '@/components/common/CartToast';
import { useBuilderLabels } from '@/hooks/useBuilderLabels';
 
 export default function PizzaAddons() {
   const navigate = useNavigate();
   const { addItem } = useCart();
  const multiGroupsRef = useRef<HTMLDivElement>(null);
  const labels = useBuilderLabels();
   
   const { 
     selectedSize, 
     selectedFlavors, 
     selectedAddons,
     selectedCrust,
     generalObservation,
     quantity,
     updateFlavorObservation,
     setAddonQty,
     setSelectedCrust,
     setGeneralObservation,
     setQuantity,
     calculateTotal,
     calculateBasePrice,
     calculateAddonsTotal,
     resetBuilder
   } = usePizzaBuilderStore();
   
   const { data: addonGroups, isLoading: loadingGroups } = usePizzaAddonGroups();
   const { data: addons, isLoading: loadingAddons } = usePizzaAddons();
   const { data: settings } = useStorePizzaSettings();
 
   // Redirect if missing previous steps
   useEffect(() => {
     if (!selectedSize) {
       navigate('/app/pizza', { replace: true });
     } else if (selectedFlavors.length === 0) {
       navigate('/app/pizza/sabores', { replace: true });
     }
   }, [selectedSize, selectedFlavors, navigate]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
 
   const pricingRule = settings?.pricing_rule || 'average';
   const pricingMode = settings?.pricing_mode || 'matrix';
   const maxChars = settings?.max_observation_chars || 140;
   const total = calculateTotal(pricingRule, pricingMode);
 
   // Group addons by group
   const crustGroups = addonGroups?.filter(g => g.group_type === 'single') || [];
   const multiGroups = addonGroups?.filter(g => g.group_type === 'multi') || [];
 
   const getAddonsForGroup = (groupId: string) => 
     addons?.filter(a => a.group_id === groupId) || [];
 
   const getAddonQty = (addonId: string) => 
     selectedAddons.find(a => a.addon_id === addonId)?.qty || 0;
 
  const handleSelectCrust = (addon: { id: string; name: string; price: number }) => {
    const isSelected = selectedCrust?.addon_id === addon.id;
    setSelectedCrust(isSelected ? null : {
      addon_id: addon.id,
      name: addon.name,
      price: addon.price,
    });
    
    // Scroll to multi groups section when selecting a crust
    if (!isSelected && multiGroupsRef.current) {
      setTimeout(() => {
        multiGroupsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

   const handleAddToCart = () => {
     if (!selectedSize) return;
     
     const cartItem = {
       productId: `pizza-v2-${selectedSize.id}`,
       name: `${selectedSize.name} - ${selectedFlavors.map(f => f.name).join(' / ')}`,
       basePrice: calculateBasePrice(pricingRule, pricingMode),
       quantity,
       options: [
         {
           optionId: 'pizza_size',
           optionName: labels.steps[0],
           itemId: selectedSize.id,
           itemLabel: selectedSize.name,
           priceDelta: 0,
         },
         ...selectedFlavors.map(f => ({
           optionId: `flavor_${f.flavor_id}`,
           optionName: labels.steps[1],
           itemId: f.flavor_id,
           itemLabel: f.name + (f.observation ? ` (${f.observation})` : ''),
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
       ],
       notes: generalObservation || undefined,
     };
     
     addItem(cartItem);
    
    showCartToast({
      productName: `${labels.cartPrefix} ${selectedSize.name}`,
      quantity,
    });
     
     resetBuilder();
      navigate('/app/cart');
   };
 
   if (!selectedSize || loadingGroups || loadingAddons) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <LoadingSpinner size="lg" />
       </div>
     );
   }
 
   return (
    <div className="min-h-screen bg-background pb-44 sm:pb-40 overflow-x-hidden">
       {/* Header */}
       <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-4">
           <button
             onClick={() => navigate('/app/pizza/sabores')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors touch-manipulation flex-shrink-0"
           >
             <ChevronLeft className="w-5 h-5" />
           </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold truncate">{labels.step3.heading}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
               {selectedFlavors.map(f => f.name).join(' / ')}
             </p>
           </div>
         </div>
         
        <BuilderStepper
          steps={labels.steps.map(s => ({ label: s, shortLabel: s }))}
          currentStep={2}
        />
       </div>
 
       {/* Content */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-5 sm:space-y-6">
         {/* Crust Groups (single select) */}
         {crustGroups.map((group) => (
           <div key={group.id}>
            <h3 className="font-semibold mb-3">
              {group.name} <span className="text-muted-foreground font-normal">(Máx: {group.max_select})</span>
             </h3>
            <div className="space-y-1.5 sm:space-y-2">
               {getAddonsForGroup(group.id).map((addon) => {
                 const isSelected = selectedCrust?.addon_id === addon.id;
                 return (
                   <button
                     key={addon.id}
                      onClick={() => handleSelectCrust(addon)}
                     className={cn(
                      "w-full flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 transition-all text-left touch-manipulation",
                       isSelected 
                         ? "border-primary bg-primary/5" 
                         : "border-border bg-card hover:border-primary/50"
                     )}
                   >
                     <div>
                      <p className="font-medium">{addon.name}</p>
                      <p className="text-sm text-primary">
                         +R$ {addon.price.toFixed(2).replace('.', ',')}
                       </p>
                     </div>
                     <div className={cn(
                      "w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                       isSelected 
                         ? "border-primary bg-primary" 
                         : "border-muted-foreground"
                     )}>
                      {isSelected && <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />}
                     </div>
                   </button>
                 );
               })}
             </div>
           </div>
         ))}
 
         {/* Multi Groups (quantity select) */}
        {multiGroups.length > 0 && (
          <div ref={multiGroupsRef}>
            {multiGroups.map((group) => (
              <div key={group.id} className="mb-5 sm:mb-6 last:mb-0">
                <h3 className="font-semibold mb-3">{group.name}</h3>
                <div className="space-y-1.5 sm:space-y-2">
                  {getAddonsForGroup(group.id).map((addon) => {
                    const qty = getAddonQty(addon.id);
                    return (
                      <div
                        key={addon.id}
                        className="flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 border-border bg-card"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{addon.name}</p>
                          <p className="text-sm text-primary">
                            +R$ {addon.price.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <button
                            onClick={() => setAddonQty(addon.id, addon.name, addon.price, qty - 1)}
                            disabled={qty === 0}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50 touch-manipulation"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center font-medium">{qty}</span>
                          <button
                            onClick={() => setAddonQty(addon.id, addon.name, addon.price, qty + 1)}
                            disabled={qty >= 1}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
           </div>
        )}
 
         {/* Observations per flavor */}
         <div>
          <h3 className="font-semibold mb-3">Observações por {labels.step2.selectedUnit}</h3>
          <div className="space-y-2 sm:space-y-3">
             {selectedFlavors.map((flavor) => (
               <div key={flavor.flavor_id}>
                <label className="text-sm text-muted-foreground block mb-1">
                   Observações para {flavor.name}
                 </label>
                 <div className="relative">
                   <Textarea
                     placeholder={`Observações para ${flavor.name}...`}
                     value={flavor.observation}
                     onChange={(e) => updateFlavorObservation(flavor.flavor_id, e.target.value.slice(0, maxChars))}
                    className="resize-none text-sm"
                     rows={2}
                   />
                   <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                     {flavor.observation.length}/{maxChars}
                   </span>
                 </div>
               </div>
             ))}
           </div>
         </div>
 
         {/* General observation */}
         <div>
          <h3 className="font-semibold mb-3">Observação geral do pedido</h3>
           <div className="relative">
             <Textarea
               placeholder="Alguma observação geral?"
               value={generalObservation}
               onChange={(e) => setGeneralObservation(e.target.value.slice(0, 200))}
              className="resize-none text-sm"
               rows={3}
             />
             <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
               {generalObservation.length}/200
             </span>
           </div>
           <p className="text-xs text-muted-foreground mt-2">
             Observações com acréscimos e/ou alterações podem aumentar o valor final do pedido.
           </p>
         </div>
       </div>
 
       {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-3 sm:p-4 z-20" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
             <button
               onClick={() => setQuantity(quantity - 1)}
               disabled={quantity <= 1}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50 touch-manipulation"
             >
               <Minus className="w-4 h-4" />
             </button>
            <span className="w-6 sm:w-8 text-center font-semibold text-base sm:text-lg">{quantity}</span>
             <button
               onClick={() => setQuantity(quantity + 1)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted touch-manipulation"
             >
               <Plus className="w-4 h-4" />
             </button>
           </div>
          <div className="flex-1 text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-primary">
               R$ {total.toFixed(2).replace('.', ',')}
             </p>
           </div>
         </div>
         <Button 
           onClick={handleAddToCart}
          className="w-full h-12 sm:h-14 text-sm sm:text-base touch-manipulation"
         >
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
           Adicionar ao carrinho
         </Button>
       </div>
     </div>
   );
 }
