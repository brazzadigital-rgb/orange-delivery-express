import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { useCallback, useMemo, useRef } from 'react';

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface FavoriteProduct {
  id: string;
  product_id: string;
  created_at: string;
  product: {
    id: string;
    name: string;
    description: string | null;
    base_price: number;
    promo_price: number | null;
    image_url: string | null;
    active: boolean;
    rating_avg: number;
    rating_count: number;
  } | null;
}

// Hook to get user's favorites as a Set for fast lookups
export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Lock to prevent double-clicks
  const toggleLock = useRef<Set<string>>(new Set());

  const query = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select('id, product_id, created_at')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as Favorite[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create a Set of product IDs for fast lookup
  const favoritesSet = useMemo(() => {
    return new Set(query.data?.map(f => f.product_id) || []);
  }, [query.data]);

  // Check if a product is favorited
  const isFavorited = useCallback((productId: string) => {
    return favoritesSet.has(productId);
  }, [favoritesSet]);

  // Toggle favorite mutation with optimistic updates
  const toggleMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const isCurrentlyFavorited = favoritesSet.has(productId);

      if (isCurrentlyFavorited) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;
        return { action: 'removed', productId };
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            product_id: productId,
          });

        if (error) throw error;
        return { action: 'added', productId };
      }
    },
    onMutate: async (productId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] });

      // Snapshot the previous value
      const previousFavorites = queryClient.getQueryData<Favorite[]>(['favorites', user?.id]);

      // Optimistically update
      const isCurrentlyFavorited = favoritesSet.has(productId);
      
      if (isCurrentlyFavorited) {
        // Remove from cache
        queryClient.setQueryData<Favorite[]>(['favorites', user?.id], (old) => 
          old?.filter(f => f.product_id !== productId) || []
        );
      } else {
        // Add to cache
        queryClient.setQueryData<Favorite[]>(['favorites', user?.id], (old) => [
          ...(old || []),
          {
            id: `temp-${productId}`,
            product_id: productId,
            user_id: user?.id || '',
            created_at: new Date().toISOString(),
          },
        ]);
      }

      return { previousFavorites };
    },
    onError: (err, productId, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites', user?.id], context.previousFavorites);
      }
      toast.error('Não foi possível atualizar favoritos. Tente novamente.');
    },
    onSettled: () => {
      // Refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['favorites-products'] });
    },
  });

  // Toggle with lock to prevent double-clicks
  const toggleFavorite = useCallback(async (productId: string) => {
    if (!user) {
      toast.error('Entre para salvar favoritos', {
        action: {
          label: 'Entrar',
          onClick: () => window.location.href = '/auth/login',
        },
      });
      return;
    }

    // Check lock
    if (toggleLock.current.has(productId)) {
      return;
    }

    // Set lock
    toggleLock.current.add(productId);

    try {
      await toggleMutation.mutateAsync(productId);
    } finally {
      // Release lock after 300ms
      setTimeout(() => {
        toggleLock.current.delete(productId);
      }, 300);
    }
  }, [user, toggleMutation]);

  return {
    favorites: query.data || [],
    favoritesSet,
    isFavorited,
    toggleFavorite,
    isLoading: query.isLoading,
    isToggling: toggleMutation.isPending,
  };
}

// Hook to get favorites with full product data (for Favorites page)
export function useFavoritesWithProducts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites-products', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get favorites
      const { data: favorites, error: favError } = await supabase
        .from('favorites')
        .select('id, product_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (favError) throw favError;
      if (!favorites || favorites.length === 0) return [];

      // Get product IDs
      const productIds = favorites.map(f => f.product_id);

      // Fetch products scoped to the current store
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, description, base_price, promo_price, image_url, active, rating_avg, rating_count')
        .in('id', productIds);

      if (prodError) throw prodError;

      // Map products to favorites
      const productMap = new Map(products?.map(p => [p.id, p]) || []);

      return favorites.map(f => ({
        ...f,
        product: productMap.get(f.product_id) || null,
      })) as FavoriteProduct[];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
