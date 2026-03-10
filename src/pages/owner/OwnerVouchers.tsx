import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Ticket, Plus, Copy, Search, CheckCircle2, Clock, XCircle, Gift, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

/* ── Cycle config ── */
const CYCLE_OPTIONS = [
  { value: 'monthly', label: 'Mensal', months: 1 },
  { value: 'semestral', label: 'Semestral', months: 6 },
  { value: 'annual', label: 'Anual', months: 12 },
] as const;

const STATUS_MAP: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  active:   { label: 'Ativo',     cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
  redeemed: { label: 'Resgatado', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20',         icon: Gift },
  expired:  { label: 'Expirado',  cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20',      icon: Clock },
  cancelled:{ label: 'Cancelado', cls: 'bg-red-500/10 text-red-600 border-red-500/20',            icon: XCircle },
};

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function OwnerVouchers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newCycle, setNewCycle] = useState<string>('monthly');
  const [newCode, setNewCode] = useState(generateCode());
  const [quantity, setQuantity] = useState(1);
  const [creating, setCreating] = useState(false);

  const { data: vouchers, isLoading, refetch } = useQuery({
    queryKey: ['owner-vouchers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*, stores:redeemed_by(name, slug)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!vouchers) return [];
    return vouchers.filter((v: any) => {
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (search && !v.code.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [vouchers, statusFilter, search]);

  const metrics = useMemo(() => {
    if (!vouchers) return { total: 0, active: 0, redeemed: 0 };
    return {
      total: vouchers.length,
      active: vouchers.filter((v: any) => v.status === 'active').length,
      redeemed: vouchers.filter((v: any) => v.status === 'redeemed').length,
    };
  }, [vouchers]);

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);
    try {
      const cycle = CYCLE_OPTIONS.find(c => c.value === newCycle)!;
      const codes: { code: string; plan_cycle: string; plan_months: number; created_by: string }[] = [];
      
      for (let i = 0; i < quantity; i++) {
        codes.push({
          code: i === 0 ? newCode : generateCode(),
          plan_cycle: cycle.value,
          plan_months: cycle.months,
          created_by: user.id,
        });
      }

      const { error } = await supabase.from('vouchers').insert(codes);
      if (error) throw error;

      toast.success(`${quantity} voucher(s) criado(s) com sucesso!`);
      setShowCreate(false);
      setNewCode(generateCode());
      setQuantity(1);
      queryClient.invalidateQueries({ queryKey: ['owner-vouchers'] });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar voucher');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from('vouchers').update({ status: 'cancelled' }).eq('id', id);
    if (error) {
      toast.error('Erro ao cancelar voucher');
      return;
    }
    toast.success('Voucher cancelado');
    queryClient.invalidateQueries({ queryKey: ['owner-vouchers'] });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="w-7 h-7 text-primary" />
            Vouchers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie e gerencie vouchers de assinatura para seus clientes
          </p>
        </div>
        <Button onClick={() => { setNewCode(generateCode()); setShowCreate(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Voucher
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: metrics.total, icon: Ticket },
          { label: 'Ativos', value: metrics.active, icon: CheckCircle2 },
          { label: 'Resgatados', value: metrics.redeemed, icon: Gift },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="redeemed">Resgatados</SelectItem>
            <SelectItem value="expired">Expirados</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resgatado por</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum voucher encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((v: any) => {
                  const cycleLabel = CYCLE_OPTIONS.find(c => c.value === v.plan_cycle)?.label || v.plan_cycle;
                  const st = STATUS_MAP[v.status] || STATUS_MAP.active;
                  const StIcon = st.icon;
                  return (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm font-semibold">{v.code}</code>
                          <button onClick={() => copyCode(v.code)} className="text-muted-foreground hover:text-foreground">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{cycleLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs border', st.cls)}>
                          <StIcon className="w-3 h-3 mr-1" />
                          {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {v.stores?.name || (v.redeemed_by ? v.redeemed_by : '—')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(v.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        {v.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleCancel(v.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              Criar Voucher
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ciclo do Plano</label>
              <Select value={newCycle} onValueChange={setNewCycle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CYCLE_OPTIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label} ({c.months} {c.months === 1 ? 'mês' : 'meses'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Código do Voucher</label>
              <div className="flex gap-2">
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="font-mono font-semibold tracking-wider"
                />
                <Button variant="outline" size="icon" onClick={() => setNewCode(generateCode())}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Quantidade</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {quantity > 1 ? `Serão gerados ${quantity} vouchers com códigos únicos` : 'Será gerado 1 voucher com o código acima'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating} className="gap-2">
              {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Criar {quantity > 1 ? `${quantity} Vouchers` : 'Voucher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
