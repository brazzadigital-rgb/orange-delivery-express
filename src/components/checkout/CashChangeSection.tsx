import { useState, useEffect } from 'react';
import { Banknote, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCheckoutStore } from '@/hooks/useCheckoutStore';
import { cn } from '@/lib/utils';

interface CashChangeSectionProps {
  total: number;
}

const suggestedAmounts = [50, 100, 200];

export function CashChangeSection({ total }: CashChangeSectionProps) {
  const { 
    cashChangeNeeded, 
    cashChangeFor, 
    setCashChange 
  } = useCheckoutStore();
  
  const [inputValue, setInputValue] = useState(
    cashChangeFor ? cashChangeFor.toFixed(2).replace('.', ',') : ''
  );
  const [error, setError] = useState<string | null>(null);

  // Calculate change amount
  const changeAmount = cashChangeFor && cashChangeFor > total 
    ? cashChangeFor - total 
    : null;

  useEffect(() => {
    if (!cashChangeNeeded) {
      setInputValue('');
      setError(null);
      setCashChange(false, undefined, undefined);
    }
  }, [cashChangeNeeded, setCashChange]);

  const handleToggle = (checked: boolean) => {
    setCashChange(checked, undefined, undefined);
    if (!checked) {
      setInputValue('');
      setError(null);
    }
  };

  const handleInputChange = (value: string) => {
    // Allow only numbers and comma
    const cleaned = value.replace(/[^\d,]/g, '');
    setInputValue(cleaned);
    
    // Parse value
    const numericValue = parseFloat(cleaned.replace(',', '.'));
    
    if (isNaN(numericValue) || numericValue <= 0) {
      setError(null);
      setCashChange(true, undefined, undefined);
      return;
    }
    
    if (numericValue <= total) {
      setError(`Valor deve ser maior que R$ ${total.toFixed(2).replace('.', ',')}`);
      setCashChange(true, undefined, undefined);
      return;
    }
    
    setError(null);
    setCashChange(true, numericValue, numericValue - total);
  };

  const handleSuggestedAmount = (amount: number) => {
    if (amount <= total) {
      setError(`Valor deve ser maior que R$ ${total.toFixed(2).replace('.', ',')}`);
      return;
    }
    setInputValue(amount.toFixed(2).replace('.', ','));
    setError(null);
    setCashChange(true, amount, amount - total);
  };

  return (
    <section className="card-premium p-4">
      <h2 className="font-semibold mb-3 flex items-center gap-2">
        <Banknote className="w-5 h-5 text-primary" />
        Pagamento em Dinheiro
      </h2>
      
      {/* Toggle for change needed */}
      <div className="flex items-center justify-between py-3 border-b border-border">
        <div>
          <p className="font-medium">Precisa de troco?</p>
          <p className="text-sm text-muted-foreground">
            Informe o valor para calcularmos o troco
          </p>
        </div>
        <Switch 
          checked={cashChangeNeeded}
          onCheckedChange={handleToggle}
        />
      </div>

      {/* Change amount input */}
      {cashChangeNeeded && (
        <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div>
            <Label htmlFor="changeFor" className="text-sm font-medium">
              Troco para quanto?
            </Label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="changeFor"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                className={cn(
                  "pl-10 text-lg font-semibold",
                  error && "border-destructive focus-visible:ring-destructive"
                )}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive mt-1">{error}</p>
            )}
          </div>

          {/* Suggested amounts */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Sugestões rápidas:</p>
            <div className="flex gap-2">
              {suggestedAmounts.map((amount) => {
                const isSelected = cashChangeFor === amount;
                const isDisabled = amount <= total;
                
                return (
                  <button
                    key={amount}
                    onClick={() => handleSuggestedAmount(amount)}
                    disabled={isDisabled}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : isDisabled
                        ? "border-border bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    R$ {amount}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calculated change display */}
          {changeAmount !== null && changeAmount > 0 && (
            <div className="p-3 rounded-xl bg-success/10 border border-success/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Você vai receber de troco:</p>
                  <p className="text-lg font-bold text-success">
                    R$ {changeAmount.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!cashChangeNeeded && (
        <p className="text-sm text-muted-foreground pt-3">
          Pague ao receber seu pedido. Nosso entregador leva troco.
        </p>
      )}
    </section>
  );
}