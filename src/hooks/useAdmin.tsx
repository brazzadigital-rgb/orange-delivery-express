import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';

export interface AdminOrder {
  id: string;
  order_number: number;
  status: string;
  delivery_type: string;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  user_id: string;
  driver_id: string | null;
  profiles?: {
    name: string | null;
    phone: string | null;
  } | null;
  order_items?: {
    id: string;
    name_snapshot: string;
    quantity: number;
    options_snapshot: any;
    product_id: string | null;
  }[];
}

export function useAdminOrders(status?: string) {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['admin-orders', storeId, status],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles (
            name,
            phone,
            email
          ),
          order_items (
            id,
            name_snapshot,
            quantity,
            options_snapshot,
            product_id
          ),
          restaurant_tables (
            number,
            name,
            area
          )
        `)
        .eq('store_id', storeId)
        .or('created_by_source.is.null,created_by_source.eq.customer')
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status as any);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as unknown as AdminOrder[];
    },
  });
}

export function useAdminProducts() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['admin-products', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories (name)')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminCategories() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['admin-categories', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminCoupons() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['admin-coupons', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminCustomers() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['admin-customers', storeId],
    queryFn: async () => {
      // Get distinct user_ids that have orders in this store
      const { data: orderUsers, error: orderError } = await supabase
        .from('orders')
        .select('user_id')
        .eq('store_id', storeId)
        .not('user_id', 'is', null);
      if (orderError) throw orderError;

      const uniqueUserIds = [...new Set(orderUsers?.map(o => o.user_id).filter(Boolean))] as string[];
      if (uniqueUserIds.length === 0) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', uniqueUserIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminDrivers() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['admin-drivers', storeId],
    queryFn: async () => {
      // Get drivers associated with this store via store_users
      const { data, error } = await supabase
        .from('store_users')
        .select('id, user_id, role, created_at, profiles (id, name, phone, email)')
        .eq('store_id', storeId)
        .eq('role', 'staff');
      if (error) throw error;
      return data;
    },
  });
}
