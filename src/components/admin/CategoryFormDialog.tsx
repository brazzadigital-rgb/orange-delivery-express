 import { useState, useEffect } from 'react';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Switch } from '@/components/ui/switch';
 import { supabase } from '@/integrations/supabase/client';
 import { useStoreId } from '@/contexts/TenantContext';
 import { toast } from 'sonner';
 import { Loader2, FolderOpen, Upload, X, Image as ImageIcon } from 'lucide-react';
 
 interface Category {
   id?: string;
   name: string;
   slug: string;
   icon: string | null;
   image_url: string | null;
   active: boolean;
   sort_order: number;
 }
 
 interface CategoryFormDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   category?: Category | null;
   onSuccess: () => void;
 }
 
 const emptyCategory: Category = {
   name: '',
   slug: '',
   icon: '🍕',
   image_url: null,
   active: true,
   sort_order: 0,
 };
 
 export function CategoryFormDialog({ open, onOpenChange, category, onSuccess }: CategoryFormDialogProps) {
   const storeId = useStoreId();
   const [formData, setFormData] = useState<Category>(emptyCategory);
   const [saving, setSaving] = useState(false);
   const [uploading, setUploading] = useState(false);
 
   const isEditing = !!category?.id;
 
   useEffect(() => {
     if (category) {
       setFormData({
         ...category,
         icon: category.icon || '🍕',
         image_url: category.image_url || null,
       });
     } else {
       setFormData(emptyCategory);
     }
   }, [category, open]);
 
   const generateSlug = (name: string) => {
     return name
       .toLowerCase()
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, '')
       .replace(/[^a-z0-9]+/g, '-')
       .replace(/(^-|-$)/g, '');
   };
 
   const handleNameChange = (name: string) => {
     setFormData({
       ...formData,
       name,
       slug: isEditing ? formData.slug : generateSlug(name),
     });
   };
 
   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     if (!file.type.startsWith('image/')) {
       toast.error('Por favor, selecione uma imagem');
       return;
     }
 
     if (file.size > 5 * 1024 * 1024) {
       toast.error('A imagem deve ter no máximo 5MB');
       return;
     }
 
     setUploading(true);
 
     try {
       const fileExt = file.name.split('.').pop();
       const fileName = `categories/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
 
       const { error: uploadError } = await supabase.storage
         .from('products')
         .upload(fileName, file);
 
       if (uploadError) throw uploadError;
 
       const { data: { publicUrl } } = supabase.storage
         .from('products')
         .getPublicUrl(fileName);
 
       setFormData({ ...formData, image_url: publicUrl });
       toast.success('Imagem enviada com sucesso!');
     } catch (error: any) {
       console.error('Upload error:', error);
       toast.error('Erro ao enviar imagem');
     } finally {
       setUploading(false);
     }
   };
 
   const handleSave = async () => {
     if (!formData.name.trim()) {
       toast.error('Nome da categoria é obrigatório');
       return;
     }
     if (!formData.slug.trim()) {
       toast.error('Slug é obrigatório');
       return;
     }
 
     setSaving(true);
 
     try {
       const payload = {
         name: formData.name.trim(),
         slug: formData.slug.trim(),
         icon: formData.icon || null,
         image_url: formData.image_url || null,
         active: formData.active,
         sort_order: formData.sort_order,
         store_id: storeId,
       };
 
       if (isEditing) {
         const { error } = await supabase
           .from('categories')
           .update(payload)
           .eq('id', category.id);
 
         if (error) throw error;
         toast.success('Categoria atualizada com sucesso!');
       } else {
         const { error } = await supabase.from('categories').insert(payload);
 
         if (error) throw error;
         toast.success('Categoria criada com sucesso!');
       }
 
       onSuccess();
       onOpenChange(false);
     } catch (error: any) {
       console.error('Error saving category:', error);
       toast.error(error.message || 'Erro ao salvar categoria');
     } finally {
       setSaving(false);
     }
   };
 
   const commonEmojis = ['🍕', '🍔', '🌭', '🍟', '🥤', '🍰', '🍦', '🥗', '🍝', '🍣', '🍜', '🥡'];
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-lg">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2 text-xl">
             <FolderOpen className="w-5 h-5 text-primary" />
             {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
           </DialogTitle>
           <DialogDescription>
             {isEditing ? 'Atualize as informações da categoria' : 'Crie uma nova categoria para organizar seus produtos'}
           </DialogDescription>
         </DialogHeader>
 
         <div className="space-y-5 py-4">
           {/* Image Upload */}
           <div className="space-y-2">
             <Label>Imagem da Categoria</Label>
             {formData.image_url ? (
               <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-muted">
                 <img
                   src={formData.image_url}
                   alt="Preview"
                   className="w-full h-full object-cover"
                 />
                 <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   <label className="cursor-pointer px-3 py-1.5 bg-white/90 rounded-lg text-sm font-medium hover:bg-white transition-colors">
                     Alterar
                     <input
                       type="file"
                       accept="image/*"
                       className="hidden"
                       onChange={handleImageUpload}
                       disabled={uploading}
                     />
                   </label>
                   <button
                     onClick={() => setFormData({ ...formData, image_url: null })}
                     className="px-3 py-1.5 bg-destructive/90 text-white rounded-lg text-sm font-medium hover:bg-destructive transition-colors"
                   >
                     Remover
                   </button>
                 </div>
               </div>
             ) : (
               <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
                 {uploading ? (
                   <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                 ) : (
                   <>
                     <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                     <span className="text-sm text-muted-foreground">Clique para enviar uma imagem</span>
                     <span className="text-xs text-muted-foreground/70">PNG, JPG até 5MB</span>
                   </>
                 )}
                 <input
                   type="file"
                   accept="image/*"
                   className="hidden"
                   onChange={handleImageUpload}
                   disabled={uploading}
                 />
               </label>
             )}
           </div>
 
           {/* Name */}
           <div className="space-y-2">
             <Label htmlFor="name">Nome da Categoria *</Label>
             <Input
               id="name"
               placeholder="Ex: Pizzas Tradicionais"
               value={formData.name}
               onChange={(e) => handleNameChange(e.target.value)}
             />
           </div>
 
           {/* Slug */}
           <div className="space-y-2">
             <Label htmlFor="slug">Slug (URL) *</Label>
             <Input
               id="slug"
               placeholder="pizzas-tradicionais"
               value={formData.slug}
               onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
             />
             <p className="text-xs text-muted-foreground">Usado na URL: /categoria/{formData.slug || 'slug'}</p>
           </div>
 
           {/* Icon */}
           <div className="space-y-2">
             <Label>Ícone (Emoji)</Label>
             <div className="flex flex-wrap gap-2">
               {commonEmojis.map((emoji) => (
                 <button
                   key={emoji}
                   type="button"
                   onClick={() => setFormData({ ...formData, icon: emoji })}
                   className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                     formData.icon === emoji
                       ? 'border-primary bg-primary/10 scale-110'
                       : 'border-border hover:border-primary/50'
                   }`}
                 >
                   {emoji}
                 </button>
               ))}
             </div>
             <div className="flex items-center gap-2 mt-2">
               <Input
                 placeholder="Ou digite um emoji personalizado"
                 value={formData.icon || ''}
                 onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                 className="w-40"
               />
               <span className="text-2xl">{formData.icon}</span>
             </div>
           </div>
 
           {/* Sort Order */}
           <div className="space-y-2">
             <Label htmlFor="sort_order">Ordem de Exibição</Label>
             <Input
               id="sort_order"
               type="number"
               min="0"
               value={formData.sort_order}
               onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
               className="w-24"
             />
             <p className="text-xs text-muted-foreground">Categorias com menor número aparecem primeiro</p>
           </div>
 
           {/* Active Toggle */}
           <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border">
             <Switch
               id="active"
               checked={formData.active}
               onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
             />
             <Label htmlFor="active" className="cursor-pointer">
               Categoria ativa
             </Label>
           </div>
         </div>
 
         {/* Actions */}
         <div className="flex justify-end gap-3 pt-4 border-t">
           <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
             Cancelar
           </Button>
           <Button onClick={handleSave} disabled={saving || uploading} className="min-w-[120px]">
             {saving ? (
               <>
                 <Loader2 className="w-4 h-4 animate-spin mr-2" />
                 Salvando...
               </>
             ) : isEditing ? (
               'Atualizar'
             ) : (
               'Criar Categoria'
             )}
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   );
 }