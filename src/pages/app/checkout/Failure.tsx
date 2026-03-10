import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutFailure() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Get order ID from URL params (for Stripe redirect)
  const orderId = searchParams.get('order_id');
  const errorMessage = (location.state as any)?.error || 'Não foi possível processar seu pagamento';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
        <XCircle className="w-14 h-14 text-destructive" />
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Erro no Pagamento</h1>
        <p className="text-muted-foreground max-w-sm">
          {errorMessage}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <Button
          onClick={() => navigate('/app/checkout/payment')}
          className="w-full btn-primary h-14 gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Tentar Novamente
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate('/app/support')}
          className="w-full h-12 gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          Falar com Suporte
        </Button>

        <Button
          variant="ghost"
          onClick={() => navigate('/app/cart')}
          className="w-full h-12"
        >
          Voltar ao Carrinho
        </Button>
      </div>
    </div>
  );
}
