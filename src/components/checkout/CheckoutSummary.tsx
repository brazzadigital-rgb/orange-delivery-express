import { useCheckoutStore } from '@/hooks/useCheckoutStore';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';

interface CheckoutSummaryProps {
  compact?: boolean;
}

export function CheckoutSummary({ compact = false }: CheckoutSummaryProps) {
  const { getTotal } = useCart();
  const { deliveryFee, discount } = useCheckoutStore();
  
  const subtotal = getTotal();
  const total = subtotal + deliveryFee - discount;

  if (compact) {
    return (
      <div className="px-4 py-4 border-b border-border/30 bg-muted/20">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground font-medium">Total do pedido</span>
          <span className="text-2xl font-bold text-primary">
            R$ {total.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="card-premium p-5 space-y-4">
      <h3 className="font-bold text-[15px]">Resumo do pedido</h3>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Taxa de entrega</span>
          <span className={cn('font-medium', deliveryFee === 0 && 'text-success')}>
            {deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`}
          </span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-success">
            <span>Desconto</span>
            <span className="font-medium">-R$ {discount.toFixed(2).replace('.', ',')}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center font-bold text-lg pt-3 border-t border-border/40">
          <span>Total</span>
          <span className="text-primary text-xl">R$ {total.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>
    </div>
  );
}
