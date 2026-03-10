import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type { StoreSettings, OpeningHours } from '@/contexts/StoreConfigContext';

export function useStoreSettings() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['store-settings', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;
      
      const openingHours = typeof data.opening_hours === 'string' 
        ? JSON.parse(data.opening_hours) 
        : data.opening_hours;
      
      return {
        ...data,
        opening_hours: openingHours,
      } as StoreSettings;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useUpdateStoreSettings() {
  const storeId = useStoreId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<StoreSettings>) => {
      const { data: existing } = await supabase
        .from('store_settings')
        .select('id')
        .eq('store_id', storeId)
        .maybeSingle();

      const preparedData = {
        ...settings,
        opening_hours: settings.opening_hours 
          ? JSON.stringify(settings.opening_hours) 
          : undefined,
      };

      if (existing) {
        const { data, error } = await supabase
          .from('store_settings')
          .update(preparedData)
          .eq('store_id', storeId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('store_settings')
          .insert({ ...preparedData, store_id: storeId })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-settings'] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (error) => {
      console.error('Error saving store settings:', error);
      toast.error('Erro ao salvar configurações');
    },
  });
}

export function useToggleStoreOpen() {
  const storeId = useStoreId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isOpen: boolean | null) => {
      const { data, error } = await supabase
        .from('store_settings')
        .update({ is_open_override: isOpen })
        .eq('store_id', storeId)
        .select()
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        const { data: inserted, error: insertErr } = await supabase
          .from('store_settings')
          .insert({ store_id: storeId, is_open_override: isOpen, store_name: 'Minha Loja' })
          .select()
          .single();
        if (insertErr) throw insertErr;
        return inserted;
      }

      return data;
    },
    onSuccess: (_, isOpen) => {
      queryClient.invalidateQueries({ queryKey: ['store-settings'] });
      if (isOpen === null) {
        toast.success('Modo automático ativado');
      } else if (isOpen) {
        toast.success('Loja forçada como ABERTA');
      } else {
        toast.success('Loja forçada como FECHADA');
      }
    },
    onError: (error) => {
      console.error('Error toggling store status:', error);
      toast.error('Erro ao alterar status da loja');
    },
  });
}
