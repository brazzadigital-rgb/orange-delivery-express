import { formatBRL } from '@/lib/subscription-plans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, DollarSign, TrendingUp, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const COLORS = ['hsl(28, 100%, 50%)', 'hsl(158, 64%, 42%)', 'hsl(220, 14%, 70%)'];

export default function OwnerSubscriptionReports() {
  const navigate = useNavigate();

  // Fetch from store_subscriptions (new SSOT) with billing_plans join
  const { data: subscriptions } = useQuery({
    queryKey: ['owner-subscription-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_subscriptions')
        .select('*, billing_plans!inner(name, slug, price_monthly)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    if (!subscriptions) return null;

    // Group by plan
    const planMap = new Map<string, { name: string; count: number; mrr: number }>();
    subscriptions.forEach((s: any) => {
      const planName = s.billing_plans?.name || '—';
      const planSlug = s.billing_plans?.slug || 'unknown';
      const key = planSlug;
      if (!planMap.has(key)) {
        planMap.set(key, { name: planName, count: 0, mrr: 0 });
      }
      const entry = planMap.get(key)!;
      if (s.status === 'active') {
        entry.count++;
        entry.mrr += s.billing_plans?.price_monthly || 0;
      }
    });
    const byPlan = Array.from(planMap.values());

    const byStatus = [
      { name: 'Ativas', value: subscriptions.filter((s: any) => s.status === 'active').length },
      { name: 'Em Teste', value: subscriptions.filter((s: any) => s.status === 'trialing').length },
      { name: 'Inadimplentes', value: subscriptions.filter((s: any) => s.status === 'past_due' || s.status === 'suspended').length },
      { name: 'Canceladas', value: subscriptions.filter((s: any) => s.status === 'canceled' || s.status === 'cancelled' || s.status === 'expired').length },
    ].filter((s) => s.value > 0);

    const totalMRR = byPlan.reduce((s, p) => s + p.mrr, 0);
    const totalActive = subscriptions.filter((s: any) => s.status === 'active').length;

    return { byPlan, byStatus, totalMRR, totalActive, total: subscriptions.length };
  }, [subscriptions]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/owner/subscriptions')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Relatórios de Assinatura</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.totalActive || 0}</p>
            <p className="text-xs text-muted-foreground">Assinantes ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{formatBRL(stats?.totalMRR || 0)}</p>
            <p className="text-xs text-muted-foreground">MRR total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{formatBRL((stats?.totalMRR || 0) * 12)}</p>
            <p className="text-xs text-muted-foreground">ARR projetado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Total assinaturas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Receita Mensal por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats?.byPlan || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v: number) => formatBRL(v)} />
                <Bar dataKey="mrr" fill="hsl(28, 100%, 50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {stats?.byStatus && stats.byStatus.length > 0 ? (
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={stats.byStatus}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {stats.byStatus.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 text-sm">
                  {stats.byStatus.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span>{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
