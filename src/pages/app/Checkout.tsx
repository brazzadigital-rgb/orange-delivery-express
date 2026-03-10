import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, ChevronRight, CreditCard, Banknote, QrCode, Clock, ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAddresses } from '@/hooks/useAddresses';
import { useCreateOrder } from '@/hooks/useOrders';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const paymentMethods = [
  { id: 'pix', label: 'PIX', icon: QrCode, description: 'Pagamento instantâneo' },
  { id: 'card', label: 'Cartão', icon: CreditCard, description: 'Crédito ou débito' },
  { id: 'cash', label: 'Dinheiro', icon: Banknote, description: 'Pague na entrega' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotal, getItemTotal } = useCart();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const createOrder = useCreateOrder();

  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('pix');
  const [notes, setNotes] = useState('');

  const subtotal = getTotal();
  const deliveryFee = 8.00;
  const total = subtotal + deliveryFee;

  const defaultAddress = addresses?.find((a) => a.is_default) || addresses?.[0];
  const activeAddressId = selectedAddress || defaultAddress?.id;
  const activeAddress = addresses?.find((a) => a.id === activeAddressId);

  const handleConfirm = async () => {
    if (!activeAddress) {
      toast.error('Selecione um endereço de entrega');
      return;
    }

    if (items.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        addressId: activeAddress.id,
        addressSnapshot: {
          label: activeAddress.label,
          street: activeAddress.street,
          number: activeAddress.number,
          complement: activeAddress.complement,
          neighborhood: activeAddress.neighborhood,
          city: activeAddress.city,
          state: activeAddress.state,
          zip: activeAddress.zip,
        },
        deliveryFee,
        paymentMethod: selectedPayment as 'pix' | 'card' | 'cash',
        notes: notes || undefined,
      });

      navigate(`/app/orders/${order.id}`, { replace: true });
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  if (items.length === 0) {
    navigate('/app/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <PageHeader title="Finalizar Pedido" />

      <div className="px-4 space-y-6">
        {/* Delivery Address */}
        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Endereço de Entrega
          </h2>

          {addressesLoading ? (
            <LoadingSpinner />
          ) : addresses && addresses.length > 0 ? (
            <div className="space-y-2">
              {addresses.map((address) => (
                <button
                  key={address.id}
                  onClick={() => setSelectedAddress(address.id)}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all',
                    activeAddressId === address.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{address.label}</span>
                    {address.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {address.street}, {address.number}
                    {address.complement && ` - ${address.complement}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.neighborhood}, {address.city} - {address.state}
                  </p>
                </button>
              ))}
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => navigate('/app/profile/addresses/new')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar novo endereço
              </Button>
            </div>
          ) : (
            <Button
              className="w-full btn-primary"
              onClick={() => navigate('/app/profile/addresses/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar endereço
            </Button>
          )}
        </section>

        {/* Delivery Time */}
        <section className="card-premium p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Tempo de entrega estimado</p>
              <p className="text-sm text-muted-foreground">35-50 minutos</p>
            </div>
          </div>
        </section>

        {/* Payment Method */}
        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Forma de Pagamento
          </h2>

          <div className="space-y-2">
            {paymentMethods.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => setSelectedPayment(id)}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4',
                  selectedPayment === id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 transition-all',
                    selectedPayment === id
                      ? 'border-primary bg-primary'
                      : 'border-border'
                  )}
                >
                  {selectedPayment === id && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Order Notes */}
        <section>
          <h2 className="font-semibold mb-3">Observações</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Apartamento 42, interfone quebrado..."
            className="w-full p-4 rounded-xl border border-border bg-background resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </section>

        {/* Order Summary */}
        <section className="card-premium p-4">
          <h2 className="font-semibold mb-3">Resumo do Pedido</h2>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-muted-foreground">
                  {item.quantity}x {item.name}
                </span>
                <span>R$ {getItemTotal(item).toFixed(2).replace('.', ',')}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de entrega</span>
                <span>R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 safe-area-bottom">
        <div className="flex items-center justify-between mb-4">
          <span className="text-muted-foreground">Total</span>
          <span className="text-2xl font-bold text-primary">
            R$ {total.toFixed(2).replace('.', ',')}
          </span>
        </div>
        <Button
          onClick={handleConfirm}
          disabled={createOrder.isPending || !activeAddress}
          className="w-full btn-primary h-14 text-base"
        >
          {createOrder.isPending ? 'Confirmando...' : 'Confirmar Pedido'}
        </Button>
      </div>
    </div>
  );
}
