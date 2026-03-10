import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface DeliveryZone {
  id: string;
  store_id: string;
  name: string;
  mode: 'radius' | 'polygon';
  min_distance: number | null;
  max_distance: number;
  center_lat: number | null;
  center_lng: number | null;
  radius_km: number | null;
  polygon_geojson: any | null;
  fee: number;
  per_km_fee: number;
  min_fee: number | null;
  max_fee: number | null;
  estimated_minutes: number | null;
  min_order_value: number | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export function calculateDistance(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isPointInPolygon(
  lat: number, lng: number, polygon: { lat: number; lng: number }[]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function findDeliveryZone(
  lat: number, lng: number, zones: DeliveryZone[], storeLat: number, storeLng: number
): { zone: DeliveryZone; distance: number; fee: number; eta: number } | null {
  const distance = calculateDistance(storeLat, storeLng, lat, lng);
  const sortedZones = [...zones]
    .filter(z => z.active)
    .sort((a, b) => {
      if (a.mode === 'polygon' && b.mode !== 'polygon') return -1;
      if (a.mode !== 'polygon' && b.mode === 'polygon') return 1;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
  
  for (const zone of sortedZones) {
    let isInZone = false;
    if (zone.mode === 'polygon' && zone.polygon_geojson) {
      const coords = zone.polygon_geojson.coordinates?.[0] || [];
      const polygon = coords.map((c: number[]) => ({ lat: c[1], lng: c[0] }));
      isInZone = isPointInPolygon(lat, lng, polygon);
    } else if (zone.mode === 'radius' || !zone.mode) {
      const zoneDistance = zone.radius_km || zone.max_distance;
      const minDistance = zone.min_distance || 0;
      isInZone = distance >= minDistance && distance <= zoneDistance;
    }
    
    if (isInZone) {
      let fee = zone.fee || 0;
      if (zone.per_km_fee && zone.per_km_fee > 0) {
        fee = zone.fee + (distance * zone.per_km_fee);
      }
      if (zone.min_fee && fee < zone.min_fee) fee = zone.min_fee;
      if (zone.max_fee && fee > zone.max_fee) fee = zone.max_fee;
      const eta = zone.estimated_minutes || Math.ceil(20 + (distance * 3));
      return { zone, distance, fee: Math.round(fee * 100) / 100, eta };
    }
  }
  return null;
}

export function useDeliveryZones() {
  const storeId = useStoreId();
  return useQuery({
    queryKey: ['delivery-zones', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as DeliveryZone[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDeliveryZone() {
  const storeId = useStoreId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (zone: Omit<Partial<DeliveryZone>, 'id' | 'store_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('delivery_zones')
        .insert({
          ...zone,
          store_id: storeId,
          name: zone.name || 'Nova Zona',
          max_distance: zone.max_distance || 10,
          fee: zone.fee || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      toast.success('Zona de entrega criada!');
    },
    onError: (error) => {
      console.error('Error creating delivery zone:', error);
      toast.error('Erro ao criar zona de entrega');
    },
  });
}

export function useUpdateDeliveryZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DeliveryZone> & { id: string }) => {
      const { data, error } = await supabase
        .from('delivery_zones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      toast.success('Zona de entrega atualizada!');
    },
    onError: (error) => {
      console.error('Error updating delivery zone:', error);
      toast.error('Erro ao atualizar zona de entrega');
    },
  });
}

export function useDeleteDeliveryZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('delivery_zones')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      toast.success('Zona de entrega removida!');
    },
    onError: (error) => {
      console.error('Error deleting delivery zone:', error);
      toast.error('Erro ao remover zona de entrega');
    },
  });
}
