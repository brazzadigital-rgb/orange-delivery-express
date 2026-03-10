import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { getDemoProductsForSegment } from '@/lib/builder-demo-data';

export function useCreateDemoProducts() {
  const queryClient = useQueryClient();
  const storeId = useStoreId();
  const { store } = useTenant();

  return useMutation({
    mutationFn: async () => {
      const demo = getDemoProductsForSegment(store?.store_type);

      // Clean existing categories and products for this store
      await supabase.from('products').delete().eq('store_id', storeId);
      await supabase.from('categories').delete().eq('store_id', storeId);

      // Insert categories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .insert(demo.categories.map(c => ({
          name: c.name,
          slug: c.slug,
          icon: c.icon,
          sort_order: c.sort_order,
          active: true,
          store_id: storeId,
        })))
        .select();
      if (catError) throw catError;

      // Build slug → id map
      const slugToId: Record<string, string> = {};
      categories?.forEach(cat => {
        const matchingDemo = demo.categories.find(d => d.name === cat.name);
        if (matchingDemo) slugToId[matchingDemo.slug] = cat.id;
      });

      // Insert products
      const productsToInsert = demo.products
        .filter(p => slugToId[p.categorySlug])
        .map(p => ({
          store_id: storeId,
          category_id: slugToId[p.categorySlug],
          name: p.name,
          description: p.description,
          base_price: p.base_price,
          promo_price: p.promo_price ?? null,
          featured: p.featured ?? false,
          tags: p.tags ?? [],
          active: true,
        }));

      const { error: prodError } = await supabase.from('products').insert(productsToInsert);
      if (prodError) throw prodError;

      return { categories: categories?.length, products: productsToInsert.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`${result?.categories} categorias e ${result?.products} produtos criados!`);
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao criar dados demo'),
  });
}
