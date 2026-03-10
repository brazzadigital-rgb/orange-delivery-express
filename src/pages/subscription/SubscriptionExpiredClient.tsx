import { useMySubscription, useSyncSubscription } from '@/hooks/useSubscription';
import { getPlanByCode, formatBRL } from '@/lib/subscription-plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Crown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { computeSubscriptionGate } from '@/hooks/useSubscription';

export default function SubscriptionExpiredClient() {
  const { data: subscription, isLoading } = useMySubscription();
  const syncMutation = useSyncSubscription();
  const navigate = useNavigate();

  const gate = subscription ? computeSubscriptionGate(subscription, false) : 'open';
  const plan = subscription ? getPlanByCode(subscription.plan_code) : null;

  useEffect(() => {
    if (!isLoading && gate === 'open') {
      navigate('/app/home', { replace: true });
    }
  }, [gate, isLoading, navigate]);

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync(subscription?.id);
      toast.success('Status verificado');
    } catch {
      toast.error('Erro ao verificar status');
    }
  };

  const handleRegularize = () => {
    if (subscription?.mp_init_point) {
      window.open(subscription.mp_init_point, '_blank');
    } else {
      navigate('/subscription');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted to-background p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">Assinatura Expirada</h1>
            <p className="text-muted-foreground mt-2">
              Seu acesso foi suspenso até a regularização do pagamento.
            </p>
            {plan && (
              <p className="text-sm text-muted-foreground mt-1">
                Plano: {plan.name} — {formatBRL(plan.totalPrice)}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button className="w-full" size="lg" onClick={handleRegularize}>
              <Crown className="w-5 h-5 mr-2" />
              Regularizar Agora
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleSync}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Já paguei — verificar
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Se precisar de ajuda, entre em contato com o suporte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
