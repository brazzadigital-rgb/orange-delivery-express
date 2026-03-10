 import { useState } from 'react';
 import { Link, useLocation } from 'react-router-dom';
 import { Plus, Pencil, Trash2 } from 'lucide-react';
 import { PageHeader } from '@/components/common/PageHeader';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Switch } from '@/components/ui/switch';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  useAdminPizzaFlavors, 
  useCreatePizzaFlavor, 
  useUpdatePizzaFlavor, 
  useDeletePizzaFlavor,
  useAdminStorePizzaSettings,
} from '@/hooks/useAdminPizzaBuilder';
 import { LoadingSpinner } from '@/components/common/LoadingSpinner';
 import { cn } from '@/lib/utils';
 import type { PizzaFlavor } from '@/hooks/usePizzaBuilder';
 import { useAdminBuilderNav } from '@/hooks/useAdminBuilderNav';
 
export default function AdminPizzaBuilderFlavors() {
   const location = useLocation();
    const { navItems, pageTitle } = useAdminBuilderNav();
    const { data: flavors, isLoading } = useAdminPizzaFlavors();
    const { data: settings } = useAdminStorePizzaSettings();
    const createFlavor = useCreatePizzaFlavor();
    const updateFlavor = useUpdatePizzaFlavor();
    const deleteFlavor = useDeletePizzaFlavor();
    const pricingMode = settings?.pricing_mode || 'matrix';
 
   const [dialogOpen, setDialogOpen] = useState(false);
   const [editingFlavor, setEditingFlavor] = useState<PizzaFlavor | null>(null);
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      sort_order: 0,
      active: true,
      unit_price: 0,
    });
 
   const openCreateDialog = () => {
     setEditingFlavor(null);
      setFormData({
        name: '',
        description: '',
        sort_order: (flavors?.length || 0) + 1,
        active: true,
        unit_price: 0,
      });
     setDialogOpen(true);
   };
 
   const openEditDialog = (flavor: PizzaFlavor) => {
     setEditingFlavor(flavor);
      setFormData({
        name: flavor.name,
        description: flavor.description || '',
        sort_order: flavor.sort_order,
        active: flavor.active,
        unit_price: flavor.unit_price || 0,
      });
     setDialogOpen(true);
   };
 
   const handleSave = () => {
     if (editingFlavor) {
       updateFlavor.mutate({ id: editingFlavor.id, ...formData }, {
         onSuccess: () => setDialogOpen(false),
       });
     } else {
       createFlavor.mutate(formData, {
         onSuccess: () => setDialogOpen(false),
       });
     }
   };
 
   const handleDelete = (id: string) => {
     if (confirm('Tem certeza que deseja remover este sabor?')) {
       deleteFlavor.mutate(id);
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
           Novo sabor
         </Button>
       </div>
 
       {/* Flavors List */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         {flavors?.map((flavor) => (
           <Card key={flavor.id} className={cn(!flavor.active && "opacity-60")}>
             <CardHeader className="pb-3">
               <div className="flex items-start justify-between">
                 <CardTitle className="text-lg">{flavor.name}</CardTitle>
                 <div className="flex gap-1">
                   <Button variant="ghost" size="icon" onClick={() => openEditDialog(flavor)}>
                     <Pencil className="w-4 h-4" />
                   </Button>
                   <Button variant="ghost" size="icon" onClick={() => handleDelete(flavor.id)}>
                     <Trash2 className="w-4 h-4 text-destructive" />
                   </Button>
                 </div>
               </div>
             </CardHeader>
             <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {flavor.description || 'Sem descrição'}
                </p>
                {pricingMode === 'per_item' && (
                  <p className="text-sm font-medium text-primary mt-1">
                    R$ {(flavor.unit_price || 0).toFixed(2).replace('.', ',')} / un.
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Ordem: {flavor.sort_order}
                </p>
             </CardContent>
           </Card>
         ))}
       </div>
 
       {/* Dialog */}
       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>{editingFlavor ? 'Editar sabor' : 'Novo sabor'}</DialogTitle>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div>
               <Label htmlFor="name">Nome</Label>
               <Input
                 id="name"
                 value={formData.name}
                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                 placeholder="Ex: Calabresa"
               />
             </div>
             <div>
               <Label htmlFor="description">Descrição</Label>
               <Textarea
                 id="description"
                 value={formData.description}
                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                 placeholder="Ingredientes e detalhes..."
                 rows={3}
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
              {pricingMode === 'per_item' && (
              <div>
                <Label htmlFor="unit_price">Preço unitário (R$)</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                  placeholder="0.00"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Preço por peça/unidade deste item</p>
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
             <Button onClick={handleSave} disabled={createFlavor.isPending || updateFlavor.isPending}>
               {(createFlavor.isPending || updateFlavor.isPending) ? 'Salvando...' : 'Salvar'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 }