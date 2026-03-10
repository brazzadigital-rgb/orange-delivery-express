import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'customer' | 'admin' | 'staff' | 'driver' | 'owner' | 'waiter';

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<AppRole> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return 'customer'; // Default fallback
      }

      return data.role as AppRole;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useHasRole(role: AppRole | AppRole[]) {
  const { data: userRole, isLoading } = useUserRole();
  
  const roles = Array.isArray(role) ? role : [role];
  const hasRole = userRole ? roles.includes(userRole) : false;

  return { hasRole, isLoading, userRole };
}
