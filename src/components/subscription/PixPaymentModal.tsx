import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBRL } from '@/lib/subscription-plans';
import { Copy, CheckCircle2, QrCode, Loader2, Shield, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface PixPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  amount: number;
  pixCopiaECola: string | null;
  qrCodeImage: string | null;
  txid: string | null;
  isLoading: boolean;
  onPaymentConfirmed?: () => void;
}

export default function PixPaymentModal({
  open,
  onOpenChange,
  planName,
  amount,
  pixCopiaECola,
  qrCodeImage,
  txid,
  isLoading,
  onPaymentConfirmed,
}: PixPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const [checking, setChecking] = useState(false);
  const [pulseQr, setPulseQr] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();

  // Pulse QR on each check
  useEffect(() => {
    if (checking) {
      setPulseQr(true);
      const t = setTimeout(() => setPulseQr(false), 600);
      return () => clearTimeout(t);
    }
  }, [checking]);

  // Poll for payment status every 5 seconds
  useEffect(() => {
    if (!open || !txid || isLoading || paid) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const checkStatus = async () => {
      try {
        setChecking(true);
        const { data, error } = await supabase.functions.invoke('efi-check-pix', {
          body: { txid },
        });
        if (error) return;
        if (data?.paid) {
          setPaid(true);
          onPaymentConfirmed?.();
          toast.success('Pagamento confirmado! Assinatura ativada.');
          queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
          queryClient.invalidateQueries({ queryKey: ['billing-gate'] });
          queryClient.invalidateQueries({ queryKey: ['billing-settings'] });
          queryClient.invalidateQueries({ queryKey: ['store-subscriptions'] });
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch {
        // silent
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
    intervalRef.current = setInterval(checkStatus, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [open, txid, isLoading, paid, queryClient]);

  useEffect(() => {
    if (!open) {
      setPaid(false);
    }
  }, [open]);

  const handleCopy = async () => {
    if (!pixCopiaECola) return;
    try {
      await navigator.clipboard.writeText(pixCopiaECola);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-float bg-transparent">
        {/* Gradient border wrapper */}
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/20 via-background to-primary/10 p-[1px]">
          <div className="rounded-2xl bg-background/95 backdrop-blur-xl overflow-hidden">
            {/* Header with gradient */}
            <div className="relative px-6 pt-6 pb-4 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/5" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <DialogHeader className="relative z-10">
                <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                      <QrCode className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background animate-pulse-soft" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Pagamento via PIX
                    </span>
                    <p className="text-xs font-normal text-muted-foreground mt-0.5">
                      Escaneie o QR Code ou copie o código
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>
            </div>

            <div className="px-6 pb-6 space-y-5">
              {/* Plan info card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300" />
                <div className="relative flex items-center justify-between rounded-2xl p-4 border border-primary/10 bg-gradient-to-r from-primary/5 to-transparent backdrop-blur-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Plano</p>
                    <p className="font-bold text-base mt-0.5">{planName}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 text-base px-4 py-1.5 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                      {formatBRL(amount)}
                    </Badge>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-14 gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping opacity-30" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-foreground">Gerando QR Code...</p>
                    <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
                  </div>
                </div>
              ) : paid ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4 animate-scale-in">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 animate-bounce-in">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-pulse-soft" />
                    <Sparkles className="absolute -bottom-1 -left-2 w-4 h-4 text-amber-400 animate-pulse-soft [animation-delay:500ms]" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                      Pagamento Confirmado!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Sua assinatura foi ativada com sucesso.
                    </p>
                  </div>
                  <Button
                    onClick={() => onOpenChange(false)}
                    className="mt-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 border-0 px-8"
                  >
                    Continuar
                  </Button>
                </div>
              ) : (
                <>
                  {/* QR Code */}
                  {qrCodeImage && (
                    <div className="flex justify-center">
                      <div className={cn(
                        "relative p-1 rounded-3xl bg-gradient-to-br from-primary/30 via-primary/10 to-primary/20 transition-all duration-500",
                        pulseQr && "scale-[1.02] shadow-xl shadow-primary/15"
                      )}>
                        <div className="bg-white rounded-[20px] p-5 shadow-inner">
                          <img
                            src={qrCodeImage}
                            alt="QR Code PIX"
                            className="w-52 h-52 object-contain"
                          />
                        </div>
                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/40 rounded-tl-3xl" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/40 rounded-tr-3xl" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary/40 rounded-bl-3xl" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/40 rounded-br-3xl" />
                      </div>
                    </div>
                  )}

                  {!qrCodeImage && !pixCopiaECola && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        Não foi possível gerar o QR Code. Tente novamente.
                      </p>
                    </div>
                  )}

                  {/* Copia e Cola */}
                  {pixCopiaECola && (
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                        PIX Copia e Cola
                      </p>
                      <button
                        onClick={handleCopy}
                        className={cn(
                          "w-full relative group rounded-xl border transition-all duration-300 text-left",
                          copied
                            ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20"
                            : "border-border hover:border-primary/30 bg-muted/30 hover:bg-muted/50"
                        )}
                      >
                        <div className="p-3 pr-14 text-xs font-mono break-all max-h-20 overflow-y-auto text-muted-foreground">
                          {pixCopiaECola}
                        </div>
                        <div className={cn(
                          "absolute top-1/2 -translate-y-1/2 right-3 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300",
                          copied
                            ? "bg-emerald-100 dark:bg-emerald-900/40"
                            : "bg-primary/10 group-hover:bg-primary/20"
                        )}>
                          {copied ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-scale-in" />
                          ) : (
                            <Copy className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      </button>
                    </div>
                  )}

                  {(qrCodeImage || pixCopiaECola) && (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-xl" />
                      <div className="relative flex flex-col items-center gap-2 py-3">
                        <div className="flex items-center gap-2">
                          {checking ? (
                            <div className="relative flex items-center gap-2">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                              </span>
                              <span className="text-xs font-medium text-primary">
                                Verificando pagamento...
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Shield className="w-3.5 h-3.5" />
                              <span>Aguardando confirmação</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse-soft"
                              style={{ animationDelay: `${i * 300}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
