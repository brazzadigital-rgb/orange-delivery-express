import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  promo_price: number | null;
  image_url: string | null;
  rating_avg: number;
  rating_count: number;
  tags: string[];
  featured: boolean;
  category_id: string;
}

export interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_type: string | null;
  link_value: string | null;
}

export function useCategories() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['categories', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeId)
        .eq('active', true)
        .order('sort_order');

      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useProducts(categorySlug?: string) {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['products', storeId, categorySlug],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, categories!inner(slug)')
        .eq('store_id', storeId)
        .eq('active', true);

      if (categorySlug) {
        query = query.eq('categories.slug', categorySlug);
      }

      const { data, error } = await query.order('featured', { ascending: false });

      if (error) throw error;
      return data as (Product & { categories: { slug: string } })[];
    },
  });
}

export function useFeaturedProducts() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['featured-products', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('active', true)
        .eq('featured', true)
        .limit(8);

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function usePromoProducts() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['promo-products', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('active', true)
        .not('promo_price', 'is', null)
        .limit(8);

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useBeverageProducts() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['beverage-products', storeId],
    queryFn: async () => {
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, slug')
        .eq('store_id', storeId)
        .eq('active', true)
        .or('slug.ilike.%bebida%,slug.ilike.%drink%,name.ilike.%bebida%,name.ilike.%drink%');

      if (catError) throw catError;
      
      if (!categories || categories.length === 0) {
        return [] as Product[];
      }

      const categoryIds = categories.map(c => c.id);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('active', true)
        .in('category_id', categoryIds)
        .order('featured', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });
}

export function useBanners() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['banners', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('store_id', storeId)
        .eq('active', true)
        .order('sort_order');

      if (error) throw error;
      return data as Banner[];
    },
  });
}
