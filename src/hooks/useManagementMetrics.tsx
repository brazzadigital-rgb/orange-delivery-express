import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';

// Types
export interface DailySales {
  date: string;
  orders_count: number;
  gross_revenue: number;
  discounts_sum: number;
  delivery_fee_sum: number;
  net_revenue: number;
  aov: number;
  paid_rate: number;
  cancel_rate: number;
  delivery_share: number;
  pickup_share: number;
  table_share: number;
}

export interface HourlySales {
  hour: number;
  orders_count: number;
  gross_revenue: number;
  aov: number;
}

export interface OrderEnriched {
  id: string;
  order_number: number;
  status: string;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  customer_name: string;
  time_to_accept_min: number | null;
  prep_time_min: number | null;
  delivery_time_min: number | null;
  total_cycle_time_min: number | null;
}

export interface CustomerStats {
  user_id: string;
  name: string;
  phone: string;
  email: string;
  total_orders: number;
  total_spent: number;
  last_order_at: string;
  avg_ticket: number;
  days_since_last_order: number;
  churn_risk_score: number;
}

export interface DriverStats {
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  deliveries_count: number;
  avg_delivery_time_min: number;
  last_active_at: string;
}

export interface ProductPerformance {
  product_id: string;
  product_name: string;
  category_id: string;
  category_name: string;
  qty_sold: number;
  revenue_sum: number;
  avg_price: number;
}

export function useDailySales(days = 30) {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['daily-sales', storeId, days],
    queryFn: async () => {
      const now = new Date();
      const brDateStr = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(now);
      
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      const fromDateStr = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(fromDate);
      
      const { data, error } = await supabase
        .from('v_sales_daily')
        .select('*')
        .eq('store_id', storeId)
        .gte('date', fromDateStr)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as DailySales[];
    },
    staleTime: 60 * 1000,
  });
}

export function useHourlySales() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['hourly-sales', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_sales_hourly')
        .select('*')
        .eq('store_id', storeId)
        .order('hour', { ascending: true });

      if (error) throw error;
      return data as HourlySales[];
    },
    staleTime: 60 * 1000,
  });
}

export function useOrdersEnriched(limit = 100) {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['orders-enriched', storeId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_orders_enriched')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as OrderEnriched[];
    },
    staleTime: 30 * 1000,
  });
}

export function useCustomerStats() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['customer-stats', storeId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('v_customer_stats')
        .select('*')
        .eq('store_id', storeId)
        .order('total_spent', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as CustomerStats[];
    },
    staleTime: 60 * 1000,
  });
}

export function useDriverStats() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['driver-stats', storeId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('v_driver_stats')
        .select('*')
        .eq('store_id', storeId)
        .order('deliveries_count', { ascending: false });

      if (error) throw error;
      return (data || []) as DriverStats[];
    },
    staleTime: 60 * 1000,
  });
}

export function useProductPerformance() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['product-performance', storeId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('v_product_performance')
        .select('*')
        .eq('store_id', storeId)
        .order('qty_sold', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as ProductPerformance[];
    },
    staleTime: 60 * 1000,
  });
}

export function useTodayKPIs() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['today-kpis', storeId],
    queryFn: async () => {
      const now = new Date();
      const brDate = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(now);
      const today = brDate;
      
      const { data: dailyData } = await supabase
        .from('v_sales_daily')
        .select('*')
        .eq('store_id', storeId)
        .eq('date', today)
        .maybeSingle();

      const startOfDay = `${today}T00:00:00-03:00`;
      const endOfDay = `${today}T23:59:59.999-03:00`;
      
      const { data: ordersData } = await supabase
        .from('v_orders_enriched')
        .select('time_to_accept_min, prep_time_min, delivery_time_min, status')
        .eq('store_id', storeId)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      const completedOrders = ordersData?.filter(o => o.status === 'delivered') || [];
      const avgAcceptTime = completedOrders.length > 0 
        ? completedOrders.reduce((sum, o) => sum + (o.time_to_accept_min || 0), 0) / completedOrders.length 
        : 0;
      const avgPrepTime = completedOrders.length > 0 
        ? completedOrders.reduce((sum, o) => sum + (o.prep_time_min || 0), 0) / completedOrders.length 
        : 0;
      const avgDeliveryTime = completedOrders.length > 0 
        ? completedOrders.reduce((sum, o) => sum + (o.delivery_time_min || 0), 0) / completedOrders.length 
        : 0;

      return {
        ordersCount: dailyData?.orders_count || 0,
        grossRevenue: dailyData?.gross_revenue || 0,
        netRevenue: dailyData?.net_revenue || 0,
        aov: dailyData?.aov || 0,
        cancelRate: dailyData?.cancel_rate || 0,
        avgAcceptTime: Math.round(avgAcceptTime * 10) / 10,
        avgPrepTime: Math.round(avgPrepTime * 10) / 10,
        avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
      };
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useStuckOrders(minutesThreshold = 10) {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['stuck-orders', storeId, minutesThreshold],
    queryFn: async () => {
      const thresholdTime = new Date();
      thresholdTime.setMinutes(thresholdTime.getMinutes() - minutesThreshold);

      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, created_at, updated_at')
        .eq('store_id', storeId)
        .in('status', ['created', 'accepted', 'preparing'])
        .lt('updated_at', thresholdTime.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}
