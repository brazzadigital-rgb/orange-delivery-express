import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface MergedTableRecord {
  id: string;
  master_session_id: string;
  table_id: string;
  table_number: number;
  merged_from_session_id: string | null;
  status: string;
  created_at: string;
}

// Fetch active merges for a master session
export function useMergedTables(masterSessionId: string) {
  return useQuery({
    queryKey: ['merged-tables', masterSessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merged_tables')
        .select('*')
        .eq('master_session_id', masterSessionId)
        .eq('status', 'active');
      if (error) throw error;
      return (data || []) as MergedTableRecord[];
    },
    enabled: !!masterSessionId,
  });
}

// Fetch all active merges for the store (to know which tables are merged)
export function useAllActiveMerges() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['all-active-merges', storeId],
    queryFn: async () => {
      // Join through table_sessions to filter by store_id
      const { data, error } = await supabase
        .from('merged_tables')
        .select('*, table_sessions!merged_tables_master_session_id_fkey(store_id)')
        .eq('status', 'active');
      if (error) throw error;
      // Filter client-side by store_id (merged_tables doesn't have store_id directly)
      const filtered = (data || []).filter((m: any) => m.table_sessions?.store_id === storeId);
      return filtered as MergedTableRecord[];
    },
    refetchInterval: 10000,
  });
}

interface MergeTablesParams {
  masterTableId: string;
  masterTableNumber: number;
  otherTables: Array<{ tableId: string; tableNumber: number; sessionId: string | null }>;
}

export function useMergeTablesMutation() {
  const qc = useQueryClient();
  const storeId = useStoreId();

  return useMutation({
    mutationFn: async (params: MergeTablesParams) => {
      let masterSessionId: string;

      const { data: existingMasterSession } = await supabase
        .from('table_sessions').select('id').eq('table_id', params.masterTableId).eq('status', 'open').limit(1).maybeSingle();

      if (existingMasterSession) {
        masterSessionId = existingMasterSession.id;
      } else {
        const { data: newSession, error: createErr } = await supabase
          .from('table_sessions').insert({ table_id: params.masterTableId, store_id: storeId, status: 'open' }).select('id').single();
        if (createErr) throw createErr;
        masterSessionId = newSession.id;
      }

      const allNumbers = [params.masterTableNumber, ...params.otherTables.map(t => t.tableNumber)];
      const displayTables = allNumbers.sort((a, b) => a - b).join(' + ');
      await supabase.from('table_sessions').update({ session_kind: 'master', display_tables: displayTables } as any).eq('id', masterSessionId);

      for (const other of params.otherTables) {
        let otherSessionId = other.sessionId;
        if (!otherSessionId) {
          const { data: newSess } = await supabase
            .from('table_sessions').insert({ table_id: other.tableId, store_id: storeId, status: 'open' }).select('id').single();
          if (newSess) otherSessionId = newSess.id;
        }
        if (!otherSessionId) continue;

        await supabase.from('merged_tables').insert({ master_session_id: masterSessionId, table_id: other.tableId, table_number: other.tableNumber, merged_from_session_id: otherSessionId });
        await supabase.from('orders').update({ original_table_number: other.tableNumber, original_session_id: otherSessionId, table_session_id: masterSessionId } as any).eq('table_session_id', otherSessionId);
        await supabase.from('table_sessions').update({ session_kind: 'merged', merged_into_session_id: masterSessionId, merged_at: new Date().toISOString() } as any).eq('id', otherSessionId);
      }

      const { data: orders } = await supabase.from('orders').select('total').eq('table_session_id', masterSessionId).neq('status', 'canceled');
      const total = (orders || []).reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      await supabase.from('table_sessions').update({ total_amount: total } as any).eq('id', masterSessionId);

      return masterSessionId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-table-sessions'] });
      qc.invalidateQueries({ queryKey: ['restaurant-tables'] });
      qc.invalidateQueries({ queryKey: ['all-active-merges'] });
      qc.invalidateQueries({ queryKey: ['table-session-detail'] });
      toast.success('Mesas unidas com sucesso!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao unir mesas'),
  });
}

// Unmerge a single table from master
export function useUnmergeTableMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { mergeRecordId: string; mergedFromSessionId: string; masterSessionId: string }) => {
      await supabase.from('orders').update({ table_session_id: params.mergedFromSessionId, original_table_number: null, original_session_id: null } as any).eq('original_session_id', params.mergedFromSessionId).eq('table_session_id', params.masterSessionId);
      await supabase.from('table_sessions').update({ session_kind: 'single', merged_into_session_id: null, merged_at: null } as any).eq('id', params.mergedFromSessionId);
      await supabase.from('merged_tables').update({ status: 'released' }).eq('id', params.mergeRecordId);

      const { data: remaining } = await supabase.from('merged_tables').select('id').eq('master_session_id', params.masterSessionId).eq('status', 'active');
      if (!remaining || remaining.length === 0) {
        await supabase.from('table_sessions').update({ session_kind: 'single', display_tables: null } as any).eq('id', params.masterSessionId);
      } else {
        const { data: merges } = await supabase.from('merged_tables').select('table_number').eq('master_session_id', params.masterSessionId).eq('status', 'active');
        const { data: masterSession } = await supabase.from('table_sessions').select('restaurant_tables(number)').eq('id', params.masterSessionId).single();
        const masterNum = (masterSession as any)?.restaurant_tables?.number || 0;
        const nums = [masterNum, ...(merges || []).map((m: any) => m.table_number)].sort((a, b) => a - b);
        await supabase.from('table_sessions').update({ display_tables: nums.join(' + ') } as any).eq('id', params.masterSessionId);
      }

      const { data: orders } = await supabase.from('orders').select('total').eq('table_session_id', params.masterSessionId).neq('status', 'canceled');
      const total = (orders || []).reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      await supabase.from('table_sessions').update({ total_amount: total } as any).eq('id', params.masterSessionId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-table-sessions'] });
      qc.invalidateQueries({ queryKey: ['all-active-merges'] });
      qc.invalidateQueries({ queryKey: ['table-session-detail'] });
      qc.invalidateQueries({ queryKey: ['restaurant-tables'] });
      toast.success('Mesa separada com sucesso!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao separar mesa'),
  });
}
