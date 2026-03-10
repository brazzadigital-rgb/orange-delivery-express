 import { useState } from 'react';
 import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { useAdminCategories } from '@/hooks/useAdmin';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
 import { CategoryFormDialog } from '@/components/admin/CategoryFormDialog';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 import { useQueryClient } from '@tanstack/react-query';
 import { usePlanEntitlements } from '@/hooks/usePlanEntitlements';
 import { PlanLimitAlert } from '@/components/admin/PlanLimitAlert';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';

export default function AdminCategories() {
  const { data: categories, isLoading } = useAdminCategories();
   const [dialogOpen, setDialogOpen] = useState(false);
   const [editingCategory, setEditingCategory] = useState<any>(null);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
   const queryClient = useQueryClient();
 
   const { entitlements, usage, isLimitReached } = usePlanEntitlements();
   const categoryLimitReached = isLimitReached('categories');

   const handleCreate = () => {
     if (categoryLimitReached) {
       toast.error('Limite de categorias atingido. Faça upgrade do seu plano.');
       return;
     }
     setEditingCategory(null);
     setDialogOpen(true);
   };
 
   const handleEdit = (category: any) => {
     setEditingCategory(category);
     setDialogOpen(true);
   };
 
   const handleDeleteClick = (category: any) => {
     setCategoryToDelete(category);
     setDeleteDialogOpen(true);
   };
 
   const handleDelete = async () => {
     if (!categoryToDelete) return;
 
     try {
       const { error } = await supabase
         .from('categories')
         .delete()
         .eq('id', categoryToDelete.id);
 
       if (error) throw error;
 
       toast.success('Categoria excluída com sucesso!');
       queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
     } catch (error: any) {
       console.error('Error deleting category:', error);
       toast.error(error.message || 'Erro ao excluir categoria');
     } finally {
       setDeleteDialogOpen(false);
       setCategoryToDelete(null);
     }
   };
 
   const handleSuccess = () => {
     queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
   };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">Organize o cardápio por categorias</p>
        </div>
         <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
         </Button>
       </div>

       {/* Plan limit alert */}
       {categoryLimitReached && usage && entitlements?.max_categories && (
         <div className="mb-6">
           <PlanLimitAlert
             limitType="categories"
             current={usage.categories_count}
             max={entitlements.max_categories}
             planName={entitlements.plan_name}
           />
         </div>
       )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories?.map((category) => (
             <div key={category.id} className="group card-premium overflow-hidden">
               {/* Image Header */}
               {category.image_url && (
                 <div className="aspect-video relative overflow-hidden">
                   <img
                     src={category.image_url}
                     alt={category.name}
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                   <div className="absolute bottom-2 left-3 text-3xl drop-shadow-lg">
                     {category.icon || '🍕'}
                   </div>
                 </div>
               )}
               
               <div className="p-4">
                 <div className="flex items-center gap-3 mb-3">
                   {!category.image_url && (
                     <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                       {category.icon || '🍕'}
                     </div>
                   )}
                   <div className="flex-1">
                     <h3 className="font-semibold">{category.name}</h3>
                     <p className="text-xs text-muted-foreground">/{category.slug}</p>
                   </div>
                   <span
                     className={cn(
                       'px-2 py-1 rounded-full text-xs font-medium',
                       category.active
                         ? 'bg-success/10 text-success'
                         : 'bg-muted text-muted-foreground'
                     )}
                   >
                     {category.active ? 'Ativa' : 'Inativa'}
                   </span>
                 </div>
                 
                 <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                   <GripVertical className="w-3 h-3" />
                   <span>Ordem: {category.sort_order}</span>
                 </div>
                 
                 <div className="flex gap-2">
                   <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(category)}>
                     <Edit2 className="w-4 h-4 mr-1" />
                     Editar
                   </Button>
                   <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(category)}>
                     <Trash2 className="w-4 h-4 text-destructive" />
                   </Button>
                 </div>
              </div>
            </div>
          ))}
           
           {/* Empty State */}
           {categories?.length === 0 && (
             <div className="col-span-full text-center py-12">
               <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                 <Plus className="w-8 h-8 text-muted-foreground" />
               </div>
               <h3 className="font-medium mb-1">Nenhuma categoria</h3>
               <p className="text-sm text-muted-foreground mb-4">
                 Crie sua primeira categoria para organizar o cardápio
               </p>
               <Button onClick={handleCreate}>
                 <Plus className="w-4 h-4 mr-2" />
                 Nova Categoria
               </Button>
             </div>
           )}
        </div>
      )}
 
       {/* Form Dialog */}
       <CategoryFormDialog
         open={dialogOpen}
         onOpenChange={setDialogOpen}
         category={editingCategory}
         onSuccess={handleSuccess}
       />
 
       {/* Delete Confirmation Dialog */}
       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
             <AlertDialogDescription>
               Tem certeza que deseja excluir a categoria "{categoryToDelete?.name}"? 
               Esta ação não pode ser desfeita. Produtos desta categoria ficarão sem categoria.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancelar</AlertDialogCancel>
             <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
               Excluir
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
    </div>
  );
}
