import { useState, useMemo } from 'react';
import { Users, Search, Filter, X, Eye, Mail, Phone, ShoppingBag, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useCustomerStats, CustomerStats } from '@/hooks/useManagementMetrics';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const SEGMENT_FILTERS = [
  { label: 'Todos', value: 'all' },
  { label: 'VIP', value: 'vip' },
  { label: 'Ativo', value: 'active' },
  { label: 'Em risco', value: 'at_risk' },
  { label: 'Inativo', value: 'inactive' },
];

export default function ManagementCustomers() {
  const { data: customers, isLoading } = useCustomerStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerStats | null>(null);

  const getSegmentBadge = (score: number) => {
    if (score <= 20) return { label: 'VIP', className: 'bg-emerald-500/10 text-emerald-600', value: 'vip' };
    if (score <= 50) return { label: 'Ativo', className: 'bg-blue-500/10 text-blue-600', value: 'active' };
    if (score <= 70) return { label: 'Em risco', className: 'bg-amber-500/10 text-amber-600', value: 'at_risk' };
    return { label: 'Inativo', className: 'bg-red-500/10 text-red-600', value: 'inactive' };
  };

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    return customers.filter(customer => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.includes(searchQuery);

      // Segment filter
      const segment = getSegmentBadge(customer.churn_risk_score);
      const matchesSegment = segmentFilter === 'all' || segment.value === segmentFilter;

      return matchesSearch && matchesSegment;
    });
  }, [customers, searchQuery, segmentFilter]);

  const formatCurrency = (value: number) => 
    `R$ ${Number(value).toFixed(2).replace('.', ',')}`;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            CRM Clientes
          </h1>
          <p className="text-muted-foreground">
            Gerencie sua base de clientes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, telefone ou email..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              {SEGMENT_FILTERS.find(f => f.value === segmentFilter)?.label || 'Filtros'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Segmento</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SEGMENT_FILTERS.map((filter) => (
              <DropdownMenuItem
                key={filter.value}
                onClick={() => setSegmentFilter(filter.value)}
                className="gap-2"
              >
                {filter.label}
                {segmentFilter === filter.value && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredCustomers.length} cliente(s) encontrado(s)
      </p>

      {/* Table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-sm">Cliente</th>
                <th className="text-left p-4 font-medium text-sm">Contato</th>
                <th className="text-left p-4 font-medium text-sm">Pedidos</th>
                <th className="text-left p-4 font-medium text-sm">Total Gasto</th>
                <th className="text-left p-4 font-medium text-sm">Ticket Médio</th>
                <th className="text-left p-4 font-medium text-sm">Última Compra</th>
                <th className="text-left p-4 font-medium text-sm">Segmento</th>
                <th className="text-left p-4 font-medium text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => {
                const segment = getSegmentBadge(customer.churn_risk_score);
                return (
                  <tr 
                    key={customer.user_id} 
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-medium">{customer.name || 'Sem nome'}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{customer.phone || customer.email || '-'}</p>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold">{customer.total_orders}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-primary">
                        {formatCurrency(customer.total_spent)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span>{formatCurrency(customer.avg_ticket)}</span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {customer.last_order_at 
                        ? format(new Date(customer.last_order_at), "dd/MM/yyyy", { locale: ptBR })
                        : '-'
                      }
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium',
                        segment.className
                      )}>
                        {segment.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="gap-1"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <Eye className="w-4 h-4" />
                        Ver perfil
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Perfil do Cliente</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedCustomer.name || 'Sem nome'}</h3>
                  <span className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium',
                    getSegmentBadge(selectedCustomer.churn_risk_score).className
                  )}>
                    {getSegmentBadge(selectedCustomer.churn_risk_score).label}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Contato</h4>
                {selectedCustomer.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                )}
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                  <p className="text-2xl font-bold">{selectedCustomer.total_orders}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total Gasto</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(selectedCustomer.total_spent)}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedCustomer.avg_ticket)}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">Última Compra</p>
                  <p className="text-lg font-semibold">
                    {selectedCustomer.last_order_at 
                      ? format(new Date(selectedCustomer.last_order_at), "dd/MM/yyyy", { locale: ptBR })
                      : '-'
                    }
                  </p>
                </div>
              </div>

              {/* Days since last order */}
              <div className="p-4 rounded-xl border">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dias sem comprar</p>
                    <p className="text-lg font-semibold">{selectedCustomer.days_since_last_order || 0} dias</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
