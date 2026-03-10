import { useTenant } from '@/contexts/TenantContext';
import { getStoreTypeConfig, BuilderLabels } from '@/lib/store-type-config';

/**
 * Returns the builder labels for the current store type.
 * Falls back to pizzaria labels if store type has no builder.
 */
export function useBuilderLabels(): BuilderLabels {
  const { store } = useTenant();
  const config = getStoreTypeConfig(store?.store_type);
  // Fallback to pizzaria builder labels if this type has no builder
  const fallback = getStoreTypeConfig('pizzaria').builder!;
  return config.builder || fallback;
}
