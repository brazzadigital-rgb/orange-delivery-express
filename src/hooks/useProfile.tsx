import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface UserRole {
  role: 'customer' | 'admin' | 'staff' | 'driver';
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 min cache — profile rarely changes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useUserRoles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user_roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data as UserRole[]).map(r => r.role);
    },
    enabled: !!user,
  });
}

export function useHasRole(role: 'customer' | 'admin' | 'staff' | 'driver') {
  const { data: roles = [] } = useUserRoles();
  return roles.includes(role);
}
