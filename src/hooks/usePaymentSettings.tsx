import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';

export interface PaymentSettings {
  id: string;
  store_id: string;
  efi_enabled: boolean;
  mp_enabled: boolean;
}

export function usePaymentSettings(storeId?: string) {
  const resolvedId = useStoreId();
  const sid = storeId || resolvedId;

  return useQuery({
    queryKey: ['payment-settings', sid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_payment_settings' as any)
        .select('*')
        .eq('store_id', sid)
        .maybeSingle();

      if (error) throw error;
      // Default: EFI enabled, MP disabled
      if (!data) return { efi_enabled: true, mp_enabled: false } as PaymentSettings;
      return data as unknown as PaymentSettings;
    },
    enabled: !!sid,
    staleTime: 60_000,
  });
}

export function useUpdatePaymentSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, efi_enabled, mp_enabled }: { storeId: string; efi_enabled: boolean; mp_enabled: boolean }) => {
      const { data, error } = await supabase
        .from('store_payment_settings' as any)
        .upsert({
          store_id: storeId,
          efi_enabled,
          mp_enabled,
        } as any, { onConflict: 'store_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['payment-settings', vars.storeId] });
    },
  });
}
