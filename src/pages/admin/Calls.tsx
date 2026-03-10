import { useState } from 'react';
import { Bell, CheckCircle2, XCircle, Clock, MessageSquare, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminTableCalls } from '@/hooks/useTableCalls';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FilterStatus = 'pendente' | 'atendido' | 'cancelado' | 'all';

export default function AdminCalls() {
  const { calls, isLoading, attendCall, cancelCall, pendingCount } = useAdminTableCalls();
  const [filter, setFilter] = useState<FilterStatus>('pendente');

  const filtered = filter === 'all' ? calls : calls.filter(c => c.status === filter);

  const filters: { value: FilterStatus; label: string; count?: number }[] = [
    { value: 'pendente', label: 'Pendentes', count: pendingCount },
    { value: 'atendido', label: 'Atendidos' },
    { value: 'cancelado', label: 'Cancelados' },
    { value: 'all', label: 'Todos' },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Chamados de Atendimento
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chamados em tempo real dos clientes nas mesas
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1 animate-pulse">
            {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
              filter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span className="bg-destructive text-white text-xs rounded-full px-1.5 min-w-[20px] text-center">
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Call List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum chamado {filter !== 'all' ? filter : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(call => (
            <div
              key={call.id}
              className={cn(
                'card-premium p-4 flex items-start gap-4 transition-all',
                call.status === 'pendente' && 'border-l-4 border-l-destructive animate-in slide-in-from-left-2'
              )}
            >
              {/* Mesa Number */}
              <div className={cn(
                'w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0',
                call.status === 'pendente' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
              )}>
                <span className="text-xs font-medium">Mesa</span>
                <span className="text-xl font-bold leading-none">{String(call.table_number).padStart(2, '0')}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(call.created_at), "HH:mm", { locale: ptBR })}
                    <span className="mx-1">•</span>
                    {format(new Date(call.created_at), "dd/MM", { locale: ptBR })}
                  </span>
                  <Badge variant={
                    call.status === 'pendente' ? 'destructive' :
                    call.status === 'atendido' ? 'default' : 'secondary'
                  } className="text-xs">
                    {call.status === 'pendente' ? 'Pendente' :
                     call.status === 'atendido' ? 'Atendido' : 'Cancelado'}
                  </Badge>
                </div>

                {call.message && (
                  <div className="flex items-start gap-1.5 mt-1">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-foreground">{call.message}</p>
                  </div>
                )}

                {call.attended_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Atendido às {format(new Date(call.attended_at), "HH:mm")}
                  </p>
                )}
              </div>

              {/* Actions */}
              {call.status === 'pendente' && (
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => attendCall.mutate(call.id)}
                    disabled={attendCall.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Atender
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelCall.mutate(call.id)}
                    disabled={cancelCall.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
