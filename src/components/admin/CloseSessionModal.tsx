import { useState } from 'react';
import { CreditCard, DollarSign, QrCode, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCloseTableSession, TableSessionEnriched } from '@/hooks/useTableSessions';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface CloseSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: TableSessionEnriched;
  totalAmount: number;
  onSuccess: () => void;
}

const paymentMethods = [
  { value: 'cash', label: 'Dinheiro', icon: DollarSign },
  { value: 'card', label: 'Cartão', icon: CreditCard },
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'other', label: 'Outro', icon: Smartphone },
];

export function CloseSessionModal({ open, onOpenChange, session, totalAmount, onSuccess }: CloseSessionModalProps) {
  const navigate = useNavigate();
  const closeSession = useCloseTableSession();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [printReceipt, setPrintReceipt] = useState(true);

  const handleClose = async () => {
    await closeSession.mutateAsync({
      sessionId: session.id,
      paymentMethod,
      paymentNotes: paymentNotes || undefined,
    });
    onSuccess();
    if (printReceipt) {
      navigate(`/admin/table-session/${session.id}/receipt`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fechar Mesa & Receber Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total */}
          <div className="text-center p-4 rounded-xl bg-primary/10">
            <p className="text-sm text-muted-foreground">Total da Comanda</p>
            <p className="text-3xl font-bold text-primary">
              R$ {totalAmount.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="mb-2 block">Forma de Pagamento</Label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setPaymentMethod(value)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium",
                    paymentMethod === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Observação do pagamento (opcional)</Label>
            <Input
              value={paymentNotes}
              onChange={e => setPaymentNotes(e.target.value)}
              placeholder="Ex: Dividido em 2 cartões"
            />
          </div>

          {/* Print toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={printReceipt}
              onChange={e => setPrintReceipt(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Imprimir resumo/conta para o cliente</span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleClose}
            disabled={closeSession.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {closeSession.isPending ? 'Processando...' : 'Marcar como PAGO'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
