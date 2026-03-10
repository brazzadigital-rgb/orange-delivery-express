import { Bell, CheckCircle2, XCircle, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminTableCalls } from '@/hooks/useTableCalls';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function WaiterCalls() {
  const { calls, isLoading, attendCall, cancelCall, pendingCount } = useAdminTableCalls();
  const pending = calls.filter(c => c.status === 'pendente');

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Chamados
        </h1>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="animate-pulse">
            {pendingCount}
          </Badge>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum chamado pendente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(call => (
            <div key={call.id} className="card-premium p-4 border-l-4 border-l-destructive">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-medium">Mesa</span>
                  <span className="text-lg font-bold leading-none">{String(call.table_number).padStart(2, '0')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(call.created_at), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {call.message && (
                    <div className="flex items-start gap-1.5 mt-1">
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{call.message}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="flex-1" onClick={() => attendCall.mutate(call.id)} disabled={attendCall.isPending}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Atender
                </Button>
                <Button size="sm" variant="outline" onClick={() => cancelCall.mutate(call.id)} disabled={cancelCall.isPending}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
