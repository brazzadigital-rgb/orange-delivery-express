import { useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ClipboardList, LayoutGrid, User, LogOut, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { useAdminTableCalls } from '@/hooks/useTableCalls';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const navItems = [
  { icon: ClipboardList, label: 'Pedidos', path: '/waiter/orders' },
  { icon: LayoutGrid, label: 'Mesas', path: '/waiter/tables' },
  { icon: Bell, label: 'Chamados', path: '/waiter/calls', hasBadge: true },
  { icon: User, label: 'Perfil', path: '/waiter/profile' },
];

export function WaiterLayout() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { config } = useAppConfig();
  const { pendingCount } = useAdminTableCalls();
  const queryClient = useQueryClient();
  const notifiedOrdersRef = useRef<Set<string>>(new Set());

  // Listen for ANY table order becoming "ready" and notify the waiter
  useEffect(() => {
    if (!user) return;

    // Track orders already known as ready to avoid re-notifying
    const knownReadyRef = notifiedOrdersRef.current;

    const notifyReady = (order: any) => {
      if (knownReadyRef.has(order.id)) return;
      knownReadyRef.add(order.id);

      // Play sound
      const audio = new Audio('/sounds/bell.mp3');
      audio.volume = 0.9;
      audio.play().catch(() => {});

      // Vibrate
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 100, 300]);
      }

      const tableLabel = order.restaurant_tables?.number
        ? ` • Mesa ${order.restaurant_tables.number}`
        : '';

      toast.success(`🔔 Pedido #${order.order_number} PRONTO!${tableLabel}`, {
        description: 'O pedido está pronto para ser servido.',
        duration: 15000,
        action: {
          label: 'Ver Pedidos',
          onClick: () => {
            window.location.href = '/waiter/orders';
          },
        },
      });

      queryClient.invalidateQueries({ queryKey: ['table-orders'] });
    };

    // 1. Realtime subscription — listen to ALL order updates (table orders)
    const channel = supabase
      .channel(`waiter-ready-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const order = payload.new as any;
          const oldOrder = payload.old as any;

          // Only notify for table orders that just became ready
          if (
            order.delivery_type === 'table' &&
            order.kitchen_status === 'ready' &&
            oldOrder.kitchen_status !== 'ready'
          ) {
            notifyReady(order);
          }
        }
      )
      .subscribe();

    // 2. Fallback polling every 10s for ready table orders
    let pollActive = true;
    const poll = async () => {
      if (!pollActive) return;
      try {
        const { data } = await supabase
          .from('orders')
          .select('id, order_number, table_id, restaurant_tables(number)')
          .eq('delivery_type', 'table')
          .eq('kitchen_status', 'ready')
          .order('created_at', { ascending: false })
          .limit(20);

        if (data) {
          data.forEach((o: any) => notifyReady(o));
        }
      } catch {}
      if (pollActive) setTimeout(poll, 10000);
    };
    const pollTimeout = setTimeout(poll, 10000);

    return () => {
      pollActive = false;
      clearTimeout(pollTimeout);
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {config?.app_logo_url ? (
            <img src={config.app_logo_url} alt="" className="h-8 object-contain" />
          ) : (
            <span className="font-bold">{config?.app_name || 'Garçom'}</span>
          )}
          <span className="text-sm opacity-80">• Garçom</span>
        </div>
        <button onClick={() => signOut()} className="p-2 rounded-lg hover:bg-white/10">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <main>
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 safe-area-pb">
        <div className="flex justify-around py-2">
          {navItems.map(({ icon: Icon, label, path, hasBadge }) => {
            const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-4 py-1 text-xs transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
                {hasBadge && pendingCount > 0 && (
                  <span className="absolute -top-0.5 right-1 bg-destructive text-destructive-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
