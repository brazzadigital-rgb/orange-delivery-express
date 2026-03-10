 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Gift, Star, Sparkles, Loader2 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { 
   useLoyaltySettings, 
   useLoyaltyWallet, 
   useLoyaltyRewards,
   useReserveReward,
   LoyaltyReward
 } from '@/hooks/useLoyalty';
 import { usePizzaSizes, usePizzaBuilderStore } from '@/hooks/usePizzaBuilder';
 import { useCart } from '@/hooks/useCart';
 import { cn } from '@/lib/utils';
 import { toast } from 'sonner';
 
 interface FreePizzaRewardBannerProps {
   onRedeemed?: () => void;
 }
 
 export function FreePizzaRewardBanner({ onRedeemed }: FreePizzaRewardBannerProps) {
   const navigate = useNavigate();
   const { data: settings, isLoading: settingsLoading } = useLoyaltySettings();
   const { data: wallet, isLoading: walletLoading } = useLoyaltyWallet();
   const { data: rewards, isLoading: rewardsLoading } = useLoyaltyRewards();
   const { data: sizes } = usePizzaSizes();
   const reserveReward = useReserveReward();
   const { addItem } = useCart();
   
   const [isRedeeming, setIsRedeeming] = useState(false);
 
   const isLoading = settingsLoading || walletLoading || rewardsLoading;
   
   // Find free pizza reward (type = free_item)
   const freePizzaReward = rewards?.find(r => r.type === 'free_item' && r.active);
   
   // Check if user has enough points
   const balance = wallet?.points_balance || 0;
   const canRedeem = freePizzaReward && balance >= freePizzaReward.points_cost;
 
   // Find 8-slice pizza size
   const pizza8Slices = sizes?.find(s => s.slices === 8);
 
   if (isLoading || !settings?.enabled || !freePizzaReward || !canRedeem || !pizza8Slices) {
     return null;
   }
 
   const handleRedeem = async () => {
     if (!freePizzaReward || !pizza8Slices) return;
     
     setIsRedeeming(true);
     
     try {
       // Reserve the reward
       const redemption = await reserveReward.mutateAsync({
         rewardId: freePizzaReward.id,
         pointsCost: freePizzaReward.points_cost,
       });
 
       // Add free pizza to cart
       addItem({
         productId: `pizza-reward-${Date.now()}`,
         name: `🎁 ${pizza8Slices.name} (Grátis)`,
         basePrice: 0,
         quantity: 1,
         options: [
           {
             optionId: 'reward',
            optionName: 'Recompensa',
             itemId: redemption.id,
             itemLabel: `${freePizzaReward.points_cost} pontos`,
             priceDelta: 0,
           }
         ],
         imageUrl: undefined,
       });
 
       toast.success('🎉 Pizza grátis adicionada ao carrinho!', {
         description: `Você usou ${freePizzaReward.points_cost} pontos`,
       });
 
       onRedeemed?.();
       navigate('/app/cart');
     } catch (error) {
       console.error('Error redeeming reward:', error);
       toast.error('Erro ao resgatar recompensa');
     } finally {
       setIsRedeeming(false);
     }
   };
 
   return (
     <div className="mx-3 sm:mx-4 mb-4">
       <div className={cn(
         "relative overflow-hidden rounded-2xl p-4",
         "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500",
         "shadow-lg shadow-orange-500/25"
       )}>
         {/* Sparkle decorations */}
         <div className="absolute top-2 right-4 animate-pulse">
           <Sparkles className="w-5 h-5 text-white/60" />
         </div>
         <div className="absolute bottom-3 right-12 animate-pulse delay-300">
           <Sparkles className="w-4 h-4 text-white/40" />
         </div>
         
         <div className="flex items-center gap-4">
           {/* Icon */}
           <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
             <Gift className="w-7 h-7 text-white" />
           </div>
           
           {/* Content */}
           <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2">
               <Star className="w-4 h-4 text-yellow-200 fill-yellow-200" />
               <span className="text-xs font-bold text-white/90 uppercase tracking-wide">
                 Recompensa Disponível
               </span>
             </div>
             <h3 className="text-lg font-bold text-white mt-0.5">
               {freePizzaReward.name}
             </h3>
             <p className="text-sm text-white/80">
               Use seus <span className="font-bold">{freePizzaReward.points_cost} pontos</span>
             </p>
           </div>
         </div>
         
         {/* Action button */}
         <Button
           onClick={handleRedeem}
           disabled={isRedeeming}
           className={cn(
             "w-full mt-4 h-12 text-base font-bold rounded-xl",
             "bg-white text-orange-600 hover:bg-white/90",
             "shadow-lg"
           )}
         >
           {isRedeeming ? (
             <>
               <Loader2 className="w-5 h-5 mr-2 animate-spin" />
               Resgatando...
             </>
           ) : (
             <>
               <Gift className="w-5 h-5 mr-2" />
               Resgatar Pizza Grátis
             </>
           )}
         </Button>
         
         {/* Points balance indicator */}
         <p className="text-center text-xs text-white/70 mt-2">
           Seu saldo: <span className="font-bold text-white">{balance.toLocaleString('pt-BR')} pontos</span>
         </p>
       </div>
     </div>
   );
 }