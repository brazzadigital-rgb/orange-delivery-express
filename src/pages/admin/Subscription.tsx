import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBillingSettings, useBillingPayments } from '@/hooks/useBilling';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';
import { formatBRL } from '@/lib/subscription-plans';
import { toast } from 'sonner';
import {
  Crown, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock,
  Check, Sparkles, CreditCard, ChevronRight, Receipt, CalendarDays,
  TrendingUp, Shield, Zap, Gift, Ticket,
} from 'lucide-react';
import { format, differenceInDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo } from 'react';
import PixPaymentModal from '@/components/subscription/PixPaymentModal';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStoreId } from '@/contexts/TenantContext';

/* ── Types ── */
interface BillingPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: string[] | null;
  max_orders_per_month: number | null;
  max_products: number | null;
  max_categories: number | null;
  max_users: number | null;
  max_drivers: number | null;
  has_analytics: boolean | null;
  has_api_access: boolean | null;
  has_custom_domain: boolean | null;
  has_priority_support: boolean | null;
  active: boolean | null;
  is_default: boolean | null;
  sort_order: number | null;
}

/* ── Status config ── */
const STATUS_MAP: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  active:    { label: 'Ativa',        cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
  trial:     { label: 'Teste Grátis', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20',         icon: Gift },
  past_due:  { label: 'Em Atraso',    cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20',      icon: AlertTriangle },
  suspended: { label: 'Suspensa',     cls: 'bg-red-500/10 text-red-600 border-red-500/20',            icon: XCircle },
  pending:   { label: 'Pendente',     cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20',         icon: Clock },
  cancelled: { label: 'Cancelada',    cls: 'bg-muted text-muted-foreground border-border',            icon: XCircle },
};

const PLAN_CONFIG: Record<string, { months: number; discount: number }> = {
  monthly:   { months: 1,  discount: 0 },
  quarterly: { months: 3,  discount: 10 },
  annual:    { months: 12, discount: 20 },
};

function getPlanPricing(p: BillingPlan) {
  const cfg = PLAN_CONFIG[p.slug] || { months: 1, discount: 0 };
  const totalPrice = p.price_monthly * cfg.months * (1 - cfg.discount / 100);
  const savings = p.price_monthly * cfg.months * (cfg.discount / 100);
  return { months: cfg.months, discount: cfg.discount, totalPrice, savings };
}

const BENEFIT_ICONS = [Zap, Shield, TrendingUp, CreditCard, Receipt, Crown, Sparkles, CheckCircle2];

function useBillingPlans() {
  return useQuery({
    queryKey: ['billing-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_plans')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data as BillingPlan[];
    },
  });
}

export default function AdminSubscription() {
  const storeId = useStoreId();
  const { data: billingSettings, isLoading: billingLoading } = useBillingSettings();
  const { data: payments } = useBillingPayments();
  const { data: plans, isLoading: plansLoading } = useBillingPlans();
  const { data: paymentSettings } = usePaymentSettings();
  const queryClient = useQueryClient();
  const [generatingPix, setGeneratingPix] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pendingPlanChange, setPendingPlanChange] = useState<{ plan: BillingPlan; months: number; discount: number; totalPrice: number } | null>(null);
  const [pixModalData, setPixModalData] = useState<{
    planName: string; amount: number; pixCopiaECola: string | null; qrCodeImage: string | null; txid: string | null;
  }>({ planName: '', amount: 0, pixCopiaECola: null, qrCodeImage: null, txid: null });
  const [voucherCode, setVoucherCode] = useState('');
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);

  // billing_settings is the single source of truth for store billing
  const effectiveStatus = billingSettings?.status || 'pending';
  const currentPlanSlug = billingSettings?.current_plan_code || '';
  const isTrial = effectiveStatus === 'trial' || (effectiveStatus === 'active' && billingSettings?.plan_name === 'Trial');
  const isFreePlan = isTrial || currentPlanSlug === 'free';

  // Find current plan in billing_plans
  const currentPlan = plans?.find(p => p.slug === currentPlanSlug);

  // Available paid plans (exclude free)
  const paidPlans = useMemo(() => plans?.filter(p => p.slug !== 'free' && p.price_monthly > 0) || [], [plans]);

  // Trial days remaining
  const trialDaysLeft = useMemo(() => {
    if (!isTrial || !billingSettings?.next_due_date) return null;
    const diff = differenceInDays(new Date(billingSettings.next_due_date), new Date());
    return Math.max(0, diff);
  }, [isTrial, billingSettings?.next_due_date]);

  const st = STATUS_MAP[effectiveStatus] || STATUS_MAP.pending;
  const StIcon = st.icon;

  // Benefits from current plan or free plan
  const freePlan = plans?.find(p => p.slug === 'free');
  const currentBenefits = (isFreePlan ? freePlan?.features : currentPlan?.features) || [];

  /* ── Loading ── */
  if (billingLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  /* ── Plan change handler ── */
  const handlePlanChange = async (p: BillingPlan) => {
    const { months, discount, totalPrice } = getPlanPricing(p);

    if (paymentSettings?.efi_enabled) {
      setPendingPlanChange({ plan: p, months, discount, totalPrice });
      setPixModalData({ planName: p.name, amount: totalPrice, pixCopiaECola: null, qrCodeImage: null, txid: null });
      setPixModalOpen(true);
      setGeneratingPix(true);
      try {
        const { data: pixData, error: pixErr } = await supabase.functions.invoke('efi-create-pix', {
          body: { subscription_id: billingSettings?.id, amount: totalPrice, plan_name: p.name },
        });
        if (pixErr) throw pixErr;
        setPixModalData({
          planName: p.name, amount: totalPrice,
          pixCopiaECola: pixData?.pix_copia_cola || null,
          qrCodeImage: pixData?.qrcode_image || null,
          txid: pixData?.txid || null,
        });
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao gerar PIX');
        setPixModalOpen(false);
        setPendingPlanChange(null);
      } finally {
        setGeneratingPix(false);
      }
    } else {
      toast.error('Nenhum provedor de pagamento ativo');
    }
  };

  const handleRedeemVoucher = async () => {
    if (!voucherCode.trim() || !storeId) return;
    setRedeemingVoucher(true);
    try {
      const { data: voucher, error: findErr } = await (supabase
        .from('vouchers') as any)
        .select('*')
        .eq('code', voucherCode.trim().toUpperCase())
        .eq('status', 'active')
        .maybeSingle();

      if (findErr) throw findErr;
      if (!voucher) {
        toast.error('Voucher inválido ou já utilizado');
        return;
      }

      const nextDue = new Date();
      nextDue.setMonth(nextDue.getMonth() + (voucher as any).plan_months);

      const cycleLabels: Record<string, string> = { monthly: 'Mensal', semestral: 'Semestral', annual: 'Anual' };
      const planName = cycleLabels[(voucher as any).plan_cycle] || (voucher as any).plan_cycle;

      const { error: billingErr } = await supabase.from('billing_settings').update({
        status: 'active',
        plan_name: planName,
        current_plan_code: (voucher as any).plan_cycle,
        current_plan_months: (voucher as any).plan_months,
        next_due_date: nextDue.toISOString().split('T')[0],
        last_payment_date: new Date().toISOString().split('T')[0],
      }).eq('store_id', storeId);

      if (billingErr) throw billingErr;

      await supabase.from('vouchers').update({
        status: 'redeemed',
        redeemed_by: storeId,
        redeemed_at: new Date().toISOString(),
      } as any).eq('id', voucher.id);

      toast.success(`Voucher resgatado! Plano ${planName} ativado.`);
      setVoucherCode('');
      queryClient.invalidateQueries({ queryKey: ['billing-settings', storeId] });
      queryClient.invalidateQueries({ queryKey: ['billing-gate-rpc'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['store-subscription'] });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao resgatar voucher');
    } finally {
      setRedeemingVoucher(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8">
      <SectionHeader />

      {/* ── Trial Banner ── */}
      {isTrial && (
        <section className="rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-blue-700">Período de Teste Grátis</p>
            <p className="text-sm text-muted-foreground">
              {trialDaysLeft !== null && trialDaysLeft > 0
                ? `Seu teste expira em ${trialDaysLeft} dia${trialDaysLeft !== 1 ? 's' : ''}. Assine um plano para continuar usando.`
                : 'Seu período de teste expirou. Assine um plano para continuar.'}
            </p>
          </div>
          {trialDaysLeft !== null && (
            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-sm px-3 py-1 shrink-0">
              {trialDaysLeft > 0 ? `${trialDaysLeft}d restantes` : 'Expirado'}
            </Badge>
          )}
        </section>
      )}

      {/* ── Voucher Redemption ── */}
      <section className="rounded-2xl border border-border/60 bg-card p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Ticket className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base">Resgatar Voucher</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Possui um código de voucher? Insira abaixo para ativar seu plano.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: ABCD-EFGH-JKLM"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            className="flex-1 px-4 py-2 rounded-xl border border-border bg-background font-mono font-semibold tracking-wider text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button onClick={handleRedeemVoucher} disabled={redeemingVoucher || !voucherCode.trim()} className="gap-2 shrink-0">
            {redeemingVoucher ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
            Resgatar
          </Button>
        </div>
      </section>

      {/* ── Status Card ── */}
      <section className="rounded-2xl border border-border/60 bg-card p-5 md:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
              <Crown className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-lg truncate">
                {isTrial ? 'Teste Grátis (7 dias)' : isFreePlan ? 'Plano Gratuito' : (currentPlan?.name || billingSettings?.plan_name || 'Sem plano')}
              </h2>
              <p className="text-xs text-muted-foreground">Plano atual da sua loja</p>
            </div>
          </div>
          <Badge className={cn('self-start sm:self-auto px-3 py-1 text-xs font-semibold border shrink-0', st.cls)}>
            <StIcon className="w-3.5 h-3.5 mr-1" />
            {isTrial ? 'Teste Grátis' : st.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <InfoTile
            icon={CreditCard}
            label="Valor"
            value={isFreePlan ? 'Grátis' : formatBRL(billingSettings?.current_plan_amount || billingSettings?.monthly_price || 0)}
            sub={!isFreePlan ? `/${billingSettings?.current_plan_months === 1 ? 'mês' : `${billingSettings?.current_plan_months || 1}m`}` : undefined}
          />
          <InfoTile
            icon={CalendarDays}
            label={isTrial ? 'Início do teste' : 'Último pag.'}
            value={isTrial && billingSettings?.next_due_date
              ? format(subDays(new Date(billingSettings.next_due_date), 7), 'dd/MM/yy', { locale: ptBR })
              : billingSettings?.last_payment_date
                ? format(new Date(billingSettings.last_payment_date), 'dd/MM/yy', { locale: ptBR })
                : '—'}
          />
          <InfoTile
            icon={Clock}
            label={isTrial ? 'Expira em' : 'Vencimento'}
            value={billingSettings?.next_due_date
              ? format(new Date(billingSettings.next_due_date), 'dd/MM/yy', { locale: ptBR })
              : '—'}
          />
          <InfoTile
            icon={TrendingUp}
            label="Desconto"
            value={billingSettings?.current_plan_discount_percent ? `${billingSettings.current_plan_discount_percent}%` : '0%'}
            accent={!!billingSettings?.current_plan_discount_percent}
          />
        </div>
      </section>

      {/* ── Payment Alert ── */}
      {(effectiveStatus === 'past_due' || effectiveStatus === 'suspended') && (
        <section className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold">Pagamento em atraso!</p>
            <p className="text-sm text-muted-foreground">Regularize para continuar usando todos os recursos.</p>
          </div>
          <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground shrink-0" onClick={() => {
            const current = paidPlans.find(p => p.slug === currentPlanSlug);
            if (current) handlePlanChange(current);
          }}>
            <CreditCard className="w-4 h-4 mr-2" /> Pagar Agora
          </Button>
        </section>
      )}

      {/* ── Benefits ── */}
      {currentBenefits.length > 0 && (
        <section className="rounded-2xl border border-border/60 bg-card p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-base">Seu Plano Inclui</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {currentBenefits.map((b: string, i: number) => {
              const Icon = BENEFIT_ICONS[i % BENEFIT_ICONS.length];
              return (
                <div key={b} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-sm text-foreground/80">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span>{b}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Plans ── */}
      {paidPlans.length > 0 && (
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Crown className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold text-lg">
              {isFreePlan ? 'Escolha seu Plano' : 'Planos Disponíveis'}
            </h3>
          </div>

          <div className={cn(
            'grid grid-cols-1 gap-4 md:gap-5 md:items-start',
            paidPlans.length === 1 ? 'md:grid-cols-1 max-w-md' :
            paidPlans.length === 2 ? 'md:grid-cols-2' :
            'md:grid-cols-3'
          )}>
            {paidPlans.map((p, idx) => {
              const isCurrent = currentPlanSlug === p.slug && !isFreePlan;
              return (
                <PlanCard
                  key={p.id}
                  plan={p}
                  isCurrent={isCurrent}
                  loading={generatingPix}
                  onSelect={() => handlePlanChange(p)}
                  delay={idx * 80}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ── Payment History ── */}
      <section className="rounded-2xl border border-border/60 bg-card p-5 md:p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-bold text-lg">Histórico de Pagamentos</h3>
        </div>

        {payments && payments.length > 0 ? (
          <div className="rounded-xl border border-border/50 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap">Data</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap">Valor</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p: any) => (
                  <TableRow key={p.id} className="hover:bg-muted/15">
                    <TableCell className="text-sm whitespace-nowrap">{format(new Date(p.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                    <TableCell className="font-semibold whitespace-nowrap">{formatBRL(p.amount || 0)}</TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs border', p.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border')}>
                        {p.status === 'approved' ? 'Aprovado' : p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10">
            <Receipt className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum pagamento registrado</p>
          </div>
        )}
      </section>

      <PixPaymentModal
        open={pixModalOpen} onOpenChange={(open) => { setPixModalOpen(open); if (!open) setPendingPlanChange(null); }}
        planName={pixModalData.planName} amount={pixModalData.amount}
        pixCopiaECola={pixModalData.pixCopiaECola} qrCodeImage={pixModalData.qrCodeImage}
        txid={pixModalData.txid} isLoading={generatingPix}
        onPaymentConfirmed={async () => {
          if (!pendingPlanChange || !billingSettings) return;
          const { plan: p, months, discount, totalPrice } = pendingPlanChange;
          
          const nextDue = new Date();
          nextDue.setMonth(nextDue.getMonth() + months);
          
          await supabase.from('billing_settings').update({
            current_plan_code: p.slug,
            current_plan_months: months,
            current_plan_amount: totalPrice,
            current_plan_discount_percent: discount,
            status: 'active',
            plan_name: p.name,
            monthly_price: p.price_monthly,
            last_payment_date: new Date().toISOString(),
            last_payment_amount: totalPrice,
            next_due_date: nextDue.toISOString().split('T')[0],
          }).eq('id', billingSettings.id);

          // Also update store_subscriptions if exists
          const { data: storeSub } = await supabase
            .from('store_subscriptions')
            .select('id')
            .eq('store_id', storeId)
            .maybeSingle();

          if (storeSub) {
            const planRecord = plans?.find(bp => bp.slug === p.slug);
            if (planRecord) {
              await supabase.from('store_subscriptions').update({
                plan_id: planRecord.id,
                status: 'active',
                billing_cycle: p.slug,
                current_period_start: new Date().toISOString(),
                current_period_end: nextDue.toISOString(),
                trial_ends_at: null,
              }).eq('id', storeSub.id);
            }
          }

          queryClient.invalidateQueries({ queryKey: ['billing-settings'] });
          queryClient.invalidateQueries({ queryKey: ['billing-gate-rpc'] });
          setPendingPlanChange(null);
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

function SectionHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md shadow-primary/20">
        <Crown className="w-5 h-5 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Assinatura</h1>
        <p className="text-sm text-muted-foreground">Gerencie seu plano e pagamentos</p>
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value, sub, accent }: {
  icon: typeof CreditCard; label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className="p-3 rounded-xl border border-border/40 bg-muted/15">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold truncate">{label}</span>
      </div>
      <p className={cn('font-bold text-sm md:text-base truncate', accent && 'text-emerald-600')}>
        {value}{sub && <span className="text-xs font-normal text-muted-foreground">{sub}</span>}
      </p>
    </div>
  );
}

function PlanCard({ plan: p, isCurrent, loading, onSelect, delay }: {
  plan: BillingPlan; isCurrent: boolean; loading: boolean; onSelect: () => void; delay: number;
}) {
  const benefits = (p.features as string[]) || [];
  const isPopular = p.is_default;
  const { months, discount, totalPrice, savings } = getPlanPricing(p);

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border-2 p-5 transition-all duration-300 animate-fade-in',
        isCurrent
          ? 'border-primary shadow-lg shadow-primary/10 bg-card'
          : 'border-border/50 bg-card hover:border-primary/30 hover:shadow-card',
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 text-[11px] px-3 py-0.5 shadow-md shadow-primary/20 whitespace-nowrap">
          <Sparkles className="w-3 h-3 mr-1" />
          Mais Popular
        </Badge>
      )}
      {isCurrent && (
        <Badge className="absolute -top-3 right-3 z-10 bg-emerald-500 text-white border-0 text-[11px] px-3 py-0.5 shadow-md shadow-emerald-500/20 whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Atual
        </Badge>
      )}

      <div className="text-center pt-3 pb-1 space-y-1.5">
        <h4 className="font-bold text-lg">{p.name}</h4>
        <div>
          <span className="text-3xl md:text-[2rem] font-extrabold tracking-tight">{formatBRL(totalPrice)}</span>
          <span className="block text-xs text-muted-foreground mt-0.5">/{months === 1 ? 'mês' : `${months} meses`}</span>
        </div>
        {discount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 rounded-full px-3 py-0.5">
            <TrendingUp className="w-3 h-3" />
            {discount}% off · Economia de {formatBRL(savings)}
          </span>
        )}
      </div>

      <div className="h-px bg-border/60 my-4" />

      {(p.max_orders_per_month != null || p.max_products != null || p.max_users != null || p.max_drivers != null) && (
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <span className="text-muted-foreground">Pedidos/mês</span>
            <p className="font-semibold">{p.max_orders_per_month ?? '∞'}</p>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <span className="text-muted-foreground">Produtos</span>
            <p className="font-semibold">{p.max_products ?? '∞'}</p>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <span className="text-muted-foreground">Usuários</span>
            <p className="font-semibold">{p.max_users ?? '∞'}</p>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <span className="text-muted-foreground">Motoboys</span>
            <p className="font-semibold">{p.max_drivers ?? '∞'}</p>
          </div>
        </div>
      )}

      <ul className="space-y-2 flex-1">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-2 text-[13px] leading-snug">
            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span className="text-foreground/80">{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5">
        {isCurrent ? (
          <div className="h-10 rounded-xl border-2 border-primary/20 flex items-center justify-center text-sm font-medium text-primary gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Plano Selecionado
          </div>
        ) : (
          <Button
            className={cn(
              'w-full rounded-xl h-10 transition-transform duration-200 active:scale-[0.97]',
              isPopular && 'shadow-md shadow-primary/15',
            )}
            variant={isPopular ? 'default' : 'outline'}
            disabled={loading}
            onClick={onSelect}
          >
            <ChevronRight className="w-4 h-4 mr-1" />
            {loading ? 'Processando...' : `Assinar ${p.name}`}
          </Button>
        )}
      </div>
    </div>
  );
}
