 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useStoreId } from '@/contexts/TenantContext';
 import { toast } from 'sonner';
import type { 
  PizzaSize, 
  PizzaFlavor, 
  PizzaFlavorPrice, 
  PizzaAddonGroup, 
  PizzaAddon,
  StorePizzaSettings 
} from './usePizzaBuilder';
import { useTenant } from '@/contexts/TenantContext';
import { getDemoDataForSegment } from '@/lib/builder-demo-data';
 
 // ============ Sizes ============
 export function useAdminPizzaSizes() {
   const storeId = useStoreId();
   return useQuery({
     queryKey: ['admin-pizza-sizes', storeId],
     queryFn: async () => {
       const { data, error } = await supabase.from('pizza_sizes').select('*').eq('store_id', storeId).order('sort_order');
       if (error) throw error;
       return data as PizzaSize[];
     },
   });
 }
 
 export function useCreatePizzaSize() {
   const queryClient = useQueryClient();
   const storeId = useStoreId();
   return useMutation({
     mutationFn: async (size: Partial<PizzaSize> & { name: string; slices: number; max_flavors: number; base_price: number }) => {
        const { data, error } = await supabase.from('pizza_sizes')
         .insert([{ name: size.name, slices: size.slices, max_flavors: size.max_flavors, base_price: size.base_price, is_promo: size.is_promo, promo_label: size.promo_label, sort_order: size.sort_order, active: size.active, unit_label: size.unit_label ?? null, description: size.description ?? null, store_id: storeId }])
         .select().single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pizza-sizes'] }); queryClient.invalidateQueries({ queryKey: ['pizza-sizes'] }); toast.success('Tamanho criado!'); },
     onError: () => toast.error('Erro ao criar tamanho'),
   });
 }
 
 export function useUpdatePizzaSize() {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async ({ id, ...updates }: Partial<PizzaSize> & { id: string }) => {
       const { data, error } = await supabase.from('pizza_sizes').update(updates).eq('id', id).select().single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pizza-sizes'] }); queryClient.invalidateQueries({ queryKey: ['pizza-sizes'] }); toast.success('Tamanho atualizado!'); },
     onError: () => toast.error('Erro ao atualizar tamanho'),
   });
 }
 
 export function useDeletePizzaSize() {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async (id: string) => { const { error } = await supabase.from('pizza_sizes').delete().eq('id', id); if (error) throw error; },
     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pizza-sizes'] }); queryClient.invalidateQueries({ queryKey: ['pizza-sizes'] }); toast.success('Tamanho removido!'); },
     onError: () => toast.error('Erro ao remover tamanho'),
   });
 }
 
 // ============ Flavors ============
 export function useAdminPizzaFlavors() {
   const storeId = useStoreId();
   return useQuery({
     queryKey: ['admin-pizza-flavors', storeId],
     queryFn: async () => {
       const { data, error } = await supabase.from('pizza_flavors').select('*').eq('store_id', storeId).order('sort_order');
       if (error) throw error;
       return data as PizzaFlavor[];
     },
   });
 }
 
 export function useCreatePizzaFlavor() {
   const queryClient = useQueryClient();
   const storeId = useStoreId();
   return useMutation({
     mutationFn: async (flavor: { name: string; description?: string; sort_order?: number; active?: boolean; unit_price?: number }) => {
        const { data, error } = await supabase.from('pizza_flavors')
         .insert([{ name: flavor.name, description: flavor.description, sort_order: flavor.sort_order ?? 0, active: flavor.active ?? true, unit_price: flavor.unit_price ?? 0, store_id: storeId }])
          .select().single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pizza-flavors'] }); queryClient.invalidateQueries({ queryKey: ['pizza-flavors'] }); toast.success('Sabor criado!'); },
     onError: () => toast.error('Erro ao criar sabor'),
   });
 }
 
 export function useUpdatePizzaFlavor() {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async ({ id, ...updates }: Partial<PizzaFlavor> & { id: string }) => {
       const { data, error } = await supabase.from('pizza_flavors').update(updates).eq('id', id).select().single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pizza-flavors'] }); queryClient.invalidateQueries({ queryKey: ['pizza-flavors'] }); toast.success('Sabor atualizado!'); },
     onError: () => toast.error('Erro ao atualizar sabor'),
   });
 }
 
 export function useDeletePizzaFlavor() {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async (id: string) => { const { error } = await supabase.from('pizza_flavors').delete().eq('id', id); if (error) throw error; },
     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pizza-flavors'] }); queryClient.invalidateQueries({ queryKey: ['pizza-flavors'] }); toast.success('Sabor removido!'); },
     onError: () => toast.error('Erro ao remover sabor'),
   });
 }
 
 // ============ Flavor Prices ============
 export function useAdminPizzaFlavorPrices() {
   const storeId = useStoreId();
   return useQuery({
     queryKey: ['admin-pizza-flavor-prices', storeId],
     queryFn: async () => {
       const { data, error } = await supabase.from('pizza_flavor_prices').select('*').eq('store_id', storeId);
       if (error) throw error;
       return data as PizzaFlavorPrice[];
     },
   });
 }
 
 export function useUpsertPizzaFlavorPrice() {
   const queryClient = useQueryClient();
   const storeId = useStoreId();
   return useMutation({
     mutationFn: async ({ size_id, flavor_id, price }: { size_id: string; flavor_id: string; price: number }) => {
       const { data, error } = await supabase.from('pizza_flavor_prices')
         .upsert({ store_id: storeId, size_id, flavor_id, price }, { onConflict: 'size_id,flavor_id' }).select().single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pizza-flavor-prices'] }); queryClient.invalidateQueries({ queryKey: ['pizza-flavor-prices'] }); },
   });
 }
 
 // ============ Addon Groups ============
 export function useAdminPizzaAddonGroups() {
   const storeId = useStoreId();
   return useQuery({
     queryKey: ['admin-pizza-addon-groups', storeId],
     queryFn: async () => {
       const { data, error } = await supabase.from('pizza_addon_groups').select('*').eq('store_id', storeId).order('sort_order');
       if (error) throw error;
       return data as PizzaAddonGroup[];
     },
   });
 }
 
 export function useCreatePizzaAddonGroup() {
   const queryClient = useQueryClient();
   const storeId = useStoreId();
   return useMutation({
    mutationFn: async (group: { name: string; group_type: 'single' | 'multi'; max_select?: number; min_select?: number; sort_order?: number; active?: boolean }) => {
       const { data, error } = await supabase.from('pizza_addon_groups')
        .insert([{ name: group.name, group_type: group.group_type, max_select: group.max_select ?? 1, min_select: group.min_select ?? 0, sort_order: group.sort_order ?? 0, active: group.active ?? true, store_id: storeId }])
         .select().single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pizza-addon-groups'] }); queryClient.invalidateQueries({ queryKey: ['pizza-addon-groups'] }); toast.success('Grupo criado!'); },
     onError: () => toast.error('Erro ao criar grupo'),
   });
 }
 
 export function useUpdatePizzaAddonGroup() {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async ({ id, ...updates }: Partial<PizzaAddonGroup> & { id: string }) => {
       const { data, error } = await supabase.from('pizza_addon_groups').update(updates).eq('id', id).select().single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pizza-addon-groups'] }); queryClient.invalidateQueries({ queryKey: ['pizza-addon-groups'] }); toast.success('Grupo atualizado!'); },
     onError: () => toast.error('Erro ao atualizar grupo'),
   });
 }
 
 export function useDeletePizzaAddonGroup() {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async (id: string) => { const { error } = await supabase.from('pizza_addon_groups').delete().eq('id', id); if (error) throw error; },
     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pizza-addon-groups'] }); queryClient.invalidateQueries({ queryKey: ['pizza-addon-groups'] }); toast.success('Grupo removido!'); },
     onError: () => toast.error('Erro ao remover grupo'),
   });
 }
 
 // ============ Addons ============
 export function useAdminPizzaAddons() {
   const storeId = useStoreId();
   return useQuery({
     queryKey: ['admin-pizza-addons', storeId],
     queryFn: async () => {
       const { data, error } = await supabase.from('pizza_addons').select('*').eq('store_id', storeId).order('sort_order');
       if (error) throw error;
       return data as PizzaAddon[];
     },
   });
 }
 
 export function useCreatePizzaAddon() {
   const queryClient = useQueryClient();
   const storeId = useStoreId();
   return useMutation({
    mutationFn: async (addon: { group_id: string; name: string; price?: number; sort_order?: number; active?: boolean }) => {
       const { data, error } = await supabase.from('pizza_addons')
        .insert([{ group_id: addon.group_id, name: addon.name, price: addon.price ?? 0, sort_order: addon.sort_order ?? 0, active: addon.active ?? true, store_id: storeId }])
         .select().single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pizza-addons'] }); queryClient.invalidateQueries({ queryKey: ['pizza-addons'] }); toast.success('Adicional criado!'); },
     onError: () => toast.error('Erro ao criar adicional'),
   });
 }
 
 export function useUpdatePizzaAddon() {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async ({ id, ...updates }: Partial<PizzaAddon> & { id: string }) => {
       const { data, error } = await supabase.from('pizza_addons').update(updates).eq('id', id).select().single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pizza-addons'] }); queryClient.invalidateQueries({ queryKey: ['pizza-addons'] }); toast.success('Adicional atualizado!'); },
     onError: () => toast.error('Erro ao atualizar adicional'),
   });
 }
 
 export function useDeletePizzaAddon() {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async (id: string) => { const { error } = await supabase.from('pizza_addons').delete().eq('id', id); if (error) throw error; },
     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pizza-addons'] }); queryClient.invalidateQueries({ queryKey: ['pizza-addons'] }); toast.success('Adicional removido!'); },
     onError: () => toast.error('Erro ao remover adicional'),
   });
 }
 
 // ============ Settings ============
 export function useAdminStorePizzaSettings() {
   const storeId = useStoreId();
   return useQuery({
     queryKey: ['admin-store-pizza-settings', storeId],
     queryFn: async () => {
       const { data, error } = await supabase.from('store_pizza_settings').select('*').eq('store_id', storeId).maybeSingle();
       if (error) throw error;
       return data as StorePizzaSettings | null;
     },
   });
 }
 
 export function useUpsertStorePizzaSettings() {
   const queryClient = useQueryClient();
   const storeId = useStoreId();
   return useMutation({
     mutationFn: async (settings: Partial<StorePizzaSettings>) => {
       const { data, error } = await supabase.from('store_pizza_settings')
         .upsert({ ...settings, store_id: storeId }, { onConflict: 'store_id' }).select().single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-store-pizza-settings'] }); queryClient.invalidateQueries({ queryKey: ['store-pizza-settings'] }); toast.success('Configurações salvas!'); },
     onError: () => toast.error('Erro ao salvar configurações'),
   });
 }
 
// ============ Demo Data ============
export function useCreatePizzaBuilderDemoData() {
  const queryClient = useQueryClient();
  const storeId = useStoreId();
  const { store } = useTenant();

  return useMutation({
    mutationFn: async () => {
      // Limpa dados existentes antes de criar os demos
      await supabase.from('pizza_addons').delete().eq('store_id', storeId);
      await supabase.from('pizza_addon_groups').delete().eq('store_id', storeId);
      await supabase.from('pizza_flavor_prices').delete().eq('store_id', storeId);
      await supabase.from('pizza_flavors').delete().eq('store_id', storeId);
      await supabase.from('pizza_sizes').delete().eq('store_id', storeId);

      const demo = getDemoDataForSegment(store?.store_type);

      // Sizes
      const { data: sizes, error: sizesError } = await supabase
        .from('pizza_sizes')
        .insert(demo.sizes.map(s => ({ ...s, store_id: storeId })))
        .select();
      if (sizesError) throw sizesError;

      // Flavors
      const { data: flavors, error: flavorsError } = await supabase
        .from('pizza_flavors')
        .insert(demo.flavors.map(f => ({ ...f, store_id: storeId })))
        .select();
      if (flavorsError) throw flavorsError;

      // Prices matrix
      if (demo.pricingMode === 'matrix') {
        const pricesData: { size_id: string; flavor_id: string; price: number; store_id: string }[] = [];
        sizes?.forEach((size) => {
          flavors?.forEach((flavor, fi) => {
            const multiplier = [1, 1.1, 0.9, 0.95, 1.05, 1.15, 1.2, 1, 1.1, 1.05][fi] || 1;
            pricesData.push({ size_id: size.id, flavor_id: flavor.id, price: Math.round(size.base_price * multiplier * 100) / 100, store_id: storeId });
          });
        });
        const { error: pricesError } = await supabase.from('pizza_flavor_prices').insert(pricesData);
        if (pricesError) throw pricesError;
      }

      // Addon groups
      const { data: groups, error: groupsError } = await supabase
        .from('pizza_addon_groups')
        .insert(demo.addonGroups.map(g => ({ ...g, store_id: storeId })))
        .select();
      if (groupsError) throw groupsError;

      // Map group keys to IDs — first group is 'single', second is 'multi'
      const firstGroup = groups?.[0];
      const secondGroup = groups?.[1];
      const addonsData = demo.addons
        .map(a => ({
          group_id: a.groupKey === 'single' ? firstGroup?.id : secondGroup?.id,
          name: a.name,
          price: a.price,
          sort_order: a.sort_order,
        }))
        .filter(a => a.group_id);
      const { error: addonsError } = await supabase.from('pizza_addons').insert(addonsData.map(a => ({ ...a, store_id: storeId })));
      if (addonsError) throw addonsError;

      // Settings
      const { error: settingsError } = await supabase.from('store_pizza_settings').upsert({
        store_id: storeId,
        pricing_rule: 'average',
        pricing_mode: demo.pricingMode,
        require_at_least_one_flavor: true,
        allow_less_than_max: true,
        max_observation_chars: 140,
      });
      if (settingsError) throw settingsError;

      return { sizes, flavors, groups };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pizza-sizes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pizza-flavors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pizza-addon-groups'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pizza-addons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pizza-flavor-prices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-store-pizza-settings'] });
      toast.success('Dados demo criados com sucesso!');
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao criar dados demo'),
  });
}
