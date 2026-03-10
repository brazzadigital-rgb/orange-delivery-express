import { useState } from 'react';
import { CreditCard, Download, Calendar, TrendingUp, TrendingDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDailySales } from '@/hooks/useManagementMetrics';
import { KPIStatCard } from '@/components/management/KPIStatCard';
import { ChartCard } from '@/components/management/ChartCard';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const DATE_RANGES = [
  { label: 'Últimos 7 dias', value: 7 },
  { label: 'Últimos 14 dias', value: 14 },
  { label: 'Últimos 30 dias', value: 30 },
  { label: 'Últimos 60 dias', value: 60 },
  { label: 'Últimos 90 dias', value: 90 },
];

export default function ManagementFinance() {
  const [dateRange, setDateRange] = useState(30);
  const { data: dailySales, isLoading } = useDailySales(dateRange);

  const selectedRangeLabel = DATE_RANGES.find(r => r.value === dateRange)?.label || 'Período';

  const handleExport = () => {
    if (!dailySales || dailySales.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = ['Data', 'Pedidos', 'Receita Bruta', 'Descontos', 'Receita Líquida', 'AOV', '% Pagos'];
    const rows = dailySales.map(day => [
      format(new Date(day.date), 'dd/MM/yyyy', { locale: ptBR }),
      day.orders_count,
      Number(day.gross_revenue).toFixed(2),
      Number(day.discounts_sum).toFixed(2),
      Number(day.net_revenue).toFixed(2),
      Number(day.aov).toFixed(2),
      Number(day.paid_rate).toFixed(1) + '%',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `financeiro-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('Relatório exportado com sucesso!');
  };

  // Calcular totais do período
  const totals = dailySales?.reduce((acc, day) => ({
    grossRevenue: acc.grossRevenue + Number(day.gross_revenue || 0),
    netRevenue: acc.netRevenue + Number(day.net_revenue || 0),
    discounts: acc.discounts + Number(day.discounts_sum || 0),
    deliveryFees: acc.deliveryFees + Number(day.delivery_fee_sum || 0),
    orders: acc.orders + (day.orders_count || 0),
  }), { grossRevenue: 0, netRevenue: 0, discounts: 0, deliveryFees: 0, orders: 0 });

  const chartData = dailySales?.map(d => ({
    date: format(new Date(d.date), 'dd/MM', { locale: ptBR }),
    bruto: Number(d.gross_revenue) || 0,
    liquido: Number(d.net_revenue) || 0,
  })) || [];

  const aovData = dailySales?.map(d => ({
    date: format(new Date(d.date), 'dd/MM', { locale: ptBR }),
    aov: Number(d.aov) || 0,
  })) || [];

  const formatCurrency = (value: number) => 
    `R$ ${value.toFixed(2).replace('.', ',')}`;

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-primary" />
            Financeiro
          </h1>
          <p className="text-muted-foreground">
            Faturamento e análise financeira
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
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard
          title="Receita Bruta"
          value={formatCurrency(totals?.grossRevenue || 0)}
          icon={TrendingUp}
          variant="primary"
          isLoading={isLoading}
        />
        <KPIStatCard
          title="Receita Líquida"
          value={formatCurrency(totals?.netRevenue || 0)}
          icon={TrendingUp}
          variant="success"
          isLoading={isLoading}
        />
        <KPIStatCard
          title="Descontos"
          value={formatCurrency(totals?.discounts || 0)}
          icon={TrendingDown}
          variant="warning"
          isLoading={isLoading}
        />
        <KPIStatCard
          title="Taxas de Entrega"
          value={formatCurrency(totals?.deliveryFees || 0)}
          icon={CreditCard}
          isLoading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Receita Diária"
          subtitle="Bruto vs Líquido"
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value), 
                  name === 'bruto' ? 'Bruto' : 'Líquido'
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Line type="monotone" dataKey="bruto" stroke="#FF8A00" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="liquido" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Ticket Médio"
          subtitle="AOV por dia"
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={aovData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'AOV']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="aov" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
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

      {/* Tabela de Vendas Diárias */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Vendas por Dia</h3>
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
                <th className="text-left p-4 font-medium text-sm">% Pagos</th>
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
                  <td className="p-4 font-semibold text-success">{formatCurrency(Number(day.net_revenue))}</td>
                  <td className="p-4">{formatCurrency(Number(day.aov))}</td>
                  <td className="p-4">{Number(day.paid_rate).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
