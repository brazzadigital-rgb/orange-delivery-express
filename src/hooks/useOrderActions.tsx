import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
 import { sendOrderStatusPush } from './usePushNotifications';

interface UpdateStatusParams {
  orderId: string;
  newStatus: string;
  message?: string;
  rejectReason?: string;
  cancelReason?: string;
  driverId?: string;
}

export function useUpdateOrderStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, newStatus, message, rejectReason, cancelReason, driverId }: UpdateStatusParams) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Build update object
      const updateData: Record<string, any> = {
        status: newStatus as any,
        updated_at: new Date().toISOString(),
      };

      if (rejectReason) updateData.reject_reason = rejectReason;
      if (cancelReason) updateData.cancel_reason = cancelReason;
      if (driverId) updateData.driver_id = driverId;

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Create order event
      const { error: eventError } = await supabase
        .from('order_events')
        .insert({
          order_id: orderId,
          status: newStatus as any,
          message: message || getStatusMessage(newStatus, rejectReason, cancelReason),
          created_by: user.id,
        });

      if (eventError) console.error('Error creating event:', eventError);

      // Get order info for notification
      const { data: order } = await supabase
        .from('orders')
        .select('user_id, order_number')
        .eq('id', orderId)
        .single();

      if (order && order.user_id) {
        // Create notification for customer (skip for anonymous table orders)
        const notificationData = getNotificationData(newStatus, order.order_number, rejectReason, cancelReason);
        if (notificationData) {
          await supabase.from('notifications').insert({
            user_id: order.user_id,
            title: notificationData.title,
            body: notificationData.body,
            type: 'order',
            data: { order_id: orderId, status: newStatus },
          });
           
           // Send push notification (async, don't block)
           sendOrderStatusPush(order.user_id, order.order_number, newStatus, orderId)
             .catch(err => console.error('[Push] Failed to send:', err));
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['order-events'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar pedido');
    },
  });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, driverId }: { orderId: string; driverId: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ driver_id: driverId })
        .eq('id', orderId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      toast.success('Motoboy atribuído!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atribuir motoboy');
    },
  });
}

function getStatusMessage(status: string, rejectReason?: string, cancelReason?: string): string {
  const messages: Record<string, string> = {
    accepted: 'Pedido aceito pelo restaurante',
    rejected: `Pedido recusado: ${rejectReason || 'Motivo não informado'}`,
    preparing: 'Pedido em preparo',
    ready: 'Pedido pronto para entrega/retirada',
    out_for_delivery: 'Pedido saiu para entrega',
    delivered: 'Pedido entregue',
    canceled: `Pedido cancelado: ${cancelReason || 'Motivo não informado'}`,
  };
  return messages[status] || `Status atualizado para ${status}`;
}

function getNotificationData(status: string, orderNumber: number, rejectReason?: string, cancelReason?: string) {
  const notifications: Record<string, { title: string; body: string }> = {
    accepted: {
      title: 'Pedido aceito! 🎉',
      body: `Seu pedido #${orderNumber} foi aceito e será preparado em breve.`,
    },
    rejected: {
      title: 'Pedido recusado 😔',
      body: `Infelizmente seu pedido #${orderNumber} foi recusado. ${rejectReason || ''}`,
    },
    preparing: {
      title: 'Preparando seu pedido 👨‍🍳',
      body: `Seu pedido #${orderNumber} está sendo preparado com carinho!`,
    },
    ready: {
      title: 'Pedido pronto! 🍕',
      body: `Seu pedido #${orderNumber} está pronto!`,
    },
    out_for_delivery: {
      title: 'Saiu para entrega! 🛵',
      body: `Seu pedido #${orderNumber} está a caminho. Acompanhe no mapa!`,
    },
    delivered: {
      title: 'Entregue! ✅',
      body: `Seu pedido #${orderNumber} foi entregue. Bom apetite!`,
    },
    canceled: {
      title: 'Pedido cancelado',
      body: `Seu pedido #${orderNumber} foi cancelado. ${cancelReason || ''}`,
    },
  };
  return notifications[status];
}
