import { ReactNode, useEffect, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/customer/BottomNav';
import { useCustomerOrderNotifications } from '@/hooks/useCustomerOrderNotifications';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { AudioUnlockBanner } from '@/components/common/AudioUnlockBanner';
import { FloatingCartButton } from '@/components/customer/FloatingCartButton';
import { useStoreGate } from '@/hooks/useStoreGate';
import { StoreUnavailableNotice } from '@/components/common/StoreUnavailableNotice';

interface CustomerLayoutProps {
  children?: ReactNode;
}

export function CustomerLayout({ children }: CustomerLayoutProps) {
  const { user } = useAuth();
  const { data: storeGate } = useStoreGate();
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);

  // Initialize customer order notifications (realtime + sound) - SINGLE source of truth
  useCustomerOrderNotifications();

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  useEffect(() => {
    if (user && 'Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        setShowPermissionBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    setShowPermissionBanner(false);
    if (!granted) {
      console.log('Notification permission denied');
    }
  };

  // Block customer app when store billing is suspended
  if (storeGate === 'blocked') {
    return <StoreUnavailableNotice />;
  }

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden gradient-surface">
      {showPermissionBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 p-3 animate-fade-in safe-area-top">
          <div className="flex items-center gap-3 max-w-lg mx-auto p-3 rounded-2xl bg-card border border-border/30" style={{ boxShadow: 'var(--shadow-elevated)' }}>
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm flex-1 font-medium">Ative as notificações para acompanhar seus pedidos!</p>
            <Button size="sm" onClick={handleEnableNotifications} className="btn-primary !py-2 !px-4 flex-shrink-0">
              Ativar
            </Button>
            <button onClick={() => setShowPermissionBanner(false)} className="text-muted-foreground hover:text-foreground p-1">
              ✕
            </button>
          </div>
        </div>
      )}
      
      {children || <Outlet />}
      <BottomNav />
      
      {/* Audio Unlock Banner - shows when sound needs activation */}
      <AudioUnlockBanner />
      
      {/* Floating Cart Button - always visible when cart has items */}
      <FloatingCartButton />
      
      {/* PWA Install Banner */}
      <InstallBanner variant="floating" className="mb-20" />
    </div>
  );
}
