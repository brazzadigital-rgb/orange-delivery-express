 import { useState } from 'react';
 import { Link, useLocation } from 'react-router-dom';
 import { Plus, Pencil, Trash2 } from 'lucide-react';
 import { PageHeader } from '@/components/common/PageHeader';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Switch } from '@/components/ui/switch';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
 import { 
   useAdminPizzaAddonGroups,
   useCreatePizzaAddonGroup,
   useUpdatePizzaAddonGroup,
   useDeletePizzaAddonGroup,
   useAdminPizzaAddons,
   useCreatePizzaAddon,
   useUpdatePizzaAddon,
   useDeletePizzaAddon
 } from '@/hooks/useAdminPizzaBuilder';
 import { LoadingSpinner } from '@/components/common/LoadingSpinner';
 import { cn } from '@/lib/utils';
 import type { PizzaAddonGroup, PizzaAddon } from '@/hooks/usePizzaBuilder';
 import { useAdminBuilderNav } from '@/hooks/useAdminBuilderNav';
 
 export default function AdminPizzaBuilderAddons() {
   const location = useLocation();
   const { navItems, pageTitle } = useAdminBuilderNav();
   const { data: groups, isLoading: loadingGroups } = useAdminPizzaAddonGroups();
   const { data: addons, isLoading: loadingAddons } = useAdminPizzaAddons();
   
   const createGroup = useCreatePizzaAddonGroup();
   const updateGroup = useUpdatePizzaAddonGroup();
   const deleteGroup = useDeletePizzaAddonGroup();
   
   const createAddon = useCreatePizzaAddon();
   const updateAddon = useUpdatePizzaAddon();
   const deleteAddon = useDeletePizzaAddon();
 
   // Group dialog
   const [groupDialogOpen, setGroupDialogOpen] = useState(false);
   const [editingGroup, setEditingGroup] = useState<PizzaAddonGroup | null>(null);
   const [groupFormData, setGroupFormData] = useState({
     name: '',
     group_type: 'single' as 'single' | 'multi',
     max_select: 1,
     min_select: 0,
     sort_order: 0,
     active: true,
   });
 
   // Addon dialog
   const [addonDialogOpen, setAddonDialogOpen] = useState(false);
   const [editingAddon, setEditingAddon] = useState<PizzaAddon | null>(null);
   const [addonFormData, setAddonFormData] = useState({
     group_id: '',
     name: '',
     price: 0,
     sort_order: 0,
     active: true,
   });
 
   // Group handlers
   const openCreateGroupDialog = () => {
     setEditingGroup(null);
     setGroupFormData({
       name: '',
       group_type: 'single',
       max_select: 1,
       min_select: 0,
       sort_order: (groups?.length || 0) + 1,
       active: true,
     });
     setGroupDialogOpen(true);
   };
 
   const openEditGroupDialog = (group: PizzaAddonGroup) => {
     setEditingGroup(group);
     setGroupFormData({
       name: group.name,
       group_type: group.group_type,
       max_select: group.max_select,
       min_select: group.min_select,
       sort_order: group.sort_order,
       active: group.active,
     });
     setGroupDialogOpen(true);
   };
 
   const handleSaveGroup = () => {
     if (editingGroup) {
       updateGroup.mutate({ id: editingGroup.id, ...groupFormData }, {
         onSuccess: () => setGroupDialogOpen(false),
       });
     } else {
       createGroup.mutate(groupFormData, {
         onSuccess: () => setGroupDialogOpen(false),
       });
     }
   };
 
   const handleDeleteGroup = (id: string) => {
     if (confirm('Isso removerá o grupo e todos os adicionais. Continuar?')) {
       deleteGroup.mutate(id);
     }
   };
 
   // Addon handlers
   const openCreateAddonDialog = (groupId: string) => {
     setEditingAddon(null);
     const groupAddons = addons?.filter(a => a.group_id === groupId) || [];
     setAddonFormData({
       group_id: groupId,
       name: '',
       price: 0,
       sort_order: groupAddons.length + 1,
       active: true,
     });
     setAddonDialogOpen(true);
   };
 
   const openEditAddonDialog = (addon: PizzaAddon) => {
     setEditingAddon(addon);
     setAddonFormData({
       group_id: addon.group_id,
       name: addon.name,
       price: addon.price,
       sort_order: addon.sort_order,
       active: addon.active,
     });
     setAddonDialogOpen(true);
   };
 
   const handleSaveAddon = () => {
     if (editingAddon) {
       updateAddon.mutate({ id: editingAddon.id, ...addonFormData }, {
         onSuccess: () => setAddonDialogOpen(false),
       });
     } else {
       createAddon.mutate(addonFormData, {
         onSuccess: () => setAddonDialogOpen(false),
       });
     }
   };
 
   const handleDeleteAddon = (id: string) => {
     if (confirm('Remover este adicional?')) {
       deleteAddon.mutate(id);
     }
   };
 
   const getAddonsForGroup = (groupId: string) => 
     addons?.filter(a => a.group_id === groupId) || [];
 
   const isLoading = loadingGroups || loadingAddons;
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center min-h-[400px]">
         <LoadingSpinner size="lg" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
      <PageHeader title={pageTitle} showBack={false} />
 
       {/* Navigation */}
       <div className="flex gap-2 overflow-x-auto pb-2">
         {navItems.map((item) => {
           const Icon = item.icon;
           const isActive = location.pathname === item.path;
           return (
             <Link
               key={item.path}
               to={item.path}
               className={cn(
                 "flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors",
                 isActive 
                   ? "bg-primary text-primary-foreground" 
                   : "bg-muted hover:bg-muted/80"
               )}
             >
               <Icon className="w-4 h-4" />
               {item.label}
             </Link>
           );
         })}
       </div>
 
       {/* Actions */}
       <div className="flex justify-end">
         <Button onClick={openCreateGroupDialog}>
           <Plus className="w-4 h-4 mr-2" />
           Novo grupo
         </Button>
       </div>
 
       {/* Groups */}
       <div className="space-y-6">
         {groups?.map((group) => (
           <Card key={group.id} className={cn(!group.active && "opacity-60")}>
             <CardHeader>
               <div className="flex items-start justify-between">
                 <div>
                   <CardTitle className="text-lg">{group.name}</CardTitle>
                   <CardDescription>
                     Tipo: {group.group_type === 'single' ? 'Seleção única' : 'Múltipla quantidade'} • 
                     Máx: {group.max_select}
                   </CardDescription>
                 </div>
                 <div className="flex gap-1">
                   <Button variant="ghost" size="icon" onClick={() => openEditGroupDialog(group)}>
                     <Pencil className="w-4 h-4" />
                   </Button>
                   <Button variant="ghost" size="icon" onClick={() => handleDeleteGroup(group.id)}>
                     <Trash2 className="w-4 h-4 text-destructive" />
                   </Button>
                 </div>
               </div>
             </CardHeader>
             <CardContent>
               <div className="space-y-2">
                 {getAddonsForGroup(group.id).map((addon) => (
                   <div 
                     key={addon.id} 
                     className={cn(
                       "flex items-center justify-between p-3 rounded-lg bg-muted/50",
                       !addon.active && "opacity-60"
                     )}
                   >
                     <div>
                       <span className="font-medium">{addon.name}</span>
                       <span className="text-primary ml-2">
                         R$ {addon.price.toFixed(2)}
                       </span>
                     </div>
                     <div className="flex gap-1">
                       <Button variant="ghost" size="sm" onClick={() => openEditAddonDialog(addon)}>
                         <Pencil className="w-3 h-3" />
                       </Button>
                       <Button variant="ghost" size="sm" onClick={() => handleDeleteAddon(addon.id)}>
                         <Trash2 className="w-3 h-3 text-destructive" />
                       </Button>
                     </div>
                   </div>
                 ))}
                 <Button 
                   variant="outline" 
                   size="sm" 
                   className="w-full mt-2"
                   onClick={() => openCreateAddonDialog(group.id)}
                 >
                   <Plus className="w-4 h-4 mr-2" />
                   Adicionar item
                 </Button>
               </div>
             </CardContent>
           </Card>
         ))}
       </div>
 
       {/* Group Dialog */}
       <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>{editingGroup ? 'Editar grupo' : 'Novo grupo'}</DialogTitle>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div>
               <Label htmlFor="group_name">Nome</Label>
               <Input
                 id="group_name"
                 value={groupFormData.name}
                 onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                 placeholder="Ex: Borda Recheada"
               />
             </div>
             <div>
               <Label htmlFor="group_type">Tipo</Label>
               <Select 
                 value={groupFormData.group_type} 
                 onValueChange={(v) => setGroupFormData({ ...groupFormData, group_type: v as 'single' | 'multi' })}
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="single">Seleção única (radio)</SelectItem>
                   <SelectItem value="multi">Múltipla quantidade (+/-)</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="max_select">Máximo</Label>
                 <Input
                   id="max_select"
                   type="number"
                   value={groupFormData.max_select}
                   onChange={(e) => setGroupFormData({ ...groupFormData, max_select: Number(e.target.value) })}
                   min={1}
                 />
               </div>
               <div>
                 <Label htmlFor="min_select">Mínimo</Label>
                 <Input
                   id="min_select"
                   type="number"
                   value={groupFormData.min_select}
                   onChange={(e) => setGroupFormData({ ...groupFormData, min_select: Number(e.target.value) })}
                   min={0}
                 />
               </div>
             </div>
             <div className="flex items-center justify-between">
               <Label htmlFor="group_active">Ativo</Label>
               <Switch
                 id="group_active"
                 checked={groupFormData.active}
                 onCheckedChange={(checked) => setGroupFormData({ ...groupFormData, active: checked })}
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>
               Cancelar
             </Button>
             <Button onClick={handleSaveGroup} disabled={createGroup.isPending || updateGroup.isPending}>
               {(createGroup.isPending || updateGroup.isPending) ? 'Salvando...' : 'Salvar'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
       {/* Addon Dialog */}
       <Dialog open={addonDialogOpen} onOpenChange={setAddonDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>{editingAddon ? 'Editar adicional' : 'Novo adicional'}</DialogTitle>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div>
               <Label htmlFor="addon_name">Nome</Label>
               <Input
                 id="addon_name"
                 value={addonFormData.name}
                 onChange={(e) => setAddonFormData({ ...addonFormData, name: e.target.value })}
                 placeholder="Ex: Borda Cheddar"
               />
             </div>
             <div>
               <Label htmlFor="addon_price">Preço (R$)</Label>
               <Input
                 id="addon_price"
                 type="number"
                 step="0.01"
                 value={addonFormData.price}
                 onChange={(e) => setAddonFormData({ ...addonFormData, price: Number(e.target.value) })}
                 min={0}
               />
             </div>
             <div>
               <Label htmlFor="addon_order">Ordem</Label>
               <Input
                 id="addon_order"
                 type="number"
                 value={addonFormData.sort_order}
                 onChange={(e) => setAddonFormData({ ...addonFormData, sort_order: Number(e.target.value) })}
               />
             </div>
             <div className="flex items-center justify-between">
               <Label htmlFor="addon_active">Ativo</Label>
               <Switch
                 id="addon_active"
                 checked={addonFormData.active}
                 onCheckedChange={(checked) => setAddonFormData({ ...addonFormData, active: checked })}
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setAddonDialogOpen(false)}>
               Cancelar
             </Button>
             <Button onClick={handleSaveAddon} disabled={createAddon.isPending || updateAddon.isPending}>
               {(createAddon.isPending || updateAddon.isPending) ? 'Salvando...' : 'Salvar'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 }