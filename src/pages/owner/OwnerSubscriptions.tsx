import { formatBRL } from '@/lib/subscription-plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Crown, RefreshCw, Users, AlertTriangle, Search,
  ChevronRight, ChevronDown, DollarSign, Gift, Clock, Store,
  Mail, Calendar, User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface StoreBilling {
  id: string;
  store_id: string;
  plan_name: string;
  monthly_price: number;
  status: string;
  next_due_date: string | null;
  last_payment_date: string | null;
  last_payment_amount: number | null;
  current_plan_code: string | null;
  current_plan_months: number | null;
  current_plan_amount: number | null;
  current_plan_discount_percent: number | null;
  grace_period_days: number;
  updated_at: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  billing_cycle: string | null;
  store?: {
    id: string;
    name: string;
    slug: string | null;
    owner_email: string | null;
    created_at: string;
    is_open: boolean | null;
    phone: string | null;
    created_by: string | null;
  };
}

interface OwnerGroup {
  email: string;
  stores: StoreBilling[];
  totalMrr: number;
  activeCount: number;
  trialCount: number;
  overdueCount: number;
  createdBy: string | null;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  active:    { label: 'Ativa',        cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  trial:     { label: 'Teste Grátis', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  trialing:  { label: 'Teste Grátis', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  past_due:  { label: 'Em Atraso',    cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  suspended: { label: 'Suspensa',     cls: 'bg-red-500/10 text-red-600 border-red-500/20' },
  expired:   { label: 'Expirada',     cls: 'bg-red-500/10 text-red-600 border-red-500/20' },
  canceled:  { label: 'Cancelada',    cls: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'Cancelada',    cls: 'bg-muted text-muted-foreground border-border' },
  pending:   { label: 'Pendente',     cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
};

function getEffectiveStatus(sb: StoreBilling) {
  if (sb.status === 'trialing' || sb.status === 'trial') return 'trial';
  if (sb.status === 'active' && sb.plan_name === 'Trial') return 'trial';
  return sb.status;
}

function getTrialDaysLeft(sb: StoreBilling): number | null {
  const isTrial = getEffectiveStatus(sb) === 'trial';
  const endDate = sb.trial_ends_at || sb.next_due_date;
  if (!isTrial || !endDate) return null;
  return Math.max(0, differenceInDays(new Date(endDate), new Date()));
}

export default function OwnerSubscriptions() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOwners, setExpandedOwners] = useState<Set<string>>(new Set());

  // Fetch from store_subscriptions (new SSOT) + fallback billing_settings (legacy)
  const { data: storeBillings, isLoading } = useQuery({
    queryKey: ['owner-store-billings-unified'],
    queryFn: async () => {
      // 1. Try to fetch from store_subscriptions (new system) — non-fatal if table has no FK
      let fromSubs: StoreBilling[] = [];
      try {
        const { data: subs } = await supabase
          .from('store_subscriptions')
          .select('*, stores!inner(id, name, slug, owner_email, created_at, is_open, phone, created_by)')
          .order('created_at', { ascending: false });

        fromSubs = (subs || []).map((s: any) => ({
          id: s.id,
          store_id: s.store_id,
          plan_name: s.plan_code || s.store_name || '—',
          monthly_price: s.amount || 0,
          status: s.status,
          next_due_date: s.current_period_end,
          last_payment_date: null,
          last_payment_amount: null,
          current_plan_code: s.billing_cycle,
          current_plan_months: s.plan_months,
          current_plan_amount: s.amount,
          current_plan_discount_percent: null,
          grace_period_days: 2,
          updated_at: s.updated_at,
          trial_ends_at: s.trial_ends_at,
          current_period_end: s.current_period_end,
          billing_cycle: s.billing_cycle,
          store: s.stores ? {
            id: s.stores.id,
            name: s.stores.name,
            slug: s.stores.slug,
            owner_email: s.stores.owner_email,
            created_at: s.stores.created_at,
            is_open: s.stores.is_open,
            phone: s.stores.phone,
            created_by: s.stores.created_by,
          } : undefined,
        }));
      } catch (e) {
        console.warn('[OwnerSubscriptions] store_subscriptions query failed, using legacy only', e);
      }

      const storeIdsFromSubs = new Set(fromSubs.map(s => s.store_id));

      // 2. Fetch legacy billing_settings for stores NOT in store_subscriptions
      const { data: legacy, error: legacyError } = await supabase
        .from('billing_settings')
        .select('*, store:store_id(id, name, slug, owner_email, created_at, is_open, phone, created_by)')
        .order('updated_at', { ascending: false });
      if (legacyError) throw legacyError;

      // Map legacy billing_settings (only for stores NOT in new system)
      const fromLegacy: StoreBilling[] = (legacy || [])
        .filter((l: any) => !storeIdsFromSubs.has(l.store_id))
        .map((l: any) => ({
          id: l.id,
          store_id: l.store_id,
          plan_name: l.plan_name,
          monthly_price: l.monthly_price,
          status: l.status,
          next_due_date: l.next_due_date,
          last_payment_date: l.last_payment_date,
          last_payment_amount: l.last_payment_amount,
          current_plan_code: l.current_plan_code,
          current_plan_months: l.current_plan_months,
          current_plan_amount: l.current_plan_amount,
          current_plan_discount_percent: l.current_plan_discount_percent,
          grace_period_days: l.grace_period_days,
          updated_at: l.updated_at,
          trial_ends_at: null,
          current_period_end: null,
          billing_cycle: null,
          store: l.store,
        }));

      return [...fromSubs, ...fromLegacy];
    },
  });

  // Fetch owner profiles for names
  const ownerUserIds = useMemo(() => {
    if (!storeBillings) return [];
    const ids = new Set<string>();
    storeBillings.forEach(sb => {
      if (sb.store?.created_by) ids.add(sb.store.created_by);
    });
    return Array.from(ids);
  }, [storeBillings]);

  const { data: ownerProfiles } = useQuery({
    queryKey: ['owner-profiles', ownerUserIds],
    queryFn: async () => {
      if (ownerUserIds.length === 0) return {};
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, phone, avatar_url')
        .in('id', ownerUserIds);
      const map: Record<string, { name: string; email: string; phone: string | null; avatar_url: string | null }> = {};
      data?.forEach(p => { map[p.id] = p; });
      return map;
    },
    enabled: ownerUserIds.length > 0,
  });

  // Group by owner
  const ownerGroups = useMemo((): OwnerGroup[] => {
    if (!storeBillings) return [];
    const map = new Map<string, OwnerGroup>();

    storeBillings.forEach(sb => {
      const email = sb.store?.owner_email || 'sem-email';
      if (!map.has(email)) {
        map.set(email, {
          email,
          stores: [],
          totalMrr: 0,
          activeCount: 0,
          trialCount: 0,
          overdueCount: 0,
          createdBy: sb.store?.created_by || null,
        });
      }
      const group = map.get(email)!;
      group.stores.push(sb);

      const eff = getEffectiveStatus(sb);
      if (eff === 'active') {
        group.activeCount++;
        group.totalMrr += sb.monthly_price || 0;
      } else if (eff === 'trial') {
        group.trialCount++;
      } else if (eff === 'past_due' || eff === 'suspended') {
        group.overdueCount++;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.stores.length - a.stores.length || b.totalMrr - a.totalMrr);
  }, [storeBillings]);

  // Filtered groups
  const filtered = useMemo(() => {
    return ownerGroups.filter(g => {
      if (search) {
        const q = search.toLowerCase();
        const ownerName = ownerProfiles?.[g.createdBy || '']?.name?.toLowerCase() || '';
        const matches = g.email.toLowerCase().includes(q)
          || ownerName.includes(q)
          || g.stores.some(s => s.store?.name?.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (statusFilter !== 'all') {
        const hasStatus = g.stores.some(s => getEffectiveStatus(s) === statusFilter);
        if (!hasStatus) return false;
      }
      return true;
    });
  }, [ownerGroups, search, statusFilter, ownerProfiles]);

  // Global metrics
  const metrics = useMemo(() => {
    if (!storeBillings) return { owners: 0, stores: 0, active: 0, trial: 0, mrr: 0, overdue: 0 };
    const ownerEmails = new Set(storeBillings.map(s => s.store?.owner_email).filter(Boolean));
    const active = storeBillings.filter(s => getEffectiveStatus(s) === 'active').length;
    const trial = storeBillings.filter(s => getEffectiveStatus(s) === 'trial').length;
    const mrr = storeBillings
      .filter(s => getEffectiveStatus(s) === 'active')
      .reduce((sum, s) => sum + (s.monthly_price || 0), 0);
    const overdue = storeBillings.filter(s => {
      const eff = getEffectiveStatus(s);
      return eff === 'past_due' || eff === 'suspended';
    }).length;
    return { owners: ownerEmails.size, stores: storeBillings.length, active, trial, mrr, overdue };
  }, [storeBillings]);

  function toggleOwner(email: string) {
    setExpandedOwners(prev => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Assinaturas das Lojas</h1>
        <p className="text-muted-foreground text-sm">Visão unificada por proprietário</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard icon={User} label="Proprietários" value={metrics.owners} color="text-primary" bgColor="bg-primary/10" />
        <KPICard icon={Store} label="Lojas" value={metrics.stores} color="text-violet-500" bgColor="bg-violet-500/10" />
        <KPICard icon={Users} label="Ativas" value={metrics.active} color="text-emerald-500" bgColor="bg-emerald-500/10" />
        <KPICard icon={Gift} label="Em Teste" value={metrics.trial} color="text-blue-500" bgColor="bg-blue-500/10" />
        <KPICard icon={DollarSign} label="MRR" value={formatBRL(metrics.mrr)} color="text-emerald-500" bgColor="bg-emerald-500/10" />
        <KPICard icon={AlertTriangle} label="Inadimplentes" value={metrics.overdue} color="text-destructive" bgColor="bg-destructive/10" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, loja ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativa</SelectItem>
            <SelectItem value="trial">Teste Grátis</SelectItem>
            <SelectItem value="past_due">Em Atraso</SelectItem>
            <SelectItem value="suspended">Suspensa</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Owner Groups */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              Nenhum proprietário encontrado
            </CardContent>
          </Card>
        ) : (
          filtered.map((group) => {
            const isExpanded = expandedOwners.has(group.email);
            const profile = ownerProfiles?.[group.createdBy || ''];
            const ownerName = profile?.name || group.email.split('@')[0];
            const firstStoreDate = group.stores
              .map(s => s.store?.created_at)
              .filter(Boolean)
              .sort()[0];

            return (
              <Card key={group.email} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleOwner(group.email)}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full text-left">
                      <CardContent className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                        {/* Expand icon */}
                        <div className="shrink-0">
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>

                        {/* Owner info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{ownerName}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{group.email}</span>
                          </div>
                          {firstStoreDate && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              <Calendar className="w-3 h-3" />
                              <span>Cliente desde {format(new Date(firstStoreDate), 'MMM yyyy', { locale: ptBR })}</span>
                            </div>
                          )}
                        </div>

                        {/* Stats pills */}
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                          <StatPill icon={Store} value={group.stores.length} label="lojas" />
                          {group.activeCount > 0 && (
                            <StatPill icon={Users} value={group.activeCount} label="ativas" className="text-emerald-600 bg-emerald-500/10" />
                          )}
                          {group.trialCount > 0 && (
                            <StatPill icon={Clock} value={group.trialCount} label="trial" className="text-blue-600 bg-blue-500/10" />
                          )}
                          {group.overdueCount > 0 && (
                            <StatPill icon={AlertTriangle} value={group.overdueCount} label="atraso" className="text-amber-600 bg-amber-500/10" />
                          )}
                        </div>

                        {/* MRR */}
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">MRR</p>
                          <p className="font-bold text-sm">{group.totalMrr > 0 ? formatBRL(group.totalMrr) : '—'}</p>
                        </div>
                      </CardContent>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t">
                      {/* Mobile stats */}
                      <div className="sm:hidden flex items-center gap-2 px-4 py-2 border-b bg-muted/30 overflow-x-auto">
                        <StatPill icon={Store} value={group.stores.length} label="lojas" />
                        {group.activeCount > 0 && (
                          <StatPill icon={Users} value={group.activeCount} label="ativas" className="text-emerald-600 bg-emerald-500/10" />
                        )}
                        {group.trialCount > 0 && (
                          <StatPill icon={Clock} value={group.trialCount} label="trial" className="text-blue-600 bg-blue-500/10" />
                        )}
                      </div>

                      {group.stores.map(sb => {
                        const eff = getEffectiveStatus(sb);
                        const statusInfo = STATUS_LABELS[eff] || STATUS_LABELS.pending;
                        const trialDays = getTrialDaysLeft(sb);
                        const isTrial = eff === 'trial';

                        return (
                          <div
                            key={sb.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-colors"
                            onClick={() => navigate(`/owner/subscriptions/${sb.store_id}`)}
                          >
                            <div className="pl-5 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Store className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <p className="font-medium text-sm truncate">{sb.store?.name || '—'}</p>
                                <Badge className={cn('text-[10px] border shrink-0', statusInfo.cls)}>{statusInfo.label}</Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground pl-5">
                                {sb.store?.slug && <span className="truncate">{sb.store.slug}</span>}
                                {sb.store?.created_at && (
                                  <span>Criada {format(new Date(sb.store.created_at), 'dd/MM/yy', { locale: ptBR })}</span>
                                )}
                                {isTrial && trialDays !== null && (
                                  <span className={cn('font-medium', trialDays === 0 ? 'text-destructive' : 'text-blue-600')}>
                                    {trialDays > 0 ? `${trialDays}d restantes` : 'Trial expirado'}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold">
                                {isTrial ? 'Grátis' : formatBRL(sb.monthly_price || 0)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {isTrial ? 'Trial' : (sb.plan_name || sb.current_plan_code || '—')}
                              </p>
                            </div>

                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color, bgColor }: {
  icon: React.ElementType; label: string; value: string | number; color: string; bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', bgColor)}>
            <Icon className={cn('w-4 h-4', color)} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-lg font-bold leading-tight truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatPill({ icon: Icon, value, label, className }: {
  icon: React.ElementType; value: number; label: string; className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted', className)}>
      <Icon className="w-3 h-3" />
      {value} {label}
    </span>
  );
}
