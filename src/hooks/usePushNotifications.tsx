 import { useState, useCallback, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 
 interface PushDiagnostics {
   permission: NotificationPermission | 'unsupported';
   serviceWorkerRegistered: boolean;
   serviceWorkerActive: boolean;
   serviceWorkerScope: string | null;
   subscriptionExists: boolean;
   subscriptionEndpoint: string | null;
   isSubscribing: boolean;
   lastError: string | null;
  vapidKeyAvailable: boolean;
 }
 
// Cache for VAPID public key
let cachedVapidKey: string | null = null;

async function getVapidPublicKey(): Promise<string | null> {
  if (cachedVapidKey) return cachedVapidKey;
  
  try {
    const response = await supabase.functions.invoke('get-vapid-key');
    if (response.data?.publicKey) {
      cachedVapidKey = response.data.publicKey;
      return cachedVapidKey;
    }
  } catch (error) {
    console.error('[usePushNotifications] Error fetching VAPID key:', error);
  }
  return null;
}
 
 // Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
   const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
   const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
   const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length) as Uint8Array<ArrayBuffer>;
   for (let i = 0; i < rawData.length; ++i) {
     outputArray[i] = rawData.charCodeAt(i);
   }
   return outputArray;
 }
 
 export function usePushNotifications() {
   const [diagnostics, setDiagnostics] = useState<PushDiagnostics>({
     permission: 'unsupported',
     serviceWorkerRegistered: false,
     serviceWorkerActive: false,
     serviceWorkerScope: null,
     subscriptionExists: false,
     subscriptionEndpoint: null,
     isSubscribing: false,
     lastError: null,
    vapidKeyAvailable: false,
   });
 
   const [isLoading, setIsLoading] = useState(true);
 
   // Check current state
   const checkDiagnostics = useCallback(async () => {
     setIsLoading(true);
     
     try {
       const newDiagnostics: PushDiagnostics = {
         permission: 'unsupported',
         serviceWorkerRegistered: false,
         serviceWorkerActive: false,
         serviceWorkerScope: null,
         subscriptionExists: false,
         subscriptionEndpoint: null,
         isSubscribing: false,
         lastError: null,
        vapidKeyAvailable: false,
       };
 
       // Check notification support
       if ('Notification' in window) {
         newDiagnostics.permission = Notification.permission;
       }
      
      // Check VAPID key
      const vapidKey = await getVapidPublicKey();
      newDiagnostics.vapidKeyAvailable = !!vapidKey;
 
       // Check service worker
       if ('serviceWorker' in navigator) {
         const registration = await navigator.serviceWorker.getRegistration();
         
         if (registration) {
           newDiagnostics.serviceWorkerRegistered = true;
           newDiagnostics.serviceWorkerScope = registration.scope;
           newDiagnostics.serviceWorkerActive = !!registration.active;
 
           // Check subscription
           const subscription = await (registration as any).pushManager.getSubscription();
           if (subscription) {
             newDiagnostics.subscriptionExists = true;
             newDiagnostics.subscriptionEndpoint = subscription.endpoint.slice(-32) + '...';
           }
         }
       }
 
       setDiagnostics(newDiagnostics);
     } catch (error: any) {
       console.error('[usePushNotifications] Error checking diagnostics:', error);
       setDiagnostics(prev => ({ ...prev, lastError: error.message }));
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => {
     checkDiagnostics();
   }, [checkDiagnostics]);
 
   // Request notification permission
   const requestPermission = useCallback(async (): Promise<boolean> => {
     if (!('Notification' in window)) {
       toast.error('Este navegador não suporta notificações');
       return false;
     }
 
     try {
       const permission = await Notification.requestPermission();
       setDiagnostics(prev => ({ ...prev, permission }));
       
       if (permission === 'granted') {
         toast.success('Permissão concedida!');
         return true;
       } else if (permission === 'denied') {
         toast.error('Permissão negada. Ative nas configurações do navegador.');
         return false;
       }
       return false;
     } catch (error: any) {
       console.error('[usePushNotifications] Error requesting permission:', error);
       setDiagnostics(prev => ({ ...prev, lastError: error.message }));
       return false;
     }
   }, []);
 
   // Subscribe to push notifications
   const subscribe = useCallback(async (vapidKey?: string): Promise<boolean> => {
    const publicKey = vapidKey || await getVapidPublicKey();
     
     if (!publicKey) {
       toast.error('VAPID key não configurada');
       setDiagnostics(prev => ({ ...prev, lastError: 'VAPID key não configurada' }));
       return false;
     }
 
     setDiagnostics(prev => ({ ...prev, isSubscribing: true, lastError: null }));
 
     try {
       // Get current user
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) {
         throw new Error('Usuário não autenticado');
       }
 
       // Ensure permission
       if (Notification.permission !== 'granted') {
         const granted = await requestPermission();
         if (!granted) return false;
       }
 
       // Get service worker registration
       const registration = await navigator.serviceWorker.ready;
 
       // Subscribe to push
       const subscription = await (registration as any).pushManager.subscribe({
         userVisibleOnly: true,
         applicationServerKey: urlBase64ToUint8Array(publicKey),
       });
 
       const subscriptionData = subscription.toJSON();
 
       // Save to database
       const { error } = await supabase
         .from('push_subscriptions')
         .upsert({
           user_id: user.id,
           endpoint: subscriptionData.endpoint!,
           keys: subscriptionData.keys,
           user_agent: navigator.userAgent,
           is_active: true,
         }, {
           onConflict: 'endpoint',
         });
 
       if (error) throw error;
 
       toast.success('Push notifications ativadas!');
       await checkDiagnostics();
       return true;
     } catch (error: any) {
       console.error('[usePushNotifications] Error subscribing:', error);
       setDiagnostics(prev => ({ 
         ...prev, 
         isSubscribing: false, 
         lastError: error.message 
       }));
       toast.error(`Erro ao ativar: ${error.message}`);
       return false;
     } finally {
       setDiagnostics(prev => ({ ...prev, isSubscribing: false }));
     }
   }, [requestPermission, checkDiagnostics]);
 
   // Unsubscribe from push notifications
   const unsubscribe = useCallback(async (): Promise<boolean> => {
     try {
       const registration = await navigator.serviceWorker.getRegistration();
       if (!registration) return true;
 
       const subscription = await (registration as any).pushManager.getSubscription();
       if (!subscription) return true;
 
       // Unsubscribe from browser
       await subscription.unsubscribe();
 
       // Remove from database
       const { error } = await supabase
         .from('push_subscriptions')
         .delete()
         .eq('endpoint', subscription.endpoint);
 
       if (error) throw error;
 
       toast.success('Push notifications desativadas');
       await checkDiagnostics();
       return true;
     } catch (error: any) {
       console.error('[usePushNotifications] Error unsubscribing:', error);
       setDiagnostics(prev => ({ ...prev, lastError: error.message }));
       toast.error(`Erro ao desativar: ${error.message}`);
       return false;
     }
   }, [checkDiagnostics]);
 
   // Send test push notification
   const sendTestPush = useCallback(async (): Promise<boolean> => {
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) {
         toast.error('Usuário não autenticado');
         return false;
       }
 
       const response = await supabase.functions.invoke('send-push', {
         body: {
           user_id: user.id,
           title: '🔔 Teste de Push',
           body: 'Se você está vendo isso, as notificações estão funcionando!',
           url: '/app/debug/push',
           tag: 'test',
         },
       });
 
       if (response.error) {
         throw new Error(response.error.message);
       }
 
       const result = response.data;
       
       if (result.sent > 0) {
         toast.success(`Push enviado! (${result.sent} dispositivo(s))`);
         return true;
        }

        if (result.failed > 0) {
          toast.error(`Falha ao enviar push (${result.failed}).`);
          return false;
        }

        toast.warning('Nenhuma subscription ativa encontrada');
        return false;
     } catch (error: any) {
       console.error('[usePushNotifications] Error sending test push:', error);
       toast.error(`Erro ao enviar: ${error.message}`);
       return false;
     }
   }, []);
 
   return {
     diagnostics,
     isLoading,
     requestPermission,
     subscribe,
     unsubscribe,
     sendTestPush,
     refresh: checkDiagnostics,
   };
 }
 
 // Helper to send push when order status changes
 export async function sendOrderStatusPush(
   userId: string,
   orderNumber: number,
   status: string,
   orderId: string
 ): Promise<void> {
   const statusMessages: Record<string, { title: string; body: string }> = {
     accepted: {
       title: 'Pedido aceito ✅',
       body: `Seu pedido #${orderNumber} foi aceito!`,
     },
     preparing: {
       title: 'Em preparo 🍕',
       body: `Seu pedido #${orderNumber} está sendo preparado!`,
     },
     ready: {
       title: 'Pedido pronto! 🔥',
       body: `Seu pedido #${orderNumber} está pronto!`,
     },
     out_for_delivery: {
       title: 'Saiu para entrega 🛵',
       body: `Seu pedido #${orderNumber} saiu para entrega! Acompanhe no mapa.`,
     },
     delivered: {
       title: 'Entregue! 😋',
       body: `Seu pedido #${orderNumber} foi entregue. Bom apetite!`,
     },
   };
 
   const message = statusMessages[status];
   if (!message) return;
 
   try {
     await supabase.functions.invoke('send-push', {
       body: {
         user_id: userId,
         title: message.title,
         body: message.body,
         url: status === 'out_for_delivery' 
           ? `/app/orders/${orderId}/track` 
           : `/app/orders/${orderId}`,
         tag: `order-${orderId}`,
         data: { order_id: orderId, status },
       },
     });
   } catch (error) {
     console.error('[sendOrderStatusPush] Error:', error);
   }
 }