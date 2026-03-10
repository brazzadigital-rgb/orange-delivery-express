import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InstallBanner } from '@/components/pwa/InstallBanner';

const navItems = [
  { icon: Home, label: 'Início', path: '/driver/home' },
  { icon: Package, label: 'Entregas', path: '/driver/orders' },
  { icon: User, label: 'Perfil', path: '/driver/profile' },
];

export function DriverLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Outlet />
      
      <nav className="bottom-nav safe-area-bottom">
        <div className="flex items-center justify-around py-1">
          {navItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path || location.pathname.startsWith(path.replace('/home', '/orders'));
            
            return (
              <Link
                key={path}
                to={path}
                className={cn('bottom-nav-item flex-1', isActive && 'active')}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* PWA Install Banner */}
      <InstallBanner variant="floating" className="mb-20" />
    </div>
  );
}
