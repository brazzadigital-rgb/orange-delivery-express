import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
   LayoutDashboard, 
   ShoppingBag, 
   ChefHat, 
   Pizza, 
   Tag, 
   Ticket, 
   Users, 
   Truck, 
   Map, 
   Settings,
   LogOut,
   Menu,
   X,
   Image,
   BarChart3,
   TrendingUp,
   CreditCard,
   Timer,
   Crown,
   ChevronDown,
   ChevronRight,
   Plug,
   FolderOpen,
   Package,
   Star,
    Gift,
    MessageSquare,
    ShieldCheck,
    QrCode,
    UserCheck,
    Bell,
    UtensilsCrossed,
  } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { useState, useRef, useEffect } from 'react';
 import { useAuth } from '@/hooks/useAuth';
 import { useAppConfig } from '@/contexts/AppConfigContext';
 import { InstallBanner } from '@/components/pwa/InstallBanner';
  import { useAdminPendingOrders } from '@/hooks/useAdminPendingOrders';
  import { useAdminTableCalls } from '@/hooks/useTableCalls';
   import { useFeatures, StoreFeatures } from '@/contexts/FeatureContext';
   import { StoreSwitcher } from '@/components/admin/StoreSwitcher';
   import { useBuilderLabels } from '@/hooks/useBuilderLabels';
   import { useAdminBuilderNav } from '@/hooks/useAdminBuilderNav';
   import { usePlanEntitlements } from '@/hooks/usePlanEntitlements';
   import { TrialCountdownBanner } from '@/components/admin/TrialCountdownBanner';

type FeatureKey = keyof StoreFeatures;

const topItems: { icon: any; label: string; path: string; badgeKey?: 'total' | 'table' | 'calls'; feature?: FeatureKey }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: ShoppingBag, label: 'Pedidos', path: '/admin/orders', badgeKey: 'total' },
  { icon: QrCode, label: 'Mesas', path: '/admin/tables', badgeKey: 'table', feature: 'table_service' },
  { icon: Bell, label: 'Chamados', path: '/admin/calls', badgeKey: 'calls', feature: 'table_service' },
  { icon: ChefHat, label: 'Cozinha', path: '/admin/kitchen' },
];

const staticMenuItems = [
  { icon: Package, label: 'Produtos', path: '/admin/menu/products' },
  { icon: FolderOpen, label: 'Categorias', path: '/admin/menu/categories' },
];

const bottomItems: { icon: any; label: string; path: string; feature?: FeatureKey; isPlan?: boolean }[] = [
  { icon: Tag, label: 'Promoções', path: '/admin/promotions' },
  { icon: Image, label: 'Banners', path: '/admin/banners' },
  { icon: Ticket, label: 'Cupons', path: '/admin/coupons' },
  { icon: Users, label: 'Clientes', path: '/admin/customers' },
  { icon: Truck, label: 'Motoboys', path: '/admin/drivers', feature: 'courier_app' },
  { icon: Map, label: 'Zonas de Entrega', path: '/admin/delivery-zones' },
  { icon: Map, label: 'Mapa Ao Vivo', path: '/admin/live-map', feature: 'courier_app' },
  { icon: UserCheck, label: 'Garçons', path: '/admin/waiters', feature: 'waiter_app' },
  { icon: MessageSquare, label: 'Avaliações', path: '/admin/reviews' },
  { icon: ShieldCheck, label: 'Administradores', path: '/admin/admins' },
  { icon: Plug, label: 'Integrações', path: '/admin/integrations' },
  { icon: Settings, label: 'Config. App', path: '/admin/app-settings' },
  { icon: Crown, label: 'Assinatura', path: '/admin/subscription', isPlan: true },
];

const loyaltyItems = [
  { icon: Settings, label: 'Configurações', path: '/admin/loyalty/settings' },
  { icon: Gift, label: 'Recompensas', path: '/admin/loyalty/rewards' },
  { icon: Users, label: 'Clientes', path: '/admin/loyalty/customers' },
  { icon: BarChart3, label: 'Relatórios', path: '/admin/loyalty/reports' },
];

const managementItems = [
  { icon: TrendingUp, label: 'Visão Geral', path: '/admin/management/overview' },
  { icon: Users, label: 'CRM Clientes', path: '/admin/management/customers' },
  { icon: CreditCard, label: 'Financeiro', path: '/admin/management/finance' },
  { icon: Timer, label: 'Operações', path: '/admin/management/operations' },
  { icon: BarChart3, label: 'Rel. Vendas', path: '/admin/management/reports/sales' },
  { icon: Pizza, label: 'Rel. Produtos', path: '/admin/management/reports/products' },
];

function BadgeCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function NotificationBell({ counts, badgeCount, onMarkAsSeen }: {
  counts: { total: number; delivery: number; table: number };
  badgeCount: number;
  onMarkAsSeen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b border-border">
            <h4 className="font-semibold text-sm">Pedidos Pendentes</h4>
          </div>
          <div className="p-2 space-y-1">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                <span className="text-sm">Delivery pendentes</span>
              </div>
              <span className="font-bold text-sm">{counts.delivery}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-primary" />
                <span className="text-sm">Mesa pendentes</span>
              </div>
              <span className="font-bold text-sm">{counts.table}</span>
            </div>
          </div>
          <div className="p-2 space-y-1 border-t border-border">
            <button
              onClick={() => { navigate('/admin/orders'); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-primary font-medium"
            >
              Ver todos os pedidos
            </button>
            {counts.table > 0 && (
              <button
                onClick={() => { navigate('/admin/orders'); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-primary font-medium"
              >
                Ver pedidos de mesa
              </button>
            )}
            {badgeCount > 0 && (
              <button
                onClick={() => { onMarkAsSeen(); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              >
                Marcar como visto
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(true);
  const [loyaltyOpen, setLoyaltyOpen] = useState(true);
  const location = useLocation();
  const { signOut } = useAuth();
  const { config } = useAppConfig();
  
  // Global pending orders with realtime alerts
  const { counts, badgeCount, markAsSeen } = useAdminPendingOrders();
  const { pendingCount: callsPendingCount } = useAdminTableCalls();
  const { features, hasFeature } = useFeatures();
  const { hasPlanFeature, isFree, isTrialing, entitlements } = usePlanEntitlements();

  // Dynamic builder label & icon from store type
  const builderLabels = useBuilderLabels();
  const { BuilderIcon } = useAdminBuilderNav();
  const menuItems = [
    ...staticMenuItems,
    { icon: BuilderIcon, label: builderLabels.admin.sidebarLabel, path: '/admin/pizza-builder' },
  ];
  
  const logoUrl = config?.app_logo_url;
  const appName = config?.app_name || '';

  // Filter items by feature flags
  const filteredTopItems = topItems.filter(i => !i.feature || hasFeature(i.feature));
  const filteredBottomItems = bottomItems.filter(i => !i.feature || hasFeature(i.feature));

  const getBadge = (badgeKey?: 'total' | 'table' | 'calls') => {
    if (!badgeKey) return 0;
    if (badgeKey === 'total') return counts.total;
    if (badgeKey === 'table') return counts.table;
    if (badgeKey === 'calls') return callsPendingCount;
    return 0;
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-muted"
        >
          <Menu className="w-6 h-6" />
        </button>
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={appName} 
            className="h-10 max-w-[160px] object-contain"
          />
        ) : (
          <h1 className="font-bold text-lg gradient-primary bg-clip-text text-transparent">
            {appName}
          </h1>
        )}
        <NotificationBell counts={counts} badgeCount={badgeCount} onMarkAsSeen={markAsSeen} />
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-border transform transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={appName} 
                className="h-10 max-w-[160px] object-contain"
              />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Pizza className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-lg">{appName}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Desktop notification bell */}
            <div className="hidden lg:block">
              <NotificationBell counts={counts} badgeCount={badgeCount} onMarkAsSeen={markAsSeen} />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {/* Store Switcher */}
          <div className="mb-3">
            <StoreSwitcher />
          </div>
          {/* Top items: Dashboard, Pedidos, Cozinha */}
          {filteredTopItems.map(({ icon: Icon, label, path, badgeKey }) => {
            const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
            const badge = getBadge(badgeKey);
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
                {badge > 0 && !isActive && <BadgeCount count={badge} />}
                {badge > 0 && isActive && (
                  <span className="ml-auto bg-white/30 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Menu (Cardápio) Section with submenu */}
          <div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                location.pathname.startsWith('/admin/menu')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <Pizza className="w-5 h-5" />
                <span>Cardápio</span>
              </div>
              {menuOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {menuOpen && (
              <div className="mt-1 space-y-1 ml-4">
                {menuItems.map(({ icon: Icon, label, path }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom items */}
          {filteredBottomItems.map(({ icon: Icon, label, path, ...rest }) => {
            const badgeKey = (rest as any).badgeKey;
            const isPlan = (rest as any).isPlan;
            const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
            const badge = getBadge(badgeKey);
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
                {isPlan && entitlements?.plan_name && !isActive && (
                  <span className="ml-auto bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    {entitlements.plan_name}
                  </span>
                )}
                {badge > 0 && !isActive && <BadgeCount count={badge} />}
                {badge > 0 && isActive && (
                  <span className="ml-auto bg-white/30 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Loyalty Section - only if feature enabled */}
          {hasFeature('loyalty_points') && (
          <div className="pt-4 mt-4 border-t border-border">
            <button
              onClick={() => setLoyaltyOpen(!loyaltyOpen)}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 text-sm font-semibold transition-colors",
                location.pathname.startsWith('/admin/loyalty')
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>Pontos Fidelidade</span>
              </div>
              {loyaltyOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {loyaltyOpen && (
              <div className="mt-1 space-y-1 ml-2">
                {loyaltyItems.map(({ icon: Icon, label, path }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {/* Management Section - hidden for free plans without analytics */}
          {hasPlanFeature('analytics') && (
          <div className="pt-4 mt-4 border-t border-border">
            <button
              onClick={() => setManagementOpen(!managementOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Gestão</span>
              </div>
              {managementOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {managementOpen && (
              <div className="mt-1 space-y-1 ml-2">
                {managementItems.map(({ icon: Icon, label, path }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {/* Settings */}
          <Link
            to="/admin/settings"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mt-2',
              location.pathname === '/admin/settings'
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Settings className="w-5 h-5" />
            <span>Configurações</span>
          </Link>
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

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <TrialCountdownBanner />
        <Outlet />
      </main>
      
      {/* PWA Install Banner - for testing in admin */}
      <InstallBanner variant="floating" />
    </div>
  );
}
