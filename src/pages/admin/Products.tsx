import { useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, Search, Filter, Package, TrendingUp, Sparkles, ImageIcon, Loader2 } from 'lucide-react';
import { useAdminProducts, useAdminCategories } from '@/hooks/useAdmin';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ProductFormDialog } from '@/components/admin/ProductFormDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCreateDemoProducts } from '@/hooks/useDemoProducts';
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

interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  promo_price: number | null;
  image_url: string | null;
  category_id: string;
  active: boolean;
  featured: boolean;
  tags: string[] | null;
  rating_avg: number | null;
  rating_count: number | null;
  categories?: { name: string } | null;
}

export default function AdminProducts() {
  const { data: products, isLoading, refetch } = useAdminProducts();
  const { data: categories } = useAdminCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;
      toast.success(active ? 'Produto desativado' : 'Produto ativado');
      refetch();
    } catch (error) {
      toast.error('Erro ao atualizar produto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const { entitlements, usage, isLimitReached } = usePlanEntitlements();
  const productLimitReached = isLimitReached('products');

  const handleCreate = () => {
    if (productLimitReached) {
      toast.error('Limite de produtos atingido. Faça upgrade do seu plano.');
      return;
    }
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deletingProduct.id);

      if (error) throw error;
      toast.success('Produto excluído com sucesso');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir produto');
    } finally {
      setDeleteDialogOpen(false);
      setDeletingProduct(null);
    }
  };

  // Filter products
  const filteredProducts = products?.filter((product) => {
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && product.active) ||
      (statusFilter === 'inactive' && !product.active) ||
      (statusFilter === 'featured' && product.featured) ||
      (statusFilter === 'promo' && product.promo_price);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: products?.length || 0,
    active: products?.filter((p) => p.active).length || 0,
    featured: products?.filter((p) => p.featured).length || 0,
    promo: products?.filter((p) => p.promo_price).length || 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-7 h-7 text-primary" />
            Produtos
          </h1>
          <p className="text-muted-foreground">Gerencie o cardápio</p>
        </div>
        <div className="flex gap-2">
          {stats.total === 0 && <DemoProductsButton />}
          <Button onClick={handleCreate} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Plan limit alert */}
      {productLimitReached && usage && entitlements?.max_products && (
        <PlanLimitAlert
          limitType="products"
          current={usage.products_count}
          max={entitlements.max_products}
          planName={entitlements.plan_name}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total de Produtos</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-muted-foreground">Produtos Ativos</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20">
          <div className="text-2xl font-bold text-yellow-600">{stats.featured}</div>
          <div className="text-sm text-muted-foreground">Em Destaque</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
          <div className="text-2xl font-bold text-red-600">{stats.promo}</div>
          <div className="text-sm text-muted-foreground">Em Promoção</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="featured">Destaques</SelectItem>
            <SelectItem value="promo">Em Promoção</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <LoadingSpinner />
      ) : filteredProducts?.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground">Tente ajustar os filtros ou criar um novo produto</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {filteredProducts?.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => handleEdit(product)}
              onToggleActive={() => toggleActive(product.id, product.active)}
              onDelete={() => {
                setDeletingProduct(product);
                setDeleteDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSuccess={refetch}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deletingProduct?.name}</strong>? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Premium Product Card Component
function ProductCard({
  product,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const hasPromo = product.promo_price && product.promo_price < product.base_price;
  const discount = hasPromo
    ? Math.round(((product.base_price - product.promo_price!) / product.base_price) * 100)
    : 0;

  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden border transition-all duration-300',
        'bg-card hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
        !product.active && 'opacity-60'
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-3xl">🍕</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {product.featured && (
            <Badge className="bg-yellow-500 text-yellow-950 border-0 text-[10px] px-1.5 py-0.5">
              <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />
              Destaque
            </Badge>
          )}
          {hasPromo && (
            <Badge className="bg-red-500 text-white border-0 text-[10px] px-1.5 py-0.5">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Status */}
        <div className="absolute top-2 right-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full ring-1 ring-white',
              product.active ? 'bg-green-500' : 'bg-gray-400'
            )}
          />
        </div>

        {/* Category */}
        <div className="absolute bottom-2 left-2">
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-white/90 backdrop-blur-sm rounded-full text-foreground">
            {product.categories?.name || 'Sem cat.'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-1.5">
        <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          {hasPromo && (
            <span className="text-[10px] text-muted-foreground line-through">
              R$ {product.base_price.toFixed(2).replace('.', ',')}
            </span>
          )}
          <span className="text-sm font-bold text-primary">
            R$ {(hasPromo ? product.promo_price! : product.base_price).toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1.5 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={onEdit}
          >
            <Edit2 className="w-3 h-3 mr-1" />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggleActive}
            title={product.active ? 'Desativar' : 'Ativar'}
          >
            {product.active ? (
              <EyeOff className="w-3 h-3" />
            ) : (
              <Eye className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
            title="Excluir"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DemoProductsButton() {
  const createDemo = useCreateDemoProducts();
  return (
    <Button
      variant="outline"
      onClick={() => createDemo.mutate()}
      disabled={createDemo.isPending}
      className="border-primary/30 text-primary hover:bg-primary/10"
    >
      <Sparkles className="w-4 h-4 mr-2" />
      {createDemo.isPending ? 'Criando...' : 'Dados Demo'}
    </Button>
  );
}
