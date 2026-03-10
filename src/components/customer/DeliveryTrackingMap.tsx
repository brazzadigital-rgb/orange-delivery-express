 import { useEffect, useState } from 'react';
 import { MapPin, Navigation, Clock, MessageCircle } from 'lucide-react';
 import { GoogleMap } from '@/components/maps/GoogleMap';
 import { Button } from '@/components/ui/button';
 import { supabase } from '@/integrations/supabase/client';
 import { cn } from '@/lib/utils';
 
 interface DriverLocation {
   lat: number;
   lng: number;
   heading: number | null;
   recorded_at: string;
 }
 
 interface AddressSnapshot {
   lat?: number;
   lng?: number;
   label?: string;
   street?: string;
   number?: string;
   complement?: string;
 }
 
 interface DeliveryTrackingMapProps {
   orderId: string;
   estimatedMinutes?: number | null;
   addressSnapshot?: AddressSnapshot | null;
   driverPhone?: string | null;
   className?: string;
 }
 
 export function DeliveryTrackingMap({ 
   orderId, 
   estimatedMinutes,
   addressSnapshot,
   driverPhone,
   className 
 }: DeliveryTrackingMapProps) {
   const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
   const [isMapLoading, setIsMapLoading] = useState(true);
 
   // Subscribe to driver location updates
   useEffect(() => {
     if (!orderId) return;
 
     const channel = supabase
       .channel(`driver-location-inline-${orderId}`)
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'driver_locations',
           filter: `order_id=eq.${orderId}`,
         },
         (payload) => {
           if (payload.new && typeof payload.new === 'object' && 'lat' in payload.new) {
             setDriverLocation(payload.new as DriverLocation);
           }
         }
       )
       .subscribe();
 
     // Fetch initial location
     const fetchLocation = async () => {
       const { data } = await supabase
         .from('driver_locations')
         .select('lat, lng, heading, recorded_at')
         .eq('order_id', orderId)
         .order('recorded_at', { ascending: false })
         .limit(1)
         .single();
 
       if (data) {
         setDriverLocation(data);
       }
       setIsMapLoading(false);
     };
 
     fetchLocation();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [orderId]);
 
   const handleWhatsApp = () => {
     if (driverPhone) {
       const phone = driverPhone.replace(/\D/g, '');
       const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;
       window.open(`https://wa.me/${formattedPhone}`, '_blank');
     }
   };
 
   return (
     <div className={cn("card-premium overflow-hidden animate-fade-in", className)}>
       {/* Map Container */}
       <div className="relative h-[280px] w-full">
         <GoogleMap
           driverLocation={driverLocation ? {
             lat: driverLocation.lat,
             lng: driverLocation.lng,
             heading: driverLocation.heading,
           } : undefined}
           destinationLocation={addressSnapshot?.lat && addressSnapshot?.lng ? {
             lat: addressSnapshot.lat,
             lng: addressSnapshot.lng,
           } : undefined}
           showRoute={!!driverLocation && !!addressSnapshot?.lat}
           className="absolute inset-0"
         />
 
         {/* Loading/Waiting overlay */}
         {isMapLoading ? (
           <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
             <div className="text-center">
               <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 animate-pulse">
                 <Navigation className="w-6 h-6 text-primary" />
               </div>
               <p className="text-sm text-muted-foreground">Carregando mapa...</p>
             </div>
           </div>
         ) : !driverLocation && (
           <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
             <div className="text-center p-4">
               <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                 <Navigation className="w-7 h-7 text-primary animate-pulse" />
               </div>
               <h3 className="font-semibold mb-1">Aguardando Motoboy</h3>
               <p className="text-muted-foreground text-xs max-w-[200px] mx-auto">
                 O motoboy ainda não iniciou o compartilhamento
               </p>
             </div>
           </div>
         )}
 
         {/* Live indicator */}
         {driverLocation && (
           <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm border border-border/50 shadow-sm">
             <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
             <span className="text-xs font-medium">Ao vivo</span>
           </div>
         )}
       </div>
 
       {/* Driver Info Bar */}
       <div className="p-4 bg-card border-t border-border/50">
         <div className="flex items-center gap-3">
           <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
             <span className="text-xl">🏍️</span>
           </div>
           <div className="flex-1 min-w-0">
             <p className="font-semibold truncate">Motoboy a caminho</p>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>Chegada: ~{Math.min(estimatedMinutes || 30, 90)} min</span>
              </div>
           </div>
           {driverPhone && (
             <Button 
               variant="outline" 
               size="icon" 
               className="rounded-full flex-shrink-0"
               onClick={handleWhatsApp}
             >
               <MessageCircle className="w-5 h-5 text-success" />
             </Button>
           )}
         </div>
 
         {/* Destination Preview */}
         {addressSnapshot?.street && (
           <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-muted/50">
             <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
             <div className="text-xs min-w-0">
               <p className="font-medium truncate">{addressSnapshot.label || 'Destino'}</p>
               <p className="text-muted-foreground truncate">
                 {addressSnapshot.street}, {addressSnapshot.number}
               </p>
             </div>
           </div>
         )}
       </div>
     </div>
   );
 }