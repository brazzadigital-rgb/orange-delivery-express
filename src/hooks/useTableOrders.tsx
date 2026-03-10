import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface RestaurantTable {
  id: string;
  store_id: string;
  number: number;
  name: string | null;
  area: string | null;
  is_active: boolean;
  qr_token: string;
  created_at: string;
}

export interface TableSession {
  id: string;
  store_id: string;
  table_id: string;
  status: string;
  opened_at: string;
  closed_at: string | null;
  opened_by_waiter_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  push_subscription: any;
}

// ---- Tables CRUD ----

export function useRestaurantTables() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['restaurant-tables', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('store_id', storeId)
        .order('number');
      if (error) throw error;
      return data as RestaurantTable[];
    },
  });
}

export function useTableByToken(qrToken: string) {
  return useQuery({
    queryKey: ['table-by-token', qrToken],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('qr_token', qrToken)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data as RestaurantTable | null;
    },
    enabled: !!qrToken,
  });
}

export function useCreateTable() {
  const storeId = useStoreId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { number: number; name?: string; area?: string }) => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .insert({ store_id: storeId, ...params })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant-tables'] });
      toast.success('Mesa criada!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao criar mesa'),
  });
}

export function useUpdateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...params }: { id: string; number?: number; name?: string; area?: string; is_active?: boolean }) => {
      const { error } = await supabase
        .from('restaurant_tables')
        .update(params)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant-tables'] });
      toast.success('Mesa atualizada!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao atualizar mesa'),
  });
}

export function useDeleteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant-tables'] });
      toast.success('Mesa excluída!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao excluir mesa'),
  });
}

// ---- Sessions ----

export function useTableSession(tableId: string) {
  return useQuery({
    queryKey: ['table-session', tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('table_id', tableId)
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as TableSession | null;
    },
    enabled: !!tableId,
  });
}

export function useCreateTableSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { table_id: string; store_id: string; customer_name?: string; customer_phone?: string }) => {
      const { data, error } = await supabase
        .from('table_sessions')
        .insert(params)
        .select()
        .single();
      if (error) throw error;
      return data as TableSession;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['table-session', vars.table_id] });
    },
  });
}

// ---- Table Order Creation (via RPC) ----

interface CreateTableOrderParams {
  storeId: string;
  tableId: string;
  sessionId: string;
  customerName?: string;
  paymentMethod?: string;
  notes?: string;
  items: Array<{
    product_id?: string;
    name_snapshot: string;
    quantity: number;
    base_price: number;
    options_snapshot: any;
    item_total: number;
  }>;
}

export function useCreateTableOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreateTableOrderParams) => {
      const { data, error } = await supabase.rpc('create_table_order', {
        p_store_id: params.storeId,
        p_table_id: params.tableId,
        p_table_session_id: params.sessionId,
        p_customer_name: params.customerName || null,
        p_payment_method: params.paymentMethod || 'cash',
        p_notes: params.notes || null,
        p_items: params.items,
      });
      if (error) throw error;
      return data as string; // order id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Pedido enviado!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao criar pedido'),
  });
}

// ---- Table orders for admin/waiter ----

export function useTableOrders() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['table-orders', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (name, phone, email),
          order_items (id, name_snapshot, quantity, options_snapshot),
          restaurant_tables (number, name, area)
        `)
        .eq('store_id', storeId)
        .eq('delivery_type', 'table')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

// ---- Update kitchen status ----

export function useUpdateKitchenStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, kitchenStatus }: { orderId: string; kitchenStatus: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ kitchen_status: kitchenStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['table-orders'] });
      qc.invalidateQueries({ queryKey: ['order'] });
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao atualizar status'),
  });
}

// ---- Waiters ----

export function useWaiters() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['waiters', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waiters')
        .select('*, profiles:profiles!waiters_user_id_fkey (name, email, phone)')
        .eq('store_id', storeId)
        .order('display_name');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateWaiter() {
  const storeId = useStoreId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { user_id: string; display_name: string }) => {
      // Add waiter role
      await supabase.from('user_roles').upsert(
        { user_id: params.user_id, role: 'waiter' },
        { onConflict: 'user_id,role' }
      );
      
      const { data, error } = await supabase
        .from('waiters')
        .insert({ ...params, store_id: storeId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waiters'] });
      toast.success('Garçom adicionado!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao adicionar garçom'),
  });
}

export function useDeleteWaiter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('waiters')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
      // Remove waiter role
      await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'waiter');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waiters'] });
      toast.success('Garçom removido!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao remover garçom'),
  });
}

// ---- Waiter Assignments ----

export function useWaiterAssignments() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['waiter-assignments', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waiter_assignments')
        .select('*, waiters (display_name), restaurant_tables (number, name)')
        .eq('store_id', storeId);
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateWaiterAssignment() {
  const storeId = useStoreId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { waiter_user_id: string; table_id?: string; area?: string }) => {
      const { error } = await supabase
        .from('waiter_assignments')
        .insert({ ...params, store_id: storeId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waiter-assignments'] });
      toast.success('Atribuição criada!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao criar atribuição'),
  });
}

export function useDeleteWaiterAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('waiter_assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waiter-assignments'] });
      toast.success('Atribuição removida!');
    },
  });
}
