import { useMySubscription, useCreateSubscription, useSyncSubscription } from '@/hooks/useSubscription';
import { getPlanByCode, formatBRL, SUBSCRIPTION_PLANS } from '@/lib/subscription-plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Crown, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

export default function SubscriptionManage() {
  const { data: subscription, isLoading } = useMySubscription();
  const createMutation = useCreateSubscription();
  const navigate = useNavigate();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const currentPlan = subscription ? getPlanByCode(subscription.plan_code) : null;

  const handleChangePlan = async (planCode: string) => {
    if (planCode === subscription?.plan_code) return;
    try {
      const result = await createMutation.mutateAsync({ planCode, storeId: subscription?.store_id || '' });
      if (result?.init_point) {
        window.open(result.init_point, '_blank');
        toast.success('Redirecionando para o Mercado Pago');
      }
    } catch {
      toast.error('Erro ao trocar plano');
    }
  };

  const handleCancel = async () => {
    if (!subscription?.id) return;
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription.id);
      if (error) throw error;
      toast.success('Assinatura cancelada');
      setShowCancelDialog(false);
      navigate('/subscription');
    } catch {
      toast.error('Erro ao cancelar');
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3 pt-6 pb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/subscription')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Gerenciar Assinatura</h1>
        </div>

        {/* Plan selection */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Trocar Plano</h2>
          <div className="space-y-3">
            {SUBSCRIPTION_PLANS.map((p) => {
              const isCurrent = subscription?.plan_code === p.code;
              return (
                <Card key={p.code} className={`transition-all ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{p.name}</h3>
                        {isCurrent && <Badge>Atual</Badge>}
                        {p.popular && !isCurrent && <Badge variant="secondary">Popular</Badge>}
                      </div>
                      <p className="text-lg font-bold mt-1">
                        {formatBRL(p.totalPrice)}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          /{p.months === 1 ? 'mês' : `${p.months}m`}
                        </span>
                      </p>
                      {p.savings > 0 && (
                        <p className="text-xs text-success font-medium">
                          Economize {formatBRL(p.savings)}
                        </p>
                      )}
                    </div>
                    {isCurrent ? (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangePlan(p.code)}
                        disabled={createMutation.isPending}
                      >
                        Trocar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Cancel */}
        {subscription && subscription.status !== 'cancelled' && (
          <div className="pt-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/5"
              onClick={() => setShowCancelDialog(true)}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Cancelar Assinatura
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao cancelar, você perderá o acesso aos recursos premium ao final do período atual.
              Esta ação não pode ser desfeita automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
