import { useBillingSettings, useBillingSync, computeBillingGate } from '@/hooks/useBilling';
import { getPlanByCode, formatBRL } from '@/lib/subscription-plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Crown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function BillingExpired() {
  const { data: settings, isLoading } = useBillingSettings();
  const syncBilling = useBillingSync();
  const navigate = useNavigate();
  const gate = computeBillingGate(settings);

  const currentPlan = getPlanByCode(settings?.current_plan_code || '');

  useEffect(() => {
    if (!isLoading && gate === 'open') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [gate, isLoading, navigate]);

  const handleSync = async () => {
    try {
      await syncBilling.mutateAsync();
      toast.success('Status verificado');
    } catch {
      toast.error('Erro ao verificar status');
    }
  };

  const handleRegularize = () => {
    navigate('/billing');
  };

  const isTrial = settings?.plan_name === 'Trial';
  const expirationDate = settings?.next_due_date
    ? new Date(settings.next_due_date).toLocaleDateString('pt-BR')
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted to-background p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              {isTrial ? 'Seu teste expirou' : 'Assinatura Expirada'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isTrial
                ? 'Seu período de teste de 7 dias terminou. Assine um plano para continuar usando a plataforma.'
                : 'O acesso ao painel foi suspenso até a regularização do pagamento.'}
            </p>
            {expirationDate && (
              <p className="text-sm text-muted-foreground mt-1">
                {isTrial ? 'Teste expirou em:' : 'Vencimento:'} {expirationDate}
              </p>
            )}
            {currentPlan && !isTrial && (
              <p className="text-sm text-muted-foreground mt-1">
                Plano: {currentPlan.name} — {formatBRL(currentPlan.totalPrice)}
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
              disabled={syncBilling.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncBilling.isPending ? 'animate-spin' : ''}`} />
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
