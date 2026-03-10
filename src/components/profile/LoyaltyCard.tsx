 import { useNavigate } from 'react-router-dom';
 import { Zap, Gift, ChevronRight, TrendingUp } from 'lucide-react';
 import { useLoyaltySettings, useLoyaltyWallet } from '@/hooks/useLoyalty';
 import { Skeleton } from '@/components/ui/skeleton';
 
 export function LoyaltyCard() {
   const navigate = useNavigate();
   const { data: settings, isLoading: settingsLoading } = useLoyaltySettings();
   const { data: wallet, isLoading: walletLoading } = useLoyaltyWallet();
 
   // Don't show if loyalty is disabled
   if (settingsLoading || walletLoading) {
     return (
       <div className="card-premium p-4 animate-pulse">
         <div className="h-6 bg-muted rounded w-1/3 mb-3" />
         <div className="h-8 bg-muted rounded w-1/4 mb-2" />
         <div className="h-4 bg-muted rounded w-1/2" />
       </div>
     );
   }
 
   if (!settings?.enabled) return null;
 
   const balance = wallet?.points_balance || 0;
   const pending = wallet?.points_pending || 0;
   const lifetimeEarned = wallet?.lifetime_earned || 0;
 
   return (
     <button
       onClick={() => navigate('/app/loyalty')}
       className="w-full card-premium p-4 text-left transition-all hover:shadow-lg active:scale-[0.99]"
     >
       <div className="flex items-center justify-between mb-3">
         <div className="flex items-center gap-2">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-white" />
           </div>
           <h3 className="font-semibold">{settings.program_name}</h3>
         </div>
         <ChevronRight className="w-5 h-5 text-muted-foreground" />
       </div>
 
       <div className="flex items-end justify-between">
         <div>
           <p className="text-3xl font-bold text-primary">{balance.toLocaleString('pt-BR')}</p>
           <p className="text-sm text-muted-foreground">pontos disponíveis</p>
         </div>
         <div className="text-right">
           {pending > 0 && (
             <p className="text-sm text-muted-foreground">
               +{pending.toLocaleString('pt-BR')} pendentes
             </p>
           )}
           <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
             <TrendingUp className="w-3 h-3" />
             {lifetimeEarned.toLocaleString('pt-BR')} total
           </p>
         </div>
       </div>
 
       <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
         <div className="flex items-center gap-2 text-sm text-primary">
           <Gift className="w-4 h-4" />
           <span className="font-medium">Ver recompensas</span>
         </div>
         <ChevronRight className="w-4 h-4 text-primary" />
       </div>
     </button>
   );
 }