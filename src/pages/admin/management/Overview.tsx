import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  ChefHat,
  Truck,
  Users,
  CreditCard,
  Percent,
  Timer,
  Package,
  ArrowRight,
  Download,
  Calendar as CalendarIcon
} from 'lucide-react';
import { 
  useTodayKPIs, 
  useDailySales, 
  useHourlySales, 
  useStuckOrders,
  useProductPerformance 
} from '@/hooks/useManagementMetrics';
import { useAdminOrders } from '@/hooks/useAdmin';
import { KPIStatCard } from '@/components/management/KPIStatCard';
import { ChartCard } from '@/components/management/ChartCard';
import { InsightCard } from '@/components/management/InsightCard';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const COLORS = ['#FF8A00', '#FF6A3D', '#10B981', '#6366F1', '#EC4899'];

export default function ManagementOverview() {
  const navigate = useNavigate();
  const [daysFilter, setDaysFilter] = useState<string>('14');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  const days = daysFilter === 'custom' 
    ? (customDateRange.from && customDateRange.to 
        ? Math.ceil((customDateRange.to.getTime() - customDateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 14)
    : parseInt(daysFilter);

  const { data: kpis, isLoading: kpisLoading } = useTodayKPIs();
  const { data: dailySales, isLoading: dailyLoading } = useDailySales(days);
  const { data: hourlySales, isLoading: hourlyLoading } = useHourlySales();
  const { data: stuckOrders } = useStuckOrders(10);
  const { data: topProducts } = useProductPerformance();
  const { data: allOrders } = useAdminOrders();

  // Função para exportar CSV
  const handleExportCSV = () => {
    if (!dailySales || dailySales.length === 0) {
      toast.error('Nenhum dado disponível para exportar');
      return;
    }

    const headers = ['Data', 'Pedidos', 'Receita Bruta', 'Descontos', 'Taxa Entrega', 'Receita Líquida', 'Ticket Médio'];
    const rows = dailySales.map(d => [
      d.date,
      d.orders_count,
      Number(d.gross_revenue).toFixed(2),
      Number(d.discounts_sum).toFixed(2),
      Number(d.delivery_fee_sum).toFixed(2),
      Number(d.net_revenue).toFixed(2),
      Number(d.aov).toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-vendas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast.success('Relatório exportado com sucesso!');
  };

  // Calcular métricas de pagamento
  const paymentMethods = allOrders?.reduce((acc, order) => {
    const method = order.payment_method === 'pix' ? 'PIX' : 
                   order.payment_method === 'card' ? 'Cartão' : 'Dinheiro';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const paymentData = Object.entries(paymentMethods).map(([name, value]) => ({
    name,
    value,
  }));

  // Delivery vs Pickup vs Table
  const deliveryData = [
    { 
      name: 'Entrega', 
      value: allOrders?.filter(o => o.delivery_type === 'delivery').length || 0 
    },
    { 
      name: 'Retirada', 
      value: allOrders?.filter(o => o.delivery_type === 'pickup').length || 0 
    },
    { 
      name: 'Mesa', 
      value: allOrders?.filter(o => o.delivery_type === 'table').length || 0 
    },
  ].filter(d => d.value > 0);

  // Formatar dados do gráfico diário
  const chartDailyData = dailySales?.map(d => ({
    date: format(new Date(d.date), 'dd/MM', { locale: ptBR }),
    receita: Number(d.gross_revenue) || 0,
    pedidos: d.orders_count || 0,
  })) || [];

  // Formatar dados do gráfico por hora
  const chartHourlyData = hourlySales?.map(h => ({
    hora: `${h.hour}h`,
    pedidos: h.orders_count || 0,
    receita: Number(h.gross_revenue) || 0,
  })) || [];

  const formatCurrency = (value: number) => 
    `R$ ${value.toFixed(2).replace('.', ',')}`;

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground">
            Dashboard executivo • {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro de período */}
          <Select value={daysFilter} onValueChange={setDaysFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Picker (quando custom) */}
          {daysFilter === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 min-w-[200px] justify-start">
                  <CalendarIcon className="w-4 h-4" />
                  {customDateRange.from ? (
                    customDateRange.to ? (
                      <>
                        {format(customDateRange.from, 'dd/MM')} - {format(customDateRange.to, 'dd/MM')}
                      </>
                    ) : (
                      format(customDateRange.from, 'dd/MM/yyyy')
                    )
                  ) : (
                    'Selecionar datas'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={customDateRange}
                  onSelect={(range) => setCustomDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Botão Exportar */}
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleExportCSV}
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard
          title="Pedidos Hoje"
          value={kpis?.ordersCount || 0}
          icon={ShoppingBag}
          variant="primary"
          isLoading={kpisLoading}
        />
        <KPIStatCard
          title="Receita Bruta"
          value={formatCurrency(kpis?.grossRevenue || 0)}
          icon={DollarSign}
          variant="success"
          isLoading={kpisLoading}
        />
        <KPIStatCard
          title="Ticket Médio"
          value={formatCurrency(kpis?.aov || 0)}
          icon={TrendingUp}
          isLoading={kpisLoading}
        />
        <KPIStatCard
          title="Taxa Cancelamento"
          value={`${(kpis?.cancelRate || 0).toFixed(1)}%`}
          icon={Percent}
          variant={kpis?.cancelRate && kpis.cancelRate > 5 ? 'danger' : 'default'}
          isLoading={kpisLoading}
        />
      </div>

      {/* Tempos Operacionais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPIStatCard
          title="Tempo p/ Aceitar"
          value={`${kpis?.avgAcceptTime || 0} min`}
          icon={Timer}
          subtitle="Média do dia"
          variant={kpis?.avgAcceptTime && kpis.avgAcceptTime > 5 ? 'warning' : 'default'}
          isLoading={kpisLoading}
        />
        <KPIStatCard
          title="Tempo de Preparo"
          value={`${kpis?.avgPrepTime || 0} min`}
          icon={ChefHat}
          subtitle="Média do dia"
          variant={kpis?.avgPrepTime && kpis.avgPrepTime > 25 ? 'warning' : 'default'}
          isLoading={kpisLoading}
        />
        <KPIStatCard
          title="Tempo de Entrega"
          value={`${kpis?.avgDeliveryTime || 0} min`}
          icon={Truck}
          subtitle="Média do dia"
          variant={kpis?.avgDeliveryTime && kpis.avgDeliveryTime > 35 ? 'warning' : 'default'}
          isLoading={kpisLoading}
        />
      </div>

      {/* Alertas */}
      {stuckOrders && stuckOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InsightCard
            type="danger"
            title={`${stuckOrders.length} pedido(s) parado(s)`}
            description={`Existem pedidos aguardando há mais de 10 minutos. Verifique a cozinha.`}
            action={{
              label: 'Ver pedidos',
              onClick: () => navigate('/admin/orders'),
            }}
          />
        </div>
      )}

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita por Dia */}
        <ChartCard
          title="Receita por Dia"
          subtitle="Últimos 14 dias"
          isLoading={dailyLoading}
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartDailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `R$${v}`}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Receita']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="receita" 
                stroke="#FF8A00" 
                strokeWidth={3}
                dot={{ fill: '#FF8A00', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#FF6A3D' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pedidos por Hora */}
        <ChartCard
          title="Pedidos por Hora"
          subtitle="Distribuição horária"
          isLoading={hourlyLoading}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartHourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="hora" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Bar 
                dataKey="pedidos" 
                fill="url(#colorGradient)" 
                radius={[6, 6, 0, 0]}
              />
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

      {/* Gráficos Secundários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Mix de Pagamentos */}
        <ChartCard
          title="Métodos de Pagamento"
          subtitle="Distribuição geral"
        >
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {paymentData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Delivery vs Retirada */}
        <ChartCard
          title="Tipo de Pedido"
          subtitle="Entrega vs Retirada vs Mesa"
        >
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={deliveryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {deliveryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Produtos */}
        <ChartCard
          title="Top Produtos"
          subtitle="Mais vendidos"
          action={
            <Link to="/admin/management/reports/products">
              <Button variant="ghost" size="sm" className="gap-1">
                Ver todos <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          }
        >
          <div className="space-y-3">
            {topProducts?.slice(0, 5).map((product, index) => (
              <div 
                key={product.product_id} 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.product_name}</p>
                  <p className="text-xs text-muted-foreground">{product.qty_sold} vendidos</p>
                </div>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(Number(product.revenue_sum))}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/orders">
          <div className="p-5 rounded-2xl border bg-card hover:bg-muted/50 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group">
            <Package className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-1">Ver Pedidos</h3>
            <p className="text-sm text-muted-foreground">Gerenciar pedidos ativos</p>
          </div>
        </Link>
        <Link to="/admin/management/customers">
          <div className="p-5 rounded-2xl border bg-card hover:bg-muted/50 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group">
            <Users className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-1">Clientes</h3>
            <p className="text-sm text-muted-foreground">CRM e segmentação</p>
          </div>
        </Link>
        <Link to="/admin/management/finance">
          <div className="p-5 rounded-2xl border bg-card hover:bg-muted/50 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group">
            <CreditCard className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-1">Financeiro</h3>
            <p className="text-sm text-muted-foreground">Faturamento e relatórios</p>
          </div>
        </Link>
        <Link to="/admin/management/reports/sales">
          <div className="p-5 rounded-2xl border bg-card hover:bg-muted/50 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group">
            <TrendingUp className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-1">Relatórios</h3>
            <p className="text-sm text-muted-foreground">Análises avançadas</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
