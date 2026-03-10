import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface Driver {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export interface DriverFormData {
  name: string;
  email: string;
  phone: string;
  password?: string;
}

export function useDrivers() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['drivers', storeId],
    queryFn: async () => {
      // Get drivers via store_users for this specific store
      const { data, error } = await supabase
        .from('store_users')
        .select('id, user_id, role, created_at, profiles!store_users_user_id_profiles_fkey(id, name, phone, email, avatar_url)')
        .eq('store_id', storeId)
        .eq('role', 'staff');
      if (error) throw error;
      return data as unknown as Driver[];
    },
  });
}

export function useDriver(id: string) {
  return useQuery({
    queryKey: ['driver', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, user_id, role, created_at, profiles (id, name, phone, email, avatar_url)')
        .eq('id', id)
        .eq('role', 'driver')
        .single();
      
      if (error) throw error;
      return data as unknown as Driver;
    },
    enabled: !!id,
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: DriverFormData) => {
      // Call edge function to create driver (doesn't change current user session)
      const { data, error } = await supabase.functions.invoke('create-driver', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
      toast.success('Motoboy cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao cadastrar motoboy');
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<DriverFormData> }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          phone: data.phone,
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Motoboy atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar motoboy');
    },
  });
}

export function useDriverDeliveriesToday(driverId: string) {
  return useQuery({
    queryKey: ['driver-deliveries-today', driverId],
    queryFn: async () => {
      if (!driverId) return 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', driverId)
        .eq('status', 'delivered')
        .gte('created_at', today.toISOString());

      if (error) throw error;
      return count || 0;
    },
    enabled: !!driverId,
  });
}
