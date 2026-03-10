import { useState } from 'react';
import { Timer, AlertTriangle, ChefHat, Truck, Check, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { KPIStatCard } from '@/components/management/KPIStatCard';
import { ChartCard } from '@/components/management/ChartCard';
import { InsightCard } from '@/components/management/InsightCard';
import { useOrdersEnriched, useStuckOrders, useDriverStats } from '@/hooks/useManagementMetrics';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const ORDER_LIMITS = [
  { label: 'Últimos 50 pedidos', value: 50 },
  { label: 'Últimos 100 pedidos', value: 100 },
  { label: 'Últimos 200 pedidos', value: 200 },
  { label: 'Últimos 500 pedidos', value: 500 },
];

export default function ManagementOperations() {
  const navigate = useNavigate();
  const [orderLimit, setOrderLimit] = useState(200);
  const { data: orders, isLoading } = useOrdersEnriched(orderLimit);
  const { data: stuckOrders } = useStuckOrders(10);
  const { data: drivers } = useDriverStats();

  const selectedLimitLabel = ORDER_LIMITS.find(l => l.value === orderLimit)?.label || 'Período';

  const handleExportDrivers = () => {
    if (!drivers || drivers.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = ['Motoboy', 'Telefone', 'Entregas', 'Tempo Médio (min)', 'Última Atividade'];
    const rows = drivers.map(d => [
      d.driver_name,
      d.driver_phone || '-',
      d.deliveries_count,
      (d.avg_delivery_time_min || 0).toFixed(1),
      d.last_active_at ? format(new Date(d.last_active_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `motoboys-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('Relatório exportado com sucesso!');
  };

  // Calcular métricas de tempo
  const completedOrders = orders?.filter(o => o.status === 'delivered') || [];
  
  const avgAcceptTime = completedOrders.length > 0
    ? completedOrders.reduce((sum, o) => sum + (o.time_to_accept_min || 0), 0) / completedOrders.length
    : 0;
  const avgPrepTime = completedOrders.length > 0
    ? completedOrders.reduce((sum, o) => sum + (o.prep_time_min || 0), 0) / completedOrders.length
    : 0;
  const avgDeliveryTime = completedOrders.length > 0
    ? completedOrders.reduce((sum, o) => sum + (o.delivery_time_min || 0), 0) / completedOrders.length
    : 0;
  const avgTotalTime = completedOrders.length > 0
    ? completedOrders.reduce((sum, o) => sum + (o.total_cycle_time_min || 0), 0) / completedOrders.length
    : 0;

  // Distribuição de tempos de preparo
  const prepTimeRanges = [
    { range: '0-10 min', count: 0 },
    { range: '10-20 min', count: 0 },
    { range: '20-30 min', count: 0 },
    { range: '30-40 min', count: 0 },
    { range: '40+ min', count: 0 },
  ];

  completedOrders.forEach(order => {
    const prepTime = order.prep_time_min || 0;
    if (prepTime <= 10) prepTimeRanges[0].count++;
    else if (prepTime <= 20) prepTimeRanges[1].count++;
    else if (prepTime <= 30) prepTimeRanges[2].count++;
    else if (prepTime <= 40) prepTimeRanges[3].count++;
    else prepTimeRanges[4].count++;
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Timer className="w-8 h-8 text-primary" />
            Operações
          </h1>
          <p className="text-muted-foreground">
            Métricas de tempo e SLA
          </p>
        </div>
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                {selectedLimitLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ORDER_LIMITS.map((limit) => (
                <DropdownMenuItem
                  key={limit.value}
                  onClick={() => setOrderLimit(limit.value)}
                  className="gap-2"
                >
                  {limit.label}
                  {orderLimit === limit.value && <Check className="w-4 h-4 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="gap-2" onClick={handleExportDrivers}>
            <Download className="w-4 h-4" />
            Exportar Motoboys
          </Button>
        </div>
      </div>

      {/* KPIs de Tempo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard
          title="Tempo p/ Aceitar"
          value={`${avgAcceptTime.toFixed(1)} min`}
          icon={Check}
          subtitle="Média geral"
          variant={avgAcceptTime > 5 ? 'warning' : 'success'}
        />
        <KPIStatCard
          title="Tempo de Preparo"
          value={`${avgPrepTime.toFixed(1)} min`}
          icon={ChefHat}
          subtitle="Média geral"
          variant={avgPrepTime > 25 ? 'warning' : 'success'}
        />
        <KPIStatCard
          title="Tempo de Entrega"
          value={`${avgDeliveryTime.toFixed(1)} min`}
          icon={Truck}
          subtitle="Média geral"
          variant={avgDeliveryTime > 35 ? 'warning' : 'success'}
        />
        <KPIStatCard
          title="Ciclo Total"
          value={`${avgTotalTime.toFixed(1)} min`}
          icon={Timer}
          subtitle="Do pedido à entrega"
          variant={avgTotalTime > 60 ? 'danger' : 'default'}
        />
      </div>

      {/* Alertas */}
      {stuckOrders && stuckOrders.length > 0 && (
        <InsightCard
          type="danger"
          title={`${stuckOrders.length} pedido(s) parado(s)`}
          description="Pedidos aguardando há mais de 10 minutos sem atualização de status."
          action={{
            label: 'Ver pedidos',
            onClick: () => navigate('/admin/orders'),
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Tempo de Preparo */}
        <ChartCard
          title="Distribuição - Tempo de Preparo"
          subtitle="Quantidade de pedidos por faixa"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={prepTimeRanges}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="count" fill="url(#colorGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF8A00" />
                  <stop offset="100%" stopColor="#FF6A3D" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Performance dos Motoboys */}
        <ChartCard
          title="Performance dos Motoboys"
          subtitle="Entregas e tempo médio"
        >
          <div className="space-y-3">
            {drivers?.map((driver) => (
              <div 
                key={driver.driver_id} 
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{driver.driver_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {driver.deliveries_count} entregas
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {(driver.avg_delivery_time_min || 0).toFixed(1)} min
                  </p>
                  <p className="text-xs text-muted-foreground">tempo médio</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
