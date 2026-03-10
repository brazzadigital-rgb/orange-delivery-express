import { useState } from 'react';
import { Package, Download, Calendar, Check, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProductPerformance } from '@/hooks/useManagementMetrics';
import { ChartCard } from '@/components/management/ChartCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const COLORS = ['#FF8A00', '#FF6A3D', '#10B981', '#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#8B5CF6'];

export default function ReportProducts() {
  const { data: products, isLoading } = useProductPerformance();

  const formatCurrency = (value: number) => 
    `R$ ${Number(value).toFixed(2).replace('.', ',')}`;

  const handleExport = () => {
    if (!products || products.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = ['Produto', 'Categoria', 'Quantidade Vendida', 'Receita', 'Preço Médio'];
    const rows = products.map(p => [
      p.product_name,
      p.category_name,
      p.qty_sold,
      Number(p.revenue_sum).toFixed(2),
      Number(p.avg_price).toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `produtos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('Relatório exportado com sucesso!');
  };

  // Prepare chart data - safely handle null values
  const top10Products = (products || []).slice(0, 10);
  const chartData = top10Products.map(p => {
    const name = p.product_name || 'Sem nome';
    return {
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      vendas: p.qty_sold || 0,
      receita: Number(p.revenue_sum) || 0,
    };
  });

  // Category distribution - safely handle null values
  const categoryData = (products || []).reduce((acc, p) => {
    const cat = p.category_name || 'Outros';
    acc[cat] = (acc[cat] || 0) + (Number(p.revenue_sum) || 0);
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value,
  }));

  // Calculate totals
  const totalRevenue = products?.reduce((sum, p) => sum + Number(p.revenue_sum), 0) || 0;
  const totalSold = products?.reduce((sum, p) => sum + Number(p.qty_sold), 0) || 0;

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
            <Package className="w-8 h-8 text-primary" />
            Relatório de Produtos
          </h1>
          <p className="text-muted-foreground">
            Performance de vendas por produto
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border bg-card">
          <p className="text-sm text-muted-foreground">Total de Produtos</p>
          <p className="text-3xl font-bold">{products?.length || 0}</p>
        </div>
        <div className="p-5 rounded-2xl border bg-card">
          <p className="text-sm text-muted-foreground">Unidades Vendidas</p>
          <p className="text-3xl font-bold">{totalSold}</p>
        </div>
        <div className="p-5 rounded-2xl border bg-card">
          <p className="text-sm text-muted-foreground">Receita Total</p>
          <p className="text-3xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Top 10 Produtos"
          subtitle="Por quantidade vendida"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis 
                dataKey="name" 
                type="category" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                width={100}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'vendas' ? `${value} un` : formatCurrency(value),
                  name === 'vendas' ? 'Vendas' : 'Receita'
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="vendas" fill="url(#colorGradient)" radius={[0, 4, 4, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FF6A3D" />
                  <stop offset="100%" stopColor="#FF8A00" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Receita por Categoria"
          subtitle="Distribuição percentual"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Receita']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Products Table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Todos os Produtos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-sm">#</th>
                <th className="text-left p-4 font-medium text-sm">Produto</th>
                <th className="text-left p-4 font-medium text-sm">Categoria</th>
                <th className="text-left p-4 font-medium text-sm">Qtd. Vendida</th>
                <th className="text-left p-4 font-medium text-sm">Receita</th>
                <th className="text-left p-4 font-medium text-sm">Preço Médio</th>
                <th className="text-left p-4 font-medium text-sm">% do Total</th>
              </tr>
            </thead>
            <tbody>
              {products?.map((product, index) => {
                const revenuePercent = totalRevenue > 0 
                  ? (Number(product.revenue_sum) / totalRevenue) * 100 
                  : 0;
                return (
                  <tr 
                    key={product.product_id} 
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4 text-muted-foreground">{index + 1}</td>
                    <td className="p-4 font-medium">{product.product_name}</td>
                    <td className="p-4 text-muted-foreground">{product.category_name}</td>
                    <td className="p-4 font-semibold">{product.qty_sold}</td>
                    <td className="p-4 font-semibold text-primary">
                      {formatCurrency(Number(product.revenue_sum))}
                    </td>
                    <td className="p-4">{formatCurrency(Number(product.avg_price))}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(revenuePercent, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {revenuePercent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}