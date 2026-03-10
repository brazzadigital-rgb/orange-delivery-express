 import { useState } from 'react';
 import { Link, useLocation } from 'react-router-dom';
 import { Plus, Pencil, Trash2 } from 'lucide-react';
 import { PageHeader } from '@/components/common/PageHeader';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Switch } from '@/components/ui/switch';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
 import { 
   useAdminPizzaSizes, 
   useCreatePizzaSize, 
   useUpdatePizzaSize, 
   useDeletePizzaSize 
 } from '@/hooks/useAdminPizzaBuilder';
 import { LoadingSpinner } from '@/components/common/LoadingSpinner';
 import { cn } from '@/lib/utils';
 import type { PizzaSize } from '@/hooks/usePizzaBuilder';
 import { useAdminBuilderNav } from '@/hooks/useAdminBuilderNav';
 
export default function AdminPizzaBuilderSizes() {
   const location = useLocation();
   const { navItems, pageTitle, labels } = useAdminBuilderNav();
   const sf = labels.admin.sizeForm;
   const { data: sizes, isLoading } = useAdminPizzaSizes();
   const createSize = useCreatePizzaSize();
   const updateSize = useUpdatePizzaSize();
   const deleteSize = useDeletePizzaSize();
 
   const [dialogOpen, setDialogOpen] = useState(false);
   const [editingSize, setEditingSize] = useState<PizzaSize | null>(null);
   const [formData, setFormData] = useState({
     name: '',
     slices: 8,
     max_flavors: 2,
     base_price: 0,
     is_promo: false,
     promo_label: '',
     sort_order: 0,
     active: true,
   });
 
   const openCreateDialog = () => {
     setEditingSize(null);
     setFormData({
       name: '',
       slices: 8,
       max_flavors: 2,
       base_price: 0,
       is_promo: false,
       promo_label: '',
       sort_order: (sizes?.length || 0) + 1,
       active: true,
     });
     setDialogOpen(true);
   };
 
   const openEditDialog = (size: PizzaSize) => {
     setEditingSize(size);
     setFormData({
       name: size.name,
       slices: size.slices,
       max_flavors: size.max_flavors,
       base_price: size.base_price,
       is_promo: size.is_promo,
       promo_label: size.promo_label || '',
       sort_order: size.sort_order,
       active: size.active,
     });
     setDialogOpen(true);
   };
 
   const handleSave = () => {
     if (editingSize) {
       updateSize.mutate({ id: editingSize.id, ...formData }, {
         onSuccess: () => setDialogOpen(false),
       });
     } else {
       createSize.mutate(formData, {
         onSuccess: () => setDialogOpen(false),
       });
     }
   };
 
   const handleDelete = (id: string) => {
     if (confirm('Tem certeza que deseja remover este tamanho?')) {
       deleteSize.mutate(id);
     }
   };
 
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
         <Button onClick={openCreateDialog}>
           <Plus className="w-4 h-4 mr-2" />
           {sf.newButton}
         </Button>
       </div>
 
       {/* Sizes List */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         {sizes?.map((size) => (
           <Card key={size.id} className={cn(!size.active && "opacity-60")}>
             <CardHeader className="pb-3">
               <div className="flex items-start justify-between">
                 <div>
                   <CardTitle className="text-lg">{size.name}</CardTitle>
                   {size.is_promo && size.promo_label && (
                     <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold">
                       {size.promo_label}
                     </span>
                   )}
                 </div>
                 <div className="flex gap-1">
                   <Button variant="ghost" size="icon" onClick={() => openEditDialog(size)}>
                     <Pencil className="w-4 h-4" />
                   </Button>
                   <Button variant="ghost" size="icon" onClick={() => handleDelete(size.id)}>
                     <Trash2 className="w-4 h-4 text-destructive" />
                   </Button>
                 </div>
               </div>
             </CardHeader>
             <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                 <div>
                   <span className="text-muted-foreground">{sf.slicesLabel}:</span> {size.slices}
                 </div>
                 <div>
                   <span className="text-muted-foreground">{sf.maxFlavorsLabel}:</span> {size.max_flavors}
                 </div>
                 <div>
                   <span className="text-muted-foreground">Preço base:</span> R$ {size.base_price.toFixed(2)}
                 </div>
                 <div>
                   <span className="text-muted-foreground">Ordem:</span> {size.sort_order}
                 </div>
               </div>
             </CardContent>
           </Card>
         ))}
       </div>
 
       {/* Dialog */}
       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>{editingSize ? sf.dialogTitleEdit : sf.dialogTitle}</DialogTitle>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div>
               <Label htmlFor="name">Nome</Label>
               <Input
                 id="name"
                 value={formData.name}
                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                 placeholder={sf.namePlaceholder}
               />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="slices">{sf.slicesLabel}</Label>
                 <Input
                   id="slices"
                   type="number"
                   value={formData.slices}
                   onChange={(e) => setFormData({ ...formData, slices: Number(e.target.value) })}
                   min={1}
                 />
               </div>
               <div>
                 <Label htmlFor="max_flavors">{sf.maxFlavorsLabel}</Label>
                 <Input
                   id="max_flavors"
                   type="number"
                   value={formData.max_flavors}
                   onChange={(e) => setFormData({ ...formData, max_flavors: Number(e.target.value) })}
                   min={1}
                   max={10}
                 />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="base_price">Preço base (R$)</Label>
                 <Input
                   id="base_price"
                   type="number"
                   step="0.01"
                   value={formData.base_price}
                   onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                   min={0}
                 />
               </div>
               <div>
                 <Label htmlFor="sort_order">Ordem</Label>
                 <Input
                   id="sort_order"
                   type="number"
                   value={formData.sort_order}
                   onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                 />
               </div>
             </div>
             <div className="flex items-center justify-between">
               <Label htmlFor="is_promo">É promoção?</Label>
               <Switch
                 id="is_promo"
                 checked={formData.is_promo}
                 onCheckedChange={(checked) => setFormData({ ...formData, is_promo: checked })}
               />
             </div>
             {formData.is_promo && (
               <div>
                 <Label htmlFor="promo_label">Label da promoção</Label>
                 <Input
                   id="promo_label"
                   value={formData.promo_label}
                   onChange={(e) => setFormData({ ...formData, promo_label: e.target.value })}
                   placeholder="Ex: PROMOÇÃO"
                 />
               </div>
             )}
             <div className="flex items-center justify-between">
               <Label htmlFor="active">Ativo</Label>
               <Switch
                 id="active"
                 checked={formData.active}
                 onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setDialogOpen(false)}>
               Cancelar
             </Button>
             <Button onClick={handleSave} disabled={createSize.isPending || updateSize.isPending}>
               {(createSize.isPending || updateSize.isPending) ? 'Salvando...' : 'Salvar'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 }