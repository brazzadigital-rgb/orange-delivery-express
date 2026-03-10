 import { useState } from 'react';
 import { Star, Gift, History, TrendingUp, Clock, ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
 import { PageHeader } from '@/components/common/PageHeader';
 import { Button } from '@/components/ui/button';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { 
   useLoyaltySettings, 
   useLoyaltyWallet, 
   useLoyaltyRewards,
   useLoyaltyTransactions,
   useLoyaltyRedemptions,
   isRewardApplicable,
   getTransactionTypeLabel,
   getRewardTypeLabel,
   LoyaltyReward
 } from '@/hooks/useLoyalty';
 import { LoadingSpinner } from '@/components/common/LoadingSpinner';
 import { cn } from '@/lib/utils';
 import { format } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 
 export default function Loyalty() {
   const [transactionFilter, setTransactionFilter] = useState<'all' | 'earn' | 'spend' | 'expire'>('all');
   
   const { data: settings, isLoading: settingsLoading } = useLoyaltySettings();
   const { data: wallet, isLoading: walletLoading } = useLoyaltyWallet();
   const { data: rewards, isLoading: rewardsLoading } = useLoyaltyRewards();
   const { data: transactions, isLoading: transactionsLoading } = useLoyaltyTransactions(transactionFilter);
   const { data: redemptions } = useLoyaltyRedemptions();
 
   if (settingsLoading || walletLoading) {
     return (
       <div className="min-h-screen bg-background">
         <PageHeader title="Pontos" />
         <div className="flex items-center justify-center py-20">
           <LoadingSpinner />
         </div>
       </div>
     );
   }
 
   if (!settings?.enabled) {
     return (
       <div className="min-h-screen bg-background">
         <PageHeader title="Pontos" />
         <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
           <Star className="w-16 h-16 text-muted-foreground mb-4" />
           <h2 className="text-xl font-bold mb-2">Programa de Fidelidade</h2>
           <p className="text-muted-foreground">
             O programa de pontos não está disponível no momento.
           </p>
         </div>
       </div>
     );
   }
 
   const balance = wallet?.points_balance || 0;
   const pending = wallet?.points_pending || 0;
   const lifetimeEarned = wallet?.lifetime_earned || 0;
   const lifetimeSpent = wallet?.lifetime_spent || 0;
 
   return (
     <div className="min-h-screen bg-background pb-24">
       <PageHeader title={settings.program_name} />
 
       <div className="px-4 space-y-6">
         {/* Balance Card */}
         <div className="card-premium p-6 bg-gradient-to-br from-primary/10 to-primary/5">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
               <Star className="w-7 h-7 text-white fill-white" />
             </div>
             <div>
               <p className="text-sm text-muted-foreground">Saldo disponível</p>
               <p className="text-4xl font-bold text-primary">{balance.toLocaleString('pt-BR')}</p>
             </div>
           </div>
 
           <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
             <div className="text-center">
               <p className="text-lg font-bold">{pending.toLocaleString('pt-BR')}</p>
               <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                 <Clock className="w-3 h-3" />
                 Pendentes
               </p>
             </div>
             <div className="text-center">
               <p className="text-lg font-bold text-green-600">{lifetimeEarned.toLocaleString('pt-BR')}</p>
               <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                 <TrendingUp className="w-3 h-3" />
                 Total ganho
               </p>
             </div>
             <div className="text-center">
               <p className="text-lg font-bold text-orange-600">{lifetimeSpent.toLocaleString('pt-BR')}</p>
               <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                 <Gift className="w-3 h-3" />
                 Total gasto
               </p>
             </div>
           </div>
 
          {settings.reais_per_point > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-sm text-center text-muted-foreground">
                Ganhe <span className="font-bold text-primary">1 ponto</span> a cada <span className="font-bold text-primary">R$ {settings.reais_per_point.toFixed(2).replace('.', ',')}</span> gasto
              </p>
            </div>
          )}
         </div>
 
         {/* Rewards Section */}
         <section>
           <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
             <Gift className="w-5 h-5 text-primary" />
             Recompensas
           </h2>
 
           {rewardsLoading ? (
             <LoadingSpinner />
           ) : rewards && rewards.length > 0 ? (
             <div className="grid gap-3">
               {rewards.map((reward) => (
                 <RewardCard key={reward.id} reward={reward} balance={balance} />
               ))}
             </div>
           ) : (
             <p className="text-center text-muted-foreground py-8">
               Nenhuma recompensa disponível no momento.
             </p>
           )}
         </section>
 
         {/* Transactions Section */}
         <section>
           <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
             <History className="w-5 h-5 text-primary" />
             Extrato
           </h2>
 
           <Tabs value={transactionFilter} onValueChange={(v) => setTransactionFilter(v as any)}>
             <TabsList className="grid w-full grid-cols-4 mb-4">
               <TabsTrigger value="all">Todos</TabsTrigger>
               <TabsTrigger value="earn">Ganhos</TabsTrigger>
               <TabsTrigger value="spend">Gastos</TabsTrigger>
               <TabsTrigger value="expire">Expirados</TabsTrigger>
             </TabsList>
 
             <TabsContent value={transactionFilter} className="mt-0">
               {transactionsLoading ? (
                 <LoadingSpinner />
               ) : transactions && transactions.length > 0 ? (
                 <div className="space-y-2">
                   {transactions.map((tx) => (
                     <div 
                       key={tx.id} 
                       className="card-premium p-3 flex items-center gap-3"
                     >
                       <div className={cn(
                         "w-10 h-10 rounded-xl flex items-center justify-center",
                         tx.points > 0 
                           ? "bg-green-100 text-green-600" 
                           : "bg-orange-100 text-orange-600"
                       )}>
                         {tx.points > 0 ? (
                           <ArrowDownLeft className="w-5 h-5" />
                         ) : (
                           <ArrowUpRight className="w-5 h-5" />
                         )}
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="font-medium truncate">{tx.description}</p>
                         <p className="text-xs text-muted-foreground">
                           {format(new Date(tx.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                         </p>
                       </div>
                       <span className={cn(
                         "font-bold text-lg",
                         tx.points > 0 ? "text-green-600" : "text-orange-600"
                       )}>
                         {tx.points > 0 ? '+' : ''}{tx.points}
                       </span>
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="text-center text-muted-foreground py-8">
                   Nenhuma movimentação encontrada.
                 </p>
               )}
             </TabsContent>
           </Tabs>
         </section>
       </div>
     </div>
   );
 }
 
 function RewardCard({ reward, balance }: { reward: LoyaltyReward; balance: number }) {
   const canRedeem = balance >= reward.points_cost;
   const constraints = reward.constraints || {};
 
   return (
     <div className={cn(
       "card-premium p-4 transition-all",
       !canRedeem && "opacity-60"
     )}>
       <div className="flex items-start gap-4">
         <div className={cn(
           "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
           canRedeem 
             ? "bg-gradient-to-br from-primary to-primary/70" 
             : "bg-muted"
         )}>
           <Gift className={cn("w-7 h-7", canRedeem ? "text-white" : "text-muted-foreground")} />
         </div>
         <div className="flex-1 min-w-0">
           <h3 className="font-bold">{reward.name}</h3>
           {reward.description && (
             <p className="text-sm text-muted-foreground">{reward.description}</p>
           )}
           <div className="flex items-center gap-2 mt-2">
             <span className={cn(
               "px-2 py-0.5 rounded-full text-xs font-bold",
               canRedeem 
                 ? "bg-primary text-white" 
                 : "bg-muted text-muted-foreground"
             )}>
               {reward.points_cost.toLocaleString('pt-BR')} pts
             </span>
             <span className="text-xs text-muted-foreground">
               {getRewardTypeLabel(reward.type)}
             </span>
           </div>
           {constraints.min_order_value && (
             <p className="text-xs text-muted-foreground mt-1">
               Pedido mínimo: R$ {constraints.min_order_value.toFixed(2).replace('.', ',')}
             </p>
           )}
         </div>
         {!canRedeem && (
           <div className="text-right flex-shrink-0">
             <p className="text-xs text-muted-foreground">Faltam</p>
             <p className="font-bold text-primary">
               {(reward.points_cost - balance).toLocaleString('pt-BR')}
             </p>
           </div>
         )}
       </div>
     </div>
   );
 }