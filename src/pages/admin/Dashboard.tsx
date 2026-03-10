import { Link } from 'react-router-dom';
import { ShoppingBag, DollarSign, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { useAdminOrders } from '@/hooks/useAdmin';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminDashboard() {
  const { data: allOrders, isLoading } = useAdminOrders();

  // Calculate stats from real data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayOrders = allOrders?.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate >= today;
  }) || [];

  const todayRevenue = todayOrders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, order) => sum + order.total, 0);

  const deliveredOrders = allOrders?.filter(o => o.status === 'delivered') || [];
  const totalOrders = allOrders?.length || 0;
  const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders.length / totalOrders) * 100) : 0;

  const recentOrders = allOrders?.slice(0, 5) || [];

  const stats = [
    { icon: ShoppingBag, label: 'Pedidos Hoje', value: String(todayOrders.length), change: '+12%' },
    { icon: DollarSign, label: 'Faturamento Hoje', value: `R$ ${todayRevenue.toFixed(2).replace('.', ',')}`, change: '+8%' },
    { icon: Clock, label: 'Tempo Médio', value: '28 min', change: '-5%' },
    { icon: TrendingUp, label: 'Taxa de Entrega', value: `${deliveryRate}%`, change: '+2%' },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ icon: Icon, label, value, change }) => (
          <div key={label} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                {change}
              </span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pedidos Recentes</h2>
          <Link to="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
            Ver todos <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum pedido recente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/admin/orders/${order.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">#{order.order_number}</span>
                  </div>
                  <div>
                    <p className="font-medium">{order.profiles?.name || 'Cliente'}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      R$ {order.total.toFixed(2).replace('.', ',')}
                    </p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
