import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantTables } from '@/hooks/useTableOrders';
import { useActiveTableSessions, TableSessionEnriched } from '@/hooks/useTableSessions';
import { useAllActiveMerges } from '@/hooks/useMergeTables';
import { useOpenTableSession } from '@/hooks/useWaiterTableActions';
import { MergeTablesModal } from '@/components/admin/MergeTablesModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Merge, Eye, Plus, ShoppingCart, User } from 'lucide-react';

export default function WaiterTables() {
  const navigate = useNavigate();
  const { data: tables, isLoading } = useRestaurantTables();
  const { data: sessions } = useActiveTableSessions();
  const { data: activeMerges } = useAllActiveMerges();
  const openSession = useOpenTableSession();

  const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());
  const [mergeModalOpen, setMergeModalOpen] = useState(false);

  // Open table modal state
  const [openTableModal, setOpenTableModal] = useState(false);
  const [openTableTarget, setOpenTableTarget] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  if (isLoading) return <div className="p-6"><LoadingSpinner /></div>;

  const sessionByTable = new Map<string, TableSessionEnriched>();
  sessions?.forEach(s => sessionByTable.set(s.table_id, s));

  const mergeByTableId = new Map<string, any>();
  activeMerges?.forEach(m => mergeByTableId.set(m.table_id, m));

  const toggleMerge = (id: string) => {
    setSelectedForMerge(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const canMerge = selectedForMerge.size >= 2;
  const selectedMergeTables = tables?.filter(t => selectedForMerge.has(t.id)) || [];
  const areas = [...new Set(tables?.map(t => t.area || 'Sem área').filter(Boolean) || [])];

  const handleOpenTable = (table: any) => {
    setOpenTableTarget(table);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerNotes('');
    setOpenTableModal(true);
  };

  const handleConfirmOpenTable = async () => {
    if (!openTableTarget || !customerName.trim()) return;
    const result = await openSession.mutateAsync({
      tableId: openTableTarget.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      notes: customerNotes.trim() || undefined,
    });
    setOpenTableModal(false);
    // Navigate to session add items
    if (result?.id) {
      navigate(`/waiter/table-session/${result.id}`);
    }
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Mesas</h1>
        {canMerge && (
          <Button size="sm" onClick={() => setMergeModalOpen(true)} className="bg-purple-600 hover:bg-purple-700">
            <Merge className="w-4 h-4 mr-1" />Unir ({selectedForMerge.size})
          </Button>
        )}
      </div>

      {areas.map(area => (
        <div key={area} className="mb-6">
          <h2 className="font-semibold text-muted-foreground mb-2">{area}</h2>
          <div className="grid grid-cols-2 gap-3">
            {tables?.filter(t => (t.area || 'Sem área') === area).map(t => {
              const session = sessionByTable.get(t.id);
              const isOccupied = !!session;
              const mergeRecord = mergeByTableId.get(t.id);
              const isMergedChild = !!mergeRecord;
              const isMaster = isOccupied && (session as any)?.session_kind === 'master';
              const displayTables = (session as any)?.display_tables;
              const sessionKind = (session as any)?.session_kind || 'single';

              return (
                <div
                  key={t.id}
                  className={cn(
                    'card-premium p-3 relative',
                    t.is_active ? '' : 'opacity-50',
                    isMaster ? 'border-2 border-purple-400' : isOccupied ? 'border-2 border-primary/40' : '',
                    isMergedChild && 'border-2 border-purple-200 opacity-75',
                    selectedForMerge.has(t.id) && 'ring-2 ring-purple-500'
                  )}
                >
                  {/* Merge checkbox */}
                  {!isMergedChild && t.is_active && sessionKind !== 'merged' && (
                    <div className="absolute top-1 left-1">
                      <Checkbox
                        checked={selectedForMerge.has(t.id)}
                        onCheckedChange={() => toggleMerge(t.id)}
                      />
                    </div>
                  )}

                  <div className="text-center">
                    <p className="font-bold text-lg">{String(t.number).padStart(2, '0')}</p>
                    {t.name && <p className="text-xs text-muted-foreground">{t.name}</p>}

                    {isMaster && (
                      <Badge className="text-[10px] bg-purple-600 mt-1">
                        <Merge className="w-2.5 h-2.5 mr-0.5" />{displayTables}
                      </Badge>
                    )}

                    {isMergedChild && (
                      <p className="text-[10px] text-purple-600 mt-1">Unida</p>
                    )}

                    {/* Customer info */}
                    {isOccupied && !isMergedChild && session.customer_name && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                        <User className="w-3 h-3" />{session.customer_name}
                      </p>
                    )}

                    {isOccupied && !isMergedChild && (
                      <p className="text-sm font-bold text-primary mt-1">
                        R$ {((session as any).total_amount || 0).toFixed(2).replace('.', ',')}
                      </p>
                    )}

                    {/* Status badge */}
                    {!isOccupied && !isMergedChild && t.is_active && (
                      <Badge variant="secondary" className="text-[10px] mt-1">Disponível</Badge>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 mt-2">
                      {/* Available: Open table */}
                      {!isOccupied && !isMergedChild && t.is_active && (
                        <Button size="sm" className="w-full text-xs h-8" onClick={() => handleOpenTable(t)}>
                          <Plus className="w-3 h-3 mr-1" />Abrir Mesa
                        </Button>
                      )}

                      {/* Occupied: View session + Add items */}
                      {isOccupied && !isMergedChild && (
                        <>
                          <Button size="sm" variant="outline" className="w-full text-xs h-8"
                            onClick={() => navigate(`/waiter/table-session/${session.id}`)}>
                            <Eye className="w-3 h-3 mr-1" />Ver Comanda
                          </Button>
                          <Button size="sm" variant="default" className="w-full text-xs h-8"
                            onClick={() => navigate(`/waiter/table-session/${session.id}`)}>
                            <ShoppingCart className="w-3 h-3 mr-1" />Adicionar
                          </Button>
                        </>
                      )}

                      {/* Merged child: view master */}
                      {isMergedChild && (
                        <Button size="sm" variant="ghost" className="w-full text-xs h-7"
                          onClick={() => navigate(`/waiter/table-session/${mergeRecord.master_session_id}`)}>
                          <Eye className="w-3 h-3 mr-1" />Master
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Open Table Modal */}
      <Dialog open={openTableModal} onOpenChange={setOpenTableModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Abrir Mesa {openTableTarget ? String(openTableTarget.number).padStart(2, '0') : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do cliente *</Label>
              <Input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Ex: João Silva"
                autoFocus
              />
            </div>
            <div>
              <Label>WhatsApp / Telefone (opcional)</Label>
              <Input
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <Label>Observação (opcional)</Label>
              <Input
                value={customerNotes}
                onChange={e => setCustomerNotes(e.target.value)}
                placeholder="Ex: Aniversário, preferência..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTableModal(false)}>Cancelar</Button>
            <Button
              onClick={handleConfirmOpenTable}
              disabled={!customerName.trim() || openSession.isPending}
            >
              {openSession.isPending ? 'Abrindo...' : 'Abrir e Fazer Pedido'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
