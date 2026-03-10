import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';

export interface HomeSection {
  id: string;
  store_id: string;
  section_key: string;
  label: string;
  enabled: boolean;
  sort_order: number;
  config: Record<string, any>;
}

export function useHomeSections(overrideStoreId?: string) {
  const resolvedId = useStoreId();
  const storeId = overrideStoreId || resolvedId;

  return useQuery({
    queryKey: ['home-sections', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_home_sections')
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as HomeSection[];
    },
    enabled: !!storeId,
    staleTime: 60_000,
  });
}

export function useUpdateHomeSection() {
  const queryClient = useQueryClient();
  const storeId = useStoreId();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HomeSection> & { id: string }) => {
      const { error } = await supabase
        .from('store_home_sections')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-sections', storeId] });
    },
  });
}

export function useReorderHomeSections() {
  const queryClient = useQueryClient();
  const storeId = useStoreId();

  return useMutation({
    mutationFn: async (sections: { id: string; sort_order: number }[]) => {
      const promises = sections.map(s =>
        supabase.from('store_home_sections').update({ sort_order: s.sort_order }).eq('id', s.id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-sections', storeId] });
    },
  });
}

/** Returns only the enabled section keys in order, for use in the customer Home */
export function useEnabledHomeSections(overrideStoreId?: string) {
  const { data, isLoading } = useHomeSections(overrideStoreId);
  const enabled = data?.filter(s => s.enabled).map(s => s.section_key) || [];
  return { sections: enabled, allSections: data, isLoading };
}
