import { useMySubscription, useSyncSubscription, useCreateSubscription, computeSubscriptionGate } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { getPlanByCode, formatBRL, SUBSCRIPTION_PLANS } from '@/lib/subscription-plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, RefreshCw, CreditCard, Clock, ArrowRight, ChevronRight, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
  active: { label: 'Ativa', variant: 'default', icon: CheckCircle2 },
  pending: { label: 'Pendente', variant: 'secondary', icon: Clock },
  past_due: { label: 'Em atraso', variant: 'destructive', icon: AlertTriangle },
  suspended: { label: 'Suspensa', variant: 'destructive', icon: XCircle },
  cancelled: { label: 'Cancelada', variant: 'outline', icon: XCircle },
};

export default function MySubscription() {
  const { user } = useAuth();
  const { data: subscription, isLoading } = useMySubscription();
  const syncMutation = useSyncSubscription();
  const createMutation = useCreateSubscription();
  const navigate = useNavigate();

  const plan = subscription ? getPlanByCode(subscription.plan_code) : null;
  const statusInfo = subscription ? STATUS_MAP[subscription.status] || STATUS_MAP.pending : null;
  const StatusIcon = statusInfo?.icon || Clock;

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync(subscription?.id);
      toast.success('Status atualizado com sucesso');
    } catch {
      toast.error('Erro ao sincronizar');
    }
  };

  const handleSubscribe = async (planCode: string) => {
    try {
      const result = await createMutation.mutateAsync({ planCode, storeId: '' });
      if (result?.init_point) {
        window.open(result.init_point, '_blank');
      }
    } catch {
      toast.error('Erro ao criar assinatura');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No subscription yet — show plan selection
  if (!subscription) {
    return (
      <div className="min-h-screen bg-background p-4 pb-24">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="text-center pt-8 pb-4">
            <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Escolha seu Plano</h1>
            <p className="text-muted-foreground mt-1">Assine e aproveite todos os recursos</p>
          </div>

          <div className="space-y-3">
            {SUBSCRIPTION_PLANS.map((p) => (
              <Card key={p.code} className={`relative overflow-hidden transition-all ${p.popular ? 'ring-2 ring-primary shadow-lg' : ''}`}>
                {p.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{p.name}</h3>
                      <p className="text-2xl font-black text-foreground">
                        {formatBRL(p.totalPrice)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{p.months === 1 ? 'mês' : `${p.months} meses`}
                        </span>
                      </p>
                      {p.savings > 0 && (
                        <p className="text-sm text-success font-medium mt-1">
                          Economia de {formatBRL(p.savings)} ({p.discountPercent}% off)
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleSubscribe(p.code)}
                      disabled={createMutation.isPending}
                      size="lg"
                    >
                      Assinar
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Has subscription — show details
  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="pt-6 pb-2">
          <h1 className="text-2xl font-bold">Minha Assinatura</h1>
        </div>

        {/* Status Card */}
        <Card className="overflow-hidden">
          <div className="h-1.5 w-full gradient-primary" />
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">{plan?.name || subscription.plan_code}</h2>
                  <Badge variant={statusInfo?.variant || 'secondary'} className="mt-0.5">
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusInfo?.label || subscription.status}
                  </Badge>
                </div>
              </div>
              <p className="text-2xl font-black">{formatBRL(subscription.amount_per_cycle)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Próxima cobrança</p>
                <p className="font-semibold text-sm">
                  {subscription.next_due_date
                    ? format(new Date(subscription.next_due_date), "dd 'de' MMM, yyyy", { locale: ptBR })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Último pagamento</p>
                <p className="font-semibold text-sm">
                  {subscription.last_payment_date
                    ? format(new Date(subscription.last_payment_date), "dd/MM/yyyy", { locale: ptBR })
                    : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Past due warning */}
        {(subscription.status === 'past_due' || subscription.status === 'suspended') && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-destructive">Pagamento em atraso</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Regularize para continuar usando o app.
                </p>
                {subscription.mp_init_point && (
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open(subscription.mp_init_point!, '_blank')}
                  >
                    Regularizar Agora
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => navigate('/subscription/history')}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Histórico de Pagamentos</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate('/subscription/manage')}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Trocar ou Cancelar Plano</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Sync Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSync}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          Sincronizar com Mercado Pago
        </Button>
      </div>
    </div>
  );
}
