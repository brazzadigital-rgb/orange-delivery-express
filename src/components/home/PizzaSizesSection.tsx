 import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Flame } from 'lucide-react';
 import { usePizzaSizes } from '@/hooks/usePizzaBuilder';
 import { Skeleton } from '@/components/ui/skeleton';
 import { cn } from '@/lib/utils';
 
 function PizzaSizeIcon({ slices }: { slices: number }) {
   return (
     <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
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
 
 function SizeCardSkeleton() {
   return (
     <div className="min-w-[280px] flex-shrink-0">
       <div className="bg-card rounded-2xl p-4 border border-border/30 shadow-sm">
         <div className="flex items-center gap-3">
           <Skeleton className="w-14 h-14 rounded-full" />
           <div className="flex-1 space-y-2">
             <Skeleton className="h-5 w-32" />
             <Skeleton className="h-4 w-24" />
             <Skeleton className="h-4 w-20" />
           </div>
         </div>
       </div>
     </div>
   );
 }
 
 export function PizzaSizesSection() {
   const navigate = useNavigate();
   const { data: sizes, isLoading } = usePizzaSizes();
 
   const handleSelectSize = (sizeId: string) => {
     // Navigate to pizza builder, size will be selected there
     navigate('/app/pizza');
   };
 
   if (isLoading) {
     return (
       <section className="section-premium">
         <div className="section-header">
           <h2 className="section-title">🍕 Monte sua Pizza</h2>
           <Link to="/app/pizza" className="section-link">Ver todos</Link>
         </div>
         <div className="overflow-x-auto scrollbar-hide">
           <div className="flex gap-3 px-4 pb-2">
             {[1, 2, 3].map((i) => <SizeCardSkeleton key={i} />)}
           </div>
         </div>
       </section>
     );
   }
 
   if (!sizes || sizes.length === 0) {
     return null;
   }
 
   return (
     <section className="section-premium">
       <div className="section-header">
         <h2 className="section-title">🍕 Monte sua Pizza</h2>
         <Link to="/app/pizza" className="section-link">Ver todos</Link>
       </div>
       <div className="overflow-x-auto scrollbar-hide">
         <div className="flex gap-3 px-4 pb-2">
           {sizes.map((size) => (
             <button
               key={size.id}
               onClick={() => handleSelectSize(size.id)}
               className={cn(
                 "min-w-[280px] flex-shrink-0 text-left",
                 "bg-card rounded-2xl p-4 border-2 transition-all duration-200",
                 "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02]",
                 "active:scale-[0.98]",
                 size.is_promo 
                   ? "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent" 
                   : "border-border/30"
               )}
             >
               <div className="flex items-center gap-3">
                 <PizzaSizeIcon slices={size.slices} />
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2">
                     <h3 className="font-bold text-base truncate">{size.name}</h3>
                     {size.is_promo && size.promo_label && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-destructive to-orange-500 text-white text-[10px] font-bold uppercase tracking-wide flex-shrink-0 shadow-lg">
                          {size.promo_label}
                          <Flame className="w-2.5 h-2.5 animate-pulse" />
                          <span className="animate-pulse">HOT</span>
                        </span>
                     )}
                   </div>
                   <p className="text-xs text-muted-foreground mt-0.5">
                     Até {size.max_flavors} {size.max_flavors === 1 ? 'sabor' : 'sabores'}
                   </p>
                   <p className="text-sm font-semibold text-primary mt-1">
                     A partir de R$ {size.base_price.toFixed(2).replace('.', ',')}
                   </p>
                 </div>
                 <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
               </div>
             </button>
           ))}
         </div>
       </div>
     </section>
   );
 }