import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Address {
  id: string;
  user_id: string;
  label: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
  created_at: string;
}

export function useAddresses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      if (!user) return [];

      console.log('[useAddresses] Fetching addresses for user:', user.id);

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) {
        console.error('[useAddresses] Error fetching addresses:', error);
        throw error;
      }
      
      console.log('[useAddresses] Found addresses:', data?.length || 0);
      return data as Address[];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 min cache
    refetchOnMount: true,
  });
}

export function useCreateAddress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: Omit<Address, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('addresses')
        .insert({
          ...address,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Endereço salvo!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao salvar endereço');
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...address }: Partial<Address> & { id: string }) => {
      const { data, error } = await supabase
        .from('addresses')
        .update(address)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Endereço atualizado!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar endereço');
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Endereço removido!');
    },
    onError: (error: any) => {
      if (error?.code === '23503' || error?.message?.includes('foreign key constraint')) {
        toast.error('Este endereço está vinculado a pedidos e não pode ser removido.');
      } else {
        toast.error(error.message || 'Erro ao remover endereço');
      }
    },
  });
}
