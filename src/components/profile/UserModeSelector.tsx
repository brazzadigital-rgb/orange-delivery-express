import { useNavigate } from 'react-router-dom';
import { User, Truck, Settings } from 'lucide-react';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';

type UserMode = 'client' | 'driver' | 'admin';

interface ModeOption {
  id: UserMode;
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  allowedRoles: AppRole[];
}

const modeOptions: ModeOption[] = [
  {
    id: 'client',
    label: 'Cliente',
    description: 'Pedir e acompanhar pedidos',
    icon: User,
    path: '/app/home',
    allowedRoles: ['customer', 'driver', 'admin', 'staff'],
  },
  {
    id: 'driver',
    label: 'Motoboy',
    description: 'Ver entregas e navegar',
    icon: Truck,
    path: '/driver/home',
    allowedRoles: ['driver', 'admin', 'staff'],
  },
  {
    id: 'admin',
    label: 'Administrador',
    description: 'Gerenciar loja e pedidos',
    icon: Settings,
    path: '/admin/dashboard',
    allowedRoles: ['admin', 'staff'],
  },
];

export function UserModeSelector() {
  const navigate = useNavigate();
  const { data: userRole, isLoading } = useUserRole();
  
  // Get current mode from localStorage or determine from path
  const getCurrentMode = (): UserMode => {
    const stored = localStorage.getItem('user_mode') as UserMode | null;
    if (stored) return stored;
    
    const path = window.location.pathname;
    if (path.startsWith('/driver')) return 'driver';
    if (path.startsWith('/admin')) return 'admin';
    return 'client';
  };

  const currentMode = getCurrentMode();

  const handleModeChange = (mode: UserMode, path: string) => {
    localStorage.setItem('user_mode', mode);
    navigate(path);
  };

  if (isLoading || !userRole) {
    return null;
  }

  // Filter modes based on user's actual role
  const availableModes = modeOptions.filter(mode => 
    mode.allowedRoles.includes(userRole)
  );

  // If only one mode is available, don't show the selector
  if (availableModes.length <= 1) {
    return null;
  }

  return (
    <div className="card-premium p-4">
      <h2 className="font-semibold mb-3">Modo de Uso</h2>
      <div className="space-y-2">
        {availableModes.map(({ id, label, description, icon: Icon, path }) => {
          const isSelected = currentMode === id;

          return (
            <button
              key={id}
              onClick={() => handleModeChange(id, path)}
              className={cn(
                'w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              </div>
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}