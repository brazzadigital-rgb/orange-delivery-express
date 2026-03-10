import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface AppSettings {
  id: string;
  store_id: string;
  app_name: string;
  app_short_name: string;
  app_description: string | null;
  theme_color: string;
  background_color: string;
  brand_primary: string | null;
  brand_secondary: string | null;
  brand_accent: string | null;
  brand_background: string | null;
  brand_surface: string | null;
  brand_text: string | null;
  gradient_start: string | null;
  gradient_end: string | null;
  app_logo_url: string | null;
  app_icon_192_url: string | null;
  app_icon_512_url: string | null;
  app_icon_maskable_url: string | null;
  splash_image_url: string | null;
  support_whatsapp: string | null;
  support_email: string | null;
  terms_url: string | null;
  privacy_url: string | null;
  enable_install_banner: boolean;
  enable_push_notifications: boolean;
  enable_maintenance_mode: boolean;
  maintenance_message: string;
  enable_offline_catalog: boolean;
  offline_message: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SETTINGS: Partial<AppSettings> = {
  app_name: '',
  app_short_name: '',
  app_description: '',
  theme_color: '#FF8A00',
  background_color: '#FFFFFF',
  enable_install_banner: true,
  enable_push_notifications: false,
  enable_maintenance_mode: false,
  maintenance_message: '',
  enable_offline_catalog: true,
  offline_message: '',
};

export function useAppSettings() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['app-settings', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        return { ...DEFAULT_SETTINGS, store_id: storeId } as AppSettings;
      }
      
      return data as AppSettings;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateAppSettings() {
  const storeId = useStoreId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<AppSettings>) => {
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('store_id', storeId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('app_settings')
          .update(settings)
          .eq('store_id', storeId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('app_settings')
          .insert({ ...settings, store_id: storeId })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (error) => {
      console.error('Error saving app settings:', error);
      toast.error('Erro ao salvar configurações');
    },
  });
}

export function useUploadAppAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      file, 
      bucket, 
      path 
    }: { 
      file: File; 
      bucket: 'app-logos' | 'app-icons' | 'app-splash'; 
      path: string;
    }) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
    },
    onError: (error) => {
      console.error('Error uploading asset:', error);
      toast.error('Erro ao fazer upload do arquivo');
    },
  });
}

export function usePushSubscription() {
  const queryClient = useQueryClient();

  const subscribe = useMutation({
    mutationFn: async (subscription: PushSubscription) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const subscriptionData = subscription.toJSON();
      
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint!,
          keys: subscriptionData.keys,
          user_agent: navigator.userAgent,
        }, {
          onConflict: 'endpoint',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Notificações ativadas!');
    },
    onError: (error) => {
      console.error('Error saving subscription:', error);
      toast.error('Erro ao ativar notificações');
    },
  });

  const unsubscribe = useMutation({
    mutationFn: async (endpoint: string) => {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Notificações desativadas');
    },
  });

  return { subscribe, unsubscribe };
}
