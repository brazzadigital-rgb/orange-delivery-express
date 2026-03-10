import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  order_sound_enabled: boolean;
  order_sound_volume: number;
  order_sound_type: 'soft_chime' | 'pop' | 'bell';
  push_enabled: boolean;
  vibration_enabled: boolean;
  last_sound_unlocked_at: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  order_sound_enabled: true,
  order_sound_volume: 0.8,
  order_sound_type: 'soft_chime',
  push_enabled: false,
  vibration_enabled: true,
  last_sound_unlocked_at: null,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_notification_preferences' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If no preferences exist, create default ones
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('user_notification_preferences' as any)
          .insert({
            user_id: user.id,
            ...DEFAULT_PREFERENCES,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating notification preferences:', insertError);
          // Return defaults even if insert fails
          return { user_id: user.id, ...DEFAULT_PREFERENCES } as unknown as NotificationPreferences;
        }

        return newData as unknown as NotificationPreferences;
      }

      return data as unknown as NotificationPreferences;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_notification_preferences' as any)
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-preferences', user?.id], data);
    },
    onError: (error) => {
      console.error('Error updating notification preferences:', error);
      toast.error('Erro ao salvar preferências');
    },
  });

  const updateSoundUnlocked = useMutation({
    mutationFn: async () => {
      if (!user) return;

      await supabase
        .from('user_notification_preferences' as any)
        .update({ last_sound_unlocked_at: new Date().toISOString() })
        .eq('user_id', user.id);
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updatePreferences: updateMutation.mutate,
    updatePreferencesAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    markSoundUnlocked: updateSoundUnlocked.mutate,
  };
}
