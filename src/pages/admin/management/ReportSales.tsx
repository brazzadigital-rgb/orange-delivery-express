import { useState } from 'react';
import { TrendingUp, Download, Calendar, Check, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDailySales, useHourlySales } from '@/hooks/useManagementMetrics';
import { ChartCard } from '@/components/management/ChartCard';
import { KPIStatCard } from '@/components/management/KPIStatCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  LineChart,
  Line,
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const DATE_RANGES = [
  { label: 'Últimos 7 dias', value: 7 },
  { label: 'Últimos 14 dias', value: 14 },
  { label: 'Últimos 30 dias', value: 30 },
  { label: 'Últimos 60 dias', value: 60 },
  { label: 'Últimos 90 dias', value: 90 },
];

export default function ReportSales() {
  const [dateRange, setDateRange] = useState(30);
  const { data: dailySales, isLoading: dailyLoading } = useDailySales(dateRange);
  const { data: hourlySales, isLoading: hourlyLoading } = useHourlySales();

  const selectedRangeLabel = DATE_RANGES.find(r => r.value === dateRange)?.label || 'Período';

  const formatCurrency = (value: number) => 
    `R$ ${Number(value).toFixed(2).replace('.', ',')}`;

  const handleExport = () => {
    if (!dailySales || dailySales.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = ['Data', 'Pedidos', 'Receita Bruta', 'Descontos', 'Taxa Entrega', 'Receita Líquida', 'AOV', '% Entrega', '% Retirada', '% Mesa', '% Cancelados'];
    const rows = dailySales.map(day => [
      format(new Date(day.date), 'dd/MM/yyyy', { locale: ptBR }),
      day.orders_count,
      Number(day.gross_revenue).toFixed(2),
      Number(day.discounts_sum).toFixed(2),
      Number(day.delivery_fee_sum).toFixed(2),
      Number(day.net_revenue).toFixed(2),
      Number(day.aov).toFixed(2),
      Number(day.delivery_share).toFixed(1) + '%',
      Number(day.pickup_share).toFixed(1) + '%',
      Number(day.table_share || 0).toFixed(1) + '%',
      Number(day.cancel_rate).toFixed(1) + '%',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vendas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('Relatório exportado com sucesso!');
  };

  // Calculate totals and comparisons
  const totals = dailySales?.reduce((acc, day) => ({
    orders: acc.orders + (day.orders_count || 0),
    grossRevenue: acc.grossRevenue + Number(day.gross_revenue || 0),
    netRevenue: acc.netRevenue + Number(day.net_revenue || 0),
    discounts: acc.discounts + Number(day.discounts_sum || 0),
  }), { orders: 0, grossRevenue: 0, netRevenue: 0, discounts: 0 }) || { orders: 0, grossRevenue: 0, netRevenue: 0, discounts: 0 };

  const avgAOV = totals.orders > 0 ? totals.grossRevenue / totals.orders : 0;
  const avgOrdersPerDay = dailySales?.length ? totals.orders / dailySales.length : 0;

  // Chart data
  const chartDailyData = dailySales?.map(d => ({
    date: format(new Date(d.date), 'dd/MM', { locale: ptBR }),
    receita: Number(d.gross_revenue) || 0,
    liquido: Number(d.net_revenue) || 0,
    pedidos: d.orders_count || 0,
  })) || [];

  const chartHourlyData = hourlySales?.map(h => ({
    hora: `${h.hour}h`,
    pedidos: h.orders_count || 0,
    receita: Number(h.gross_revenue) || 0,
  })) || [];

  // Weekday distribution
  const weekdayData = dailySales?.reduce((acc, d) => {
    const dayName = format(new Date(d.date), 'EEEE', { locale: ptBR });
    acc[dayName] = (acc[dayName] || 0) + Number(d.gross_revenue || 0);
    return acc;
  }, {} as Record<string, number>) || {};

  const weekdayChartData = Object.entries(weekdayData).map(([name, value]) => ({
    dia: name.charAt(0).toUpperCase() + name.slice(1, 3),
    receita: value,
  }));

  if (dailyLoading) {
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
            <TrendingUp className="w-8 h-8 text-primary" />
            Relatório de Vendas
          </h1>
          <p className="text-muted-foreground">
            Análise detalhada de vendas e faturamento
          </p>
        </div>
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                {selectedRangeLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {DATE_RANGES.map((range) => (
                <DropdownMenuItem
                  key={range.value}
                  onClick={() => setDateRange(range.value)}
                  className="gap-2"
                >
                  {range.label}
                  {dateRange === range.value && <Check className="w-4 h-4 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border bg-card">
          <p className="text-sm text-muted-foreground">Total de Pedidos</p>
          <p className="text-3xl font-bold">{totals.orders}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Média: {avgOrdersPerDay.toFixed(1)}/dia
          </p>
        </div>
        <div className="p-5 rounded-2xl border bg-card">
          <p className="text-sm text-muted-foreground">Receita Bruta</p>
          <p className="text-3xl font-bold text-primary">{formatCurrency(totals.grossRevenue)}</p>
        </div>
        <div className="p-5 rounded-2xl border bg-card">
          <p className="text-sm text-muted-foreground">Receita Líquida</p>
          <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totals.netRevenue)}</p>
        </div>
        <div className="p-5 rounded-2xl border bg-card">
          <p className="text-sm text-muted-foreground">Ticket Médio</p>
          <p className="text-3xl font-bold">{formatCurrency(avgAOV)}</p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Receita Diária"
          subtitle="Bruto vs Líquido"
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartDailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value), 
                  name === 'receita' ? 'Bruto' : 'Líquido'
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="receita" 
                stroke="#FF8A00" 
                fill="#FF8A00" 
                fillOpacity={0.2}
                strokeWidth={2}
                name="Bruto"
              />
              <Area 
                type="monotone" 
                dataKey="liquido" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.2}
                strokeWidth={2}
                name="Líquido"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Pedidos por Dia"
          subtitle="Volume diário"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartDailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                formatter={(value: number) => [value, 'Pedidos']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="pedidos" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF8A00" />
                  <stop offset="100%" stopColor="#FF6A3D" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Vendas por Hora"
          subtitle="Distribuição horária"
          isLoading={hourlyLoading}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartHourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hora" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'pedidos' ? value : formatCurrency(value),
                  name === 'pedidos' ? 'Pedidos' : 'Receita'
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="pedidos" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Vendas por Dia da Semana"
          subtitle="Receita acumulada"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weekdayChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Receita']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="receita" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Detailed Table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Detalhamento Diário</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-sm">Data</th>
                <th className="text-left p-4 font-medium text-sm">Pedidos</th>
                <th className="text-left p-4 font-medium text-sm">Receita Bruta</th>
                <th className="text-left p-4 font-medium text-sm">Descontos</th>
                <th className="text-left p-4 font-medium text-sm">Receita Líquida</th>
                <th className="text-left p-4 font-medium text-sm">AOV</th>
                <th className="text-left p-4 font-medium text-sm">% Entrega</th>
                <th className="text-left p-4 font-medium text-sm">% Mesa</th>
                <th className="text-left p-4 font-medium text-sm">% Cancelados</th>
              </tr>
            </thead>
            <tbody>
              {dailySales?.slice().reverse().map((day) => (
                <tr key={day.date} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">
                    {format(new Date(day.date), "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                  <td className="p-4">{day.orders_count}</td>
                  <td className="p-4">{formatCurrency(Number(day.gross_revenue))}</td>
                  <td className="p-4 text-destructive">-{formatCurrency(Number(day.discounts_sum))}</td>
                  <td className="p-4 font-semibold text-emerald-600">{formatCurrency(Number(day.net_revenue))}</td>
                  <td className="p-4">{formatCurrency(Number(day.aov))}</td>
                  <td className="p-4">{Number(day.delivery_share).toFixed(1)}%</td>
                  <td className="p-4">{Number(day.table_share || 0).toFixed(1)}%</td>
                  <td className="p-4">
                    <span className={Number(day.cancel_rate) > 5 ? 'text-destructive' : ''}>
                      {Number(day.cancel_rate).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}