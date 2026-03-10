 import { useState } from 'react';
import { Users, Search, Star, Plus, Minus, History, CheckCircle, Clock, Zap } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
 import { 
   Dialog, 
   DialogContent, 
   DialogHeader, 
   DialogTitle,
   DialogFooter
 } from '@/components/ui/dialog';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { 
   useAdminLoyaltyWallets, 
   useAdminCustomerTransactions,
   useAdjustPoints,
  LoyaltyWalletWithProfile,
  usePendingPointsOrders,
  useApprovePoints,
  useApproveAllPoints,
 } from '@/hooks/useAdminLoyalty';
import { useAdminLoyaltySettings } from '@/hooks/useAdminLoyalty';
 import { getTransactionTypeLabel } from '@/hooks/useLoyalty';
 import { LoadingSpinner } from '@/components/common/LoadingSpinner';
 import { format } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { cn } from '@/lib/utils';
 
 export default function AdminLoyaltyCustomers() {
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedCustomer, setSelectedCustomer] = useState<LoyaltyWalletWithProfile | null>(null);
   const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
   const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
   const [adjustForm, setAdjustForm] = useState({ points: 0, description: '' });
 
   const { data: wallets, isLoading } = useAdminLoyaltyWallets(searchTerm);
  const { data: settings } = useAdminLoyaltySettings();
  const { data: pendingOrders, isLoading: pendingLoading } = usePendingPointsOrders();
   const { data: transactions, isLoading: transactionsLoading } = useAdminCustomerTransactions(
     selectedCustomer?.user_id || ''
   );
   const adjustPoints = useAdjustPoints();
  const approvePoints = useApprovePoints();
  const approveAllPoints = useApproveAllPoints();

  const showPendingTab = !settings?.auto_credit_enabled;
  const pendingCount = pendingOrders?.length || 0;
 
   const openAdjust = (wallet: LoyaltyWalletWithProfile, type: 'add' | 'remove') => {
     setSelectedCustomer(wallet);
     setAdjustForm({ 
       points: type === 'add' ? 100 : -100, 
       description: type === 'add' ? 'Ajuste manual - crédito' : 'Ajuste manual - débito' 
     });
     setAdjustDialogOpen(true);
   };
 
   const openHistory = (wallet: LoyaltyWalletWithProfile) => {
     setSelectedCustomer(wallet);
     setHistoryDialogOpen(true);
   };
 
   const handleAdjust = async () => {
     if (!selectedCustomer || !adjustForm.description) return;
     
     await adjustPoints.mutateAsync({
       userId: selectedCustomer.user_id,
       points: adjustForm.points,
       description: adjustForm.description,
     });
     
     setAdjustDialogOpen(false);
     setSelectedCustomer(null);
   };
 
  const handleApprove = async (orderId: string) => {
    await approvePoints.mutateAsync(orderId);
  };

  const handleApproveAll = async () => {
    if (!pendingOrders || pendingOrders.length === 0) return;
    await approveAllPoints.mutateAsync(pendingOrders.map(o => o.id));
  };

   if (isLoading) {
     return (
       <div className="p-6 flex items-center justify-center">
         <LoadingSpinner />
       </div>
     );
   }
 
   return (
     <div className="p-6">
       <div className="flex items-center justify-between mb-6">
         <div>
           <h1 className="text-2xl font-bold flex items-center gap-2">
             <Users className="w-6 h-6" />
             Clientes
           </h1>
           <p className="text-muted-foreground">Gerencie os pontos dos clientes</p>
         </div>
       </div>
 
      <Tabs defaultValue={showPendingTab && pendingCount > 0 ? "pending" : "customers"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">
            <Users className="w-4 h-4 mr-2" />
            Todos Clientes
          </TabsTrigger>
          {showPendingTab && (
            <TabsTrigger value="pending" className="relative">
              <Clock className="w-4 h-4 mr-2" />
              Aprovação Pendente
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>
 
        {/* Pending Approval Tab */}
        {showPendingTab && (
          <TabsContent value="pending" className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Crédito Automático Desativado</p>
                <p className="text-sm text-amber-700">
                  Pontos de pedidos entregues precisam ser aprovados manualmente antes de serem creditados.
                </p>
              </div>
            </div>

            {pendingCount > 0 && (
              <div className="flex justify-end">
                <Button 
                  onClick={handleApproveAll}
                  disabled={approveAllPoints.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar Todos ({pendingCount})
                </Button>
              </div>
            )}

            {pendingLoading ? (
              <LoadingSpinner />
            ) : pendingOrders && pendingOrders.length > 0 ? (
              <div className="card-premium overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Pedido</th>
                      <th className="text-left p-4 font-medium">Cliente</th>
                      <th className="text-right p-4 font-medium">Valor</th>
                      <th className="text-right p-4 font-medium">Pontos</th>
                      <th className="text-right p-4 font-medium">Data</th>
                      <th className="text-right p-4 font-medium">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pendingOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/30">
                        <td className="p-4">
                          <span className="font-mono font-bold">#{order.order_number}</span>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{order.profile?.name || 'Cliente'}</p>
                            <p className="text-sm text-muted-foreground">{order.profile?.email}</p>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          R$ {order.total.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-bold text-primary">
                            +{order.loyalty_points_earned}
                          </span>
                        </td>
                        <td className="p-4 text-right text-muted-foreground text-sm">
                          {format(new Date(order.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(order.id)}
                            disabled={approvePoints.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 card-premium">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Tudo em dia!</h3>
                <p className="text-muted-foreground">
                  Não há pontos pendentes para aprovar
                </p>
              </div>
            )}
          </TabsContent>
        )}

        {/* All Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, email ou telefone..."
              className="pl-10"
            />
          </div>

          {wallets && wallets.length > 0 ? (
            <div className="card-premium overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Cliente</th>
                    <th className="text-right p-4 font-medium">Saldo</th>
                    <th className="text-right p-4 font-medium">Pendentes</th>
                    <th className="text-right p-4 font-medium">Total Ganho</th>
                    <th className="text-right p-4 font-medium">Total Gasto</th>
                    <th className="text-right p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {wallets.map((wallet) => (
                    <tr key={wallet.id} className="hover:bg-muted/30">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{wallet.profile?.name || 'Cliente'}</p>
                          <p className="text-sm text-muted-foreground">{wallet.profile?.email}</p>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-primary">
                          {wallet.points_balance.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="p-4 text-right text-muted-foreground">
                        {wallet.points_pending.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4 text-right text-green-600">
                        {wallet.lifetime_earned.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4 text-right text-orange-600">
                        {wallet.lifetime_spent.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openHistory(wallet)}
                          >
                            <History className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openAdjust(wallet, 'add')}
                          >
                            <Plus className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openAdjust(wallet, 'remove')}
                          >
                            <Minus className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 card-premium">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Nenhum cliente</h3>
              <p className="text-muted-foreground">
                Clientes com pontos aparecerão aqui
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
 
       {/* Adjust Points Dialog */}
       <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Ajustar Pontos</DialogTitle>
           </DialogHeader>
 
           <div className="space-y-4">
             <div className="p-3 bg-muted/50 rounded-lg">
               <p className="font-medium">{selectedCustomer?.profile?.name || 'Cliente'}</p>
               <p className="text-sm text-muted-foreground">{selectedCustomer?.profile?.email}</p>
               <p className="text-sm mt-1">
                 Saldo atual: <span className="font-bold text-primary">{selectedCustomer?.points_balance.toLocaleString('pt-BR')}</span> pontos
               </p>
             </div>
 
             <div>
               <Label>Pontos (positivo para adicionar, negativo para remover)</Label>
               <Input
                 type="number"
                 value={adjustForm.points}
                 onChange={(e) => setAdjustForm(f => ({ ...f, points: parseInt(e.target.value) || 0 }))}
               />
             </div>
 
             <div>
               <Label>Motivo</Label>
               <Textarea
                 value={adjustForm.description}
                 onChange={(e) => setAdjustForm(f => ({ ...f, description: e.target.value }))}
                 placeholder="Descreva o motivo do ajuste..."
                 rows={2}
               />
             </div>
 
             {adjustForm.points !== 0 && (
               <div className={cn(
                 "p-3 rounded-lg text-sm",
                 adjustForm.points > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
               )}>
                 Novo saldo: <strong>
                   {((selectedCustomer?.points_balance || 0) + adjustForm.points).toLocaleString('pt-BR')}
                 </strong> pontos
               </div>
             )}
           </div>
 
           <DialogFooter>
             <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
               Cancelar
             </Button>
             <Button 
               onClick={handleAdjust}
               disabled={!adjustForm.description || adjustForm.points === 0 || adjustPoints.isPending}
             >
               Confirmar
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
       {/* History Dialog */}
       <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
         <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
           <DialogHeader>
             <DialogTitle>Extrato - {selectedCustomer?.profile?.name || 'Cliente'}</DialogTitle>
           </DialogHeader>
 
           <div className="flex-1 overflow-y-auto">
             {transactionsLoading ? (
               <LoadingSpinner />
             ) : transactions && transactions.length > 0 ? (
               <div className="space-y-2">
                 {transactions.map((tx) => (
                   <div 
                     key={tx.id} 
                     className="p-3 rounded-lg bg-muted/30 flex items-center justify-between"
                   >
                     <div>
                       <p className="font-medium text-sm">{tx.description}</p>
                       <p className="text-xs text-muted-foreground">
                         {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                         {' • '}
                         {getTransactionTypeLabel(tx.type)}
                       </p>
                     </div>
                     <span className={cn(
                       "font-bold",
                       tx.points > 0 ? "text-green-600" : "text-red-600"
                     )}>
                       {tx.points > 0 ? '+' : ''}{tx.points}
                     </span>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-center text-muted-foreground py-8">
                 Nenhuma movimentação
               </p>
             )}
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 }