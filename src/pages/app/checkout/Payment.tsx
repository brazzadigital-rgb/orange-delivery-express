import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, CreditCard, Banknote, Check, Ticket } from 'lucide-react';
import { CheckoutLayout } from '@/components/checkout/CheckoutLayout';
import { CashChangeSection } from '@/components/checkout/CashChangeSection';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCheckoutStore } from '@/hooks/useCheckoutStore';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LoyaltyReward } from '@/hooks/useLoyalty';

const paymentMethods = [
  { 
    id: 'pix' as const, 
    label: 'PIX', 
    icon: QrCode, 
    description: 'Pagamento instantâneo',
    method: 'pix' as const
  },
  { 
    id: 'credit_card' as const, 
    label: 'Cartão de Crédito', 
    icon: CreditCard, 
    description: 'Pague com cartão de crédito',
    method: 'credit_card' as const
  },
  { 
    id: 'debit_card' as const, 
    label: 'Cartão de Débito', 
    icon: CreditCard, 
    description: 'Débito na entrega',
    method: 'debit_card' as const
  },
  { 
    id: 'cash' as const, 
    label: 'Dinheiro', 
    icon: Banknote, 
    description: 'Pague na entrega',
    method: 'cash' as const
  },
];

export default function CheckoutPayment() {
  const navigate = useNavigate();
  const storeId = useStoreId();
  const { items, getTotal } = useCart();
  const { 
    paymentMethod, 
    setPaymentMethod,
    couponCode,
    setCoupon,
    discount,
    deliveryFee,
    cashChangeNeeded,
    cashChangeFor,
    setCashChange,
    loyaltyReward
  } = useCheckoutStore();
  
  const [couponInput, setCouponInput] = useState(couponCode || '');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const cashChangeSectionRef = useRef<HTMLDivElement>(null);

  const subtotal = getTotal();
  
  // Calculate effective delivery fee considering loyalty reward
  const effectiveDeliveryFee = loyaltyReward?.type === 'free_shipping' ? 0 : deliveryFee;
  const total = subtotal + effectiveDeliveryFee - discount;

  // Redirect if cart is empty
  if (items.length === 0) {
    navigate('/app/cart');
    return null;
  }

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error('Digite um cupom');
      return;
    }

    setApplyingCoupon(true);

    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('store_id', storeId)
        .eq('code', couponInput.toUpperCase().trim())
        .eq('active', true)
        .single();

      if (error || !coupon) {
        toast.error('Cupom inválido ou expirado');
        return;
      }

      // Check validity period
      const now = new Date();
      if (coupon.starts_at && new Date(coupon.starts_at) > now) {
        toast.error('Este cupom ainda não está ativo');
        return;
      }
      if (coupon.ends_at && new Date(coupon.ends_at) < now) {
        toast.error('Este cupom expirou');
        return;
      }

      // Check min value
      if (coupon.min_value && subtotal < coupon.min_value) {
        toast.error(`Pedido mínimo para este cupom: R$ ${coupon.min_value.toFixed(2).replace('.', ',')}`);
        return;
      }

      // Check usage limit
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        toast.error('Este cupom atingiu o limite de uso');
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.type === 'percent') {
        discountAmount = (subtotal * coupon.amount) / 100;
      } else if (coupon.type === 'value') {
        discountAmount = coupon.amount;
      } else if (coupon.type === 'free_delivery') {
        discountAmount = deliveryFee;
      }

      // Apply coupon
      setCoupon(coupon.code, coupon.id, discountAmount);
      toast.success(`Cupom "${coupon.code}" aplicado!`);
    } catch (err) {
      console.error('Error applying coupon:', err);
      toast.error('Erro ao validar cupom');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null, null, 0);
    setCouponInput('');
    toast.success('Cupom removido');
  };

  const handleSetPaymentMethod = (method: typeof paymentMethod) => {
    setPaymentMethod(method);
    // Reset cash change if switching away from cash
    if (method !== 'cash') {
      setCashChange(false, undefined, undefined);
    } else {
      // Scroll to cash change section when selecting cash
      setTimeout(() => {
        cashChangeSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  };

  const handleNext = () => {
    if (!paymentMethod) {
      toast.error('Selecione uma forma de pagamento');
      return;
    }
    // Validate cash change if needed
    if (paymentMethod === 'cash' && cashChangeNeeded) {
      if (!cashChangeFor || cashChangeFor <= total) {
        toast.error('Informe um valor válido para o troco');
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/app/checkout/review');
  };

  return (
    <CheckoutLayout
      currentStep="payment"
      title="Forma de Pagamento"
      nextLabel="Revisar Pedido"
      onNext={handleNext}
      backTo="/app/checkout/delivery"
    >
      <div className="space-y-6">
        {/* Payment Methods */}
        <section>
          <h2 className="font-semibold mb-3">Como deseja pagar?</h2>
          <div className="space-y-3">
            {paymentMethods.map(({ id, label, icon: Icon, description, method }) => {
              const isSelected = paymentMethod === method;

              return (
                <button
                  key={id}
                  onClick={() => handleSetPaymentMethod(method)}
                  className={cn(
                    'w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/40'
                  )}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{label}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  <div className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0',
                    isSelected ? 'border-primary bg-primary' : 'border-border'
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Cash Change Section - Only when cash is selected */}
        {paymentMethod === 'cash' && (
          <div ref={cashChangeSectionRef}>
            <CashChangeSection total={total} />
          </div>
        )}

        {/* Coupon Section */}
        <section className="card-premium p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            Cupom de Desconto
          </h2>

          {couponCode ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
              <div>
                <p className="font-medium text-primary">{couponCode}</p>
                <p className="text-sm text-muted-foreground">
                  -R$ {discount.toFixed(2).replace('.', ',')} de desconto
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveCoupon}
                className="text-destructive"
              >
                Remover
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Digite seu cupom"
                className="flex-1 uppercase"
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={applyingCoupon || !couponInput.trim()}
                className="btn-primary"
              >
                {applyingCoupon ? '...' : 'Aplicar'}
              </Button>
            </div>
          )}
        </section>

        {/* Card Form (when credit/debit selected) */}
        {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
          <section className="card-premium p-4">
            <h2 className="font-semibold mb-3">Dados do Cartão</h2>
            <p className="text-sm text-muted-foreground mb-4">
              ⚠️ Integração de cartão em breve. Por enquanto, o pagamento será processado na entrega.
            </p>
            <div className="space-y-3 opacity-50 pointer-events-none">
              <Input placeholder="Número do cartão" />
              <Input placeholder="Nome no cartão" />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Validade (MM/AA)" />
                <Input placeholder="CVV" />
              </div>
            </div>
          </section>
        )}

        {/* PIX Info */}
        {paymentMethod === 'pix' && (
          <section className="card-premium p-4">
            <h2 className="font-semibold mb-3">Pagamento via PIX</h2>
            <p className="text-sm text-muted-foreground">
              Após confirmar o pedido, você receberá um QR Code para pagamento instantâneo.
              O pedido será preparado assim que o pagamento for confirmado.
            </p>
          </section>
        )}

      </div>
    </CheckoutLayout>
  );
}
