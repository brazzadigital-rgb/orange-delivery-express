import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';

// Types
export interface PizzaSize {
  id: string;
  store_id: string;
  name: string;
  slices: number;
  max_flavors: number;
  base_price: number;
  is_promo: boolean;
  promo_label: string | null;
  sort_order: number;
  active: boolean;
  unit_label: string | null;
  description: string | null;
}

export interface PizzaFlavor {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  unit_price: number;
}

export interface PizzaFlavorPrice {
  id: string;
  size_id: string;
  flavor_id: string;
  price: number;
}

export interface PizzaAddonGroup {
  id: string;
  store_id: string;
  name: string;
  max_select: number;
  min_select: number;
  group_type: 'single' | 'multi';
  sort_order: number;
  active: boolean;
}

export interface PizzaAddon {
  id: string;
  store_id: string;
  group_id: string;
  name: string;
  price: number;
  active: boolean;
  sort_order: number;
}

export type PricingMode = 'matrix' | 'fixed_by_size' | 'per_item';

export interface StorePizzaSettings {
  store_id: string;
  pricing_rule: 'average' | 'highest';
  pricing_mode: PricingMode;
  require_at_least_one_flavor: boolean;
  allow_less_than_max: boolean;
  max_observation_chars: number;
}

export interface SelectedFlavor {
  flavor_id: string;
  name: string;
  price: number;
  observation: string;
}

export interface SelectedAddon {
  addon_id: string;
  name: string;
  price: number;
  qty: number;
}

export interface SelectedCrust {
  addon_id: string;
  name: string;
  price: number;
}

interface PizzaBuilderState {
  selectedSize: PizzaSize | null;
  selectedFlavors: SelectedFlavor[];
  selectedAddons: SelectedAddon[];
  selectedCrust: SelectedCrust | null;
  generalObservation: string;
  quantity: number;
  setSelectedSize: (size: PizzaSize | null) => void;
  addFlavor: (flavor: SelectedFlavor) => void;
  removeFlavor: (flavorId: string) => void;
  updateFlavorObservation: (flavorId: string, observation: string) => void;
  setAddonQty: (addonId: string, name: string, price: number, qty: number) => void;
  setSelectedCrust: (crust: SelectedCrust | null) => void;
  setGeneralObservation: (observation: string) => void;
  setQuantity: (quantity: number) => void;
  resetBuilder: () => void;
  getFlavorCount: () => number;
  canAddMoreFlavors: () => boolean;
  calculateBasePrice: (pricingRule: 'average' | 'highest', pricingMode?: PricingMode) => number;
  calculateAddonsTotal: () => number;
  calculateTotal: (pricingRule: 'average' | 'highest', pricingMode?: PricingMode) => number;
}

const initialState = {
  selectedSize: null,
  selectedFlavors: [],
  selectedAddons: [],
  selectedCrust: null,
  generalObservation: '',
  quantity: 1,
};

export const usePizzaBuilderStore = create<PizzaBuilderState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setSelectedSize: (size) => set({ selectedSize: size, selectedFlavors: [], selectedAddons: [], selectedCrust: null }),
      addFlavor: (flavor) => {
        const state = get();
        if (!state.selectedSize) return;
        if (state.selectedFlavors.length >= state.selectedSize.max_flavors) return;
        if (state.selectedFlavors.some(f => f.flavor_id === flavor.flavor_id)) return;
        set({ selectedFlavors: [...state.selectedFlavors, flavor] });
      },
      removeFlavor: (flavorId) => set(state => ({ selectedFlavors: state.selectedFlavors.filter(f => f.flavor_id !== flavorId) })),
      updateFlavorObservation: (flavorId, observation) => set(state => ({ selectedFlavors: state.selectedFlavors.map(f => f.flavor_id === flavorId ? { ...f, observation } : f) })),
      setAddonQty: (addonId, name, price, qty) => {
        set(state => {
          const clampedQty = Math.min(1, qty);
          const existing = state.selectedAddons.find(a => a.addon_id === addonId);
          if (clampedQty <= 0) return { selectedAddons: state.selectedAddons.filter(a => a.addon_id !== addonId) };
          if (existing) return { selectedAddons: state.selectedAddons.map(a => a.addon_id === addonId ? { ...a, qty: clampedQty } : a) };
          return { selectedAddons: [...state.selectedAddons, { addon_id: addonId, name, price, qty: clampedQty }] };
        });
      },
      setSelectedCrust: (crust) => set({ selectedCrust: crust }),
      setGeneralObservation: (observation) => set({ generalObservation: observation }),
      setQuantity: (quantity) => set({ quantity: Math.max(1, quantity) }),
      resetBuilder: () => set(initialState),
      getFlavorCount: () => get().selectedFlavors.length,
      canAddMoreFlavors: () => { const state = get(); if (!state.selectedSize) return false; return state.selectedFlavors.length < state.selectedSize.max_flavors; },
      calculateBasePrice: (pricingRule, pricingMode) => {
        const { selectedFlavors, selectedSize } = get();
        const mode = pricingMode || 'matrix';
        
        if (mode === 'fixed_by_size') {
          return selectedSize?.base_price || 0;
        }
        
        if (mode === 'per_item') {
          // Sum all flavor unit prices + size base
          const flavorsTotal = selectedFlavors.reduce((sum, f) => sum + f.price, 0);
          return (selectedSize?.base_price || 0) + flavorsTotal;
        }
        
        // Matrix mode: average or highest
        if (selectedFlavors.length === 0) return 0;
        if (pricingRule === 'highest') return Math.max(...selectedFlavors.map(f => f.price));
        const total = selectedFlavors.reduce((sum, f) => sum + f.price, 0);
        return total / selectedFlavors.length;
      },
      calculateAddonsTotal: () => {
        const { selectedAddons, selectedCrust } = get();
        const addonsSum = selectedAddons.reduce((sum, a) => sum + (a.price * a.qty), 0);
        return addonsSum + (selectedCrust?.price || 0);
      },
      calculateTotal: (pricingRule, pricingMode) => {
        const state = get();
        return (state.calculateBasePrice(pricingRule, pricingMode) + state.calculateAddonsTotal()) * state.quantity;
      },
    }),
    { name: 'pizza-builder-v2' }
  )
);

// Queries
export function usePizzaSizes() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['pizza-sizes', storeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('pizza_sizes').select('*').eq('store_id', storeId).eq('active', true).order('sort_order');
      if (error) throw error;
      return data as PizzaSize[];
    },
  });
}

export function usePizzaFlavors() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['pizza-flavors', storeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('pizza_flavors').select('*').eq('store_id', storeId).eq('active', true).order('sort_order');
      if (error) throw error;
      return data as PizzaFlavor[];
    },
  });
}

export function usePizzaFlavorPrices(sizeId: string | undefined) {
  return useQuery({
    queryKey: ['pizza-flavor-prices', sizeId],
    queryFn: async () => {
      if (!sizeId) return [];
      const { data, error } = await supabase.from('pizza_flavor_prices').select('*').eq('size_id', sizeId);
      if (error) throw error;
      return data as PizzaFlavorPrice[];
    },
    enabled: !!sizeId,
  });
}

export function usePizzaAddonGroups() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['pizza-addon-groups', storeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('pizza_addon_groups').select('*').eq('store_id', storeId).eq('active', true).order('sort_order');
      if (error) throw error;
      return data as PizzaAddonGroup[];
    },
  });
}

export function usePizzaAddons() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['pizza-addons', storeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('pizza_addons').select('*').eq('store_id', storeId).eq('active', true).order('sort_order');
      if (error) throw error;
      return data as PizzaAddon[];
    },
  });
}

export function useStorePizzaSettings() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['store-pizza-settings', storeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('store_pizza_settings').select('*').eq('store_id', storeId).single();
      if (error) {
        if (error.code === 'PGRST116') {
          return { store_id: storeId, pricing_rule: 'average' as const, pricing_mode: 'matrix' as const, require_at_least_one_flavor: true, allow_less_than_max: true, max_observation_chars: 140 };
        }
        throw error;
      }
      return data as StorePizzaSettings;
    },
  });
}
