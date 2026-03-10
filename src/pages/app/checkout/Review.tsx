import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Truck, Store, CreditCard, QrCode, Banknote, FileText, ShoppingBag } from 'lucide-react';
import { CheckoutLayout } from '@/components/checkout/CheckoutLayout';
import { Textarea } from '@/components/ui/textarea';
 import { LoyaltyPointsSection } from '@/components/checkout/LoyaltyPointsSection';
import { useCheckoutStore } from '@/hooks/useCheckoutStore';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
 import { useLoyaltySettings, useLoyaltyWallet, useEnsureLoyaltyWallet, LoyaltyReward } from '@/hooks/useLoyalty';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const paymentMethodIcons: Record<string, React.ElementType> = {
  pix: QrCode,
  credit_card: CreditCard,
  debit_card: CreditCard,
  cash: Banknote,
};

const paymentMethodLabels: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_REGEX.test(value);
}

export default function CheckoutReview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const storeId = useStoreId();
  const { items, getTotal, getItemTotal, clearCart } = useCart();
  const { redirectToCheckout, isLoading: isStripeLoading } = useStripeCheckout();
  const { 
    addressSnapshot, 
    deliveryType,
    paymentMethod,
    deliveryFee,
    discount,
    couponId,
    couponCode,
    notes,
    setNotes,
    estimatedMinutes,
    cashChangeNeeded,
    cashChangeFor,
    cashChangeAmount,
     loyaltyReward,
     setLoyaltyReward,
     setDeliveryFee,
    reset: resetCheckout
  } = useCheckoutStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
   const [originalDeliveryFee] = useState(deliveryFee);
  
  // Track if we're in the process of completing an order to prevent redirect to cart
  const isCompletingOrderRef = useRef(false);
  
  // Store initial items count to avoid redirecting during order completion
  const initialItemsCount = useRef(items.length);
  
  useEffect(() => {
    if (items.length > 0) {
      initialItemsCount.current = items.length;
    }
  }, [items.length]);

   const { data: loyaltySettings } = useLoyaltySettings();
   const { data: wallet } = useLoyaltyWallet();
   const ensureWallet = useEnsureLoyaltyWallet();
 
  const subtotal = getTotal();
   // Calculate loyalty discount
   const loyaltyDiscount = loyaltyReward?.type === 'free_shipping' ? loyaltyReward.value : 0;
   const effectiveDeliveryFee = loyaltyReward?.type === 'free_shipping' ? 0 : deliveryFee;
   const total = subtotal + effectiveDeliveryFee - discount;
 
  // Recalculate cash change based on effective total when loyalty reward changes
  const effectiveCashChangeAmount = useMemo(() => {
    if (!cashChangeNeeded || !cashChangeFor) return null;
    if (cashChangeFor <= total) return null;
    return cashChangeFor - total;
  }, [cashChangeNeeded, cashChangeFor, total]);
 
   // Handle loyalty reward application
   const handleApplyLoyaltyReward = (reward: LoyaltyReward | null, redemptionId: string | null) => {
     if (reward && redemptionId) {
       setLoyaltyReward({
         rewardId: reward.id,
         redemptionId,
         type: reward.type,
         pointsCost: reward.points_cost,
         value: reward.type === 'free_shipping' ? deliveryFee : (reward.constraints?.amount || 0),
       });
     } else {
       setLoyaltyReward(null);
     }
   };

  // Only redirect to cart if we're NOT in the middle of completing an order
  // and items were already empty when component mounted
  if (items.length === 0 && !isCompletingOrderRef.current && initialItemsCount.current === 0) {
    navigate('/app/cart');
    return null;
  }

  if (deliveryType === 'delivery' && !addressSnapshot && !isCompletingOrderRef.current) {
    navigate('/app/checkout/address');
    return null;
  }

  if (!paymentMethod && !isCompletingOrderRef.current) {
    navigate('/app/checkout/payment');
    return null;
  }

  const handleConfirmOrder = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para finalizar o pedido');
      navigate('/auth/login');
      return;
    }

    // Mark that we're completing an order to prevent cart redirect
    isCompletingOrderRef.current = true;
    setIsSubmitting(true);

    try {
      // 1. Re-fetch and validate product prices (server-side validation)
      // NOTE: Alguns itens (ex.: pizza customizada) podem ter productId não-UUID.
      // Para evitar erro de cast no backend, validamos/apuramos preços apenas de UUIDs.
      const uuidItems = items.filter((item) => isUuid(item.productId));
      const uuidProductIds = uuidItems.map((item) => item.productId);

      const { data: products, error: productsError } = uuidProductIds.length
        ? await supabase
            .from('products')
            .select('id, base_price, active')
            .in('id', uuidProductIds)
        : { data: [], error: null };

      if (productsError) throw productsError;

      // Validate UUID products exist and are active
      for (const item of uuidItems) {
        const product = products?.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(`Produto "${item.name}" não encontrado`);
        }
        if (!product.active) {
          throw new Error(`Produto "${item.name}" não está mais disponível`);
        }
      }

      // 2. Recalculate totals server-side
      const recalculatedSubtotal = items.reduce((sum, item) => {
        const optionsTotal = item.options.reduce((acc, opt) => acc + opt.priceDelta, 0);

        if (isUuid(item.productId)) {
          const product = products?.find((p) => p.id === item.productId);
          return sum + ((product?.base_price || 0) + optionsTotal) * item.quantity;
        }

        // Itens sem UUID (ex.: custom) usam o basePrice do carrinho
        return sum + ((item.basePrice || 0) + optionsTotal) * item.quantity;
      }, 0);

      // Use effectiveDeliveryFee (0 if free shipping loyalty reward) instead of deliveryFee
      const recalculatedTotal = recalculatedSubtotal + effectiveDeliveryFee - discount;

      // 3. Validate coupon if used
      if (couponId) {
        const { data: coupon, error: couponError } = await supabase
          .from('coupons')
          .select('*')
          .eq('id', couponId)
          .eq('active', true)
          .single();

        if (couponError || !coupon) {
          throw new Error('Cupom inválido ou expirado');
        }

        // Check min value
        if (coupon.min_value && recalculatedSubtotal < coupon.min_value) {
          throw new Error('Pedido não atinge valor mínimo do cupom');
        }
      }

      // 4. Validate store is open
      const { data: store, error: storeError } = await supabase
        .from('store_settings')
        .select('is_open_override, min_order_value')
        .eq('store_id', storeId)
        .maybeSingle();

      if (storeError) {
        console.error('Error fetching store settings:', storeError);
        // Continue without store validation if it fails
      }

      if (store && recalculatedSubtotal < (store.min_order_value || 0)) {
        throw new Error(`Pedido mínimo: R$ ${store.min_order_value?.toFixed(2).replace('.', ',')}`);
      }

      // 5. Create order with cash change fields
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
           store_id: storeId,
          user_id: user.id,
          status: 'created',
          delivery_type: deliveryType,
          address_id: deliveryType === 'delivery' ? addressSnapshot?.id : null,
          address_snapshot: deliveryType === 'delivery' ? addressSnapshot : null,
          subtotal: recalculatedSubtotal,
           delivery_fee: effectiveDeliveryFee,
          discount,
          total: recalculatedTotal,
          payment_method: paymentMethod === 'credit_card' || paymentMethod === 'debit_card' ? 'card' : paymentMethod,
          payment_status: 'pending',
          notes: notes || null,
          coupon_id: couponId,
          estimated_minutes: estimatedMinutes || 40,
          // Cash change fields
          cash_change_needed: paymentMethod === 'cash' ? cashChangeNeeded : false,
          cash_change_for: paymentMethod === 'cash' && cashChangeNeeded ? cashChangeFor : null,
          cash_change_amount: paymentMethod === 'cash' && cashChangeNeeded ? effectiveCashChangeAmount : null,
           // Loyalty fields
           loyalty_points_earned: loyaltySettings?.enabled 
             ? Math.floor(recalculatedSubtotal * (loyaltySettings.earning_rate_points_per_real || 1))
             : 0,
           loyalty_points_spent: loyaltyReward?.pointsCost || 0,
           loyalty_reward_applied: loyaltyReward ? {
             reward_id: loyaltyReward.rewardId,
             redemption_id: loyaltyReward.redemptionId,
             type: loyaltyReward.type,
             points_cost: loyaltyReward.pointsCost,
             value: loyaltyReward.value,
           } : null,
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // 6. Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: isUuid(item.productId) ? item.productId : null,
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

      // 7. Create initial order event
      await supabase
        .from('order_events')
        .insert({
          order_id: order.id,
          status: 'created',
          message: 'Pedido criado',
          created_by: user.id,
        });
 
       // 7.5. Process loyalty points
       if (loyaltySettings?.enabled) {
         const pointsToEarn = Math.floor(recalculatedSubtotal * (loyaltySettings.earning_rate_points_per_real || 1));
         
         // Ensure wallet exists
         await ensureWallet.mutateAsync();
 
         // Credit pending points
         if (pointsToEarn > 0) {
           await supabase.from('loyalty_transactions').insert({
              store_id: storeId,
             user_id: user.id,
             order_id: order.id,
             type: 'earn_pending',
             points: pointsToEarn,
             description: `Pontos do pedido #${order.order_number}`,
           });
 
           // Update wallet pending points
           await supabase
             .from('loyalty_wallets')
             .update({ 
               points_pending: (wallet?.points_pending || 0) + pointsToEarn 
             })
              .eq('store_id', storeId)
             .eq('user_id', user.id);
         }
 
         // Process redemption if applied
         if (loyaltyReward) {
           // Update redemption status
           await supabase
             .from('loyalty_redemptions')
             .update({ 
               status: 'applied',
               order_id: order.id,
             })
             .eq('id', loyaltyReward.redemptionId);
 
           // Debit points from wallet
           await supabase
             .from('loyalty_wallets')
             .update({ 
               points_balance: Math.max(0, (wallet?.points_balance || 0) - loyaltyReward.pointsCost),
               lifetime_spent: (wallet?.lifetime_spent || 0) + loyaltyReward.pointsCost,
             })
             .eq('store_id', storeId)
             .eq('user_id', user.id);
 
           // Create spend transaction
           await supabase.from('loyalty_transactions').insert({
             store_id: storeId,
             user_id: user.id,
             order_id: order.id,
             type: 'spend',
             points: -loyaltyReward.pointsCost,
             description: `Resgate: ${loyaltyReward.type === 'free_shipping' ? 'Frete grátis' : 'Desconto'}`,
           });
         }
       }

      // 8. Increment coupon usage (non-critical, silent fail)
      if (couponId) {
        await supabase
          .from('coupons')
          .update({ used_count: (await supabase.from('coupons').select('used_count').eq('id', couponId).single()).data?.used_count || 0 + 1 })
          .eq('id', couponId);
      }

      // 9. Handle payment based on method
      const requiresOnlinePayment = paymentMethod === 'pix' || paymentMethod === 'credit_card' || paymentMethod === 'debit_card';
      
      if (requiresOnlinePayment) {
        // Redirect to Stripe for online payments
        const baseUrl = window.location.origin;
        const success = await redirectToCheckout({
          orderId: order.id,
          paymentMethod,
          successUrl: `${baseUrl}/app/checkout/success?order_id=${order.id}&order_number=${order.order_number}`,
          cancelUrl: `${baseUrl}/app/checkout/failure?order_id=${order.id}`,
        });

        if (success) {
          // Clear cart but don't navigate - Stripe will redirect
          clearCart();
          resetCheckout();
        } else {
          // Payment failed, but order is created - let user retry
          toast.error('Erro ao redirecionar para pagamento. Tente novamente.');
        }
      } else {
        // Cash payment - navigate FIRST, then clear cart to avoid race condition
        const successPath = `/app/checkout/success?order_id=${order.id}&order_number=${order.order_number}`;
        
        // Navigate immediately with replace to prevent back-button issues
        navigate(successPath, { replace: true });
        
        // Clear cart AFTER navigation is initiated
        setTimeout(() => {
          clearCart();
          resetCheckout();
        }, 100);
      }

    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.message || 'Erro ao criar pedido. Tente novamente.');
      // Reset the completing flag on error so user can retry
      isCompletingOrderRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const PaymentIcon = paymentMethodIcons[paymentMethod] || CreditCard;

  return (
    <CheckoutLayout
      currentStep="review"
      title="Revisar Pedido"
      nextLabel="Finalizar Pedido"
      onNext={handleConfirmOrder}
      isLoading={isSubmitting || isStripeLoading}
      backTo="/app/checkout/payment"
      showSummary={false}
    >
      <div className="space-y-6">
        {/* Order Items */}
        <section className="card-premium p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Itens do Pedido
          </h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🍕</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.quantity}x {item.name}</p>
                  {item.options.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.options.map(o => o.itemLabel).join(' • ')}
                    </p>
                  )}
                </div>
                <span className="font-medium">
                  R$ {getItemTotal(item).toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Delivery Info */}
        <section className="card-premium p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            {deliveryType === 'delivery' ? (
              <Truck className="w-5 h-5 text-primary" />
            ) : (
              <Store className="w-5 h-5 text-primary" />
            )}
            {deliveryType === 'delivery' ? 'Entrega' : 'Retirada'}
          </h2>
          
          {deliveryType === 'delivery' && addressSnapshot ? (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{addressSnapshot.label || 'Endereço'}</p>
                <p className="text-sm text-muted-foreground">
                  {addressSnapshot.street}, {addressSnapshot.number}
                  {addressSnapshot.complement && ` - ${addressSnapshot.complement}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {addressSnapshot.neighborhood}, {addressSnapshot.city} - {addressSnapshot.state}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Retirar no balcão da loja</p>
          )}

          {estimatedMinutes && (
            <p className="text-sm text-primary mt-2 font-medium">
              ⏱️ Tempo estimado: {estimatedMinutes} min
            </p>
          )}
        </section>

        {/* Payment Info */}
        <section className="card-premium p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <PaymentIcon className="w-5 h-5 text-primary" />
            Pagamento
          </h2>
          <p className="text-muted-foreground">{paymentMethodLabels[paymentMethod]}</p>
          
          {/* Cash change info */}
          {paymentMethod === 'cash' && cashChangeNeeded && cashChangeFor && effectiveCashChangeAmount && (
            <div className="mt-3 p-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Troco para:</span>
                <span className="font-medium">R$ {cashChangeFor.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Troco a receber:</span>
                <span className="font-medium text-primary">R$ {effectiveCashChangeAmount.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          )}
        </section>

        {/* Notes */}
        <section className="card-premium p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Observações
          </h2>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Apartamento 42, interfone quebrado, sem cebola..."
            className="resize-none"
            rows={3}
          />
        </section>

        {/* Order Summary */}
        <section className="card-premium p-4 space-y-3">
          <h2 className="font-semibold">Resumo</h2>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({items.length} itens)</span>
              <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxa de entrega</span>
               <span className={cn(effectiveDeliveryFee === 0 && 'text-primary font-medium')}>
                 {loyaltyReward?.type === 'free_shipping' ? (
                   <span className="flex items-center gap-2">
                     <span className="line-through text-muted-foreground">R$ {originalDeliveryFee.toFixed(2).replace('.', ',')}</span>
                     <span className="text-primary font-medium">Grátis</span>
                   </span>
                 ) : effectiveDeliveryFee === 0 ? 'Grátis' : `R$ ${effectiveDeliveryFee.toFixed(2).replace('.', ',')}`}
              </span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Desconto {couponCode && `(${couponCode})`}</span>
                <span>-R$ {discount.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
 
             {loyaltyReward && (
               <div className="flex justify-between text-primary">
                 <span>🌟 Pontos ({loyaltyReward.pointsCost} pts)</span>
                 <span>-R$ {loyaltyReward.value.toFixed(2).replace('.', ',')}</span>
               </div>
             )}
            
            <div className="flex justify-between font-bold text-lg pt-3 border-t border-border">
              <span>Total</span>
              <span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </section>
         
         {/* Loyalty Points Section */}
         <LoyaltyPointsSection
           subtotal={subtotal}
           deliveryFee={originalDeliveryFee}
           onApplyReward={handleApplyLoyaltyReward}
           appliedRedemptionId={loyaltyReward?.redemptionId}
         />
      </div>
    </CheckoutLayout>
  );
}
