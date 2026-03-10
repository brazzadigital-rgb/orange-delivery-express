import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StripeCheckoutParams {
  orderId: string;
  paymentMethod: 'pix' | 'credit_card' | 'debit_card';
  successUrl: string;
  cancelUrl: string;
}

interface StripeCheckoutResult {
  sessionId: string;
  url: string;
  testMode: boolean;
  message?: string;
}

export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = async (params: StripeCheckoutParams): Promise<StripeCheckoutResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error('Usuário não autenticado');
      }

      const response = await supabase.functions.invoke('stripe-checkout', {
        body: {
          orderId: params.orderId,
          paymentMethod: params.paymentMethod === 'credit_card' || params.paymentMethod === 'debit_card' 
            ? 'card' 
            : params.paymentMethod,
          successUrl: params.successUrl,
          cancelUrl: params.cancelUrl,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao criar sessão de pagamento');
      }

      const result = response.data as StripeCheckoutResult;

      // Show test mode warning
      if (result.testMode) {
        toast.info('Modo de Teste', {
          description: result.message || 'Stripe está em modo de teste. Configure as credenciais para pagamentos reais.',
          duration: 5000,
        });
      }

      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar pagamento';
      setError(message);
      toast.error('Erro no pagamento', { description: message });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToCheckout = async (params: StripeCheckoutParams): Promise<boolean> => {
    const result = await createCheckoutSession(params);
    
    if (result?.url) {
      // For test mode, we redirect to success directly
      // For production, redirect to Stripe checkout
      window.location.href = result.url;
      return true;
    }
    
    return false;
  };

  // Simulate test payment (for development only)
  const simulateTestPayment = async (orderId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await supabase.functions.invoke('stripe-webhook', {
        body: {
          type: 'test.payment.success',
          orderId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success('Pagamento simulado com sucesso!', {
        description: 'O pedido foi marcado como pago (modo de teste).',
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao simular pagamento';
      toast.error('Erro', { description: message });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createCheckoutSession,
    redirectToCheckout,
    simulateTestPayment,
  };
}
