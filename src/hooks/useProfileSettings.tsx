import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Privacy Settings
export interface PrivacySettings {
  user_id: string;
  show_name_to_store: boolean;
  allow_promotional_contact: boolean;
  share_location_during_delivery: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PRIVACY: Omit<PrivacySettings, 'user_id' | 'created_at' | 'updated_at'> = {
  show_name_to_store: true,
  allow_promotional_contact: true,
  share_location_during_delivery: true,
};

export function usePrivacySettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['privacy-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If no settings exist, create default ones
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('user_privacy_settings')
          .insert({
            user_id: user.id,
            ...DEFAULT_PRIVACY,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating privacy settings:', insertError);
          return { user_id: user.id, ...DEFAULT_PRIVACY } as PrivacySettings;
        }

        return newData as PrivacySettings;
      }

      return data as PrivacySettings;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<PrivacySettings>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_privacy_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['privacy-settings', user?.id], data);
      toast.success('Preferências atualizadas');
    },
    onError: (error) => {
      console.error('Error updating privacy settings:', error);
      toast.error('Erro ao salvar preferências');
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}

// Profile Update
export interface ProfileUpdate {
  name?: string;
  phone?: string;
  avatar_url?: string;
  birth_date?: string | null;
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    },
  });
}

// Password Change
export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      // First verify current password by attempting a sign in
      const { data: session } = await supabase.auth.getSession();
      const email = session?.session?.user?.email;
      
      if (!email) throw new Error('Email não encontrado');

      // Try to sign in with current password to verify
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Senha atual incorreta');
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao alterar senha');
    },
  });
}

// Account Deletion Request
export interface DeletionRequest {
  id: string;
  user_id: string;
  status: 'requested' | 'processed' | 'cancelled';
  reason: string | null;
  created_at: string;
  processed_at: string | null;
}

export function useDeletionRequest() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deletion-request', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'requested')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as DeletionRequest | null;
    },
    enabled: !!user,
  });
}

export function useRequestAccountDeletion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reason?: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('account_deletion_requests')
        .insert({
          user_id: user.id,
          reason,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletion-request'] });
      toast.success('Solicitação de exclusão enviada');
    },
    onError: (error) => {
      console.error('Error requesting deletion:', error);
      toast.error('Erro ao solicitar exclusão');
    },
  });
}

export function useCancelDeletionRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('account_deletion_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletion-request'] });
      toast.success('Solicitação cancelada');
    },
    onError: (error) => {
      console.error('Error cancelling deletion:', error);
      toast.error('Erro ao cancelar solicitação');
    },
  });
}

// Export user data
export function useExportUserData() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Fetch all user data
      const [profileRes, ordersRes, addressesRes, walletRes, favoritesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('addresses').select('*').eq('user_id', user.id),
        supabase.from('loyalty_wallets').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('favorites').select('*, products(name)').eq('user_id', user.id),
      ]);

      const userData = {
        exportDate: new Date().toISOString(),
        profile: profileRes.data,
        orders: ordersRes.data || [],
        addresses: addressesRes.data || [],
        loyaltyWallet: walletRes.data,
        favorites: favoritesRes.data || [],
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return userData;
    },
    onSuccess: () => {
      toast.success('Dados exportados com sucesso!');
    },
    onError: (error) => {
      console.error('Error exporting data:', error);
      toast.error('Erro ao exportar dados');
    },
  });
}
