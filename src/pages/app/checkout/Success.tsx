import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { CheckCircle, MapPin, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import confetti from 'canvas-confetti';

interface LocationState {
  orderId: string;
  orderNumber: number;
}

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [animate, setAnimate] = useState(false);
  const { simulateTestPayment } = useStripeCheckout();
  const hasSimulated = useRef(false);
  
  // Get order info from state or URL params (for Stripe redirect)
  const state = location.state as LocationState | null;
  const orderId = state?.orderId || searchParams.get('order_id');
  const orderNumber = state?.orderNumber || searchParams.get('order_number');
  const sessionId = searchParams.get('session_id');
  const isTestMode = searchParams.get('test_mode') === 'true';

  useEffect(() => {
    // Handle test mode - simulate payment completion (only once!)
    if (isTestMode && orderId && !hasSimulated.current) {
      const storageKey = `test_payment_simulated:${orderId}`;
      const alreadySimulated = sessionStorage.getItem(storageKey) === '1';

      if (!alreadySimulated) {
        hasSimulated.current = true;
        sessionStorage.setItem(storageKey, '1');
        simulateTestPayment(orderId);
      }
    }
    
    // Trigger animation
    setAnimate(true);
    
    // Fire confetti
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FF8A00', '#FFB800', '#FF6B00'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FF8A00', '#FFB800', '#FF6B00'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, [isTestMode, orderId, simulateTestPayment]);

  // Redirect if no order data
  if (!orderId) {
    navigate('/app/orders');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col items-center justify-center px-6 py-12">
      <div className={`transition-all duration-700 ${animate ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
        <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <CheckCircle className="w-16 h-16 text-primary-foreground" strokeWidth={2.5} />
        </div>
      </div>

      <div className={`text-center transition-all duration-700 delay-300 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        <h1 className="text-3xl font-bold mb-2">Pedido Confirmado!</h1>
        <p className="text-muted-foreground mb-2">
          Seu pedido #{orderNumber} foi recebido com sucesso
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Você receberá atualizações sobre o status do seu pedido
        </p>
      </div>

      <div className={`w-full max-w-sm space-y-4 transition-all duration-700 delay-500 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        {/* Order Status Card */}
        <div className="card-premium p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Preparando seu pedido</p>
              <p className="text-sm text-muted-foreground">
                Tempo estimado: 35-50 min
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <Button
          onClick={() => navigate(`/app/orders/${orderId}`)}
          className="w-full btn-primary h-14 text-base gap-2"
        >
          <MapPin className="w-5 h-5" />
          Acompanhar Pedido
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate('/app/home')}
          className="w-full h-12"
        >
          Voltar ao Cardápio
        </Button>
      </div>
    </div>
  );
}
