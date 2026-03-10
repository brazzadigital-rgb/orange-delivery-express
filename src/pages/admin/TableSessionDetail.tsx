import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Printer, CreditCard, Clock, User, ShoppingBag, X, CheckCircle, Merge, Unlink, Key, ShieldCheck, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useTableSessionDetail, useCloseTableSession, useRecalcSessionTotal } from '@/hooks/useTableSessions';
import { useMergedTables, useUnmergeTableMutation } from '@/hooks/useMergeTables';
import { useSessionTokens } from '@/hooks/useSessionToken';
import { AddItemsModal } from '@/components/admin/AddTableItemsModal';
import { CloseSessionModal } from '@/components/admin/CloseSessionModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants';

export default function TableSessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data, isLoading, refetch } = useTableSessionDetail(id || '');
  const { data: mergedTables } = useMergedTables(id || '');
  const { data: sessionTokens } = useSessionTokens(id || '');
  const unmergeMutation = useUnmergeTableMutation();
  const recalc = useRecalcSessionTotal();
  const [addItemsOpen, setAddItemsOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);

  // Auto-open add items if ?action=add
  useEffect(() => {
    if (searchParams.get('action') === 'add') setAddItemsOpen(true);
  }, [searchParams]);

  // Recalculate total when data loads
  useEffect(() => {
    if (id && data?.orders) {
      recalc.mutate(id);
    }
  }, [id, data?.orders?.length]);

  if (isLoading || !data) return <div className="p-6"><LoadingSpinner /></div>;

  const { session, orders } = data;
  const tableNum = (session.restaurant_tables as any)?.number || '?';
  const tableName = (session.restaurant_tables as any)?.name;
  const isClosed = session.status === 'closed';
  const isMaster = (session as any).session_kind === 'master';
  const displayTables = (session as any).display_tables;
  const totalAmount = orders
    .filter(o => o.status !== 'canceled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const sourceLabel: Record<string, string> = {
    customer: '👤 Cliente',
    admin: '🏪 Admin',
    waiter: '🍽️ Garçom',
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tables')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">
              {isMaster ? `Comanda Unificada — Mesas ${displayTables}` : `Mesa ${String(tableNum).padStart(2, '0')}`}
            </h1>
            {tableName && !isMaster && <span className="text-muted-foreground">— {tableName}</span>}
            <Badge variant={isClosed ? "secondary" : "default"}>
              {isClosed ? 'Fechada' : 'Aberta'}
            </Badge>
            {isMaster && (
              <Badge className="bg-purple-600 text-xs">
                <Merge className="w-3 h-3 mr-1" />Mesas unidas
              </Badge>
            )}
          </div>
          {/* Merged tables detail */}
          {isMaster && mergedTables && mergedTables.length > 0 && !isClosed && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Mesas vinculadas:</span>
              {mergedTables.map(mt => (
                <div key={mt.id} className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    Mesa {String(mt.table_number).padStart(2, '0')}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5"
                    onClick={() => mt.merged_from_session_id && unmergeMutation.mutate({
                      mergeRecordId: mt.id,
                      mergedFromSessionId: mt.merged_from_session_id,
                      masterSessionId: id!,
                    })}
                    title="Desfazer junção"
                  >
                    <Unlink className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {session.customer_name || `Cliente Mesa ${String(tableNum).padStart(2, '0')}`}
            </span>
            {session.customer_phone && <span>📞 {session.customer_phone}</span>}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {format(new Date(session.opened_at), "dd/MM HH:mm", { locale: ptBR })}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="card-premium p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Total da Comanda</p>
          <p className="text-3xl font-bold text-primary">
            R$ {totalAmount.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {orders.filter(o => o.status !== 'canceled').length} pedido(s) •
            Pagamento: <Badge variant={(session as any).payment_status === 'paid' ? 'default' : 'secondary'} className="text-xs ml-1">
              {(session as any).payment_status === 'paid' ? 'Pago' : 'Pendente'}
            </Badge>
          </p>
        </div>
        {!isClosed && (
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setAddItemsOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />Adicionar Itens
            </Button>
            <Button variant="outline" onClick={() => navigate(`/admin/table-session/${id}/receipt`)}>
              <Printer className="w-4 h-4 mr-2" />Imprimir Conta
            </Button>
            <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => setCloseModalOpen(true)}>
              <CreditCard className="w-4 h-4 mr-2" />Fechar Mesa
            </Button>
          </div>
        )}
        {isClosed && (
          <Button variant="outline" onClick={() => navigate(`/admin/table-session/${id}/receipt`)}>
            <Printer className="w-4 h-4 mr-2" />Ver Conta
          </Button>
        )}
      </div>

      {/* Session Tokens (Anti-fraud) */}
      {sessionTokens && sessionTokens.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Key className="w-5 h-5" /> Tokens de Sessão
          </h2>
          <div className="space-y-2">
            {sessionTokens.slice(0, 3).map(tk => (
              <div key={tk.id} className="card-premium p-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {tk.status === 'active' ? (
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                  ) : (
                    <ShieldX className="w-4 h-4 text-destructive" />
                  )}
                  <div>
                    <span className="font-mono text-xs">{tk.token.slice(0, 12)}…</span>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>Emitido: {format(new Date(tk.issued_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                      {tk.last_used_at && <span>• Usado: {format(new Date(tk.last_used_at), "HH:mm", { locale: ptBR })}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {tk.is_verified && (
                    <Badge variant="outline" className="text-xs border-green-300 text-green-700">PIN ✓</Badge>
                  )}
                  <Badge variant={tk.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {tk.status === 'active' ? 'Ativo' : tk.status === 'revoked' ? 'Revogado' : 'Expirado'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Timeline */}
      <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5" /> Pedidos da Comanda
      </h2>

      <div className="space-y-4">
        {orders.map((order, idx) => (
          <div key={order.id} className="card-premium p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">#{order.order_number}</span>
                <span className={cn('status-badge text-xs', ORDER_STATUS_COLORS[order.status] || 'bg-muted')}>
                  {ORDER_STATUS_LABELS[order.status] || order.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {sourceLabel[(order as any).created_by_source] || '👤 Cliente'}
                </span>
                {(order as any).original_table_number && (
                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                    Mesa {String((order as any).original_table_number).padStart(2, '0')}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(order.created_at), "HH:mm", { locale: ptBR })}
              </span>
            </div>

            <div className="space-y-1">
              {order.order_items?.map(item => (
                <div key={item.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span>{item.quantity}x {item.name_snapshot}</span>
                    <span className="font-medium">R$ {item.item_total.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {item.options_snapshot && (() => {
                    const snap = item.options_snapshot as any;
                    // New array format
                    if (Array.isArray(snap) && snap.length > 0) {
                      const extras = snap.filter((opt: any) => opt.optionName !== 'Tamanho' && opt.optionName !== 'Sabor');
                      if (extras.length === 0) return null;
                      return (
                        <ul className="text-xs text-muted-foreground mt-0.5 space-y-0.5 ml-4">
                          {extras.map((opt: any, idx: number) => (
                            <li key={idx}>• {opt.optionName}: {opt.itemLabel} {opt.priceDelta > 0 && `(+R$ ${opt.priceDelta.toFixed(2).replace('.', ',')})`}</li>
                          ))}
                        </ul>
                      );
                    }
                    // Old object format (pizza_builder)
                    if (snap.type === 'pizza_builder') {
                      const parts: string[] = [];
                      if (snap.crust) parts.push(`Borda: ${snap.crust.name}${snap.crust.price > 0 ? ` (+R$ ${snap.crust.price.toFixed(2).replace('.', ',')})` : ''}`);
                      if (snap.addons?.length > 0) snap.addons.forEach((a: any) => parts.push(`Adicional: ${a.name} x${a.qty}${a.price > 0 ? ` (+R$ ${(a.price * a.qty).toFixed(2).replace('.', ',')})` : ''}`));
                      if (snap.observation) parts.push(`Obs: ${snap.observation}`);
                      if (parts.length === 0) return null;
                      return (
                        <ul className="text-xs text-muted-foreground mt-0.5 space-y-0.5 ml-4">
                          {parts.map((p, idx) => <li key={idx}>• {p}</li>)}
                        </ul>
                      );
                    }
                    return null;
                  })()}
                </div>
              ))}
            </div>

            {order.notes && (
              <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">📝 {order.notes}</p>
            )}

            <div className="flex justify-between mt-2 pt-2 border-t border-border text-sm font-bold">
              <span>Subtotal</span>
              <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Nenhum pedido nesta comanda</p>
        </div>
      )}

      {/* Add Items Modal */}
      <AddItemsModal
        open={addItemsOpen}
        onOpenChange={setAddItemsOpen}
        session={session}
        onSuccess={() => { refetch(); setAddItemsOpen(false); }}
      />

      {/* Close/Pay Modal */}
      <CloseSessionModal
        open={closeModalOpen}
        onOpenChange={setCloseModalOpen}
        session={session}
        totalAmount={totalAmount}
        onSuccess={() => { refetch(); setCloseModalOpen(false); }}
      />
    </div>
  );
}
