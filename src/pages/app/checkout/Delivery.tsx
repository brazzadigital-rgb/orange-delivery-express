import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Store, Clock, Calendar, AlertCircle } from 'lucide-react';
import { CheckoutLayout } from '@/components/checkout/CheckoutLayout';
import { Button } from '@/components/ui/button';
import { useCheckoutStore } from '@/hooks/useCheckoutStore';
import { useCart } from '@/hooks/useCart';
import { useStoreConfig } from '@/contexts/StoreConfigContext';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StoreInfo {
  is_open: boolean;
  min_order_value: number;
  lat: number | null;
  lng: number | null;
}

export default function CheckoutDelivery() {
  const navigate = useNavigate();
  const storeId = useStoreId();
  const { items, getTotal } = useCart();
  const { settings: storeSettings } = useStoreConfig();
  const { 
    addressSnapshot, 
    deliveryType, 
    scheduleType,
    setDeliveryType, 
    setSchedule,
    setDeliveryFee 
  } = useCheckoutStore();
  
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const isSchedulingEnabled = storeSettings?.scheduled_delivery_enabled ?? false;

  const subtotal = getTotal();

  // Redirect if no address selected
  useEffect(() => {
    if (!addressSnapshot && deliveryType === 'delivery') {
      navigate('/app/checkout/address');
    }
  }, [addressSnapshot, deliveryType, navigate]);

  // Fetch store info - use store_settings for coordinates (where admin saves them)
  useEffect(() => {
    async function fetchStore() {
      // Get basic store info
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('is_open, min_order_value')
        .eq('id', storeId)
        .single();

      // Get coordinates from store_settings (where admin actually saves them)
      const { data: settingsData } = await supabase
        .from('store_settings')
        .select('store_lat, store_lng')
        .eq('store_id', storeId)
        .single();

      if (!storeError && storeData) {
        setStore({
          is_open: storeData.is_open,
          min_order_value: storeData.min_order_value,
          lat: settingsData?.store_lat ?? null,
          lng: settingsData?.store_lng ?? null,
        });
      }
      setLoading(false);
    }
    fetchStore();
  }, []);

  // Calculate delivery fee based on distance - memoized function
  const calculateDeliveryFee = () => {
    if (deliveryType === 'pickup') {
      return { fee: 0, eta: 15 };
    }

    if (!addressSnapshot?.lat || !addressSnapshot?.lng || !store?.lat || !store?.lng) {
      return { fee: 8, eta: 40 }; // Default fee
    }

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = toRad(addressSnapshot.lat - store.lat);
    const dLng = toRad(addressSnapshot.lng - store.lng);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(store.lat)) * Math.cos(toRad(addressSnapshot.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Calculate fee: R$5 base + R$1.50/km, min R$5, max R$20
    const baseFee = 5;
    const perKmFee = 1.5;
    const fee = Math.min(20, Math.max(baseFee, baseFee + distance * perKmFee));
    
    // Calculate ETA: 25 base + 3 min/km
    const eta = Math.round(25 + distance * 3);

    return { fee: Math.round(fee * 100) / 100, eta };
  };

  // Auto-calculate and persist delivery fee when dependencies change
  useEffect(() => {
    setCalculating(true);
    const { fee, eta } = calculateDeliveryFee();
    setDeliveryFee(fee, eta);
    setCalculating(false);
  }, [deliveryType, addressSnapshot, store, setDeliveryFee]);

  function toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  const handleNext = () => {
    // Validate minimum order
    if (store && subtotal < store.min_order_value) {
      toast.error(`Pedido mínimo: R$ ${store.min_order_value.toFixed(2).replace('.', ',')}`);
      return;
    }

    // Validate store is open (unless scheduled)
    if (!store?.is_open && scheduleType === 'asap') {
      toast.error('A loja está fechada. Agende seu pedido.');
      return;
    }

    // Ensure delivery fee is calculated before navigating
    const { fee, eta } = calculateDeliveryFee();
    setDeliveryFee(fee, eta);

    navigate('/app/checkout/payment');
  };

  if (items.length === 0) {
    navigate('/app/cart');
    return null;
  }

  return (
    <CheckoutLayout
      currentStep="delivery"
      title="Tipo de Entrega"
      nextLabel="Continuar"
      onNext={handleNext}
      isLoading={calculating}
      backTo="/app/checkout/address"
    >
      <div className="space-y-6">
        {/* Store Status Warning */}
        {store && !store.is_open && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Loja fechada no momento</p>
              <p className="text-sm text-amber-700 mt-1">
                Você pode agendar seu pedido para o próximo horário disponível.
              </p>
            </div>
          </div>
        )}

        {/* Delivery Type Selection */}
        <section>
          <h2 className="font-semibold mb-3">Como deseja receber?</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDeliveryType('delivery')}
              className={cn(
                'p-4 rounded-2xl border-2 text-center transition-all',
                deliveryType === 'delivery'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40'
              )}
            >
              <div className={cn(
                'w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3',
                deliveryType === 'delivery' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <Truck className="w-6 h-6" />
              </div>
              <p className="font-semibold">Entrega</p>
              <p className="text-sm text-muted-foreground">Receba em casa</p>
            </button>

            <button
              onClick={() => setDeliveryType('pickup')}
              className={cn(
                'p-4 rounded-2xl border-2 text-center transition-all',
                deliveryType === 'pickup'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40'
              )}
            >
              <div className={cn(
                'w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3',
                deliveryType === 'pickup' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <Store className="w-6 h-6" />
              </div>
              <p className="font-semibold">Retirada</p>
              <p className="text-sm text-muted-foreground">Retire no balcão</p>
            </button>
          </div>
        </section>

        {/* Schedule Selection */}
        {isSchedulingEnabled && (
          <section>
          <h2 className="font-semibold mb-3">Quando deseja receber?</h2>
          <div className="space-y-3">
            <button
              onClick={() => setSchedule('asap')}
              disabled={!store?.is_open}
              className={cn(
                'w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4',
                scheduleType === 'asap'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40',
                !store?.is_open && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                scheduleType === 'asap' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">O quanto antes</p>
                <p className="text-sm text-muted-foreground">
                  {deliveryType === 'delivery' ? 'Entrega em 35-50 min' : 'Pronto em ~15 min'}
                </p>
              </div>
            </button>

            <button
              onClick={() => setSchedule('scheduled')}
              className={cn(
                'w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4',
                scheduleType === 'scheduled'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                scheduleType === 'scheduled' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Agendar</p>
                <p className="text-sm text-muted-foreground">Escolha dia e horário</p>
              </div>
            </button>
          </div>

          {scheduleType === 'scheduled' && (
            <div className="mt-4 p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground text-center">
                ⏰ Agendamento em breve. Por enquanto, fazemos o pedido assim que possível.
              </p>
            </div>
          )}
          </section>
        )}

        {/* Delivery Address Summary */}
        {deliveryType === 'delivery' && addressSnapshot && (
          <section className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{addressSnapshot.label || 'Endereço'}</p>
                <p className="text-sm text-muted-foreground">
                  {addressSnapshot.street}, {addressSnapshot.number}
                </p>
                <p className="text-sm text-muted-foreground">
                  {addressSnapshot.neighborhood}, {addressSnapshot.city}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/checkout/address')}
                className="text-primary"
              >
                Alterar
              </Button>
            </div>
          </section>
        )}
      </div>
    </CheckoutLayout>
  );
}
