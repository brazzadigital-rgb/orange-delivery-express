import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';

/**
 * Fetches all beverage category IDs for the store.
 */
export function useBeverageCategoryIds() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['beverage-category-ids', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, slug, name')
        .eq('store_id', storeId)
        .eq('active', true);

      if (error) throw error;

      const beverageIds = (data || [])
        .filter(c =>
          c.slug?.toLowerCase().includes('bebida') ||
          c.slug?.toLowerCase().includes('drink') ||
          c.name?.toLowerCase().includes('bebida') ||
          c.name?.toLowerCase().includes('drink')
        )
        .map(c => c.id);

      return new Set(beverageIds);
    },
    staleTime: 5 * 60 * 1000, // cache 5min
  });
}

/**
 * Checks if an order contains only beverage items.
 * Requires order_items to include product_id, and products to have category_id.
 */
export function useIsBeverageOnlyOrder(orderItems?: { product_id?: string | null }[]) {
  const { data: beverageCatIds } = useBeverageCategoryIds();

  return useQuery({
    queryKey: ['is-beverage-order', orderItems?.map(i => i.product_id).join(',')],
    queryFn: async () => {
      if (!orderItems || orderItems.length === 0 || !beverageCatIds || beverageCatIds.size === 0) return false;

      // Items without product_id (e.g. custom pizzas) are NOT beverages
      const hasCustomItems = orderItems.some(i => !i.product_id);
      if (hasCustomItems) return false;

      const productIds = orderItems
        .map(i => i.product_id)
        .filter(Boolean) as string[];

      if (productIds.length === 0) return false;

      const { data: products } = await supabase
        .from('products')
        .select('id, category_id')
        .in('id', productIds);

      if (!products || products.length === 0) return false;

      return products.every(p => p.category_id && beverageCatIds.has(p.category_id));
    },
    enabled: !!orderItems && orderItems.length > 0 && !!beverageCatIds,
    staleTime: 60 * 1000,
  });
}

/**
 * Synchronous helper: checks if all product_ids belong to beverage categories.
 * Use when you already have the product→category mapping.
 */
export function checkBeverageOnly(
  productCategoryMap: Map<string, string>,
  beverageCatIds: Set<string>,
  orderItems: { product_id?: string | null }[]
): boolean {
  if (!orderItems || orderItems.length === 0 || beverageCatIds.size === 0) return false;

  // Items without product_id (e.g. custom pizzas) are NOT beverages
  if (orderItems.some(i => !i.product_id)) return false;

  const productIds = orderItems.map(i => i.product_id).filter(Boolean) as string[];
  if (productIds.length === 0) return false;

  return productIds.every(pid => {
    const catId = productCategoryMap.get(pid);
    return catId && beverageCatIds.has(catId);
  });
}
