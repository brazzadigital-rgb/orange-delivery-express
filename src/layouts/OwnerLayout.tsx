import { Outlet, Link, useLocation } from 'react-router-dom';
import { Crown, BarChart3, LogOut, Menu, X, UserPlus, CreditCard, Package, ShoppingCart, ToggleRight, Ticket, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppConfig } from '@/contexts/AppConfigContext';

const navItems = [
  { icon: Globe, label: 'Plataforma', path: '/owner/platform' },
  { icon: Crown, label: 'Assinaturas', path: '/owner/subscriptions' },
  { icon: Ticket, label: 'Vouchers', path: '/owner/vouchers' },
  { icon: ToggleRight, label: 'Recursos do Plano', path: '/owner/store-features' },
  { icon: ShoppingCart, label: 'Pedidos de Compra', path: '/owner/purchase-orders' },
  { icon: Package, label: 'Planos & Preços', path: '/owner/plans' },
  { icon: CreditCard, label: 'Pagamentos', path: '/owner/payment-settings' },
  { icon: BarChart3, label: 'Relatórios', path: '/owner/subscriptions/reports' },
  { icon: UserPlus, label: 'Gerenciar Admin', path: '/owner/manage-admins' },
];

export function OwnerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  const { config } = useAppConfig();

  const logoUrl = config?.app_logo_url;
  const appName = config?.app_name || '';

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-lg">Painel do Dono</h1>
        <div className="w-10" />
      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-border transform transition-transform lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="h-10 max-w-[160px] object-contain" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-lg">Dono</span>
              </>
            )}
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="lg:ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
