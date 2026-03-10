import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, QrCode, Trash2, Pencil, Printer, ToggleLeft, ToggleRight, Globe, Users, Receipt, ShoppingCart, Bell, Eye, DoorOpen, Merge, Unlink } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useRestaurantTables, useCreateTable, useUpdateTable, useDeleteTable, RestaurantTable } from '@/hooks/useTableOrders';
import { useActiveTableSessions, TableSessionEnriched } from '@/hooks/useTableSessions';
import { useAllActiveMerges } from '@/hooks/useMergeTables';
import { MergeTablesModal } from '@/components/admin/MergeTablesModal';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminTables() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const storeId = useStoreId();
  const { data: tables, isLoading } = useRestaurantTables();
  const { data: sessions } = useActiveTableSessions();
  const { data: activeMerges } = useAllActiveMerges();
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [formData, setFormData] = useState({ number: '', name: '', area: '', table_pin: '' });
  const [selectedForPrint, setSelectedForPrint] = useState<Set<string>>(new Set());
  const [customDomain, setCustomDomain] = useState<string | null>(null);
  const [closingSession, setClosingSession] = useState<TableSessionEnriched | null>(null);
  const [closingLoading, setClosingLoading] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());
  const [mergeModalOpen, setMergeModalOpen] = useState(false);

  useEffect(() => {
    supabase
      .from('stores')
      .select('custom_domain')
      .eq('id', storeId)
      .single()
      .then(({ data }) => {
        if (data?.custom_domain) setCustomDomain(data.custom_domain);
      });
  }, []);

  // Realtime: alert when waiter/admin adds items to a table session
  useEffect(() => {
    const channel = supabase
      .channel('table-orders-staff-alert')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: 'delivery_type=eq.table' },
        (payload) => {
          const order = payload.new as any;
          // Only alert for staff-created orders
          if (order.created_by_source !== 'admin' && order.created_by_source !== 'waiter') return;

          const sourceLabel = order.created_by_source === 'waiter' ? 'Garçom' : 'Admin';
          toast.info(`🍽️ ${sourceLabel} adicionou itens`, {
            description: `Pedido #${order.order_number} na mesa`,
            duration: 6000,
            action: order.table_session_id ? {
              label: 'Ver comanda',
              onClick: () => navigate(`/admin/table-session/${order.table_session_id}`),
            } : undefined,
          });

          // Refresh sessions data
          queryClient.invalidateQueries({ queryKey: ['active-table-sessions'] });
          queryClient.invalidateQueries({ queryKey: ['table-session-detail'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const baseUrl = customDomain
    ? (customDomain.startsWith('http') ? customDomain : `https://${customDomain}`)
    : window.location.origin;

  // Map sessions by table_id for quick lookup
  const sessionByTable = new Map<string, TableSessionEnriched>();
  sessions?.forEach(s => sessionByTable.set(s.table_id, s));

  // Map merged tables: tableId -> merge record
  const mergeByTableId = new Map<string, any>();
  activeMerges?.forEach(m => mergeByTableId.set(m.table_id, m));

  // Map: sessionId -> session to check if a session is merged
  const mergedSessionIds = new Set<string>();
  sessions?.forEach(s => {
    if ((s as any).session_kind === 'merged') mergedSessionIds.add(s.id);
  });

  const toggleMergeSelection = (id: string) => {
    setSelectedForMerge(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const canMerge = selectedForMerge.size >= 2;
  const selectedMergeTables = tables?.filter(t => selectedForMerge.has(t.id)) || [];

  // Map sessionId -> table number for showing master table on merged children
  const sessionToTableNum = new Map<string, number>();
  sessions?.forEach(s => {
    const tbl = tables?.find(t => t.id === s.table_id);
    if (tbl) sessionToTableNum.set(s.id, tbl.number);
  });

  const handleSubmit = async () => {
    if (!formData.number) return;
    if (editingTable) {
      await updateTable.mutateAsync({
        id: editingTable.id,
        number: parseInt(formData.number),
        name: formData.name || undefined,
        area: formData.area || undefined,
      });
      // Save PIN separately (not in typed hook)
      if (formData.table_pin !== ((editingTable as any).table_pin || '')) {
        await supabase.from('restaurant_tables').update({ table_pin: formData.table_pin || null } as any).eq('id', editingTable.id);
      }
    } else {
      const result = await createTable.mutateAsync({
        number: parseInt(formData.number),
        name: formData.name || undefined,
        area: formData.area || undefined,
      });
      if (formData.table_pin && result?.id) {
        await supabase.from('restaurant_tables').update({ table_pin: formData.table_pin } as any).eq('id', result.id);
      }
    }
    setFormOpen(false);
    setEditingTable(null);
    setFormData({ number: '', name: '', area: '', table_pin: '' });
  };

  const openEdit = (t: RestaurantTable) => {
    setEditingTable(t);
    setFormData({ number: String(t.number), name: t.name || '', area: t.area || '', table_pin: (t as any).table_pin || '' });
    setFormOpen(true);
  };

  const openNew = () => {
    setEditingTable(null);
    const nextNum = tables?.length ? Math.max(...tables.map(t => t.number)) + 1 : 1;
    setFormData({ number: String(nextNum), name: '', area: '', table_pin: '' });
    setFormOpen(true);
  };

  const togglePrintSelection = (id: string) => {
    setSelectedForPrint(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const printQRCodes = (overrideTables?: RestaurantTable[]) => {
    const toPrint = overrideTables || tables?.filter(t => selectedForPrint.has(t.id)) || [];
    if (toPrint.length === 0) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const cards = toPrint.map(t => `
      <div style="border:2px solid #333;border-radius:16px;padding:24px;text-align:center;width:280px;break-inside:avoid;margin:12px;">
        <h2 style="font-size:24px;margin:0 0 4px;">Mesa ${String(t.number).padStart(2, '0')}</h2>
        ${t.name ? `<p style="color:#666;margin:0 0 12px;">${t.name}</p>` : '<div style="height:12px;"></div>'}
        <div style="display:inline-block;padding:12px;background:#fff;border-radius:12px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${baseUrl}/t/${t.qr_token}`)}" width="200" height="200" />
        </div>
        <p style="font-size:12px;color:#888;margin:12px 0 0;">Aponte a câmera e faça seu pedido</p>
      </div>
    `).join('');
    printWindow.document.write(`
      <html><head><title>QR Codes - Mesas</title>
      <style>body { font-family: system-ui, sans-serif; display: flex; flex-wrap: wrap; justify-content: center; padding: 20px; }
      @media print { body { padding: 0; } }</style></head><body>${cards}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleCloseSession = async () => {
    if (!closingSession) return;
    setClosingLoading(true);
    try {
      // Update all pending orders for this session to 'delivered'
      await supabase
        .from('orders')
        .update({ status: 'delivered', payment_status: 'paid' })
        .eq('table_session_id', closingSession.id)
        .in('status', ['created', 'accepted', 'preparing', 'ready']);

      // Close the session
      await supabase
        .from('table_sessions')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', closingSession.id);

      // If this is a master session, also close merged sessions and release merge records
      if ((closingSession as any).session_kind === 'master') {
        // Release merged_tables records
        await supabase
          .from('merged_tables')
          .update({ status: 'released' })
          .eq('master_session_id', closingSession.id);

        // Close all merged sessions
        const { data: mergedSessions } = await supabase
          .from('table_sessions')
          .select('id')
          .eq('merged_into_session_id', closingSession.id)
          .eq('status', 'open');

        if (mergedSessions) {
          for (const ms of mergedSessions) {
            await supabase
              .from('table_sessions')
              .update({ status: 'closed', closed_at: new Date().toISOString() })
              .eq('id', ms.id);
          }
        }
      }

      toast.success('Mesa fechada e liberada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['active-table-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      queryClient.invalidateQueries({ queryKey: ['all-active-merges'] });
    } catch (err) {
      toast.error('Erro ao fechar mesa');
    } finally {
      setClosingLoading(false);
      setClosingSession(null);
    }
  };

  if (isLoading) return <div className="p-6"><LoadingSpinner /></div>;

  return (
    <div className="p-6">
      {!customDomain && (
        <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm flex items-center gap-2">
          <Globe className="w-4 h-4 shrink-0" />
          <span>Os QR Codes estão usando a URL de preview. Configure o <strong>domínio personalizado</strong> em Configurações.</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mesas</h1>
          <p className="text-muted-foreground">Gerencie as mesas, comandas e QR Codes do salão</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canMerge && (
            <Button onClick={() => setMergeModalOpen(true)} variant="default" className="bg-purple-600 hover:bg-purple-700">
              <Merge className="w-4 h-4 mr-2" />Unir Mesas ({selectedForMerge.size})
            </Button>
          )}
          {selectedForMerge.size > 0 && !canMerge && (
            <Button variant="outline" disabled>
              <Merge className="w-4 h-4 mr-2" />Selecione +1 mesa
            </Button>
          )}
          {tables && tables.length > 0 && (
            <Button onClick={() => { printQRCodes(tables); }} variant="outline">
              <Printer className="w-4 h-4 mr-2" />Imprimir Todos
            </Button>
          )}
          {selectedForPrint.size > 0 && (
            <Button onClick={() => printQRCodes()} variant="outline">
              <Printer className="w-4 h-4 mr-2" />Imprimir Selecionados ({selectedForPrint.size})
            </Button>
          )}
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" />Nova Mesa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables?.map(t => {
          const session = sessionByTable.get(t.id);
          const isOccupied = !!session;
          const mergeRecord = mergeByTableId.get(t.id);
          const isMergedChild = !!mergeRecord;
          const isMaster = isOccupied && (session as any)?.session_kind === 'master';
          const sessionKind = (session as any)?.session_kind || 'single';
          const displayTables = (session as any)?.display_tables;

          return (
            <div
              key={t.id}
              className={cn(
                "card-premium p-4 relative transition-all border-2",
                !t.is_active && "opacity-50",
                isMaster ? "border-purple-400 bg-purple-50/50" : isOccupied ? "border-primary/50 bg-primary/5" : "border-transparent",
                isMergedChild && "border-purple-200 bg-purple-50/30 opacity-75",
                selectedForPrint.has(t.id) && "ring-2 ring-primary",
                selectedForMerge.has(t.id) && "ring-2 ring-purple-500"
              )}
            >
              {/* Merge checkbox */}
              {!isMergedChild && t.is_active && sessionKind !== 'merged' && (
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedForMerge.has(t.id)}
                    onCheckedChange={() => toggleMergeSelection(t.id)}
                  />
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="pl-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg">Mesa {String(t.number).padStart(2, '0')}</h3>
                    {isMaster && (
                      <Badge className="text-xs bg-purple-600">
                        <Merge className="w-3 h-3 mr-1" />Mesas {displayTables}
                      </Badge>
                    )}
                    {isMergedChild && (
                      <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                        Unida à Mesa {String(sessionToTableNum.get(mergeRecord.master_session_id) || '?').padStart(2, '0')}
                      </Badge>
                    )}
                    {!isMaster && !isMergedChild && (
                      <Badge variant={isOccupied ? "default" : "secondary"} className="text-xs">
                        {isOccupied ? 'Ocupada' : 'Disponível'}
                      </Badge>
                    )}
                  </div>
                  {t.name && <p className="text-sm text-muted-foreground">{t.name}</p>}
                  {t.area && <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{t.area}</span>}
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => updateTable.mutate({ id: t.id, is_active: !t.is_active })}>
                    {t.is_active ? <ToggleRight className="w-3 h-3 text-green-500" /> : <ToggleLeft className="w-3 h-3 text-destructive" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteTable.mutate(t.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Merged child info */}
              {isMergedChild && (
                <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-sm text-purple-700 mb-3 text-center">
                  Controlada pela comanda master
                  <Button size="sm" variant="link" className="text-purple-700 text-xs h-auto p-0 ml-1"
                    onClick={() => navigate(`/admin/table-session/${mergeRecord.master_session_id}`)}>
                    Ver comanda
                  </Button>
                </div>
              )}

              {/* Session Info (only for non-merged-child) */}
              {isOccupied && session && !isMergedChild && (
                <div className="space-y-2 mb-3 p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium">{session.customer_name || `Cliente Mesa ${String(t.number).padStart(2, '0')}`}</span>
                  </div>
                  {session.customer_phone && (
                    <p className="text-xs text-muted-foreground pl-5">📞 {session.customer_phone}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold text-primary">
                      R$ {((session as any).total_amount || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Abertura:</span>
                    <span>{format(new Date(session.opened_at), "HH:mm", { locale: ptBR })}</span>
                  </div>
                </div>
              )}

              {/* QR Code */}
              {!isMergedChild && (
                <div className="flex justify-center py-2 cursor-pointer" onClick={() => togglePrintSelection(t.id)}>
                  <QRCodeSVG value={`${baseUrl}/t/${t.qr_token}`} size={isOccupied ? 80 : 120} />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-1 mt-2 flex-wrap justify-center">
                {isOccupied && session && !isMergedChild && (
                  <>
                    <Button size="sm" variant="outline" className="text-xs h-7"
                      onClick={() => navigate(`/admin/table-session/${session.id}`)}>
                      <Eye className="w-3 h-3 mr-1" />Comanda
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7"
                      onClick={() => navigate(`/admin/table-session/${session.id}?action=add`)}>
                      <ShoppingCart className="w-3 h-3 mr-1" />Adicionar
                    </Button>
                    {isMaster && (
                      <Button size="sm" variant="outline" className="text-xs h-7 border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
                        onClick={() => navigate(`/admin/table-session/${session.id}?action=unmerge`)}>
                        <Unlink className="w-3 h-3 mr-1" />Desvincular
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" className="text-xs h-7"
                      onClick={() => setClosingSession(session)}>
                      <DoorOpen className="w-3 h-3 mr-1" />Fechar
                    </Button>
                  </>
                )}
                {!isMergedChild && (
                  <Button size="sm" variant="ghost" className="text-xs h-7"
                    onClick={() => printQRCodes([t])}>
                    <Printer className="w-3 h-3 mr-1" />QR
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(!tables || tables.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma mesa cadastrada</p>
          <p className="text-sm">Crie mesas para gerar QR Codes</p>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTable ? 'Editar Mesa' : 'Nova Mesa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Número *</Label>
              <Input type="number" value={formData.number} onChange={e => setFormData(p => ({ ...p, number: e.target.value }))} />
            </div>
            <div>
              <Label>Nome (opcional)</Label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Mesa VIP" />
            </div>
            <div>
              <Label>Área (opcional)</Label>
              <Input value={formData.area} onChange={e => setFormData(p => ({ ...p, area: e.target.value }))} placeholder="Ex: Salão, Varanda" />
            </div>
            <div>
              <Label>PIN da Mesa (anti-fraude, opcional)</Label>
              <Input value={formData.table_pin} onChange={e => setFormData(p => ({ ...p, table_pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="Ex: 1234" maxLength={4} />
              <p className="text-xs text-muted-foreground mt-1">4 dígitos impressos no adesivo da mesa para verificação</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createTable.isPending || updateTable.isPending}>
              {editingTable ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Session Confirmation */}
      <AlertDialog open={!!closingSession} onOpenChange={(open) => !open && setClosingSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar mesa e liberar?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os pedidos pendentes serão marcados como pagos e entregues. A mesa ficará disponível novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closingLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseSession} disabled={closingLoading}>
              {closingLoading ? 'Fechando...' : 'Fechar Mesa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Merge Tables Modal */}
      <MergeTablesModal
        open={mergeModalOpen}
        onOpenChange={(open) => {
          setMergeModalOpen(open);
          if (!open) setSelectedForMerge(new Set());
        }}
        selectedTables={selectedMergeTables}
        sessionByTable={sessionByTable}
      />
    </div>
  );
}
