import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { useRecalcSessionTotal } from '@/hooks/useTableSessions';

// Open a table session from waiter
export function useOpenTableSession() {
  const storeId = useStoreId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      tableId: string;
      customerName: string;
      customerPhone?: string;
      notes?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      const waiterId = user?.user?.id || null;

      const { data, error } = await supabase
        .from('table_sessions')
        .insert({
          table_id: params.tableId,
          store_id: storeId,
          customer_name: params.customerName,
          customer_phone: params.customerPhone || null,
          notes: params.notes || null,
          opened_by_source: 'waiter',
          opened_by_waiter_id: waiterId,
          status: 'open',
          payment_status: 'pending',
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-table-sessions'] });
      qc.invalidateQueries({ queryKey: ['restaurant-tables'] });
      toast.success('Mesa aberta com sucesso!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao abrir mesa'),
  });
}

// Create a table order from waiter (marks created_by_source = 'waiter')
export function useCreateWaiterTableOrder() {
  const qc = useQueryClient();
  const recalc = useRecalcSessionTotal();

  return useMutation({
    mutationFn: async (params: {
      storeId: string;
      tableId: string;
      sessionId: string;
      notes?: string;
      items: Array<{
        product_id: string;
        name_snapshot: string;
        quantity: number;
        base_price: number;
        options_snapshot: any;
        item_total: number;
      }>;
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

      // Mark as created by waiter and set waiter_user_id
      if (data) {
        const { data: userData } = await supabase.auth.getUser();
        const waiterId = userData?.user?.id || null;
        await supabase
          .from('orders')
          .update({ created_by_source: 'waiter', waiter_user_id: waiterId } as any)
          .eq('id', data);
      }

      return data as string;
    },
    onSuccess: (_, vars) => {
      recalc.mutate(vars.sessionId);
      qc.invalidateQueries({ queryKey: ['table-session-detail'] });
      qc.invalidateQueries({ queryKey: ['active-table-sessions'] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['table-orders'] });
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao criar pedido'),
  });
}
