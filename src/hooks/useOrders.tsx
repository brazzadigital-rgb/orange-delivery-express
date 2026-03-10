import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { useCart, CartItem } from './useCart';

export interface Order {
  id: string;
  order_number: number;
  store_id: string;
  user_id: string;
  status: string;
  delivery_type: string;
  address_id: string | null;
  address_snapshot: any;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  driver_id: string | null;
  coupon_id: string | null;
  estimated_minutes: number | null;
  cancel_reason?: string | null;
  reject_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name_snapshot: string;
  quantity: number;
  base_price: number;
  options_snapshot: any;
  item_total: number;
}

export interface OrderEvent {
  id: string;
  order_id: string;
  status: string;
  message: string | null;
  created_at: string;
  created_by: string | null;
}

export function useOrders() {
  const { user } = useAuth();
  const storeId = useStoreId();

  return useQuery({
    queryKey: ['orders', user?.id, storeId],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user,
  });
}

export interface OrderWithProfile extends Order {
  profiles?: {
    name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

export function useOrder(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!user || !id) return null;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (
            name,
            phone,
            email
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as OrderWithProfile;
    },
    enabled: !!user && !!id,
  });
}

export function useOrderItems(orderId: string) {
  return useQuery({
    queryKey: ['order-items', orderId],
    queryFn: async () => {
      if (!orderId) return [];

      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!orderId,
  });
}

export function useOrderEvents(orderId: string) {
  return useQuery({
    queryKey: ['order-events', orderId],
    queryFn: async () => {
      if (!orderId) return [];

      const { data, error } = await supabase
        .from('order_events')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as OrderEvent[];
    },
    enabled: !!orderId,
  });
}

interface CreateOrderParams {
  addressId: string;
  addressSnapshot: any;
  deliveryFee: number;
  paymentMethod: 'pix' | 'card' | 'cash';
  notes?: string;
  couponId?: string;
  discount?: number;
}

export function useCreateOrder() {
  const { user } = useAuth();
  const storeId = useStoreId();
  const queryClient = useQueryClient();
  const { items, getTotal, getItemTotal, clearCart } = useCart();

  return useMutation({
    mutationFn: async (params: CreateOrderParams) => {
      if (!user) throw new Error('Usuário não autenticado');
      if (items.length === 0) throw new Error('Carrinho vazio');

      const subtotal = getTotal();
      const total = subtotal + params.deliveryFee - (params.discount || 0);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          user_id: user.id,
          status: 'created',
          delivery_type: 'delivery',
          address_id: params.addressId,
          address_snapshot: params.addressSnapshot,
          subtotal,
          delivery_fee: params.deliveryFee,
          discount: params.discount || 0,
          total,
          payment_method: params.paymentMethod,
          payment_status: 'pending',
          notes: params.notes,
          coupon_id: params.couponId,
          estimated_minutes: 40,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        name_snapshot: item.name,
        quantity: item.quantity,
        base_price: item.basePrice,
        options_snapshot: JSON.parse(JSON.stringify(item.options)),
        item_total: getItemTotal(item),
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      const { error: eventError } = await supabase
        .from('order_events')
        .insert({
          order_id: order.id,
          status: 'created',
          message: 'Pedido criado',
          created_by: user.id,
        });

      if (eventError) console.error('Error creating event:', eventError);

      return order as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      clearCart();
      toast.success('Pedido realizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar pedido');
    },
  });
}
