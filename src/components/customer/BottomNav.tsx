import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';

const navItems = [
  { icon: Home, label: 'Início', path: '/app/home', activeIcon: Home },
  { icon: Search, label: 'Buscar', path: '/app/search', activeIcon: Search },
  { icon: ShoppingBag, label: 'Pedidos', path: '/app/orders', activeIcon: ShoppingBag },
  { icon: Heart, label: 'Favoritos', path: '/app/favorites', activeIcon: Heart },
  { icon: User, label: 'Perfil', path: '/app/profile', activeIcon: User },
];

export function BottomNav() {
  const location = useLocation();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Hide bottom nav on pages with their own fixed bottom bars
  const hideOnPaths = [
    '/app/product/',
    '/app/cart',
    '/app/checkout',
    '/app/profile/addresses',
    '/app/pizza',
  ];
  const shouldHide = hideOnPaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around py-1 safe-area-bottom">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'bottom-nav-item flex-1 touch-feedback',
                isActive && 'active'
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon 
                  className={cn(
                    'w-6 h-6 transition-all duration-200',
                    isActive && 'scale-110'
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {path === '/app/orders' && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[11px] mt-1 font-medium transition-colors duration-200',
                isActive && 'text-primary'
              )}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
