import { Bell, Package, Tag, CheckCheck, Check } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/useNotifications';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const notificationIcons: Record<string, any> = {
  order: Package,
  promo: Tag,
  system: Bell,
};

function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card-premium p-4 flex gap-3">
          <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Notifications() {
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const navigate = useNavigate();

  const unreadCount = notifications?.filter(n => !n.read_at).length || 0;

  const handleNotificationClick = async (notification: typeof notifications extends (infer T)[] ? T : never) => {
    // Mark as read if unread
    if (!notification.read_at) {
      await markAsRead.mutateAsync(notification.id);
    }
    
    // Navigate based on notification type/data
    if (notification.data?.orderId) {
      navigate(`/app/orders/${notification.data.orderId}`);
    } else if (notification.type === 'promo') {
      navigate('/app/home');
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await markAsRead.mutateAsync(notificationId);
    toast.success('Notificação marcada como lida');
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
    toast.success('Todas as notificações marcadas como lidas');
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Notificações" 
        rightElement={
          unreadCount > 0 ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
              className="text-primary text-sm font-medium"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Ler todas
            </Button>
          ) : null
        }
      />

      <div className="px-4 pb-8">
        {isLoading ? (
          <NotificationSkeleton />
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification, index) => {
              const Icon = notificationIcons[notification.type] || Bell;
              const isUnread = !notification.read_at;

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'card-premium p-4 animate-fade-in cursor-pointer transition-all duration-200 active:scale-[0.98]',
                    isUnread ? 'bg-accent/50 border-primary/20 hover:bg-accent/70' : 'hover:bg-muted/50'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex gap-4">
                    <div className={cn(
                      'icon-container',
                      isUnread ? 'icon-container-primary' : 'icon-container-muted'
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-[15px]">{notification.title}</p>
                        {isUnread && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors flex-shrink-0"
                            title="Marcar como lida"
                          >
                            <Check className="w-3 h-3" />
                            <span className="hidden sm:inline">Lida</span>
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground/80 mt-1 leading-relaxed">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-2.5 font-medium">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Bell className="w-12 h-12 text-muted-foreground" />}
            title="Nenhuma notificação"
            description="Você receberá atualizações sobre seus pedidos aqui"
          />
        )}
      </div>
    </div>
  );
}
