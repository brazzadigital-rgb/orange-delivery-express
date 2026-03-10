import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCategories } from '@/hooks/useAdmin';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { Loader2, Package, DollarSign, Tag, Star } from 'lucide-react';
import { ProductImageUpload } from './ProductImageUpload';

interface Product {
  id?: string;
  name: string;
  description: string | null;
  base_price: number;
  promo_price: number | null;
  image_url: string | null;
  category_id: string;
  active: boolean;
  featured: boolean;
  tags: string[];
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
}

const emptyProduct: Product = {
  name: '',
  description: '',
  base_price: 0,
  promo_price: null,
  image_url: '',
  category_id: '',
  active: true,
  featured: false,
  tags: [],
};

export function ProductFormDialog({ open, onOpenChange, product, onSuccess }: ProductFormDialogProps) {
  const [formData, setFormData] = useState<Product>(emptyProduct);
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const { data: categories } = useAdminCategories();
  const storeId = useStoreId();

  const isEditing = !!product?.id;

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        description: product.description || '',
        image_url: product.image_url || '',
        promo_price: product.promo_price || null,
        tags: product.tags || [],
      });
      setTagsInput((product.tags || []).join(', '));
    } else {
      setFormData(emptyProduct);
      setTagsInput('');
    }
  }, [product, open]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }
    if (!formData.category_id) {
      toast.error('Selecione uma categoria');
      return;
    }
    if (formData.base_price <= 0) {
      toast.error('Preço base deve ser maior que zero');
      return;
    }

    setSaving(true);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        base_price: formData.base_price,
        promo_price: formData.promo_price || null,
        image_url: formData.image_url?.trim() || null,
        category_id: formData.category_id,
        active: formData.active,
        featured: formData.featured,
        tags,
        store_id: storeId,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', product.id);

        if (error) throw error;
        toast.success('Produto atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('products').insert(payload);

        if (error) throw error;
        toast.success('Produto criado com sucesso!');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-5 h-5 text-primary" />
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize as informações do produto' : 'Preencha os dados do novo produto'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Image Upload */}
          <ProductImageUpload
            value={formData.image_url}
            onChange={(url) => setFormData({ ...formData, image_url: url })}
          />

          {/* Name and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                placeholder="Pizza Margherita"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Molho de tomate, mozzarella fresca, manjericão..."
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_price" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                Preço Base *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-10"
                  value={formData.base_price || ''}
                  onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo_price" className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                Preço Promocional
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <Input
                  id="promo_price"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-10"
                  placeholder="Deixe vazio se não houver"
                  value={formData.promo_price || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      promo_price: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              placeholder="vegetariano, mais vendido, picante"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6 p-4 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center gap-3">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active" className="cursor-pointer">
                Produto ativo
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
              <Label htmlFor="featured" className="cursor-pointer flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Destaque
              </Label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : isEditing ? (
              'Atualizar'
            ) : (
              'Criar Produto'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
