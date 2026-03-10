import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface IFoodConnection {
  id: string;
  store_id: string;
  mode: 'POLLING' | 'WEBHOOK';
  client_id: string;
  client_secret: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  last_poll_at: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface IFoodMerchant {
  id: string;
  connection_id: string;
  merchant_id: string;
  name: string | null;
  active: boolean;
  created_at: string;
}

export interface IFoodEvent {
  id: string;
  connection_id: string;
  event_id: string;
  code: string;
  full_code: string | null;
  order_id: string | null;
  merchant_id: string | null;
  created_at_event: string;
  payload: any;
  processed: boolean;
  processed_at: string | null;
  created_at: string;
}

export function useIFoodConnection() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['ifood-connection', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ifood_connections')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) throw error;
      return data as IFoodConnection | null;
    },
  });
}

export function useIFoodMerchants(connectionId: string | null) {
  return useQuery({
    queryKey: ['ifood-merchants', connectionId],
    queryFn: async () => {
      if (!connectionId) return [];

      const { data, error } = await supabase
        .from('ifood_merchants')
        .select('*')
        .eq('connection_id', connectionId)
        .order('name');

      if (error) throw error;
      return data as IFoodMerchant[];
    },
    enabled: !!connectionId,
  });
}

export function useIFoodEvents(connectionId: string | null, limit = 100) {
  return useQuery({
    queryKey: ['ifood-events', connectionId, limit],
    queryFn: async () => {
      if (!connectionId) return [];

      const { data, error } = await supabase
        .from('ifood_events')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at_event', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as IFoodEvent[];
    },
    enabled: !!connectionId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useCreateIFoodConnection() {
  const storeId = useStoreId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { clientId: string; clientSecret: string; mode?: 'POLLING' | 'WEBHOOK' }) => {
      const { data: connection, error } = await supabase
        .from('ifood_connections')
        .insert({
          store_id: storeId,
          client_id: data.clientId,
          client_secret: data.clientSecret,
          mode: data.mode || 'POLLING',
          enabled: false,
        })
        .select()
        .single();

      if (error) throw error;
      return connection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ifood-connection'] });
      toast.success('Conexão iFood criada com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar conexão');
    },
  });
}

export function useUpdateIFoodConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<IFoodConnection> & { id: string }) => {
      const { error } = await supabase
        .from('ifood_connections')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ifood-connection'] });
      toast.success('Conexão atualizada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar conexão');
    },
  });
}

export function useIFoodAuth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ connectionId, action }: { connectionId: string; action: 'refresh' | 'test' }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('ifood-auth', {
        body: { connectionId, action },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ifood-connection'] });
      queryClient.invalidateQueries({ queryKey: ['ifood-merchants'] });
      
      if (variables.action === 'refresh') {
        toast.success('Token atualizado com sucesso');
      } else if (variables.action === 'test') {
        toast.success(`Conexão testada! ${data.merchants} merchant(s) encontrado(s)`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro na autenticação iFood');
    },
  });
}

export function useIFoodPoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId?: string) => {
      const response = await supabase.functions.invoke('ifood-poll', {
        body: connectionId ? { connectionId } : {},
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ifood-events'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      const results = data.results || [];
      const totalEvents = results.reduce((acc: number, r: any) => acc + (r.eventsCount || 0), 0);
      
      if (totalEvents > 0) {
        toast.success(`${totalEvents} evento(s) recebido(s) do iFood`);
      } else {
        toast.info('Nenhum evento novo');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao buscar eventos');
    },
  });
}

export function useProcessIFoodEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('ifood-process-events', {});

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ifood-events'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      if (data.processed > 0) {
        toast.success(`${data.processed} evento(s) processado(s)`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao processar eventos');
    },
  });
}

export function useIFoodOrderAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      action, 
      reason, 
      code 
    }: { 
      orderId: string; 
      action: 'confirm' | 'dispatch' | 'readyForPickup' | 'requestCancellation' | 'getCancellationReasons' | 'getDetails';
      reason?: string;
      code?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('ifood-order-actions', {
        body: { orderId, action, reason, code },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      
      if (data.success) {
        toast.success(data.message || 'Ação executada com sucesso');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao executar ação no iFood');
    },
  });
}
