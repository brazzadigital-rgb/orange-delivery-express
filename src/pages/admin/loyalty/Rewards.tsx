 import { useState } from 'react';
 import { Gift, Plus, Edit2, Trash2, Truck, Tag, Pizza, Percent, MoreVertical } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { 
   Dialog, 
   DialogContent, 
   DialogHeader, 
   DialogTitle,
   DialogFooter
 } from '@/components/ui/dialog';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Switch } from '@/components/ui/switch';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { 
   useAdminLoyaltyRewards, 
   useCreateLoyaltyReward, 
   useUpdateLoyaltyReward, 
   useDeleteLoyaltyReward,
   useCreateDemoRewards
 } from '@/hooks/useAdminLoyalty';
 import { LoyaltyReward, getRewardTypeLabel } from '@/hooks/useLoyalty';
 import { LoadingSpinner } from '@/components/common/LoadingSpinner';
 import { cn } from '@/lib/utils';
 
 const rewardTypeIcons: Record<string, React.ElementType> = {
   free_shipping: Truck,
   free_item: Pizza,
   discount_amount: Tag,
   discount_percent: Percent,
 };
 
 export default function AdminLoyaltyRewards() {
   const { data: rewards, isLoading } = useAdminLoyaltyRewards();
   const createReward = useCreateLoyaltyReward();
   const updateReward = useUpdateLoyaltyReward();
   const deleteReward = useDeleteLoyaltyReward();
   const createDemoRewards = useCreateDemoRewards();
 
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
   const [form, setForm] = useState({
     name: '',
     description: '',
     type: 'free_shipping' as LoyaltyReward['type'],
     points_cost: 100,
     active: true,
     constraints: {} as Record<string, any>,
     sort_order: 0,
   });
 
   const openCreate = () => {
     setEditingReward(null);
     setForm({
       name: '',
       description: '',
       type: 'free_shipping',
       points_cost: 100,
       active: true,
       constraints: {},
       sort_order: (rewards?.length || 0),
     });
     setIsDialogOpen(true);
   };
 
   const openEdit = (reward: LoyaltyReward) => {
     setEditingReward(reward);
     setForm({
       name: reward.name,
       description: reward.description || '',
       type: reward.type,
       points_cost: reward.points_cost,
       active: reward.active,
       constraints: reward.constraints || {},
       sort_order: reward.sort_order,
     });
     setIsDialogOpen(true);
   };
 
   const handleSave = async () => {
     if (editingReward) {
       await updateReward.mutateAsync({ id: editingReward.id, ...form });
     } else {
       await createReward.mutateAsync(form);
     }
     setIsDialogOpen(false);
   };
 
   const handleDelete = async (id: string) => {
     if (confirm('Tem certeza que deseja excluir esta recompensa?')) {
       await deleteReward.mutateAsync(id);
     }
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
             <Gift className="w-6 h-6" />
             Recompensas
           </h1>
           <p className="text-muted-foreground">Gerencie as recompensas do programa</p>
         </div>
         <div className="flex gap-2">
           {(!rewards || rewards.length === 0) && (
             <Button 
               variant="outline" 
               onClick={() => createDemoRewards.mutate()}
               disabled={createDemoRewards.isPending}
             >
               Criar Demo
             </Button>
           )}
           <Button onClick={openCreate}>
             <Plus className="w-4 h-4 mr-2" />
             Nova Recompensa
           </Button>
         </div>
       </div>
 
       {rewards && rewards.length > 0 ? (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {rewards.map((reward) => {
             const Icon = rewardTypeIcons[reward.type] || Gift;
             return (
               <div 
                 key={reward.id} 
                 className={cn(
                   "card-premium p-4 transition-all",
                   !reward.active && "opacity-60"
                 )}
               >
                 <div className="flex items-start justify-between mb-3">
                   <div className="flex items-center gap-3">
                     <div className={cn(
                       "w-12 h-12 rounded-xl flex items-center justify-center",
                       reward.active 
                         ? "bg-gradient-to-br from-primary to-primary/70" 
                         : "bg-muted"
                     )}>
                       <Icon className={cn(
                         "w-6 h-6",
                         reward.active ? "text-white" : "text-muted-foreground"
                       )} />
                     </div>
                     <div>
                       <h3 className="font-bold">{reward.name}</h3>
                       <p className="text-sm text-muted-foreground">
                         {getRewardTypeLabel(reward.type)}
                       </p>
                     </div>
                   </div>
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                       <Button variant="ghost" size="icon">
                         <MoreVertical className="w-4 h-4" />
                       </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                       <DropdownMenuItem onClick={() => openEdit(reward)}>
                         <Edit2 className="w-4 h-4 mr-2" />
                         Editar
                       </DropdownMenuItem>
                       <DropdownMenuItem 
                         onClick={() => handleDelete(reward.id)}
                         className="text-destructive"
                       >
                         <Trash2 className="w-4 h-4 mr-2" />
                         Excluir
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
                 </div>
 
                 {reward.description && (
                   <p className="text-sm text-muted-foreground mb-3">
                     {reward.description}
                   </p>
                 )}
 
                 <div className="flex items-center justify-between pt-3 border-t border-border">
                   <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm">
                     {reward.points_cost.toLocaleString('pt-BR')} pts
                   </span>
                   <span className={cn(
                     "text-xs font-medium px-2 py-1 rounded-full",
                     reward.active 
                       ? "bg-green-100 text-green-700" 
                       : "bg-gray-100 text-gray-500"
                   )}>
                     {reward.active ? 'Ativo' : 'Inativo'}
                   </span>
                 </div>
               </div>
             );
           })}
         </div>
       ) : (
         <div className="text-center py-12 card-premium">
           <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
           <h3 className="text-lg font-bold mb-2">Nenhuma recompensa</h3>
           <p className="text-muted-foreground mb-4">
             Crie recompensas para seus clientes trocarem por pontos
           </p>
           <div className="flex gap-2 justify-center">
             <Button 
               variant="outline" 
               onClick={() => createDemoRewards.mutate()}
               disabled={createDemoRewards.isPending}
             >
               Criar Demo
             </Button>
             <Button onClick={openCreate}>
               <Plus className="w-4 h-4 mr-2" />
               Nova Recompensa
             </Button>
           </div>
         </div>
       )}
 
       {/* Create/Edit Dialog */}
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>
               {editingReward ? 'Editar Recompensa' : 'Nova Recompensa'}
             </DialogTitle>
           </DialogHeader>
 
           <div className="space-y-4">
             <div>
               <Label>Nome</Label>
               <Input
                 value={form.name}
                 onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                 placeholder="Ex: Frete Grátis"
               />
             </div>
 
             <div>
               <Label>Descrição</Label>
               <Textarea
                 value={form.description}
                 onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                 placeholder="Descrição opcional"
                 rows={2}
               />
             </div>
 
             <div>
               <Label>Tipo</Label>
               <Select
                 value={form.type}
                 onValueChange={(value: LoyaltyReward['type']) => setForm(f => ({ ...f, type: value }))}
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="free_shipping">Frete Grátis</SelectItem>
                   <SelectItem value="discount_amount">Desconto em R$</SelectItem>
                   <SelectItem value="discount_percent">Desconto em %</SelectItem>
                   <SelectItem value="free_item">Item Grátis</SelectItem>
                 </SelectContent>
               </Select>
             </div>
 
             <div>
               <Label>Custo em Pontos</Label>
               <Input
                 type="number"
                 min={1}
                 value={form.points_cost}
                 onChange={(e) => setForm(f => ({ ...f, points_cost: parseInt(e.target.value) || 1 }))}
               />
             </div>
 
             {/* Conditional constraints based on type */}
             {form.type === 'free_shipping' && (
               <>
                 <div>
                   <Label>Frete Máximo (R$)</Label>
                   <Input
                     type="number"
                     min={0}
                     step={0.01}
                     value={form.constraints.max_shipping_value ?? ''}
                     onChange={(e) => setForm(f => ({ 
                       ...f, 
                       constraints: { 
                         ...f.constraints, 
                         max_shipping_value: e.target.value ? parseFloat(e.target.value) : undefined 
                       } 
                     }))}
                     placeholder="Sem limite"
                   />
                 </div>
                 <div>
                   <Label>Pedido Mínimo (R$)</Label>
                   <Input
                     type="number"
                     min={0}
                     step={0.01}
                     value={form.constraints.min_order_value ?? ''}
                     onChange={(e) => setForm(f => ({ 
                       ...f, 
                       constraints: { 
                         ...f.constraints, 
                         min_order_value: e.target.value ? parseFloat(e.target.value) : undefined 
                       } 
                     }))}
                     placeholder="Sem mínimo"
                   />
                 </div>
               </>
             )}
 
             {form.type === 'discount_amount' && (
               <>
                 <div>
                   <Label>Valor do Desconto (R$)</Label>
                   <Input
                     type="number"
                     min={0}
                     step={0.01}
                     value={form.constraints.amount ?? ''}
                     onChange={(e) => setForm(f => ({ 
                       ...f, 
                       constraints: { 
                         ...f.constraints, 
                         amount: e.target.value ? parseFloat(e.target.value) : undefined 
                       } 
                     }))}
                   />
                 </div>
                 <div>
                   <Label>Pedido Mínimo (R$)</Label>
                   <Input
                     type="number"
                     min={0}
                     step={0.01}
                     value={form.constraints.min_order_value ?? ''}
                     onChange={(e) => setForm(f => ({ 
                       ...f, 
                       constraints: { 
                         ...f.constraints, 
                         min_order_value: e.target.value ? parseFloat(e.target.value) : undefined 
                       } 
                     }))}
                     placeholder="Sem mínimo"
                   />
                 </div>
               </>
             )}
 
             {form.type === 'discount_percent' && (
               <>
                 <div>
                   <Label>Porcentagem de Desconto</Label>
                   <Input
                     type="number"
                     min={1}
                     max={100}
                     value={form.constraints.percent ?? ''}
                     onChange={(e) => setForm(f => ({ 
                       ...f, 
                       constraints: { 
                         ...f.constraints, 
                         percent: e.target.value ? parseInt(e.target.value) : undefined 
                       } 
                     }))}
                   />
                 </div>
                 <div>
                   <Label>Pedido Mínimo (R$)</Label>
                   <Input
                     type="number"
                     min={0}
                     step={0.01}
                     value={form.constraints.min_order_value ?? ''}
                     onChange={(e) => setForm(f => ({ 
                       ...f, 
                       constraints: { 
                         ...f.constraints, 
                         min_order_value: e.target.value ? parseFloat(e.target.value) : undefined 
                       } 
                     }))}
                     placeholder="Sem mínimo"
                   />
                 </div>
               </>
             )}
 
             <div className="flex items-center justify-between pt-2">
               <Label>Ativo</Label>
               <Switch
                 checked={form.active}
                 onCheckedChange={(checked) => setForm(f => ({ ...f, active: checked }))}
               />
             </div>
           </div>
 
           <DialogFooter>
             <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
               Cancelar
             </Button>
             <Button 
               onClick={handleSave}
               disabled={!form.name || createReward.isPending || updateReward.isPending}
             >
               {editingReward ? 'Salvar' : 'Criar'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 }