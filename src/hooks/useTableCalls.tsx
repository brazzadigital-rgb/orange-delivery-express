import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { useAdminPreferences, playNotificationSound } from './useAdminPreferences';

export interface TableCall {
  id: string;
  table_id: string;
  table_session_id: string | null;
  table_number: number;
  status: string;
  message: string | null;
  store_id: string;
  created_at: string;
  attended_at: string | null;
  attended_by_user_id: string | null;
}

// Hook for the client (QR code session) to create a call
export function useCreateTableCall() {
  const [cooldown, setCooldown] = useState(false);

  const createCall = useCallback(async (params: {
    table_id: string;
    table_session_id: string | null;
    table_number: number;
    store_id: string;
    message?: string;
  }) => {
    if (cooldown) {
      toast.error('Aguarde um instante antes de chamar novamente.');
      return null;
    }

    const { data, error } = await supabase
      .from('table_calls')
      .insert({
        table_id: params.table_id,
        table_session_id: params.table_session_id,
        table_number: params.table_number,
        store_id: params.store_id,
        message: params.message || null,
        status: 'pendente',
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao enviar chamado');
      return null;
    }

    // Also update last_call_at on session
    if (params.table_session_id) {
      await supabase
        .from('table_sessions')
        .update({ last_call_at: new Date().toISOString() })
        .eq('id', params.table_session_id);
    }

    toast.success('Chamado enviado! Aguarde um atendente.');
    setCooldown(true);
    setTimeout(() => setCooldown(false), 60000);
    return data;
  }, [cooldown]);

  return { createCall, cooldown };
}

// Hook for client to track their own call status in realtime
export function useTableCallStatus(tableId: string | undefined) {
  const [latestCall, setLatestCall] = useState<TableCall | null>(null);

  useEffect(() => {
    if (!tableId) return;

    // Fetch latest call
    const fetchLatest = async () => {
      const { data } = await supabase
        .from('table_calls')
        .select('*')
        .eq('table_id', tableId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setLatestCall(data as TableCall);
    };
    fetchLatest();

    const channel = supabase
      .channel(`table-calls-client-${tableId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'table_calls',
        filter: `table_id=eq.${tableId}`,
      }, () => { fetchLatest(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tableId]);

  return latestCall;
}

// Admin hook: fetch all calls + realtime + sound
export function useAdminTableCalls() {
  const storeId = useStoreId();
  const queryClient = useQueryClient();
  const { data: preferences } = useAdminPreferences();
  const preferencesRef = useRef(preferences);
  const processedIds = useRef(new Set<string>());
  const realtimeReady = useRef(false);

  useEffect(() => { preferencesRef.current = preferences; }, [preferences]);

  const { data: calls = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-table-calls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_calls')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      const result = (data || []) as TableCall[];
      result.forEach(c => processedIds.current.add(c.id));
      realtimeReady.current = true;
      return result;
    },
  });

  const pendingCount = calls.filter(c => c.status === 'pendente').length;

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('admin-table-calls-rt')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'table_calls',
        filter: `store_id=eq.${storeId}`,
      }, (payload) => {
        refetch();
        const call = payload.new as TableCall;
        if (!realtimeReady.current || processedIds.current.has(call.id)) return;
        processedIds.current.add(call.id);

        // Play sound
        playNotificationSound(preferencesRef.current ?? null);

        toast.info(`🔔 Chamado — Mesa ${String(call.table_number).padStart(2, '0')}`, {
          description: call.message || 'Cliente solicita atendimento',
          duration: 15000,
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'table_calls',
        filter: `store_id=eq.${storeId}`,
      }, () => { refetch(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  // Attend / cancel mutations
  const attendCall = useMutation({
    mutationFn: async (callId: string) => {
      const { error } = await supabase
        .from('table_calls')
        .update({
          status: 'atendido',
          attended_at: new Date().toISOString(),
          attended_by_user_id: (await supabase.auth.getUser()).data.user?.id || null,
        })
        .eq('id', callId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      toast.success('Chamado marcado como atendido');
    },
    onError: () => toast.error('Erro ao atender chamado'),
  });

  const cancelCall = useMutation({
    mutationFn: async (callId: string) => {
      const { error } = await supabase
        .from('table_calls')
        .update({ status: 'cancelado' })
        .eq('id', callId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      toast.success('Chamado cancelado');
    },
    onError: () => toast.error('Erro ao cancelar chamado'),
  });

  return { calls, isLoading, pendingCount, attendCall, cancelCall, refetch };
}
