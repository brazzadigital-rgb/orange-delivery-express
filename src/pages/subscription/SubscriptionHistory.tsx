import { useMySubscriptionPayments } from '@/hooks/useSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBRL } from '@/lib/subscription-plans';

const PAYMENT_STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: typeof CheckCircle2 }> = {
  approved: { label: 'Aprovado', variant: 'default', icon: CheckCircle2 },
  pending: { label: 'Pendente', variant: 'secondary', icon: Clock },
  rejected: { label: 'Rejeitado', variant: 'destructive', icon: XCircle },
  refunded: { label: 'Estornado', variant: 'secondary', icon: XCircle },
};

export default function SubscriptionHistory() {
  const { data: payments, isLoading } = useMySubscriptionPayments();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center gap-3 pt-6 pb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/subscription')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Histórico de Pagamentos</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !payments?.length ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => {
              const info = PAYMENT_STATUS[payment.status] || PAYMENT_STATUS.pending;
              const Icon = info.icon;
              return (
                <Card key={payment.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        payment.status === 'approved' ? 'bg-success/10' : 'bg-muted'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          payment.status === 'approved' ? 'text-success' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold">{formatBRL(payment.amount || 0)}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.paid_at
                            ? format(new Date(payment.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                            : format(new Date(payment.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={info.variant}>{info.label}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
