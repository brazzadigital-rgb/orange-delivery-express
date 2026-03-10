import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAdminOrders, useAdminDrivers } from '@/hooks/useAdmin';
import { useUpdateOrderStatus, useAssignDriver } from '@/hooks/useOrderActions';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ChefHat, Package, Clock, AlertCircle, Truck, UserCheck, ShoppingBag, LogOut, Maximize, Minimize } from 'lucide-react';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const columns = [
  { id: 'accepted', label: 'Aguardando Preparo', icon: Clock, color: 'bg-blue-500', nextStatus: 'preparing', nextLabel: 'Iniciar Preparo' },
  { id: 'preparing', label: 'Em Preparo', icon: ChefHat, color: 'bg-purple-500', nextStatus: 'ready', nextLabel: 'Marcar Pronto' },
  { id: 'ready', label: 'Prontos', icon: Package, color: 'bg-green-500', nextStatus: null, nextLabel: null },
];

export default function KitchenDisplay() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: orders, isLoading, refetch } = useAdminOrders();
  const { data: drivers } = useAdminDrivers();
  const updateStatus = useUpdateOrderStatus();
  const assignDriver = useAssignDriver();

  const [driverDialog, setDriverDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check user roles
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (error) throw error;
      return data?.map(r => r.role) || [];
    },
    enabled: !!user,
  });

  const canAccess = userRoles?.includes('admin') || userRoles?.includes('staff');

  // Check auth and role
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/login?redirect=/kitchen-display');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !rolesLoading && user && userRoles && !canAccess) {
      navigate('/minha-loja');
    }
  }, [user, authLoading, rolesLoading, userRoles, canAccess, navigate]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('kitchen-display-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Fullscreen handling
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, newStatus });
      toast.success('Status atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriver || !selectedOrderId) return;
    try {
      await assignDriver.mutateAsync({ orderId: selectedOrderId, driverId: selectedDriver });
      setDriverDialog(false);
      setSelectedOrderId(null);
      setSelectedDriver('');
    } catch (error) {
      toast.error('Erro ao atribuir motoboy');
    }
  };

  const openDriverDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDriverDialog(true);
  };

  const getTimeColor = (createdAt: string) => {
    const minutes = differenceInMinutes(new Date(), new Date(createdAt));
    if (minutes > 30) return 'text-destructive';
    if (minutes > 15) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth/login');
  };

  if (authLoading || rolesLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!canAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact Header */}
      <header className="flex-shrink-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Cozinha (KDS)</h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="rounded-xl"
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="rounded-xl text-muted-foreground hover:text-destructive"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* KDS Content */}
      <main className="flex-1 p-4 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {columns.map((column) => {
            const columnOrders = orders?.filter((o) => o.status === column.id) || [];
            const Icon = column.icon;

            return (
              <div key={column.id} className="bg-muted/30 rounded-2xl p-4 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border flex-shrink-0">
                  <div className={cn('w-3 h-3 rounded-full', column.color)} />
                  <Icon className="w-5 h-5" />
                  <h2 className="font-semibold flex-1">{column.label}</h2>
                  <span className={cn(
                    "text-sm font-bold px-2.5 py-1 rounded-full",
                    columnOrders.length > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {columnOrders.length}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
                  {columnOrders.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <Icon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum pedido</p>
                    </div>
                  ) : (
                    columnOrders.map((order) => {
                      const timeColor = getTimeColor(order.created_at);
                      const isLate = differenceInMinutes(new Date(), new Date(order.created_at)) > 30;
                      
                      return (
                        <div
                          key={order.id}
                          className={cn(
                            "bg-card rounded-xl p-4 shadow-sm border transition-all hover:shadow-md",
                            isLate ? "border-destructive/50 animate-pulse" : "border-border/50"
                          )}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-2xl">#{order.order_number}</span>
                              {isLate && <AlertCircle className="w-5 h-5 text-destructive" />}
                            </div>
                            <div className={cn("flex items-center gap-1 text-sm font-medium", timeColor)}>
                              <Clock className="w-4 h-4" />
                              {formatDistanceToNow(new Date(order.created_at), {
                                addSuffix: false,
                                locale: ptBR,
                              })}
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm font-medium text-muted-foreground">
                              {order.profiles?.name || 'Cliente'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.delivery_type === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}
                            </p>
                          </div>

                          {/* Order Items Preview */}
                          {order.order_items && order.order_items.length > 0 && (
                            <div className="mb-3 p-2.5 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-1 mb-1.5">
                                <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">
                                  {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'itens'}
                                </span>
                              </div>
                              <ul className="space-y-1">
                                {order.order_items.slice(0, 6).map((item) => (
                                  <li key={item.id} className="text-sm flex items-start gap-1.5">
                                    <span className="font-bold text-primary min-w-[24px]">
                                      {item.quantity}x
                                    </span>
                                    <span className="flex-1 line-clamp-1">{item.name_snapshot}</span>
                                  </li>
                                ))}
                                {order.order_items.length > 6 && (
                                  <li className="text-xs text-muted-foreground italic">
                                    +{order.order_items.length - 6} mais...
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          {column.nextStatus && (
                            <button
                              onClick={() => handleStatusChange(order.id, column.nextStatus!)}
                              disabled={updateStatus.isPending}
                              className={cn(
                                "w-full py-3.5 rounded-xl text-sm font-semibold transition-all",
                                "bg-primary text-primary-foreground hover:bg-primary/90",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                "active:scale-[0.98]"
                              )}
                            >
                              {column.nextLabel}
                            </button>
                          )}

                          {column.id === 'ready' && order.delivery_type === 'delivery' && (
                            <button
                              onClick={() => openDriverDialog(order.id)}
                              disabled={assignDriver.isPending}
                              className={cn(
                                "w-full py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                                "bg-success text-white hover:bg-success/90",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                "active:scale-[0.98]"
                              )}
                            >
                              <UserCheck className="w-4 h-4" />
                              Atribuir Motoboy
                            </button>
                          )}

                          {column.id === 'ready' && order.delivery_type === 'pickup' && (
                            <div className="text-center py-2">
                              <span className="text-sm text-success font-medium">
                                ✓ Aguardando retirada
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Driver Assignment Dialog */}
      <Dialog open={driverDialog} onOpenChange={setDriverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Motoboy</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Selecione o motoboy</label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Escolher motoboy..." />
              </SelectTrigger>
              <SelectContent>
                {drivers?.map((driver) => (
                  <SelectItem key={driver.user_id} value={driver.user_id}>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      {driver.profiles?.name || 'Motoboy'}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDriverDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignDriver} 
              disabled={!selectedDriver || assignDriver.isPending}
              className="bg-success hover:bg-success/90"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Atribuir e Despachar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
