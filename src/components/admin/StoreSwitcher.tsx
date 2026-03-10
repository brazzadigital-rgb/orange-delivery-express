import { useState, useRef, useEffect } from 'react';
import { Store, ChevronDown, Check, ExternalLink } from 'lucide-react';
import { useUserStores } from '@/hooks/useUserStores';
import { useTenant } from '@/contexts/TenantContext';
import { useQueryClient } from '@tanstack/react-query';
import { clearClientState } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const PORTAL_BASE_DOMAIN = 'deliverylitoral.com.br';

export function StoreSwitcher() {
  const { data: stores = [], isLoading } = useUserStores();
  const { store: currentStore } = useTenant();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Don't show if user only has access to one store or fewer
  if (isLoading || stores.length <= 1) return null;

  const handleSwitch = (slug: string) => {
    if (slug === currentStore?.slug) {
      setOpen(false);
      return;
    }

    const target = stores.find(s => s.slug === slug);
    if (target) {
      // Clear all cached data before switching tenant
      queryClient.clear();
      clearClientState();
      // Set the new tenant override and reload
      localStorage.setItem('tenant_store_override', target.id);
      window.location.href = '/admin/dashboard';
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors bg-muted/50 hover:bg-muted text-foreground"
      >
        <Store className="w-5 h-5 text-primary" />
        <span className="flex-1 text-left truncate">
          {currentStore?.name || 'Loja'}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
          <div className="p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
            {stores.map((store) => {
              const isActive = store.slug === currentStore?.slug;
              return (
                <button
                  key={store.id}
                  onClick={() => handleSwitch(store.slug)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <span className="flex-1 truncate">{store.name}</span>
                  {isActive ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
