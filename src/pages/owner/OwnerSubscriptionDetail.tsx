import { formatBRL } from '@/lib/subscription-plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft, RefreshCw, CheckCircle2, Clock, XCircle,
  AlertTriangle, Ban, ShieldCheck, Repeat, QrCode, Copy, Store,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface SubscriptionDetail {
  id: string;
  store_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
  billing_plans: {
    id: string;
    name: string;
    slug: string;
    price_monthly: number;
    features: string[] | null;
  } | null;
  stores: {
    id: string;
    name: string;
    slug: string | null;
    owner_email: string | null;
    created_at: string;
    is_open: boolean | null;
    phone: string | null;
    created_by: string | null;
  } | null;
}

interface BillingPlan {
  id: string; name: string; slug: string; price_monthly: number;
  active: boolean | null; sort_order: number | null;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
  active:    { label: 'Ativa',        variant: 'default',     icon: CheckCircle2 },
  trialing:  { label: 'Teste Grátis', variant: 'secondary',   icon: Clock },
  trial:     { label: 'Teste Grátis', variant: 'secondary',   icon: Clock },
  past_due:  { label: 'Em atraso',    variant: 'destructive', icon: AlertTriangle },
  suspended: { label: 'Suspensa',     variant: 'destructive', icon: Ban },
  expired:   { label: 'Expirada',     variant: 'destructive', icon: XCircle },
  canceled:  { label: 'Cancelada',    variant: 'outline',     icon: XCircle },
  cancelled: { label: 'Cancelada',    variant: 'outline',     icon: XCircle },
  pending:   { label: 'Pendente',     variant: 'secondary',   icon: Clock },
};

export default function OwnerSubscriptionDetail() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionDialog, setActionDialog] = useState<'suspend' | 'reactivate' | 'activate' | null>(null);
  const [acting, setActing] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [changingPlan, setChangingPlan] = useState(false);

  // Fetch this store's subscription from store_subscriptions
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['owner-store-subscription', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_subscriptions')
        .select('*, billing_plans!inner(id, name, slug, price_monthly, features), stores!inner(id, name, slug, owner_email, created_at, is_open, phone, created_by)')
        .eq('store_id', storeId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SubscriptionDetail | null;
    },
    enabled: !!storeId,
  });

  // Fetch billing_settings (legacy) for extra info
  const { data: legacyBilling } = useQuery({
    queryKey: ['owner-store-billing-legacy', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_settings')
        .select('*')
        .eq('store_id', storeId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });

  // Fetch owner profile
  const createdBy = subscription?.stores?.created_by;
  const { data: ownerProfile } = useQuery({
    queryKey: ['owner-profile', createdBy],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, phone')
        .eq('id', createdBy!)
        .maybeSingle();
      return data;
    },
    enabled: !!createdBy,
  });

  // Fetch active billing plans
  const { data: billingPlans } = useQuery({
    queryKey: ['billing-plans-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_plans')
        .select('id, name, slug, price_monthly, active, sort_order')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data as BillingPlan[];
    },
  });

  // Fetch invoices
  const { data: invoices } = useQuery({
    queryKey: ['owner-store-invoices', subscription?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_invoices')
        .select('*')
        .eq('subscription_id', subscription!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!subscription?.id,
  });

  const statusInfo = subscription ? STATUS_MAP[subscription.status] || STATUS_MAP.pending : null;
  const StatusIcon = statusInfo?.icon || Clock;
  const isTrial = subscription?.status === 'trialing' || subscription?.status === 'trial';
  const trialDaysLeft = isTrial && subscription?.trial_ends_at
    ? Math.max(0, differenceInDays(new Date(subscription.trial_ends_at), new Date()))
    : null;

  const handleStatusChange = async (newStatus: string) => {
    if (!subscription?.id) return;
    setActing(true);
    try {
      const { error } = await supabase
        .from('store_subscriptions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', subscription.id);
      if (error) throw error;

      // Also sync billing_settings
      const bsUpdate: Record<string, any> = { status: newStatus === 'trialing' ? 'trial' : newStatus, updated_at: new Date().toISOString() };
      if (newStatus === 'active') {
        // Set next_due_date 30 days from now
        const nextDue = new Date();
        nextDue.setDate(nextDue.getDate() + 30);
        bsUpdate.next_due_date = nextDue.toISOString().split('T')[0];
        bsUpdate.last_payment_date = new Date().toISOString();
      }
      await supabase.from('billing_settings').update(bsUpdate).eq('store_id', storeId!);

      toast.success(`Status alterado para ${STATUS_MAP[newStatus]?.label || newStatus}`);
      setActionDialog(null);
      queryClient.invalidateQueries({ queryKey: ['owner-store-subscription', storeId] });
      queryClient.invalidateQueries({ queryKey: ['owner-store-billings-unified'] });
    } catch {
      toast.error('Erro ao alterar status');
    } finally {
      setActing(false);
    }
  };

  const handleChangePlan = async () => {
    if (!subscription?.id || !selectedPlanId) return;
    const newPlan = billingPlans?.find(p => p.id === selectedPlanId);
    if (!newPlan) return;
    setChangingPlan(true);
    try {
      const { error } = await supabase
        .from('store_subscriptions')
        .update({
          plan_id: newPlan.id,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);
      if (error) throw error;

      // Sync billing_settings
      await supabase
        .from('billing_settings')
        .update({
          plan_name: newPlan.name,
          monthly_price: newPlan.price_monthly,
          current_plan_code: newPlan.slug,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('store_id', storeId!);

      toast.success(`Plano alterado para ${newPlan.name}`);
      setSelectedPlanId('');
      queryClient.invalidateQueries({ queryKey: ['owner-store-subscription', storeId] });
      queryClient.invalidateQueries({ queryKey: ['owner-store-billings-unified'] });
    } catch {
      toast.error('Erro ao alterar plano');
    } finally {
      setChangingPlan(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/owner/subscriptions')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <p className="text-center text-muted-foreground py-12">Assinatura não encontrada</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/owner/subscriptions')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-muted-foreground shrink-0" />
            <h1 className="text-xl font-bold truncate">{subscription.stores?.name || '—'}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {ownerProfile?.name || subscription.stores?.owner_email || ''}
            {subscription.stores?.slug && <span className="ml-2 text-xs opacity-60">({subscription.stores.slug})</span>}
          </p>
        </div>
        <Badge variant={statusInfo?.variant || 'secondary'} className="text-sm shrink-0">
          <StatusIcon className="w-3.5 h-3.5 mr-1" />
          {statusInfo?.label || subscription.status}
        </Badge>
      </div>

      {/* Trial Alert */}
      {isTrial && trialDaysLeft !== null && (
        <Card className={cn('border', trialDaysLeft === 0 ? 'border-destructive bg-destructive/5' : 'border-blue-500/30 bg-blue-500/5')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className={cn('w-5 h-5', trialDaysLeft === 0 ? 'text-destructive' : 'text-blue-600')} />
            <p className={cn('text-sm font-medium', trialDaysLeft === 0 ? 'text-destructive' : 'text-blue-600')}>
              {trialDaysLeft > 0 ? `${trialDaysLeft} dias restantes de teste` : 'Período de teste expirado'}
            </p>
            {subscription.trial_ends_at && (
              <span className="text-xs text-muted-foreground ml-auto">
                Expira em {format(new Date(subscription.trial_ends_at), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscription Info */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Plano</p>
              <p className="font-bold">{subscription.billing_plans?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor Mensal</p>
              <p className="font-bold">
                {isTrial ? 'Grátis' : formatBRL(subscription.billing_plans?.price_monthly || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Período Atual</p>
              <p className="font-bold">
                {subscription.current_period_end
                  ? format(new Date(subscription.current_period_end), 'dd/MM/yyyy', { locale: ptBR })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Criada em</p>
              <p className="font-bold">
                {format(new Date(subscription.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Legacy billing info */}
          {legacyBilling && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">MP Status</p>
                <p className="text-sm">{legacyBilling.last_mp_status || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Último Pagamento</p>
                <p className="text-sm">
                  {legacyBilling.last_payment_date
                    ? format(new Date(legacyBilling.last_payment_date), 'dd/MM/yyyy', { locale: ptBR })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Próx. Cobrança</p>
                <p className="text-sm">
                  {legacyBilling.next_due_date
                    ? format(new Date(legacyBilling.next_due_date), 'dd/MM/yyyy', { locale: ptBR })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Pago</p>
                <p className="text-sm">
                  {legacyBilling.last_payment_amount
                    ? formatBRL(legacyBilling.last_payment_amount)
                    : '—'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {(subscription.status === 'trialing' || subscription.status === 'trial') && (
          <Button onClick={() => setActionDialog('activate')}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Ativar Assinatura
          </Button>
        )}
        {(subscription.status === 'active' || subscription.status === 'past_due') && (
          <Button variant="destructive" onClick={() => setActionDialog('suspend')}>
            <Ban className="w-4 h-4 mr-2" />
            Suspender
          </Button>
        )}
        {(subscription.status === 'suspended' || subscription.status === 'expired') && (
          <Button onClick={() => setActionDialog('reactivate')}>
            <ShieldCheck className="w-4 h-4 mr-2" />
            Reativar
          </Button>
        )}
      </div>

      {/* Change Plan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Repeat className="w-5 h-5 text-primary" />
            Alterar Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecionar novo plano..." />
              </SelectTrigger>
              <SelectContent>
                {(billingPlans || []).map((bp) => (
                  <SelectItem
                    key={bp.id}
                    value={bp.id}
                    disabled={bp.id === subscription.plan_id}
                  >
                    {bp.name} — {formatBRL(bp.price_monthly)}/mês
                    {bp.id === subscription.plan_id ? ' (atual)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleChangePlan} disabled={!selectedPlanId || changingPlan}>
              {changingPlan ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Repeat className="w-4 h-4 mr-2" />
              )}
              Alterar Plano
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            A alteração é imediata. O status será definido como "Ativa" automaticamente.
          </p>
        </CardContent>
      </Card>

      {/* Invoices */}
      {invoices && invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Faturas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invoices.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{inv.description || 'Fatura'}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(inv.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatBRL(inv.amount)}</p>
                  <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'} className="text-[10px]">
                    {inv.status === 'paid' ? 'Pago' : inv.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Dialogs */}
      <AlertDialog open={actionDialog === 'activate'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ativar assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              A loja será marcada como ativa e o período de cobrança começará imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleStatusChange('active')} disabled={acting}>
              {acting ? 'Ativando...' : 'Confirmar Ativação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'suspend'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspender acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              A loja perderá acesso imediato ao painel até que a assinatura seja reativada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleStatusChange('suspended')}
              disabled={acting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {acting ? 'Suspendendo...' : 'Confirmar Suspensão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'reactivate'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reativar assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              A loja voltará a ter acesso ao painel imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleStatusChange('active')} disabled={acting}>
              {acting ? 'Reativando...' : 'Confirmar Reativação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
