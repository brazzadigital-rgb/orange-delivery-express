import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'customer' | 'admin' | 'staff' | 'driver' | 'owner' | 'waiter';

const ROLE_PRIORITY: Record<string, number> = {
  admin: 50,
  owner: 40,
  staff: 30,
  waiter: 20,
  driver: 15,
  customer: 10,
};

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<AppRole> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user role:', error);
        return 'customer';
      }

      if (!data || data.length === 0) return 'customer';

      // Return highest-priority role
      const sorted = data
        .map(r => r.role as AppRole)
        .sort((a, b) => (ROLE_PRIORITY[b] || 0) - (ROLE_PRIORITY[a] || 0));

      return sorted[0];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserRoles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-roles-all', user?.id],
    queryFn: async (): Promise<AppRole[]> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) return ['customer'];
      return (data || []).map(r => r.role as AppRole);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHasRole(role: AppRole | AppRole[]) {
  const { data: roles, isLoading } = useUserRoles();
  
  const targetRoles = Array.isArray(role) ? role : [role];
  const hasRole = roles ? targetRoles.some(r => roles.includes(r)) : false;
  const userRole = roles?.[0] || undefined;

  return { hasRole, isLoading, userRole };
}
