import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformSettings {
  id: string;
  platform_name: string;
  platform_short_name: string;
  platform_description: string | null;
  platform_favicon_url: string | null;
  platform_logo_url: string | null;
  platform_og_image_url: string | null;
  theme_color: string | null;
  support_email: string | null;
  support_whatsapp: string | null;
  terms_url: string | null;
  privacy_url: string | null;
  updated_at: string;
}

export function usePlatformSettings() {
  return useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('platform_settings') as any)
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as PlatformSettings | null;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<PlatformSettings>) => {
      // Get the single row ID first
      const { data: existing } = await (supabase
        .from('platform_settings') as any)
        .select('id')
        .limit(1)
        .single();

      if (!existing) throw new Error('No platform settings found');

      const { error } = await (supabase
        .from('platform_settings') as any)
        .update(updates)
        .eq('id', existing.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
    },
  });
}
