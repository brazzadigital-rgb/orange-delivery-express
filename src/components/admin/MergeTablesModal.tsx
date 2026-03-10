import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMergeTablesMutation } from '@/hooks/useMergeTables';
import { RestaurantTable } from '@/hooks/useTableOrders';
import { TableSessionEnriched } from '@/hooks/useTableSessions';
import { Merge } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTables: RestaurantTable[];
  sessionByTable: Map<string, TableSessionEnriched>;
}

export function MergeTablesModal({ open, onOpenChange, selectedTables, sessionByTable }: Props) {
  const [masterTableId, setMasterTableId] = useState<string>('');
  const mergeMutation = useMergeTablesMutation();

  const handleMerge = async () => {
    const masterTable = selectedTables.find(t => t.id === masterTableId);
    if (!masterTable) return;

    const otherTables = selectedTables
      .filter(t => t.id !== masterTableId)
      .map(t => ({
        tableId: t.id,
        tableNumber: t.number,
        sessionId: sessionByTable.get(t.id)?.id || null,
      }));

    await mergeMutation.mutateAsync({
      masterTableId: masterTable.id,
      masterTableNumber: masterTable.number,
      otherTables,
    });

    onOpenChange(false);
    setMasterTableId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="w-5 h-5" />
            Unir Mesas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione a mesa <strong>principal (master)</strong>. Os pedidos das outras mesas serão movidos para a comanda desta mesa.
          </p>

          <div>
            <Label className="mb-2 block">Mesa principal:</Label>
            <RadioGroup value={masterTableId} onValueChange={setMasterTableId}>
              {selectedTables.map(t => {
                const session = sessionByTable.get(t.id);
                return (
                  <div key={t.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted">
                    <RadioGroupItem value={t.id} id={`master-${t.id}`} />
                    <label htmlFor={`master-${t.id}`} className="flex-1 cursor-pointer">
                      <span className="font-bold">Mesa {String(t.number).padStart(2, '0')}</span>
                      {t.name && <span className="text-muted-foreground ml-1">— {t.name}</span>}
                      {session && (
                        <span className="text-xs text-primary ml-2">
                          (R$ {(session.total_amount || 0).toFixed(2).replace('.', ',')})
                        </span>
                      )}
                    </label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            ⚠️ Após a união, todos os pedidos serão consolidados na comanda da mesa principal. 
            O fechamento e pagamento serão feitos apenas pela mesa master.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={handleMerge} 
            disabled={!masterTableId || mergeMutation.isPending}
          >
            {mergeMutation.isPending ? 'Unindo...' : 'Confirmar União'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
