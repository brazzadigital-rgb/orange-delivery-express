import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export type Banner = Tables<'banners'>;
export type BannerInsert = TablesInsert<'banners'>;
export type BannerUpdate = TablesUpdate<'banners'>;

export function useBanners() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['banners', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Banner[];
    },
  });
}

export function useActiveBanners() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['banners', 'active', storeId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('store_id', storeId)
        .eq('active', true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Banner[];
    },
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  const storeId = useStoreId();

  return useMutation({
    mutationFn: async (banner: Omit<BannerInsert, 'store_id'>) => {
      const { data, error } = await supabase
        .from('banners')
        .insert({ ...banner, store_id: storeId })
        .select()
        .single();
      if (error) throw error;
      return data as Banner;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['banners'] }); toast.success('Banner criado com sucesso!'); },
    onError: (error: Error) => { toast.error('Erro ao criar banner: ' + error.message); },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: BannerUpdate & { id: string }) => {
      const { data, error } = await supabase.from('banners').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as Banner;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['banners'] }); toast.success('Banner atualizado com sucesso!'); },
    onError: (error: Error) => { toast.error('Erro ao atualizar banner: ' + error.message); },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('banners').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['banners'] }); toast.success('Banner excluído com sucesso!'); },
    onError: (error: Error) => { toast.error('Erro ao excluir banner: ' + error.message); },
  });
}

export function useToggleBannerActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { data, error } = await supabase.from('banners').update({ active }).eq('id', id).select().single();
      if (error) throw error;
      return data as Banner;
    },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['banners'] }); toast.success(data.active ? 'Banner ativado!' : 'Banner desativado!'); },
    onError: (error: Error) => { toast.error('Erro ao alterar status: ' + error.message); },
  });
}
