import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Clock, Truck, Store, ChevronRight, Bell, MapPin } from 'lucide-react';
import { useStoreConfig, OpeningHoursSlot } from '@/contexts/StoreConfigContext';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// CLOSED STORE NOTICE - Premium unified component
// Variants: banner (home), modal (checkout overlay), page (full page)
// ============================================================================

interface ClosedStoreNoticeProps {
  variant: 'banner' | 'modal' | 'page';
  className?: string;
  onClose?: () => void;
}

// Day names in Portuguese
const DAY_NAMES: Record<string, string> = {
  mon: 'Segunda',
  tue: 'Terça',
  wed: 'Quarta',
  thu: 'Quinta',
  fri: 'Sexta',
  sat: 'Sábado',
  sun: 'Domingo',
};

// Get current day key
function getCurrentDayKey(): string {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[new Date().getDay()];
}

// Format slots to readable string
function formatSlots(slots: OpeningHoursSlot[]): string {
  if (!slots || slots.length === 0) return 'Fechado';
  return slots.map(s => `${s.start} - ${s.end}`).join(' • ');
}

// Calculate time until opening
function calculateTimeUntil(nextOpenTime: string | null): { hours: number; minutes: number } | null {
  if (!nextOpenTime) return null;
  
  const [openHour, openMin] = nextOpenTime.split(':').map(Number);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openHour * 60 + openMin;
  
  let diff = openMinutes - currentMinutes;
  if (diff < 0) diff += 24 * 60; // Next day
  
  return {
    hours: Math.floor(diff / 60),
    minutes: diff % 60,
  };
}

// Premium Badge component
function StatusBadge({ 
  icon: Icon, 
  label, 
  value, 
  variant = 'default' 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string;
  variant?: 'default' | 'success' | 'muted';
}) {
  const colors = {
    default: 'bg-white/10 border-white/20 text-white/90',
    success: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
    muted: 'bg-white/5 border-white/10 text-white/60',
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-sm",
        "transition-transform duration-150 hover:-translate-y-0.5",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        colors[variant]
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
        <span className="text-xs font-semibold">{value}</span>
      </div>
    </div>
  );
}

// Countdown component with animation
function Countdown({ hours, minutes }: { hours: number; minutes: number }) {
  const [currentHours, setCurrentHours] = useState(hours);
  const [currentMinutes, setCurrentMinutes] = useState(minutes);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMinutes(prev => {
        if (prev <= 0) {
          if (currentHours > 0) {
            setCurrentHours(h => h - 1);
            return 59;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [currentHours]);

  return (
    <div className="flex items-center gap-1.5 text-white">
      <div className="flex items-baseline gap-0.5">
        <span className="text-2xl sm:text-3xl font-bold tabular-nums">{currentHours}</span>
        <span className="text-sm opacity-70">h</span>
      </div>
      <span className="text-lg opacity-50">:</span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-2xl sm:text-3xl font-bold tabular-nums">{String(currentMinutes).padStart(2, '0')}</span>
        <span className="text-sm opacity-70">min</span>
      </div>
    </div>
  );
}

// Main card content (shared between modal and page)
function ClosedStoreCard({ showCTA = true }: { showCTA?: boolean }) {
  const { settings, nextOpenTime } = useStoreConfig();
  const { config } = useAppConfig();
  
  const todayKey = getCurrentDayKey();
  const todaySlots = settings?.opening_hours?.[todayKey as keyof typeof settings.opening_hours] || [];
  const todayHours = formatSlots(todaySlots);
  const timeUntil = calculateTimeUntil(nextOpenTime);
  
  const closedMessage = settings?.closed_message || 'Você ainda pode navegar no cardápio e salvar favoritos.';
  const gradientStart = config?.gradient_start || '#FF8A00';
  const gradientEnd = config?.gradient_end || '#FF6A3D';

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-[22px] border border-white/10",
        "bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-xl",
        "shadow-2xl",
        "animate-fade-in motion-reduce:animate-none"
      )}
      style={{
        boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5), 0 0 80px -20px ${gradientStart}30`,
      }}
    >
      {/* Premium gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -top-20 -left-20 w-60 h-60 rounded-full opacity-30 blur-3xl"
          style={{ background: gradientStart }}
        />
        <div 
          className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full opacity-20 blur-3xl"
          style={{ background: gradientEnd }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-8">
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div 
              className="absolute inset-0 rounded-full blur-xl opacity-40"
              style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }}
            />
            <div 
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${gradientStart}20, ${gradientEnd}20)`,
                border: `1px solid ${gradientStart}40`,
              }}
            >
              <Moon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
          Estamos fechados no momento
        </h2>

        {/* Countdown */}
        {timeUntil && (
          <div className="flex flex-col items-center mb-5">
            <p className="text-sm text-white/60 mb-2">Abrimos em</p>
            <Countdown hours={timeUntil.hours} minutes={timeUntil.minutes} />
            {nextOpenTime && (
              <p className="text-xs text-white/50 mt-1">às {nextOpenTime}</p>
            )}
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          <StatusBadge 
            icon={Clock} 
            label="Hoje" 
            value={todayHours}
            variant="default"
          />
          <StatusBadge 
            icon={Truck} 
            label="Entrega" 
            value={settings?.delivery_enabled ? 'Ativa' : 'Indisponível'}
            variant={settings?.delivery_enabled ? 'success' : 'muted'}
          />
          <StatusBadge 
            icon={Store} 
            label="Retirada" 
            value={settings?.pickup_enabled ? 'Ativa' : 'Indisponível'}
            variant={settings?.pickup_enabled ? 'success' : 'muted'}
          />
        </div>

        {/* Message */}
        <p className="text-sm text-white/70 text-center mb-6 max-w-xs mx-auto leading-relaxed">
          {closedMessage}
        </p>

        {/* CTAs */}
        {showCTA && (
          <div className="flex flex-col gap-3">
            <Link to="/app/home" className="w-full">
              <Button 
                className="w-full h-12 rounded-xl font-semibold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
                style={{ 
                  background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                  boxShadow: `0 4px 20px -4px ${gradientStart}60`,
                }}
              >
                Ver cardápio
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="flex-1 h-11 rounded-xl bg-white/5 border-white/20 text-white/90 hover:bg-white/10 hover:text-white transition-all duration-150"
                onClick={() => {
                  // Save notification preference locally
                  localStorage.setItem('notify_on_open', 'true');
                }}
              >
                <Bell className="w-4 h-4 mr-2" />
                Lembrar-me
              </Button>
              
              <Link to="/app/store-hours" className="flex-1">
                <Button 
                  variant="ghost"
                  className="w-full h-11 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-all duration-150"
                >
                  Ver horários
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Banner variant (compact, for home)
function ClosedStoreBanner({ className }: { className?: string }) {
  const { nextOpenTime, settings } = useStoreConfig();
  const { config } = useAppConfig();
  
  const gradientStart = config?.gradient_start || '#FF8A00';
  const gradientEnd = config?.gradient_end || '#FF6A3D';
  const timeUntil = calculateTimeUntil(nextOpenTime);

  return (
    <div 
      className={cn(
        "relative overflow-hidden",
        "animate-fade-in motion-reduce:animate-none",
        className
      )}
      style={{
        background: `linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)`,
      }}
    >
      {/* Subtle gradient accent */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${gradientStart}40 0%, transparent 60%)`,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Icon + Text */}
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${gradientStart}25, ${gradientEnd}15)`,
                border: `1px solid ${gradientStart}30`,
              }}
            >
              <Moon className="w-4 h-4 text-white/90" />
            </div>
            
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                Loja fechada
              </p>
              <p className="text-xs text-white/60 truncate">
                {timeUntil ? (
                  <>Abrimos em {timeUntil.hours}h {timeUntil.minutes}min</>
                ) : nextOpenTime ? (
                  <>Abrimos às {nextOpenTime}</>
                ) : (
                  'Volte em breve'
                )}
              </p>
            </div>
          </div>
          
          {/* Right: CTA */}
          <Link 
            to="/app/store-hours"
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-white/90 bg-white/10 hover:bg-white/15 active:scale-95 transition-all duration-150 motion-reduce:active:scale-100"
          >
            Ver horários
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
      
      {/* Bottom accent */}
      <div 
        className="absolute bottom-0 left-1/4 right-1/4 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${gradientStart}50, transparent)`,
        }}
      />
    </div>
  );
}

// Modal variant (overlay for checkout)
function ClosedStoreModal({ onClose, className }: { onClose?: () => void; className?: string }) {
  const { config } = useAppConfig();
  const gradientStart = config?.gradient_start || '#FF8A00';

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "animate-fade-in motion-reduce:animate-none",
        className
      )}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Premium background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-0 left-0 w-1/2 h-1/2 opacity-10 blur-3xl"
          style={{ background: `radial-gradient(circle, ${gradientStart} 0%, transparent 70%)` }}
        />
      </div>
      
      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <ClosedStoreCard showCTA={true} />
      </div>
    </div>
  );
}

// Page variant (full screen)
function ClosedStorePage({ className }: { className?: string }) {
  const { config } = useAppConfig();
  const gradientStart = config?.gradient_start || '#FF8A00';
  const gradientEnd = config?.gradient_end || '#FF6A3D';

  return (
    <div 
      className={cn(
        "min-h-screen flex items-center justify-center p-4",
        "animate-fade-in motion-reduce:animate-none",
        className
      )}
      style={{
        background: `
          radial-gradient(60% 60% at 15% 10%, ${gradientStart}20 0%, transparent 60%),
          radial-gradient(50% 50% at 90% 0%, ${gradientEnd}15 0%, transparent 60%),
          linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.85) 100%),
          #0a0a0f
        `,
      }}
    >
      <div className="w-full max-w-md">
        <ClosedStoreCard showCTA={true} />
      </div>
    </div>
  );
}

// Main component with variant switching
export function ClosedStoreNotice({ variant, className, onClose }: ClosedStoreNoticeProps) {
  const { isStoreOpen, isLoading } = useStoreConfig();

  // Don't render if store is open or loading
  if (isLoading || isStoreOpen) {
    return null;
  }

  switch (variant) {
    case 'banner':
      return <ClosedStoreBanner className={className} />;
    case 'modal':
      return <ClosedStoreModal onClose={onClose} className={className} />;
    case 'page':
      return <ClosedStorePage className={className} />;
    default:
      return null;
  }
}

// Legacy exports for backward compatibility
export { ClosedStoreBanner as StoreClosedBanner };
