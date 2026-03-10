import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface TableSessionEnriched {
  id: string;
  table_id: string;
  store_id: string;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  opened_at: string;
  closed_at: string | null;
  payment_status: string;
  payment_method: string | null;
  paid_at: string | null;
  total_amount: number;
  opened_by_source: string;
  notes: string | null;
  payment_notes: string | null;
  session_kind: string;
  merged_into_session_id: string | null;
  display_tables: string | null;
  merged_at: string | null;
  restaurant_tables: { number: number; name: string | null; area: string | null } | null;
}

export interface SessionOrder {
  id: string;
  order_number: number;
  status: string;
  kitchen_status: string;
  subtotal: number;
  total: number;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  created_by_source: string;
  order_items: Array<{
    id: string;
    name_snapshot: string;
    quantity: number;
    base_price: number;
    item_total: number;
    options_snapshot: any;
  }>;
}

// Fetch all open sessions with table info for the admin grid
export function useActiveTableSessions() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['active-table-sessions', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_sessions')
        .select('*, restaurant_tables(number, name, area)')
        .eq('store_id', storeId)
        .eq('status', 'open')
        .order('opened_at', { ascending: false });
      if (error) throw error;

      // Calculate totals from orders for each session
      const sessions = (data || []) as unknown as TableSessionEnriched[];
      for (const session of sessions) {
        const { data: orders } = await supabase
          .from('orders')
          .select('total')
          .eq('table_session_id', session.id)
          .neq('status', 'canceled');
        session.total_amount = (orders || []).reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      }
      return sessions;
    },
    refetchInterval: 10000,
  });
}

// Fetch a single session with its orders
export function useTableSessionDetail(sessionId: string) {
  return useQuery({
    queryKey: ['table-session-detail', sessionId],
    queryFn: async () => {
      const { data: session, error: sessionError } = await supabase
        .from('table_sessions')
        .select('*, restaurant_tables(number, name, area)')
        .eq('id', sessionId)
        .single();
      if (sessionError) throw sessionError;

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('table_session_id', sessionId)
        .order('created_at', { ascending: true });
      if (ordersError) throw ordersError;

      return {
        session: session as unknown as TableSessionEnriched,
        orders: (orders || []) as unknown as SessionOrder[],
      };
    },
    enabled: !!sessionId,
  });
}

// Fetch orders for a session (for the receipt)
export function useSessionOrders(sessionId: string) {
  return useQuery({
    queryKey: ['session-orders', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('table_session_id', sessionId)
        .neq('status', 'canceled')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as SessionOrder[];
    },
    enabled: !!sessionId,
  });
}

// Close/pay session
export function useCloseTableSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      paymentMethod: string;
      paymentNotes?: string;
    }) => {
      const { error } = await supabase
        .from('table_sessions')
        .update({
          status: 'closed',
          payment_status: 'paid',
          payment_method: params.paymentMethod,
          paid_at: new Date().toISOString(),
          closed_at: new Date().toISOString(),
          payment_notes: params.paymentNotes || null,
        } as any)
        .eq('id', params.sessionId);
      if (error) throw error;

      // Also mark all orders in this session as paid
      await supabase
        .from('orders')
        .update({ payment_status: 'paid' } as any)
        .eq('table_session_id', params.sessionId)
        .neq('status', 'canceled');

      // Handle merged sessions: release merge records and close merged sessions
      const { data: merges } = await supabase
        .from('merged_tables')
        .select('id, merged_from_session_id')
        .eq('master_session_id', params.sessionId)
        .eq('status', 'active');

      if (merges && merges.length > 0) {
        await supabase
          .from('merged_tables')
          .update({ status: 'released' })
          .eq('master_session_id', params.sessionId);

        for (const m of merges) {
          if (m.merged_from_session_id) {
            await supabase
              .from('table_sessions')
              .update({ status: 'closed', closed_at: new Date().toISOString() } as any)
              .eq('id', m.merged_from_session_id);
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-table-sessions'] });
      qc.invalidateQueries({ queryKey: ['table-session-detail'] });
      qc.invalidateQueries({ queryKey: ['restaurant-tables'] });
      qc.invalidateQueries({ queryKey: ['all-active-merges'] });
      toast.success('Mesa fechada e pagamento registrado!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao fechar mesa'),
  });
}

// Recalculate session total
export function useRecalcSessionTotal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .eq('table_session_id', sessionId)
        .neq('status', 'canceled');

      const total = (orders || []).reduce((sum: number, o: any) => sum + (o.total || 0), 0);

      await supabase
        .from('table_sessions')
        .update({ total_amount: total } as any)
        .eq('id', sessionId);

      return total;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-table-sessions'] });
      qc.invalidateQueries({ queryKey: ['table-session-detail'] });
    },
  });
}

// Create an admin/internal order for a session
export function useCreateInternalTableOrder() {
  const qc = useQueryClient();
  const recalc = useRecalcSessionTotal();

  return useMutation({
    mutationFn: async (params: {
      storeId: string;
      tableId: string;
      sessionId: string;
      items: Array<{
        product_id: string;
        name_snapshot: string;
        quantity: number;
        base_price: number;
        options_snapshot: any;
        item_total: number;
      }>;
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc('create_table_order', {
        p_store_id: params.storeId,
        p_table_id: params.tableId,
        p_table_session_id: params.sessionId,
        p_customer_name: null,
        p_payment_method: 'cash',
        p_notes: params.notes || null,
        p_items: params.items,
      });
      if (error) throw error;

      // Mark as created by admin and auto-accept
      if (data) {
        await supabase
          .from('orders')
          .update({ created_by_source: 'admin', status: 'accepted' } as any)
          .eq('id', data);
      }

      return data as string;
    },
    onSuccess: (_, vars) => {
      recalc.mutate(vars.sessionId);
      qc.invalidateQueries({ queryKey: ['table-session-detail'] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Itens adicionados à comanda!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao adicionar itens'),
  });
}
