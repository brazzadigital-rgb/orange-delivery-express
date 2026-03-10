 // Push notification handlers for Service Worker
 // This file is imported by the main service worker
 
 // Handle push events
 self.addEventListener('push', function(event) {
   console.log('[SW Push] Push event received');
   
   let payload = {
     title: 'Nova notificação',
     body: 'Você tem uma nova atualização',
     icon: '/notification-badge.svg',
      badge: '/notification-badge.svg',
     data: { url: '/app' }
   };
   
   try {
     if (event.data) {
       const data = event.data.json();
       payload = {
         title: data.title || payload.title,
         body: data.body || payload.body,
         icon: data.icon || payload.icon,
          badge: data.badge || payload.badge,
        image: data.image || null,
         tag: data.tag || 'default',
         data: data.data || payload.data,
         requireInteraction: true,
         vibrate: [200, 100, 200]
       };
     }
   } catch (e) {
     console.error('[SW Push] Error parsing push data:', e);
   }
   
   console.log('[SW Push] Showing notification:', payload.title);
   
   event.waitUntil(
     self.registration.showNotification(payload.title, {
       body: payload.body,
       icon: payload.icon,
       badge: payload.badge,
      image: payload.image,
       tag: payload.tag,
       data: payload.data,
       requireInteraction: payload.requireInteraction,
       vibrate: payload.vibrate
     })
   );
 });
 
 // Handle notification click
 self.addEventListener('notificationclick', function(event) {
   console.log('[SW Push] Notification clicked');
   
   event.notification.close();
   
   const urlToOpen = event.notification.data?.url || '/app';
   
   event.waitUntil(
     clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
       // Try to focus an existing window
       for (const client of clientList) {
         if (client.url.includes(self.location.origin) && 'focus' in client) {
           client.focus();
           client.navigate(urlToOpen);
           return;
         }
       }
       // Open new window if none exists
       if (clients.openWindow) {
         return clients.openWindow(urlToOpen);
       }
     })
   );
 });
 
 // Handle notification close
 self.addEventListener('notificationclose', function(event) {
   console.log('[SW Push] Notification closed');
 });