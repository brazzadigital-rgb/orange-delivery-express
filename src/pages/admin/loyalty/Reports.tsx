 import { BarChart3, Star, Gift, TrendingUp, Users, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
 import { useAdminLoyaltyStats } from '@/hooks/useAdminLoyalty';
 import { LoadingSpinner } from '@/components/common/LoadingSpinner';
 
 export default function AdminLoyaltyReports() {
   const { data: stats, isLoading } = useAdminLoyaltyStats();
 
   if (isLoading) {
     return (
       <div className="p-6 flex items-center justify-center">
         <LoadingSpinner />
       </div>
     );
   }
 
   const redemptionRate = stats?.totalEarned 
     ? ((stats.pointsRedeemed / stats.totalEarned) * 100).toFixed(1) 
     : '0';
 
   return (
     <div className="p-6">
       <div className="mb-6">
         <h1 className="text-2xl font-bold flex items-center gap-2">
           <BarChart3 className="w-6 h-6" />
           Relatórios
         </h1>
         <p className="text-muted-foreground">Métricas do programa de fidelidade</p>
       </div>
 
       {/* KPI Cards */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
         <div className="card-premium p-4">
           <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
               <Users className="w-5 h-5 text-primary" />
             </div>
             <span className="text-sm text-muted-foreground">Clientes</span>
           </div>
           <p className="text-3xl font-bold">{stats?.customerCount.toLocaleString('pt-BR') || 0}</p>
           <p className="text-xs text-muted-foreground">com carteira de pontos</p>
         </div>
 
         <div className="card-premium p-4">
           <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
               <TrendingUp className="w-5 h-5 text-green-600" />
             </div>
             <span className="text-sm text-muted-foreground">Total Emitido</span>
           </div>
           <p className="text-3xl font-bold text-green-600">
             {stats?.totalEarned.toLocaleString('pt-BR') || 0}
           </p>
           <p className="text-xs text-muted-foreground">pontos creditados</p>
         </div>
 
         <div className="card-premium p-4">
           <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
               <Gift className="w-5 h-5 text-orange-600" />
             </div>
             <span className="text-sm text-muted-foreground">Total Resgatado</span>
           </div>
           <p className="text-3xl font-bold text-orange-600">
             {stats?.pointsRedeemed.toLocaleString('pt-BR') || 0}
           </p>
           <p className="text-xs text-muted-foreground">pontos usados</p>
         </div>
 
         <div className="card-premium p-4">
           <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
               <Star className="w-5 h-5 text-blue-600" />
             </div>
             <span className="text-sm text-muted-foreground">Saldo Circulante</span>
           </div>
           <p className="text-3xl font-bold text-blue-600">
             {stats?.totalBalance.toLocaleString('pt-BR') || 0}
           </p>
           <p className="text-xs text-muted-foreground">pontos disponíveis</p>
         </div>
       </div>
 
       {/* Secondary Stats */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <div className="card-premium p-4">
           <h3 className="font-semibold mb-4 flex items-center gap-2">
             <ArrowDownLeft className="w-4 h-4 text-green-600" />
             Pontos Pendentes
           </h3>
           <p className="text-2xl font-bold">{stats?.totalPending.toLocaleString('pt-BR') || 0}</p>
           <p className="text-sm text-muted-foreground">aguardando confirmação</p>
         </div>
 
         <div className="card-premium p-4">
           <h3 className="font-semibold mb-4 flex items-center gap-2">
             <ArrowUpRight className="w-4 h-4 text-orange-600" />
             Resgates Realizados
           </h3>
           <p className="text-2xl font-bold">{stats?.appliedRedemptions.toLocaleString('pt-BR') || 0}</p>
           <p className="text-sm text-muted-foreground">de {stats?.totalRedemptions || 0} tentativas</p>
         </div>
 
         <div className="card-premium p-4">
           <h3 className="font-semibold mb-4 flex items-center gap-2">
             <BarChart3 className="w-4 h-4 text-purple-600" />
             Taxa de Resgate
           </h3>
           <p className="text-2xl font-bold text-purple-600">{redemptionRate}%</p>
           <p className="text-sm text-muted-foreground">dos pontos emitidos</p>
         </div>
       </div>
 
       {/* Info Section */}
       <div className="mt-8 p-4 bg-muted/50 rounded-xl">
         <h3 className="font-semibold mb-2">Sobre os Relatórios</h3>
         <ul className="text-sm text-muted-foreground space-y-1">
           <li>• <strong>Total Emitido:</strong> soma de todos os pontos já creditados aos clientes</li>
           <li>• <strong>Total Resgatado:</strong> pontos já utilizados em recompensas</li>
           <li>• <strong>Saldo Circulante:</strong> pontos disponíveis nas carteiras dos clientes</li>
           <li>• <strong>Taxa de Resgate:</strong> percentual de pontos usados vs emitidos</li>
         </ul>
       </div>
     </div>
   );
 }