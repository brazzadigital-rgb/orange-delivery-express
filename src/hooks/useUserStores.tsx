import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserStore {
  id: string;
  name: string;
  slug: string;
}

/**
 * Fetches all stores the current user has access to:
 * 1. Stores where user is listed in store_users (admin/staff/owner)
 * 2. Stores where owner_email matches the user's email
 * Returns deduplicated list.
 */
export function useUserStores() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-stores', user?.id],
    queryFn: async (): Promise<UserStore[]> => {
      if (!user) return [];

      // Fetch stores from store_users
      const { data: storeUserData } = await supabase
        .from('store_users')
        .select('store_id, stores!store_users_store_id_stores_fkey(id, name, slug)')
        .eq('user_id', user.id);

      // Fetch stores by owner_email
      const { data: ownedStores } = await supabase
        .from('stores')
        .select('id, name, slug')
        .eq('owner_email', user.email ?? '');

      const storeMap = new Map<string, UserStore>();

      // Add stores from store_users
      if (storeUserData) {
        for (const su of storeUserData) {
          const store = (su as any).stores as UserStore | null;
          if (store) {
            storeMap.set(store.id, { id: store.id, name: store.name, slug: store.slug });
          }
        }
      }

      // Add owned stores
      if (ownedStores) {
        for (const s of ownedStores) {
          storeMap.set(s.id, { id: s.id, name: s.name, slug: s.slug });
        }
      }

      return Array.from(storeMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
